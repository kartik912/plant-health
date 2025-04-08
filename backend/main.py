from models import LightBulb, MoistureSensorData, TemperatureHumidityData, PhotoRecord, TDSData, PHData, SensorLimits
from checkSensorMail import SensorMonitor
from reportlab.lib.pagesizes import letter
from flask import request, jsonify, Flask, send_file, Response
from flask_socketio import SocketIO
from io import BytesIO
from gpiozero import OutputDevice
from grove.grove_moisture_sensor import GroveMoistureSensor
from grove.adc import ADC
from picamera2 import Picamera2,Preview
import adafruit_dht
from grove_ec_sensor import GroveEC 
# from gpiozero import Servo
from reportlab.pdfgen import canvas
from datetime import datetime
from config import app, db
from time import sleep
from collections import deque
import numpy as np
import time
import board
import os
import requests
import socket
import math
import sys
import io
import threading
import base64
import lgpio
import threading
import signal
import atexit

# to keep fetching data from sensors-----------------------------------------------------
def fetch_sensor_data():
    while True:
        try:
            # Call the specified routes
            # requests.post("http://127.0.0.1:5000/capture_photo")
            requests.get("http://127.0.0.1:5000/get_ph")
            requests.get("http://127.0.0.1:5000/get_temperature_humidity")
            requests.get("http://127.0.0.1:5000/get_tds")
            requests.get("http://127.0.0.1:5000/check_moisture")

            requests.post("http://127.0.0.1:5000/check_and_adjust_sensors")
            requests.post("http://127.0.0.1:5000/status_mail")
            
            
        except Exception as e:
            print(f"Error fetching sensor data: {e}")
        
        time.sleep(7200) #10 mins = 600  #3hr = 10800  #7200 = 2hr
#variable declare for pumps -----------------------------------------------------------------------------------------------
# Define GPIO pins for motor control
PUMP1_IN1 = 14   
PUMP1_IN2 = 13  
PUMP2_IN3 = 26  
PUMP2_IN4 = 17  

# second chip
PUMP3_IN1 = 24  
PUMP3_IN2 = 19  
PUMP4_IN3 = 20  
PUMP4_IN4 = 21  


# servo motor setup
# Configuration
SERVO_PIN = 12  # PWM pin you're using
FREQUENCY = 50  # Standard servo PWM frequency (50 Hz)

# Pulse width values for different angles
# These may need fine-tuning based on your specific servo
ANGLE_0 = 140.0   # Typically 0.5ms pulse width for 0 degrees
ANGLE_90 = 50.5  # Typically 1.5ms pulse width for 90 degrees

def setup_servo():
    """Initialize the GPIO and PWM for the servo"""
    h = lgpio.gpiochip_open(0)  # Open the GPIO chip
    lgpio.gpio_claim_output(h, SERVO_PIN)
    return h

def set_servo_angle(h, angle):

    if angle == 0:
        pulse_width = ANGLE_0
    elif angle == 90:
        pulse_width = ANGLE_90
    elif angle == 180:
        pulse_width = ANGLE_180
    else:
        raise ValueError("Angle must be 0, 90, or 180 degrees")
    
    # Calculate duty cycle
    duty_cycle = pulse_width / (1000 / FREQUENCY)
    
    # Set PWM
    lgpio.tx_pwm(h, SERVO_PIN, FREQUENCY, duty_cycle)
    time.sleep(0.5)  # Give time for servo to move

def cleanup(h):
    """Clean up GPIO resources"""
    lgpio.gpiochip_close(h)

handle = setup_servo()

#relay setup
RELAY_PIN = 16
relay = OutputDevice(RELAY_PIN)

# Initialize lgpio
h = lgpio.gpiochip_open(0)  # Open GPIO chip 0

# Setup pins as outputs
for pin in [PUMP1_IN1, PUMP1_IN2, PUMP2_IN3, PUMP2_IN4, PUMP3_IN1, PUMP3_IN2, PUMP4_IN3, PUMP4_IN4]:
    lgpio.gpio_claim_output(h, pin)


# Motor status
pump_status = {
    "pump1": "stopped",
    "pump2": "stopped",
    "pump3": "stopped",
    "pump4": "stopped"
}

# Lock for thread safety
pump_lock = threading.Lock()

#functions-------------------------------------------------------------------------------------------------------


# Pump control functions----------------------------------------------------------------------------------------------------
def check_humidity_regularly():
    while True:
        try:
            # Only get temperature/humidity data and check it
            requests.post("http://127.0.0.1:5000/check_humidity")
            
        except Exception as e:
            print(f"Error checking humidity: {e}")
        
        time.sleep(600) #10min

def check_and_adjust_sensors():
    """Check pH and TDS readings against set limits and activate pumps if needed"""
    # Import Flask app at the function level to avoid circular imports
    
    # Get latest sensor readings
    ph_data = PHData.query.order_by(PHData.id.desc()).first()
    tds_data = TDSData.query.order_by(TDSData.id.desc()).first()
    
    # Get sensor limits
    ph_limit = SensorLimits.query.filter_by(sensor_type="ph").first()
    tds_limit = SensorLimits.query.filter_by(sensor_type="tds").first()
    
    # Default limits if none are set
    ph_min = 5.5
    ph_max = 7.5
    ph_active = True
    tds_min = 0
    tds_max = 3
    tds_active = True
    
    # Update with database values if available
    if ph_limit:
        ph_min = ph_limit.min_value
        ph_max = ph_limit.max_value
        ph_active = ph_limit.is_active
        
    if tds_limit:
        tds_min = tds_limit.min_value
        tds_max = tds_limit.max_value
        tds_active = tds_limit.is_active
    
    # Check pH levels and adjust if needed
    if ph_data and ph_active:
        ph_value = ph_data.ph_value
        
        if ph_value < ph_min:
            # pH too low, activate pump 3 (base pump)
            print(f"pH {ph_value} below minimum {ph_min}, activating pump 3")
            pump3_forward()
            time.sleep(3)
            pump3_stop()
            
        elif ph_value > ph_max:
            # pH too high, activate pump 4 (acid pump)
            print(f"pH {ph_value} above maximum {ph_max}, activating pump 4")
            pump4_forward()
            time.sleep(3)   
            pump4_stop()
    
    # Check TDS levels and adjust if needed
    if tds_data and tds_active:
        tds_value = tds_data.tds_value
        
        if tds_value < tds_min:
            # TDS too low, activate pump 1 and 2 (nutrient pumps)
            print(f"TDS {tds_value} below minimum {tds_min}, activating pumps 1 and 2")
            pump1_forward()
            time.sleep(8)
            pump1_stop()
            time.sleep(10)
            pump2_forward()
            time.sleep(8)
            pump2_stop()

def check_temperature():
    """Check temperature readings against set limits and activate fans if needed"""
    # Get latest temperature reading
    temperature_data = TemperatureHumidityData.query.order_by(TemperatureHumidityData.id.desc()).first()
    
    # Get temperature limits
    temperature_limit = SensorLimits.query.filter_by(sensor_type="temperature").first()
    
    # Default limits if none are set
    temperature_min = 18
    temperature_max = 28
    temperature_active = True

    buffer = 2
    
    # Update with database values if available
    if temperature_limit:  
        temperature_min = temperature_limit.min_value
        temperature_max = temperature_limit.max_value
        temperature_active = temperature_limit.is_active
    
    # Check temperature levels and adjust if needed
    if temperature_data and temperature_active:
        temperature_value = temperature_data.temperature
        
        if temperature_value > temperature_max:
            # Temperature too high, activate fan
            print(f"Temperature {temperature_value} above maximum {temperature_max}, starting fan")
            relay.on()
        
        elif temperature_value < temperature_min+buffer:
            # Temperature too low, stop fan
            print(f"Temperature {temperature_value} below minimum {temperature_min}, stopping fan")
            relay.off()
            

def pump1_forward():
    with pump_lock:
        lgpio.gpio_write(h, PUMP1_IN1, 1)  # HIGH
        lgpio.gpio_write(h, PUMP1_IN2, 0)  # LOW
        pump_status["pump1"] = "running"

def pump1_stop():
    with pump_lock:
        lgpio.gpio_write(h, PUMP1_IN1, 0)  # LOW
        lgpio.gpio_write(h, PUMP1_IN2, 0)  # LOW
        pump_status["pump1"] = "stopped"
    
def pump2_forward():
    with pump_lock:
        lgpio.gpio_write(h, PUMP2_IN3, 1)  # HIGH
        lgpio.gpio_write(h, PUMP2_IN4, 0)  # LOW
        pump_status["pump2"] = "running"

def pump2_stop():
    with pump_lock:
        lgpio.gpio_write(h, PUMP2_IN3, 0)  # LOW
        lgpio.gpio_write(h, PUMP2_IN4, 0)  # LOW
        pump_status["pump2"] = "stopped"

def pump3_forward():
    with pump_lock:
        lgpio.gpio_write(h, PUMP3_IN1, 1)  # HIGH
        lgpio.gpio_write(h, PUMP3_IN2, 0)  # LOW
        pump_status["pump3"] = "running"

def pump3_stop():
    with pump_lock:
        lgpio.gpio_write(h, PUMP3_IN1, 0)  # LOW
        lgpio.gpio_write(h, PUMP3_IN2, 0)  # LOW
        pump_status["pump3"] = "stopped"

def pump4_forward():
    with pump_lock:
        lgpio.gpio_write(h, PUMP4_IN3, 1)  # HIGH
        lgpio.gpio_write(h, PUMP4_IN4, 0)  # LOW
        pump_status["pump4"] = "running"

def pump4_stop():
    with pump_lock:
        lgpio.gpio_write(h, PUMP4_IN3, 0)  # LOW
        lgpio.gpio_write(h, PUMP4_IN4, 0)  # LOW
        pump_status["pump4"] = "stopped"

# Function to auto-stop a pump after a specified duration
def auto_stop_pump(pump_number, duration):
    if pump_number == 1:
        time.sleep(duration)
        pump1_stop()
    elif pump_number == 2:
        time.sleep(duration)
        pump2_stop()
    elif pump_number == 3:
        time.sleep(duration)
        pump3_stop()
    elif pump_number == 4:
        time.sleep(duration)
        pump4_stop()

def cleanup_gpio():
    global h  # Make sure h is accessed as a global variable
    try:
        # Stop all pumps
        pump1_stop()
        pump2_stop()
        pump3_stop()
        pump4_stop()
        
        # Free all pins and close the chip
        for pin in [PUMP1_IN1, PUMP1_IN2, PUMP2_IN3, PUMP2_IN4, PUMP3_IN1, PUMP3_IN2, PUMP4_IN3, PUMP4_IN4]:
            try:
                lgpio.gpio_free(h, pin)
            except Exception:
                pass  # Ignore errors if pins are already freed
                
        try:
            lgpio.gpiochip_close(h)
            h = None  # Set to None to indicate it's closed
        except Exception:
            pass  # Ignore errors if chip is already closed
            
    except Exception as e:
        print(f"Error during cleanup: {e}")
    
# function to fetch locations --------------------------------------------------------
def get_public_ip():
    """Fetches the public IP address of Raspberry Pi"""
    try:
        response = requests.get("https://api64.ipify.org?format=json")
        return response.json()["ip"]
    except Exception as e:
        return str(e)

def get_location():
    """Gets approximate geolocation based on public IP"""
    ip = get_public_ip()
    print(ip)
    if "error" in ip:
        return {"error": "Could not fetch public IP"}
    
    # Free API for geolocation (limited requests)
    geo_url = f"http://ip-api.com/json/{ip}"
    
    try:
        response = requests.get(geo_url)
        data = response.json()
        if data["status"] == "fail":
            return {"error": "Could not determine location"}
        return {
            "ip": ip,
            "country": data["country"],
            "region": data["regionName"],
            "city": data["city"],
            "lat": data["lat"],
            "lon": data["lon"],
            "isp": data["isp"]
        }
    except Exception as e:
        return {"error": str(e)}
# ----------------------------------------------------------------------------------------
# ec sensro ---------------------------------------------------------------------------

# class for tds sensor----------------------------------------------------------------

adc = ADC()
class GroveTDS:
    def __init__(self, channel, window_size):
        self.channel = channel
        self.adc = ADC()
        self.window_size = window_size
        self.readings = deque(maxlen=window_size)  # Stores last 'window_size' readings

    def read_tds(self):
        value = self.adc.read(self.channel)
        if value != 0:
            voltage = value * 3.3 / 4095.0 - 0.02  # Convert ADC value to voltage
            tds_value = 5.11*np.exp(210.73*voltage) + 6038.51*voltage + 15.81
            return max(0,tds_value)
        return 0

    @property
    def TDS(self):
        tds_value = self.read_tds()
        self.readings.append(tds_value)  # Add new value to moving window
        return np.median(self.readings)  # Return median value tds

tdssensor = GroveTDS(2, window_size=200)

#class for ph sensor----------------------------------------------------------------

class GrovePH:
    def __init__(self, channel, window_size):
        self.channel = channel
        self.adc = ADC()
        self.window_size = window_size
        self.readings = deque(maxlen=window_size)  # Stores last 'window_size' readings

    def read_ph(self):
        raw_voltage = self.adc.read_voltage(self.channel)
        voltage = (raw_voltage * 5.0 / 4095.0) - 0.384  # Adjusted voltage
        ph_value = 7 + ((2.5 - voltage) / 0.18)  # pH calculation
        return ph_value

    @property
    def PH(self):
        ph_value = self.read_ph()
        self.readings.append(ph_value)  # Add new value to moving window
        return np.median(self.readings)  # Return median pH

Phsensor = GrovePH(channel=4, window_size=200)
    #-------------------------------------------------------------------------------------
    # Camera ------------------------------------------------------------------------------

socketio = SocketIO(app, cors_allowed_origins="*")
is_streaming = False
camera_thread = None

global_camera = None
camera_lock = threading.Lock()

def initialize_camera():
    global global_camera
    with camera_lock:
        if global_camera is not None:
            try:
                global_camera.close()
            except:
                pass
        
        global_camera = Picamera2()
        global_camera.start()
    return global_camera

def generate_frames():
    global is_streaming, global_camera
    
    try:
        camera = initialize_camera()
        
        while is_streaming:
            # Capture frame
            frame = camera.capture_image()
            
            # Convert frame to JPEG
            buffer = io.BytesIO()
            frame.save(buffer, format="JPEG")
            frame_bytes = buffer.getvalue()
            
            # Encode frame to base64
            encoded_frame = base64.b64encode(frame_bytes).decode('utf-8')
            
            # Emit frame via WebSocket
            socketio.emit('camera_frame', {'image': encoded_frame})
            
            socketio.sleep(0.1)  # Adjust frame rate
    except Exception as e:
        print(f"Streaming error: {e}")
    finally:
        with camera_lock:
            if global_camera is not None:
                global_camera.close()
                global_camera = None

PHOTO_DIRECTORY = "captured_photos"
os.makedirs(PHOTO_DIRECTORY, exist_ok=True)
#-------------------------------------------------------------------------------------


# #temperature and humidity sensor
dht_sensor = adafruit_dht.DHT11(board.D5)

# # Moisture sensor setupddd
sensor = GroveMoistureSensor(0)

# #servo setup
# servo = Servo(12)
#message sending function----------------------------------------------------------------------
def check_sensors():
    """Main function to check all sensors"""
    monitor = SensorMonitor()
    
    try:
        # Check Temperature & Humidity
        try:
            temperature = dht_sensor.temperature
            humidity = dht_sensor.humidity
            monitor.check_sensor_reading('temperature', temperature)
            monitor.check_sensor_reading('humidity', humidity)
        except Exception as e:
            monitor.send_email_alert('DHT11', f"Failed to read temperature/humidity: {str(e)}")
        
        # Check TDS
        try:
            # ec_sensor = GroveEC(channel=2, window_size=50)
            # tds_value = tdssensor.TDS
            tds_data = TDSData.query.order_by(TDSData.id.desc()).first()
            ec_value = tds_data.tds_value
            monitor.check_sensor_reading('tds', ec_value)
        except Exception as e:
            monitor.send_email_alert('EC Sensor', f"Failed to read EC: {str(e)}")
        
        # Check pH
        try:
            ph_val = Phsensor.PH
            monitor.check_sensor_reading('ph', ph_val)
        except Exception as e:
            monitor.send_email_alert('pH Sensor', f"Failed to read pH: {str(e)}")
            
    except Exception as e:
        print(f"Error in sensor monitoring: {str(e)}")

#mail route
@app.route("/status_mail", methods=["POST"])
def check_status_mail():
    try:
        check_sensors()
        return jsonify({"message": "Sensor status check done successfully"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

#pump routes----------------------------------------------------------------------------------------------
@app.route("/check_and_adjust_sensors", methods=["POST"])
def manual_check_and_adjust():
    try:
        check_and_adjust_sensors()
        return jsonify({"message": "Sensor check and adjustment completed successfully"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route("/check_humidity", methods=["POST"])
def manual_check_humidity():
    try:
        check_temperature()
        return jsonify({"message": "temperature check and adjustment completed successfully"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route("/sensor_status", methods=["GET"])
def get_sensor_status():
    try:
        # Get latest sensor readings
        ph_data = PHData.query.order_by(PHData.id.desc()).first()
        tds_data = TDSData.query.order_by(TDSData.id.desc()).first()
        
        # Get sensor limits
        ph_limit = SensorLimits.query.filter_by(sensor_type="ph").first()
        tds_limit = SensorLimits.query.filter_by(sensor_type="tds").first()
        
        # Default limits if none are set
        ph_limits = {"min": 5.5, "max": 7.5, "active": True}
        tds_limits = {"min": 500, "max": 1500, "active": True}
        
        # Update with database values if available
        if ph_limit:
            ph_limits = {
                "min": ph_limit.min_value,
                "max": ph_limit.max_value,
                "active": ph_limit.is_active
            }
            
        if tds_limit:
            tds_limits = {
                "min": tds_limit.min_value,
                "max": tds_limit.max_value,
                "active": tds_limit.is_active
            }
        
        # Format current sensor values
        current_ph = None
        current_tds = None
        ph_status = "Not available"
        tds_status = "Not available"
        
        if ph_data:
            current_ph = ph_data.ph_value
            if ph_limits["active"]:
                if current_ph < ph_limits["min"]:
                    ph_status = "Low"
                elif current_ph > ph_limits["max"]:
                    ph_status = "High"
                else:
                    ph_status = "Normal"
            else:
                ph_status = "Monitoring inactive"
        
        if tds_data:
            current_tds = tds_data.tds_value
            if tds_limits["active"]:
                if current_tds < tds_limits["min"]:
                    tds_status = "Low"
                elif current_tds > tds_limits["max"]:
                    tds_status = "High"
                else:
                    tds_status = "Normal"
            else:
                tds_status = "Monitoring inactive"
        
        return jsonify({
            "ph": {
                "value": current_ph,
                "limits": ph_limits,
                "status": ph_status,
                "last_updated": None
            },
            "tds": {
                "value": current_tds,
                "limits": tds_limits,
                "status": tds_status,
                "last_updated": None
            }
        }), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route("/sensor/limits", methods=["GET"])
def get_sensor_limits():
    try:
        # Fetch all sensor limits
        all_limits = SensorLimits.query.all()
        
        # Convert to dictionary for easier access in frontend
        limits_dict = {}
        for limit in all_limits:
            limits_dict[limit.sensor_type] = {
                "min": limit.min_value,
                "max": limit.max_value,
                "active": limit.is_active
            }
        
        # Add default values if not found
        if "ph" not in limits_dict:
            limits_dict["ph"] = {"min": 5.5, "max": 7.5, "active": True}
        if "tds" not in limits_dict:
            limits_dict["tds"] = {"min": 0, "max": 3, "active": True}
        if "temperature" not in limits_dict:
            limits_dict["temperature"] = {"min": 18, "max": 28, "active": True}
            
        return jsonify(limits_dict), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

# Update sensor limits
@app.route("/sensor/limits", methods=["POST"])
def update_sensor_limits():
    try:
        data = request.get_json()
        
        # Update pH limits
        if "ph" in data:
            ph_data = data["ph"]
            ph_limit = SensorLimits.query.filter_by(sensor_type="ph").first()
            
            if ph_limit:
                # Update existing record
                ph_limit.min_value = ph_data["min"]
                ph_limit.max_value = ph_data["max"]
                ph_limit.is_active = ph_data["active"]
                ph_limit.updated_at = datetime.now()
            else:
                # Create new record
                ph_limit = SensorLimits(
                    sensor_type="ph",
                    min_value=ph_data["min"],
                    max_value=ph_data["max"],
                    is_active=ph_data["active"]
                )
                db.session.add(ph_limit)
        
        # Adding temperature data
        if "temperature" in data:
            temperature_data = data["temperature"]
            temperature_limit = SensorLimits.query.filter_by(sensor_type="temperature").first()
            
            if temperature_limit:
                # Update existing record
                temperature_limit.min_value = temperature_data["min"]
                temperature_limit.max_value = temperature_data["max"]
                temperature_limit.is_active = temperature_data["active"]
                temperature_limit.updated_at = datetime.now()
            else:
                # Create new record
                temperature_limit = SensorLimits(
                    sensor_type="temperature",
                    min_value=temperature_data["min"],
                    max_value=temperature_data["max"],
                    is_active=temperature_data["active"]
                )
                db.session.add(temperature_limit)
        
        # Update TDS limits
        if "tds" in data:
            tds_data = data["tds"]
            tds_limit = SensorLimits.query.filter_by(sensor_type="tds").first()
            
            if tds_limit:
                # Update existing record
                tds_limit.min_value = tds_data["min"]
                tds_limit.max_value = tds_data["max"]
                tds_limit.is_active = tds_data["active"]
                tds_limit.updated_at = datetime.now()
            else:
                # Create new record
                tds_limit = SensorLimits(
                    sensor_type="tds",
                    min_value=tds_data["min"],
                    max_value=tds_data["max"],
                    is_active=tds_data["active"]
                )
                db.session.add(tds_limit)
        
        db.session.commit()
        return jsonify({"message": "Sensor limits updated successfully"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

# Flask routes for pump control
@app.route("/pump/<int:pump_id>/start", methods=["POST"])
def start_pump(pump_id):
    try:
        # Get duration from request (default: 5 seconds)
        data = request.get_json() or {}
        duration = data.get("duration", 5)
        
        # Start pump
        if pump_id == 1:
            pump1_forward()
        elif pump_id == 2:
            pump2_forward()
        elif pump_id == 3:
            pump3_forward()
        elif pump_id == 4:
            pump4_forward()
        else:
            return jsonify({"message": f"Invalid pump ID: {pump_id}"}), 400
            
        # Start a timer to auto-stop the pump after specified duration
        if duration > 0:
            stop_thread = threading.Thread(target=auto_stop_pump, args=(pump_id, duration))
            stop_thread.daemon = True
            stop_thread.start()
            
        return jsonify({
            "message": f"Pump {pump_id} started",
            "status": "running",
            "auto_stop": duration if duration > 0 else "disabled"
        }), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route("/pump/<int:pump_id>/stop", methods=["POST"])
def stop_pump(pump_id):
    try:
        # Stop pump
        if pump_id == 1:
            pump1_stop()
        elif pump_id == 2:
            pump2_stop()
        elif pump_id == 3:
            pump3_stop()
        elif pump_id == 4:
            pump4_stop()
        else:
            return jsonify({"message": f"Invalid pump ID: {pump_id}"}), 400
            
        return jsonify({
            "message": f"Pump {pump_id} stopped",
            "status": "stopped"
        }), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route("/pump/status", methods=["GET"])
def get_pump_status():
    try:
        return jsonify(pump_status), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route("/pump/all/start", methods=["POST"])
def start_all_pumps():
    try:
        # Get duration from request (default: 5 seconds)
        data = request.get_json() or {}
        duration = data.get("duration", 5)
        
        # Start all pumps
        pump1_forward()
        pump2_forward()
        pump3_forward()
        pump4_forward()
        
        # Start a timer to auto-stop all pumps after specified duration
        if duration > 0:
            for pump_id in range(1, 5):
                stop_thread = threading.Thread(target=auto_stop_pump, args=(pump_id, duration))
                stop_thread.daemon = True
                stop_thread.start()
            
        return jsonify({
            "message": "All pumps started",
            "status": "running",
            "auto_stop": duration if duration > 0 else "disabled"
        }), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route("/pump/all/stop", methods=["POST"])
def stop_all_pumps():
    try:
        # Stop all pumps
        pump1_stop()
        pump2_stop()
        pump3_stop()
        pump4_stop()
            
        return jsonify({
            "message": "All pumps stopped",
            "status": "stopped"
        }), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

# Camera route -------------------------------------------------------------------------------------------------------
@app.route("/start_stream", methods=["POST"])
def start_stream():
    global is_streaming, camera_thread
    
    # Reset streaming state and ensure any previous thread is stopped
    is_streaming = False
    if camera_thread and camera_thread.is_alive():
        camera_thread.join(timeout=2)
    
    # Start new streaming session
    is_streaming = True
    camera_thread = socketio.start_background_task(generate_frames)
    return jsonify({"message": "Stream started"}), 200

@app.route("/stop_stream", methods=["POST"])
def stop_stream():
    global is_streaming
    
    is_streaming = False
    
    # Optional: Add a small delay to ensure streaming stops
    socketio.sleep(0.5)
    
    return jsonify({"message": "Stream stopped"}), 200

@app.route("/capture_photo", methods=["POST"])
def capture_photo():
    try:
        camera = initialize_camera()

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"photo_{timestamp}.jpg"
        filepath = os.path.join(PHOTO_DIRECTORY, filename)

        camera.start_and_capture_file(filepath)
        camera.close()

        new_photo = PhotoRecord(
            filename=filename, 
            google_drive_link=filepath
        )
        db.session.add(new_photo)
        db.session.commit()

        return jsonify({
            "message": "Photo captured successfully", 
            "filename": filename,
            "filepath": filepath
        }), 200

    except Exception as e:
        app.logger.error(f"Error capturing photo: {str(e)}")
        return jsonify({"message": str(e)}), 400


# New route to get photo records
@app.route("/get_photo_records", methods=["GET"])
def get_photo_records():
    try:
        photo_records = PhotoRecord.query.all()
        results = [record.to_json() for record in photo_records]
        return jsonify({"photo_records": results}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route("/get_latest_photo", methods=["GET"])
def get_latest_photo():
    try:
        # Get the most recently captured photo
        photos = sorted([f for f in os.listdir(PHOTO_DIRECTORY) if f.endswith('.jpg')], reverse=True)
        
        if not photos:
            return jsonify({"message": "No photos found"}), 404
        
        latest_photo = photos[0]
        filepath = os.path.join(PHOTO_DIRECTORY, latest_photo)
        
        return send_file(filepath, mimetype='image/jpeg')
    except Exception as e:
        return jsonify({"message": str(e)}), 400

# Temperature and Humidity sensor routes --------------------------------------------------------------------------------
@app.route("/get_temperature_humidity", methods=["GET"])
def get_temperature_humidity():
    try:
        
        temperature = dht_sensor.temperature
        humidity = dht_sensor.humidity

        
        if temperature is not None and humidity is not None:
            # Store sensor data
            new_data = TemperatureHumidityData(
                temperature=temperature, 
                humidity=humidity
            )
            db.session.add(new_data)
            db.session.commit()
            
            return jsonify({
                "temperature": temperature, 
                "humidity": humidity
            }), 200
        else:
            return jsonify({"message": "Failed to read sensor data"}), 400
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route("/get_temperature_humidity_history", methods=["GET"])
def get_temperature_humidity_history():
    try:
        all_data = TemperatureHumidityData.query.all()
        results = [data.to_json() for data in all_data]
        return jsonify({"temperature_humidity_data": results}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route("/delete_temperature_humidity_data", methods=["POST"])
def delete_temperature_humidity_data():
    try:
        TemperatureHumidityData.query.delete()
        db.session.commit()
        return jsonify({"message": "All temperature and humidity data deleted successfully!"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

#moisture sensor routes------------------------------------------------------------------------------------------------
@app.route("/get_moisture_data", methods=["GET"])
def get_moisture_data():
    try:
        all_data = MoistureSensorData.query.all()
        results = [{"id": data.id, "moisture_level": data.moisture_level, "state": data.state, "date": data.date} for data in all_data]
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    return jsonify({"moisture_data": results}), 200

@app.route("/check_moisture", methods=["GET"])
def check_moisture():
    try:
        mois = sensor.moisture
        if mois:
            if 0 <= mois < 300:
                state = "dry"
            elif 300 <= mois < 600:
                state = "moist"
            else:
                state = "wet"
            new_data = MoistureSensorData(moisture_level=mois, state=state)
            db.session.add(new_data)
            db.session.commit()
            return jsonify({"moisture_level": mois, "state": state}), 200
        else:
            return jsonify({"message": "Failed to read Moisture sensor data"}), 400
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route("/delete_moisture_data", methods=["POST"])
def delete_moisture_data():
    try:
        MoistureSensorData.query.delete()
        db.session.commit()
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    return jsonify({"message": "All moisture data deleted successfully!"}), 200

#tds sensor routes------------------------------------------------------------------------------------------------

@app.route("/get_tds", methods=["GET"])
def get_tds():
    try:
        set_servo_angle(handle, 0)
        sleep(5)
        ec_sensor = GroveEC(channel=2, window_size=50)
        ec_sensor.begin()

        ec_readings = []

        voltage = ec_sensor.read_voltage()
                
        # Get EC value with temperature compensation
        ec_value = ec_sensor.read_EC(voltage, 25)

        # Store reading
        ec_readings.append(ec_value)
        if len(ec_readings) > 10:
            ec_readings.pop(0)  # Keep last 10 readings

        # Calculate stable EC value
        stable_ec = np.median(ec_readings) if ec_readings else ec_value
        set_servo_angle(handle, 90)
        if stable_ec:
            new_data = TDSData(tds_value=stable_ec)
            db.session.add(new_data)
            db.session.commit()
            return jsonify({"tds_value": stable_ec}), 200
        else:
            return jsonify({"message": "Failed to read TDS sensor data"}), 400
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route("/get_tds_history", methods=["GET"])
def get_tds_history():
    try:
        all_data = TDSData.query.all()
        results = [data.to_json() for data in all_data]
        return jsonify({"tds_data": results}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route("/delete_tds_data", methods=["POST"])
def delete_tds_data():
    try:
        TDSData.query.delete()
        db.session.commit()
        return jsonify({"message": "All TDS data deleted successfully!"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

#ph sensor routes------------------------------------------------------------------------------------------------
@app.route("/get_ph", methods=["GET"])
def get_ph():
    try:
        ph_val = Phsensor.PH
        latest_range = SensorLimits.query.filter_by(sensor_type="ph").order_by(SensorLimits.updated_at.desc()).first()

        if latest_range:
            min_ph = latest_range.min_value
            max_ph = latest_range.max_value
            print(min_ph)

            mode = f"Range: {min_ph}-{max_ph}"
        # Store in database
        new_data = PHData(ph_value=ph_val,mode=mode)
        db.session.add(new_data)
        db.session.commit()

        return jsonify({"ph_value": ph_val}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route("/get_ph_history", methods=["GET"])
def get_ph_history():
    try:
        all_data = PHData.query.all()
        results = [data.to_json() for data in all_data]
        return jsonify({"ph_data": results}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route("/delete_ph_data", methods=["POST"])
def delete_ph_data():
    try:
        PHData.query.delete()
        db.session.commit()
        return jsonify({"message": "All pH data deleted successfully!"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400


#download and delete database content as pdf--------------------------------------------------------------------------------
@app.route("/download_database_pdf", methods=["GET"])
def download_database_pdf():
    try:
        # Query data from all tables
        light_data = LightBulb.query.all()
        moisture_data = MoistureSensorData.query.all()
        temp_humidity_data = TemperatureHumidityData.query.all()
        photo_data = PhotoRecord.query.all()
        ph_data = PHData.query.all()
        tds_data = TDSData.query.all()

        # Create an in-memory file
        pdf_buffer = BytesIO()
        pdf = canvas.Canvas(pdf_buffer, pagesize=letter)

        # Add title
        pdf.setFont("Helvetica-Bold", 16)
        pdf.drawString(100, 750, "Plant Care Dashboard - Database Content")

        # Add Light Data
        pdf.setFont("Helvetica", 12)
        pdf.drawString(50, 720, "Light History:")
        y = 700
        for data in light_data:
            pdf.drawString(60, y, f"Status: {data.status}, Date: {data.date}")
            y -= 20

        # Add Moisture Data
        pdf.drawString(50, y - 20, "Moisture History:")
        y -= 40
        for data in moisture_data:
            pdf.drawString(60, y, f"Level: {data.moisture_level}, State: {data.state}, Date: {data.date}")
            y -= 20
            if y < 50:  # Start a new page if content exceeds the page
                pdf.showPage()
                y = 750

        # Add Temperature and Humidity Data
        pdf.drawString(50, y - 20, "Temperature & Humidity History:")
        y -= 40
        for data in temp_humidity_data:
            pdf.drawString(60, y, f"Temp: {data.temperature}°C, Humidity: {data.humidity}%, Date: {data.date}")
            y -= 20
            if y < 50:
                pdf.showPage()
                y = 750

        # Add Photo Records
        pdf.drawString(50, y - 20, "Photo Records:")
        y -= 40
        for data in photo_data:
            pdf.drawString(60, y, f"Filename: {data.filename}, Path: {data.google_drive_link}, Captured: {data.captured_at}")
            y -= 20
            if y < 50:
                pdf.showPage()
                y = 750
        
        #add ph data
        pdf.drawString(50, y - 20, "PH History:")
        y -= 40
        for data in ph_data:
            pdf.drawString(60, y, f"PH Value: {data.ph_value}, Date: {data.date}")
            y -= 20
            if y < 50:
                pdf.showPage()
                y = 750
        
        #add tds data
        pdf.drawString(50, y - 20, "EC History:")
        y -= 40
        for data in tds_data:
            pdf.drawString(60, y, f"EC Value: {data.tds_value}, Date: {data.date}")
            y -= 20
            if y < 50:
                pdf.showPage()
                y = 750


        pdf.save()

        # Return the PDF as a downloadable file
        pdf_buffer.seek(0)
        return send_file(pdf_buffer, as_attachment=True, download_name="database_content.pdf", mimetype="application/pdf")

    except Exception as e:
        return jsonify({"message": str(e)}), 400



#this will delete all but the latest 10 entries in the database for each sensor type.
@app.route("/download_database_csv_auto", methods=["GET"])
def download_database_csv_auto():
    try:
        import io
        from io import BytesIO
        import pytz
        from sqlalchemy import desc
        
        # Configure timezone - use the same timezone as in your models
        DEFAULT_TIMEZONE = pytz.timezone('Asia/Kolkata')  # Change to match your models file
        
        # Query data from all tables
        temp_humidity_data = TemperatureHumidityData.query.all()
        ph_data = PHData.query.all()
        tds_data = TDSData.query.all()
        
        # Create an in-memory file
        csv_buffer = io.StringIO()
        
        # Write header for combined data
        csv_buffer.write("Date,Temperature (°C),Humidity (%),pH,EC,Time\n")
        
        # Create a dictionary to store data by date
        combined_data = {}
        
        # Process temperature & humidity data
        for data in temp_humidity_data:
            # Convert naive datetime to aware datetime with proper timezone
            localized_date = data.date.replace(tzinfo=pytz.UTC).astimezone(DEFAULT_TIMEZONE)
            date_str = localized_date.strftime("%Y-%m-%d")
            time_str = localized_date.strftime("%H:%M:%S")
            
            if date_str not in combined_data:
                combined_data[date_str] = {}
            
            if time_str not in combined_data[date_str]:
                combined_data[date_str][time_str] = {"temp": None, "humidity": None, "ph": None, "tds": None}
            
            combined_data[date_str][time_str]["temp"] = data.temperature
            combined_data[date_str][time_str]["humidity"] = data.humidity
        
        # Process pH data
        for data in ph_data:
            # Convert naive datetime to aware datetime with proper timezone
            localized_date = data.timestamp.replace(tzinfo=pytz.UTC).astimezone(DEFAULT_TIMEZONE)
            date_str = localized_date.strftime("%Y-%m-%d")
            time_str = localized_date.strftime("%H:%M:%S")
            
            if date_str not in combined_data:
                combined_data[date_str] = {}
            
            if time_str not in combined_data[date_str]:
                combined_data[date_str][time_str] = {"temp": None, "humidity": None, "ph": None, "tds": None}
            
            combined_data[date_str][time_str]["ph"] = data.ph_value
        
        # Process TDS data
        for data in tds_data:
            # Convert naive datetime to aware datetime with proper timezone
            localized_date = data.date.replace(tzinfo=pytz.UTC).astimezone(DEFAULT_TIMEZONE)
            date_str = localized_date.strftime("%Y-%m-%d")
            time_str = localized_date.strftime("%H:%M:%S")
            
            if date_str not in combined_data:
                combined_data[date_str] = {}
            
            if time_str not in combined_data[date_str]:
                combined_data[date_str][time_str] = {"temp": None, "humidity": None, "ph": None, "tds": None}
            
            combined_data[date_str][time_str]["tds"] = data.tds_value
        
        # Write combined data to CSV
        for date_str in sorted(combined_data.keys()):
            for time_str in sorted(combined_data[date_str].keys()):
                data_point = combined_data[date_str][time_str]
                csv_buffer.write(f"{date_str},{data_point['temp'] or ''},{data_point['humidity'] or ''},{data_point['ph'] or ''},{data_point['tds'] or ''},{time_str}\n")
        
        # Convert to BytesIO for sending file
        bytes_buffer = BytesIO()
        bytes_buffer.write(csv_buffer.getvalue().encode('utf-8'))
        bytes_buffer.seek(0)
        
        # Store IDs of records to keep (latest 10 entries for each sensor type)
        
        # For temperature and humidity (assuming they are in the same table with same timestamp)
        temp_humidity_keep = TemperatureHumidityData.query.order_by(
            desc(TemperatureHumidityData.date)
        ).limit(10).all()
        temp_humidity_ids_to_keep = [record.id for record in temp_humidity_keep]
        
        # For pH data
        ph_keep = PHData.query.order_by(
            desc(PHData.timestamp)
        ).limit(10).all()
        ph_ids_to_keep = [record.id for record in ph_keep]
        
        # For TDS data
        tds_keep = TDSData.query.order_by(
            desc(TDSData.date)
        ).limit(10).all()
        tds_ids_to_keep = [record.id for record in tds_keep]
        
        # Delete old records (keeping the latest 10 for each sensor type)
        try:
            # Delete old temperature & humidity records
            TemperatureHumidityData.query.filter(
                ~TemperatureHumidityData.id.in_(temp_humidity_ids_to_keep)
            ).delete(synchronize_session=False)
            
            # Delete old pH records
            PHData.query.filter(
                ~PHData.id.in_(ph_ids_to_keep)
            ).delete(synchronize_session=False)
            
            # Delete old TDS records
            TDSData.query.filter(
                ~TDSData.id.in_(tds_ids_to_keep)
            ).delete(synchronize_session=False)
            
            # Commit the changes
            db.session.commit()
        except Exception as delete_error:
            db.session.rollback()
            # If deletion fails, still return the file but log the error
            print(f"Error during database cleanup: {str(delete_error)}")
        
        # Return the CSV as a downloadable file
        return send_file(
            bytes_buffer, 
            as_attachment=True,
            download_name="sensor_data.csv", 
            mimetype="text/csv"
        )

    except Exception as e:
        return jsonify({"message": str(e)}), 400


@app.route("/download_database_csv", methods=["GET"])
def download_database_csv():
    try:
        import io
        from io import BytesIO
        import pytz
        
        # Configure timezone - use the same timezone as in your models
        DEFAULT_TIMEZONE = pytz.timezone('Asia/Kolkata')  # Change to match your models file
        
        # Query data from all tables
        temp_humidity_data = TemperatureHumidityData.query.all()
        ph_data = PHData.query.all()
        tds_data = TDSData.query.all()
        
        # Create an in-memory file
        csv_buffer = io.StringIO()
        
        # Write header for combined data
        csv_buffer.write("Date,Temperature (°C),Humidity (%),pH,EC,Time\n")
        
        # Create a dictionary to store data by date
        combined_data = {}
        
        # Process temperature & humidity data
        for data in temp_humidity_data:
            # Convert naive datetime to aware datetime with proper timezone
            localized_date = data.date.replace(tzinfo=pytz.UTC).astimezone(DEFAULT_TIMEZONE)
            date_str = localized_date.strftime("%Y-%m-%d")
            time_str = localized_date.strftime("%H:%M:%S")
            
            if date_str not in combined_data:
                combined_data[date_str] = {}
            
            if time_str not in combined_data[date_str]:
                combined_data[date_str][time_str] = {"temp": None, "humidity": None, "ph": None, "tds": None}
            
            combined_data[date_str][time_str]["temp"] = data.temperature
            combined_data[date_str][time_str]["humidity"] = data.humidity
        
        # Process pH data
        for data in ph_data:
            # Convert naive datetime to aware datetime with proper timezone
            localized_date = data.timestamp.replace(tzinfo=pytz.UTC).astimezone(DEFAULT_TIMEZONE)
            date_str = localized_date.strftime("%Y-%m-%d")
            time_str = localized_date.strftime("%H:%M:%S")
            
            if date_str not in combined_data:
                combined_data[date_str] = {}
            
            if time_str not in combined_data[date_str]:
                combined_data[date_str][time_str] = {"temp": None, "humidity": None, "ph": None, "tds": None}
            
            combined_data[date_str][time_str]["ph"] = data.ph_value
        
        # Process TDS data
        for data in tds_data:
            # Convert naive datetime to aware datetime with proper timezone
            localized_date = data.date.replace(tzinfo=pytz.UTC).astimezone(DEFAULT_TIMEZONE)
            date_str = localized_date.strftime("%Y-%m-%d")
            time_str = localized_date.strftime("%H:%M:%S")
            
            if date_str not in combined_data:
                combined_data[date_str] = {}
            
            if time_str not in combined_data[date_str]:
                combined_data[date_str][time_str] = {"temp": None, "humidity": None, "ph": None, "tds": None}
            
            combined_data[date_str][time_str]["tds"] = data.tds_value
        
        # Write combined data to CSV
        for date_str in sorted(combined_data.keys()):
            for time_str in sorted(combined_data[date_str].keys()):
                data_point = combined_data[date_str][time_str]
                csv_buffer.write(f"{date_str},{data_point['temp'] or ''},{data_point['humidity'] or ''},{data_point['ph'] or ''},{data_point['tds'] or ''},{time_str}\n")
        
        # Convert to BytesIO for sending file
        bytes_buffer = BytesIO()
        bytes_buffer.write(csv_buffer.getvalue().encode('utf-8'))
        bytes_buffer.seek(0)
        
        # Return the CSV as a downloadable file
        return send_file(
            bytes_buffer, 
            as_attachment=True,
            download_name="sensor_data.csv", 
            mimetype="text/csv"
        )

    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route("/delete_all_data", methods=["POST"])
def delete_all_data():
    try:
        # Delete all records from the LightBulb table
        LightBulb.query.delete()
        db.session.commit()
    except Exception as e:
        return jsonify({"message": str(e)}), 400

    return jsonify({"message": "All data deleted successfully!"}), 200

#relay routes------------------------------------------------------------------------------------------------
@app.route("/get_contacts", methods=["GET"])
def get_contacts():
    try:
        # Fetch all records from the LightBulb table
        all_contacts = LightBulb.query.all()
        # Use the to_json method to format each contact with its date
        results = [contact.to_json() for contact in all_contacts]
    except Exception as e:
        return jsonify({"message": str(e)}), 400

    return jsonify({"contacts": results}), 200

@app.route("/toggle_relay", methods=["POST"])
def toggle_relay():
    try:
        # Toggle the relay state
        if relay.is_active:
            relay.off()
            light_status = "OFF"
        else:
            relay.on()
            light_status = "ON"

        # Create a new LightBulb entry with the status and current timestamp
        new_light_bulb = LightBulb(status=light_status)
        db.session.add(new_light_bulb)
        db.session.commit()
    except Exception as e:
        return jsonify({"message": str(e)}), 400

    return jsonify({"status": light_status}), 200

@app.route("/get_relay_status", methods=["GET"])
def get_relay_status():
    try:
        # Get current relay status
        light_status = "ON" if relay.is_active else "OFF"
    except Exception as e:
        return jsonify({"message": str(e)}), 400

    return jsonify({"status": light_status}), 200

@app.route("/database_structure", methods=["GET"])
def database_structure():
    try:
        structure = {}
        for table in db.metadata.tables.values():
            structure[table.name] = [column.name + " (" + str(column.type) + ")" for column in table.columns]

        return jsonify(structure), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400


#location routes------------------------------------------------------------------------------------------------
@app.route("/get-location", methods=["GET"])
def get_location_route():
    return jsonify(get_location())  


atexit.register(cleanup_gpio)

def signal_handler(sig, frame):
    print("Shutting down gracefully...")
    try:
        cleanup_gpio()
    except Exception as e:
        print(f"Error in signal handler: {e}")
    sys.exit(0)

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    
    # Start the background task

    data_fetch_thread = threading.Thread(target=fetch_sensor_data)
    data_fetch_thread.daemon = True  # This makes sure the thread will exit when the main program does
    data_fetch_thread.start()

    humidity_check_thread = threading.Thread(target=check_humidity_regularly)
    humidity_check_thread.daemon = True
    humidity_check_thread.start()
    
    app.run(host='0.0.0.0', port=5000)
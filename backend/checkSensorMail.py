from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
import json
import os
from datetime import datetime, timedelta

class SensorMonitor:
    def __init__(self):
        # Load email configuration from a config file
        self.email_config = self.load_email_config()
        
        # Define sensor thresholds and timeout values
        self.thresholds = {
            'temperature': {'min': -10, 'max': 100},  # °C
            'humidity': {'min': 0, 'max': 100},  # %
            'tds': {'min': 0, 'max': 2000},  # ppm
            'ph': {'min': 0, 'max': 20}  # pH scale
        }
        
        # Track sensor fault states and notification times
        self.sensor_states = {
            'temperature': {'is_faulted': False, 'last_notification': None, 'fault_start': None},
            'humidity': {'is_faulted': False, 'last_notification': None, 'fault_start': None},
            'moisture': {'is_faulted': False, 'last_notification': None, 'fault_start': None},
            'tds': {'is_faulted': False, 'last_notification': None, 'fault_start': None},
            'ph': {'is_faulted': False, 'last_notification': None, 'fault_start': None}
        }
        
        # Time between initial notification and reminder (in days)
        self.reminder_interval = 5
        # Minimum time between notifications for the same sensor (in hours)
        self.notification_cooldown = 1
    
    def load_email_config(self):
        """Load email configuration from a JSON file"""
        try:
            with open('email_config.json', 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            # Create default config file if it doesn't exist
            default_config = {
                'smtp_server': 'smtp.gmail.com',
                'smtp_port': 587,
                'sender_email': 'kartik134yadav@gmail.com',
                'sender_password': 'yttu pnfp vbzt xake',
                'recipient_email': 'kar9877ml@gmail.com'
            }
            with open('email_config.json', 'w') as f:
                json.dump(default_config, f, indent=4)
            return default_config

    def send_email_alert(self, sensor_name, error_message, is_reminder=False):
        """Send email notification about sensor failure"""
        try:
            current_time = datetime.now()
            sensor_state = self.sensor_states[sensor_name]
            
            # Check if we're still in cooldown period for this sensor
            if (sensor_state['last_notification'] and 
                (current_time - sensor_state['last_notification']).total_seconds() < self.notification_cooldown * 3600):
                return
            
            msg = MIMEMultipart()
            msg['From'] = self.email_config['sender_email']
            msg['To'] = self.email_config['recipient_email']
            
            if is_reminder:
                msg['Subject'] = f"REMINDER: {sensor_name} Sensor Still Malfunctioning"
                fault_duration = (current_time - sensor_state['fault_start']).days
                body = f"""
                Reminder: The {sensor_name} sensor has been malfunctioning for {fault_duration} days
                
                Initial Error: {error_message}
                Initial Fault Date: {sensor_state['fault_start'].strftime('%Y-%m-%d %H:%M:%S')}
                Current Time: {current_time.strftime('%Y-%m-%d %H:%M:%S')}
                
                Please check the sensor and system for any issues.
                """
            else:
                msg['Subject'] = f"Sensor Alert: {sensor_name} Malfunction Detected"
                body = f"""
                Alert: Problem detected with {sensor_name} sensor
                
                Error Details: {error_message}
                Time: {current_time.strftime('%Y-%m-%d %H:%M:%S')}
                
                A reminder will be sent in {self.reminder_interval} days if the issue persists.
                
                Please check the sensor and system for any issues.
                """
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Connect to SMTP server and send email
            with smtplib.SMTP(self.email_config['smtp_server'], self.email_config['smtp_port']) as server:
                server.starttls()
                server.login(self.email_config['sender_email'], self.email_config['sender_password'])
                server.send_message(msg)
            
            # Update sensor state
            sensor_state['last_notification'] = current_time
            if not sensor_state['is_faulted']:
                sensor_state['is_faulted'] = True
                sensor_state['fault_start'] = current_time
            
        except Exception as e:
            print(f"Failed to send email alert: {str(e)}")

    def check_sensor_reading(self, sensor_name, value):
        """Check if sensor reading is within expected range"""
        if sensor_name not in self.thresholds:
            return
        
        current_time = datetime.now()
        sensor_state = self.sensor_states[sensor_name]
        threshold = self.thresholds[sensor_name]
        
        # Check if sensor is faulted
        is_faulted = value is None or value < threshold['min'] or value > threshold['max']
        
        if is_faulted:
            error_message = (f"Sensor reading ({value}) is outside expected range "
                           f"({threshold['min']} - {threshold['max']})")
            
            if not sensor_state['is_faulted']:
                # New fault - send initial notification
                self.send_email_alert(sensor_name, error_message)
            elif sensor_state['fault_start']:
                # Check if it's time for a reminder
                days_since_fault = (current_time - sensor_state['fault_start']).days
                if days_since_fault >= self.reminder_interval:
                    self.send_email_alert(sensor_name, error_message, is_reminder=True)
        else:
            # Sensor is working again
            if sensor_state['is_faulted']:
                # Send recovery notification
                recovery_message = f"Sensor has recovered. Current reading: {value}"
                self.send_email_alert(sensor_name, recovery_message)
                # Reset sensor state
                sensor_state['is_faulted'] = False
                sensor_state['fault_start'] = None

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
            tds_value = tdssensor.TDS
            monitor.check_sensor_reading('tds', tds_value)
        except Exception as e:
            monitor.send_email_alert('TDS Sensor', f"Failed to read TDS: {str(e)}")
        
        # Check pH
        try:
            raw_voltage = adc.read_voltage(4)
            voltage = (raw_voltage * 5.0 / 4095.0) - 0.354
            ph_val = 7 + ((2.5 - voltage) / 0.18)
            monitor.check_sensor_reading('ph', ph_val)
        except Exception as e:
            monitor.send_email_alert('pH Sensor', f"Failed to read pH: {str(e)}")
            
    except Exception as e:
        print(f"Error in sensor monitoring: {str(e)}")

# Modify the fetch_sensor_data function to include fault detection
def fetch_sensor_data():
    while True:
        try:
            # Check all sensors
            check_sensors()
            
            # Original sensor data collection
            requests.get("http://127.0.0.1:5000/get_ph")
            requests.get("http://127.0.0.1:5000/get_temperature_humidity")
            requests.get("http://127.0.0.1:5000/get_tds")
            requests.get("http://127.0.0.1:5000/check_moisture")
        except Exception as e:
            print(f"Error fetching sensor data: {e}")
        
        time.sleep(600)  # 10 mins
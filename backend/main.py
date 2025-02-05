from datetime import datetime
from flask import request, jsonify
from flask import Flask, send_file
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from config import app, db
from models import LightBulb, MoistureSensorData, TemperatureHumidityData, PhotoRecord, TDSData
# from gpiozero import OutputDevice
# from grove.grove_moisture_sensor import GroveMoistureSensor
# from gpiozero import Servo
from time import sleep
import time
# import adafruit_dht
# import board
import os

import math
import sys
import time
# from grove.adc import ADC

# class GroveTDS:
#     def __init__(self, channel):
#         self.channel = channel
#         self.adc = ADC()

#     @property
#     def TDS(self):
#         value = self.adc.read(self.channel)
#         if value != 0:
#             voltage = value * 5 / 1024.0
#             tds_value = (133.42 * voltage**3 - 255.86 * voltage**2 + 857.39 * voltage) * 0.5
#             return tds_value
#         return 0

# tdssensor = GroveTDS(2)

# from sqlalchemy import inspect
# @app.route("/get_table_columns", methods=["GET"])
# def get_table_columns():
#     try:
#         # Use SQLAlchemy inspector to get table information
#         inspector = inspect(db.engine)
#         columns = inspector.get_columns("photo_record")
#         column_names = [column["name"] for column in columns]
        
#         return jsonify({"columns": column_names}), 200
#     except Exception as e:
#         return jsonify({"message": str(e)}), 400

#camera
# from flask import Flask, Response
# from flask_socketio import SocketIO
# from picamera2 import Picamera2,Preview
# import io
# import threading
# import base64

#live feed

# socketio = SocketIO(app, cors_allowed_origins="*")
# is_streaming = False
# camera_thread = None

# global_camera = None
# camera_lock = threading.Lock()

# def initialize_camera():
#     global global_camera
#     with camera_lock:
#         if global_camera is not None:
#             try:
#                 global_camera.close()
#             except:
#                 pass
        
#         global_camera = Picamera2()
#         global_camera.start()
#     return global_camera

# def generate_frames():
#     global is_streaming, global_camera
    
#     try:
#         camera = initialize_camera()
        
#         while is_streaming:
#             # Capture frame
#             frame = camera.capture_image()
            
#             # Convert frame to JPEG
#             buffer = io.BytesIO()
#             frame.save(buffer, format="JPEG")
#             frame_bytes = buffer.getvalue()
            
#             # Encode frame to base64
#             encoded_frame = base64.b64encode(frame_bytes).decode('utf-8')
            
#             # Emit frame via WebSocket
#             socketio.emit('camera_frame', {'image': encoded_frame})
            
#             socketio.sleep(0.1)  # Adjust frame rate
#     except Exception as e:
#         print(f"Streaming error: {e}")
#     finally:
#         with camera_lock:
#             if global_camera is not None:
#                 global_camera.close()
#                 global_camera = None

#photo capture

# PHOTO_DIRECTORY = "captured_photos"
# os.makedirs(PHOTO_DIRECTORY, exist_ok=True)

# RELAY_PIN = 16
# relay = OutputDevice(RELAY_PIN)

# #temperature and humidity sensor
# dht_sensor = adafruit_dht.DHT11(board.D5)

# # Moisture sensor setup
# sensor = GroveMoistureSensor(0)

# #servo setup
# servo = Servo(12)

# # Moisture state tracking
# last_dry_state = False
# last_wet_state = False

# @app.route("/start_stream", methods=["POST"])
# def start_stream():
#     global is_streaming, camera_thread
    
#     # Reset streaming state and ensure any previous thread is stopped
#     is_streaming = False
#     if camera_thread and camera_thread.is_alive():
#         camera_thread.join(timeout=2)
    
#     # Start new streaming session
#     is_streaming = True
#     camera_thread = socketio.start_background_task(generate_frames)
#     return jsonify({"message": "Stream started"}), 200

# @app.route("/stop_stream", methods=["POST"])
# def stop_stream():
#     global is_streaming
    
#     is_streaming = False
    
#     # Optional: Add a small delay to ensure streaming stops
#     socketio.sleep(0.5)
    
#     return jsonify({"message": "Stream stopped"}), 200

# @app.route("/capture_photo", methods=["POST"])
# def capture_photo():
#     try:
#         camera = initialize_camera()

#         timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
#         filename = f"photo_{timestamp}.jpg"
#         filepath = os.path.join(PHOTO_DIRECTORY, filename)

#         camera.start_and_capture_file(filepath)
#         camera.close()

#         new_photo = PhotoRecord(
#             filename=filename, 
#             google_drive_link=filepath
#         )
#         db.session.add(new_photo)
#         db.session.commit()

#         return jsonify({
#             "message": "Photo captured successfully", 
#             "filename": filename,
#             "filepath": filepath
#         }), 200

#     except Exception as e:
#         app.logger.error(f"Error capturing photo: {str(e)}")
#         return jsonify({"message": str(e)}), 400


# New route to get photo records
@app.route("/get_photo_records", methods=["GET"])
def get_photo_records():
    try:
        photo_records = PhotoRecord.query.all()
        results = [record.to_json() for record in photo_records]
        return jsonify({"photo_records": results}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

# @app.route("/get_latest_photo", methods=["GET"])
# def get_latest_photo():
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


# @app.route("/get_tds", methods=["GET"])
# def get_tds():
#     try:
#         tds_value = tdssensor.TDS
#         if tds_value:
#             new_data = TDSData(tds_value=tds_value)
#             db.session.add(new_data)
#             db.session.commit()
#             return jsonify({"tds_value": tds_value}), 200
#         else:
#             return jsonify({"message": "Failed to read TDS sensor data"}), 400
#     except Exception as e:
#         return jsonify({"message": str(e)}), 400

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


@app.route("/download_database_pdf", methods=["GET"])
def download_database_pdf():
    try:
        # Query data from all tables
        light_data = LightBulb.query.all()
        moisture_data = MoistureSensorData.query.all()
        temp_humidity_data = TemperatureHumidityData.query.all()
        photo_data = PhotoRecord.query.all()

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

        pdf.save()

        # Return the PDF as a downloadable file
        pdf_buffer.seek(0)
        return send_file(pdf_buffer, as_attachment=True, download_name="database_content.pdf", mimetype="application/pdf")

    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route("/get_moisture_data", methods=["GET"])
def get_moisture_data():
    try:
        all_data = MoistureSensorData.query.all()
        results = [{"id": data.id, "moisture_level": data.moisture_level, "state": data.state, "date": data.date} for data in all_data]
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    return jsonify({"moisture_data": results}), 200

# @app.route("/check_moisture", methods=["GET"])
# def check_moisture():
#     global last_dry_state, last_wet_state
#     mois = sensor.moisture
#     if 0 <= mois < 300:
#         state = "dry"
#         if not last_dry_state:
#             # Store data only when first reaching dry state
#             new_data = MoistureSensorData(moisture_level=mois, state=state)
#             db.session.add(new_data)
#             db.session.commit()
#             last_dry_state = True
#             last_wet_state = False
#             servo.min()
#             # Set motor to 90 degrees for dry state
#             # set_angle(90)
#         else:
#             return jsonify({"message": "Already in dry state."}), 200
#     elif 300 <= mois < 600:
#         state = "moist"
#     else:
#         state = "wet"
#         if not last_wet_state:
#             # Store data only when first reaching wet state
#             new_data = MoistureSensorData(moisture_level=mois, state=state)
#             db.session.add(new_data)
#             db.session.commit()
#             last_wet_state = True
#             last_dry_state = False
#             servo.max()
#             # Set motor to 0 degrees for wet state
#             # set_angle(0)

#     return jsonify({"moisture_level": mois, "state": state}), 200

# @app.route("/delete_moisture_data", methods=["POST"])
# def delete_moisture_data():
#     try:
#         MoistureSensorData.query.delete()
#         db.session.commit()
#     except Exception as e:
#         return jsonify({"message": str(e)}), 400
#     return jsonify({"message": "All moisture data deleted successfully!"}), 200

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

# @app.route("/toggle_relay", methods=["POST"])
# def toggle_relay():
#     try:
#         # Toggle the relay state
#         if relay.is_active:
#             relay.off()
#             light_status = "OFF"
#         else:
#             relay.on()
#             light_status = "ON"

#         # Create a new LightBulb entry with the status and current timestamp
#         new_light_bulb = LightBulb(status=light_status)
#         db.session.add(new_light_bulb)
#         db.session.commit()
#     except Exception as e:
#         return jsonify({"message": str(e)}), 400

#     return jsonify({"status": light_status}), 200

# @app.route("/get_relay_status", methods=["GET"])
# def get_relay_status():
#     try:
#         # Get current relay status
#         light_status = "ON" if relay.is_active else "OFF"
#     except Exception as e:
#         return jsonify({"message": str(e)}), 400

#     return jsonify({"status": light_status}), 200

@app.route("/delete_all_data", methods=["POST"])
def delete_all_data():
    try:
        # Delete all records from the LightBulb table
        LightBulb.query.delete()
        db.session.commit()
    except Exception as e:
        return jsonify({"message": str(e)}), 400

    return jsonify({"message": "All data deleted successfully!"}), 200

@app.route('/test')
def test():
    return {'message': 'Backend is working!'}

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000)
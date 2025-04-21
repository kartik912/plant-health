from datetime import datetime
import pytz
from config import db

# Configure timezone - replace with your specific timezone as needed
DEFAULT_TIMEZONE = pytz.timezone('Asia/Kolkata')  # Change to your timezone, e.g., 'America/New_York'

class LightBulb(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(80), unique=False, nullable=False)
    date = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    def to_json(self):
        localized_date = self.date.replace(tzinfo=pytz.UTC).astimezone(DEFAULT_TIMEZONE)
        return {
            "id": self.id,
            "status": self.status,
            "date": localized_date.strftime('%Y-%m-%d %H:%M:%S %Z'),
        }

class MoistureSensorData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    moisture_level = db.Column(db.Integer, nullable=False)
    state = db.Column(db.String(50), nullable=False)
    date = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    def to_json(self):
        localized_date = self.date.replace(tzinfo=pytz.UTC).astimezone(DEFAULT_TIMEZONE)
        return {
            "id": self.id,
            "moisture_level": self.moisture_level,
            "state": self.state,
            "date": localized_date.strftime('%Y-%m-%d %H:%M:%S %Z')
        }

class TemperatureHumidityData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    temperature = db.Column(db.Float, nullable=False)
    humidity = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    def to_json(self):
        localized_date = self.date.replace(tzinfo=pytz.UTC).astimezone(DEFAULT_TIMEZONE)
        return {
            "id": self.id,
            "temperature": self.temperature,
            "humidity": self.humidity,
            "date": localized_date.strftime('%Y-%m-%d %H:%M:%S %Z')
        }

class PhotoRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    google_drive_link = db.Column(db.String(500), nullable=False)
    captured_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_json(self):
        localized_date = self.captured_at.replace(tzinfo=pytz.UTC).astimezone(DEFAULT_TIMEZONE)
        return {
            "id": self.id,
            "filename": self.filename,
            "google_drive_link": self.google_drive_link,  # Fixed attribute name
            "captured_at": localized_date.strftime('%Y-%m-%d %H:%M:%S %Z')
        }

class TDSData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tds_value = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    def to_json(self):
        localized_date = self.date.replace(tzinfo=pytz.UTC).astimezone(DEFAULT_TIMEZONE)
        return {
            "id": self.id,
            "tds_value": self.tds_value,
            "date": localized_date.strftime('%Y-%m-%d %H:%M:%S %Z')
        }

class PHData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ph_value = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp())
    mode = db.Column(db.String(255), nullable=True)
    
    def to_json(self):
        localized_date = self.timestamp.replace(tzinfo=pytz.UTC).astimezone(DEFAULT_TIMEZONE)
        return {
            "id": self.id, 
            "ph_value": self.ph_value,
            "timestamp": localized_date.strftime('%Y-%m-%d %H:%M:%S %Z'),
            "mode": self.mode
        }

class SensorLimits(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sensor_type = db.Column(db.String(10), nullable=False)
    min_value = db.Column(db.Float, nullable=False)
    max_value = db.Column(db.Float, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_json(self):
        localized_date = self.updated_at.replace(tzinfo=pytz.UTC).astimezone(DEFAULT_TIMEZONE)
        return {
            "id": self.id,
            "sensor_type": self.sensor_type,
            "min_value": self.min_value,
            "max_value": self.max_value,
            "is_active": self.is_active,
            "updated_at": localized_date.strftime('%Y-%m-%d %H:%M:%S %Z')
        }

class PlantStageStatus(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    plant_name = db.Column(db.String(255), nullable=False)
    plant_stage = db.Column(db.String(255), nullable=False)
    state = db.Column(db.Boolean, default=True)

    def to_json(self):
        return {
            "id": self.id,
            "plant_name": self.plant_name,
            "plant_stage": self.plant_stage,
            "state": self.state
        }

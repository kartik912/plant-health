from datetime import datetime
from config import db


class LightBulb(db.Model):  # Corrected class name casing (PEP8 standard)
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(80), unique=False, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)  # Use DateTime type

    def to_json(self):
        return {
            "id": self.id,
            "status": self.status,
            "date": self.date.strftime('%Y-%m-%d %H:%M:%S'),  # Format the date for JSON output
        }

class MoistureSensorData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    moisture_level = db.Column(db.Integer, nullable=False)
    state = db.Column(db.String(50), nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_json(self):
        return {
            "id": self.id,
            "moisture_level": self.moisture_level,
            "state": self.state,
            "date": self.date.strftime('%Y-%m-%d %H:%M:%S')
        }

class TemperatureHumidityData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    temperature = db.Column(db.Float, nullable=False)
    humidity = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_json(self):
        return {
            "id": self.id,
            "temperature": self.temperature,
            "humidity": self.humidity,
            "date": self.date.strftime('%Y-%m-%d %H:%M:%S')
        }

class PhotoRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    google_drive_link = db.Column(db.String(500), nullable=False)
    captured_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_json(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "google_drive_link": self.photo_path,
            "captured_at": self.captured_at.isoformat()
        }

class TDSData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tds_value = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_json(self):
        return {
            "id": self.id,
            "tds_value": self.tds_value,
            "date": self.date.strftime('%Y-%m-%d %H:%M:%S')
        }
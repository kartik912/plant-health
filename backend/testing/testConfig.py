"""
Test configuration module for the hydroponics system.
This creates a separate test database and configuration.
"""

import os
import tempfile
from config import app, db
from models import LightBulb, MoistureSensorData, TemperatureHumidityData, PhotoRecord, TDSData, PHData, SensorLimits

class TestConfig:
    """Test configuration class"""
    
    @staticmethod
    def setup_test_app():
        """Configure the app for testing"""
        # Configure app for testing
        app.config['TESTING'] = True
        
        # Use in-memory SQLite database for testing
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        
        # Create a temporary directory for photo storage
        test_photo_dir = tempfile.mkdtemp()
        app.config['PHOTO_DIRECTORY'] = test_photo_dir
        
        # Return the configured app and test directory
        return app, test_photo_dir
    
    @staticmethod
    def teardown_test_app(test_photo_dir):
        """Clean up after testing"""
        # Remove temporary photo directory
        if os.path.exists(test_photo_dir):
            for file in os.listdir(test_photo_dir):
                os.unlink(os.path.join(test_photo_dir, file))
            os.rmdir(test_photo_dir)
    
    @staticmethod
    def setup_test_data():
        """Create sample test data in the database"""
        with app.app_context():
            # Clear existing data
            db.session.query(LightBulb).delete()
            db.session.query(MoistureSensorData).delete()
            db.session.query(TemperatureHumidityData).delete()
            db.session.query(PhotoRecord).delete() 
            db.session.query(TDSData).delete()
            db.session.query(PHData).delete()
            db.session.query(SensorLimits).delete()
            
            # Create sample data
            # Light bulb data
            light1 = LightBulb(status="ON")
            light2 = LightBulb(status="OFF")
            
            # Moisture data
            moisture1 = MoistureSensorData(moisture_level=300, state="moist")
            moisture2 = MoistureSensorData(moisture_level=150, state="dry")
            
            # Temperature and humidity data
            temp1 = TemperatureHumidityData(temperature=25, humidity=60)
            temp2 = TemperatureHumidityData(temperature=28, humidity=55)
            
            # TDS data
            tds1 = TDSData(tds_value=1200)
            tds2 = TDSData(tds_value=800)
            
            # pH data
            ph1 = PHData(ph_value=6.5)
            ph2 = PHData(ph_value=5.8)
            
            # Sensor limits
            ph_limit = SensorLimits(sensor_type="ph", min_value=5.5, max_value=7.5, is_active=True)
            tds_limit = SensorLimits(sensor_type="tds", min_value=500, max_value=1500, is_active=True)
            
            # Add all to session
            db.session.add_all([light1, light2, moisture1, moisture2, temp1, temp2, 
                               tds1, tds2, ph1, ph2, ph_limit, tds_limit])
            
            # Commit changes
            db.session.commit()
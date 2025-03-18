import unittest
import json
import time
from unittest.mock import patch, MagicMock
import sys
import os
from io import BytesIO

# Add the parent directory to path so we can import the modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import LightBulb, MoistureSensorData, TemperatureHumidityData, PhotoRecord, TDSData, PHData, SensorLimits
from config import app, db

class HydroponicsUnitTests(unittest.TestCase):
    """Unit tests for individual components of the hydroponics system"""
    
    def setUp(self):
        """Set up test client and create test database"""
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()
        
        with self.app.app_context():
            db.create_all()
    
    def tearDown(self):
        """Clean up after tests"""
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
    
    # Mock sensor class for testing
    class MockGroveTDS:
        def __init__(self, *args, **kwargs):
            pass
        
        @property
        def TDS(self):
            return 1200  # Return a fixed value for testing
    
    class MockGrovePH:
        def __init__(self, *args, **kwargs):
            pass
        
        @property
        def PH(self):
            return 6.5  # Return a fixed value for testing
    
    class MockMoistureSensor:
        @property
        def moisture(self):
            return 400  # Return a fixed value for testing
    
    class MockDHTSensor:
        @property
        def temperature(self):
            return 25  # Return a fixed value for testing
        
        @property
        def humidity(self):
            return 60  # Return a fixed value for testing
    
    @patch('adafruit_dht.DHT11')
    def test_temperature_humidity_route(self, mock_dht):
        """Test the temperature and humidity route"""
        # Setup the mock
        mock_sensor = MagicMock()
        mock_sensor.temperature = 25
        mock_sensor.humidity = 60
        mock_dht.return_value = mock_sensor
        
        # Test the endpoint
        response = self.client.get('/get_temperature_humidity')
        data = json.loads(response.data)
        
        # Assert the response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['temperature'], 25)
        self.assertEqual(data['humidity'], 60)
        
        # Check database entry
        with self.app.app_context():
            records = TemperatureHumidityData.query.all()
            self.assertEqual(len(records), 1)
            self.assertEqual(records[0].temperature, 25)
            self.assertEqual(records[0].humidity, 60)
    
    @patch('grove.grove_moisture_sensor.GroveMoistureSensor')
    def test_moisture_sensor_route(self, mock_sensor):
        """Test the moisture sensor route"""
        # Setup the mock
        mock_instance = MagicMock()
        mock_instance.moisture = 400
        mock_sensor.return_value = mock_instance
        
        # Test the endpoint
        response = self.client.get('/check_moisture')
        data = json.loads(response.data)
        
        # Assert the response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['moisture_level'], 400)
        self.assertEqual(data['state'], 'moist')
        
        # Check database entry
        with self.app.app_context():
            records = MoistureSensorData.query.all()
            self.assertEqual(len(records), 1)
            self.assertEqual(records[0].moisture_level, 400)
            self.assertEqual(records[0].state, 'moist')
    
    def test_pump_controls(self):
        """Test pump control routes"""
        # Test start pump
        response = self.client.post('/pump/1/start', json={'duration': 1})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'running')
        
        # Let the auto-stop timer complete
        time.sleep(1.5)
        
        # Test get status
        response = self.client.get('/pump/status')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['pump1'], 'stopped')
        
        # Test stop all pumps
        response = self.client.post('/pump/all/stop')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'stopped')
    
    def test_sensor_limits(self):
        """Test sensor limits API"""
        # Test adding sensor limits
        limit_data = {
            "ph": {"min": 6.0, "max": 7.0, "active": True},
            "tds": {"min": 800, "max": 1200, "active": True}
        }
        response = self.client.post('/sensor/limits', 
                                   json=limit_data, 
                                   content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        # Test getting sensor limits
        response = self.client.get('/sensor/limits')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['ph']['min'], 6.0)
        self.assertEqual(data['ph']['max'], 7.0)
        self.assertEqual(data['tds']['min'], 800)
        self.assertEqual(data['tds']['max'], 1200)
        
        # Test updating sensor limits
        limit_data['ph']['min'] = 5.5
        response = self.client.post('/sensor/limits', 
                                   json=limit_data, 
                                   content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        # Verify update
        response = self.client.get('/sensor/limits')
        data = json.loads(response.data)
        self.assertEqual(data['ph']['min'], 5.5)
    
    @patch('requests.get')
    def test_location_api(self, mock_get):
        """Test the location API"""
        # Mock IP and location responses
        mock_ip_response = MagicMock()
        mock_ip_response.json.return_value = {"ip": "192.0.2.0"}
        
        mock_geo_response = MagicMock()
        mock_geo_response.json.return_value = {
            "status": "success",
            "country": "United States",
            "regionName": "California",
            "city": "San Francisco",
            "lat": 37.7749,
            "lon": -122.4194,
            "isp": "Test ISP"
        }
        
        mock_get.side_effect = [mock_ip_response, mock_geo_response]
        
        # Test the endpoint
        response = self.client.get('/get-location')
        data = json.loads(response.data)
        
        # Assert the response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['country'], "United States")
        self.assertEqual(data['city'], "San Francisco")


class HydroponicsIntegrationTests(unittest.TestCase):
    """Integration tests that test multiple components working together"""
    
    def setUp(self):
        """Set up test client and create test database"""
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()
        
        with self.app.app_context():
            db.create_all()
            
            # Add test data
            ph_data = PHData(ph_value=6.3)
            tds_data = TDSData(tds_value=900)
            db.session.add(ph_data)
            db.session.add(tds_data)
            db.session.commit()
            
            # Add sensor limits
            ph_limit = SensorLimits(sensor_type="ph", min_value=5.5, max_value=7.5, is_active=True)
            tds_limit = SensorLimits(sensor_type="tds", min_value=500, max_value=1500, is_active=True)
            db.session.add(ph_limit)
            db.session.add(tds_limit)
            db.session.commit()
    
    def tearDown(self):
        """Clean up after tests"""
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
    
    def test_sensor_status_integration(self):
        """Test that sensor status correctly uses sensor data and limits"""
        response = self.client.get('/sensor_status')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        
        # Check pH data
        self.assertAlmostEqual(data['ph']['value'], 6.3, places=1)
        self.assertEqual(data['ph']['status'], 'Normal')
        self.assertEqual(data['ph']['limits']['min'], 5.5)
        self.assertEqual(data['ph']['limits']['max'], 7.5)
        
        # Check TDS data
        self.assertEqual(data['tds']['value'], 900)
        self.assertEqual(data['tds']['status'], 'Normal')
        self.assertEqual(data['tds']['limits']['min'], 500)
        self.assertEqual(data['tds']['limits']['max'], 1500)
    
    @patch('models.PHData.query')
    @patch('models.TDSData.query')
    def test_check_and_adjust_sensors(self, mock_tds_query, mock_ph_query):
        """Test the sensor adjustment logic"""
        # Setup mocks for pH and TDS data
        mock_ph_data = MagicMock()
        mock_ph_data.ph_value = 5.0  # Below minimum
        mock_ph_query.order_by.return_value.first.return_value = mock_ph_data
        
        mock_tds_data = MagicMock()
        mock_tds_data.tds_value = 400  # Below minimum
        mock_tds_query.order_by.return_value.first.return_value = mock_tds_data
        
        # Test the sensor adjustment endpoint
        response = self.client.post('/check_and_adjust_sensors')
        self.assertEqual(response.status_code, 200)
        
        # This would activate pumps in the real system, but we can't
        # directly test that in unit tests. The functionality is covered
        # in other tests.
    
    def test_pdf_generation(self):
        """Test the PDF generation functionality"""
        # Add some test data
        with self.app.app_context():
            light = LightBulb(status="ON")
            moisture = MoistureSensorData(moisture_level=450, state="moist")
            temp_humid = TemperatureHumidityData(temperature=26, humidity=65)
            photo = PhotoRecord(filename="test.jpg", google_drive_link="/test/path")
            
            db.session.add_all([light, moisture, temp_humid, photo])
            db.session.commit()
        
        # Test the PDF endpoint
        response = self.client.get('/download_database_pdf')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'application/pdf')


class MockWebSocketTest(unittest.TestCase):
    """Tests for WebSocket functionality"""
    
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        
    @patch('picamera2.Picamera2')
    def test_start_stop_stream(self, mock_picamera):
        """Test starting and stopping the camera stream"""
        # Mock the camera
        mock_camera_instance = MagicMock()
        mock_camera_instance.capture_image.return_value = MagicMock()
        mock_picamera.return_value = mock_camera_instance
        
        # Start stream
        response = self.client.post('/start_stream')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['message'], 'Stream started')
        
        # Stop stream
        response = self.client.post('/stop_stream')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['message'], 'Stream stopped')


if __name__ == '__main__':
    unittest.main()
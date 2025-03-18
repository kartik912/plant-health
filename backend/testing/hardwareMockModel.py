"""
Mock hardware modules for testing without physical sensors.
This allows testing the code without actual Raspberry Pi hardware.
"""

from unittest.mock import MagicMock
from collections import deque
import numpy as np

class MockADC:
    """Mock ADC (Analog to Digital Converter) for testing"""
    
    def __init__(self):
        """Initialize with static test values"""
        self.tds_voltage = 1.5  # Simulates a TDS value around 1000 ppm
        self.ph_voltage = 2.3  # Simulates a pH value around 6.5
    
    def read(self, channel):
        """Simulate reading analog value from channel"""
        if channel == 2:  # TDS sensor channel
            return int(self.tds_voltage * 4095 / 3.3)
        elif channel == 4:  # pH sensor channel
            return int(self.ph_voltage * 4095 / 5.0)
        return 0
    
    def read_voltage(self, channel):
        """Directly return voltage for given channel"""
        if channel == 2:  # TDS sensor channel
            return self.tds_voltage
        elif channel == 4:  # pH sensor channel
            return self.ph_voltage
        return 0
        
    def set_tds_voltage(self, voltage):
        """Set TDS voltage for testing different values"""
        self.tds_voltage = voltage
    
    def set_ph_voltage(self, voltage):
        """Set pH voltage for testing different values"""
        self.ph_voltage = voltage

class MockGroveTDS:
    """Mock TDS sensor for testing"""
    
    def __init__(self, channel, window_size):
        """Initialize with test parameters"""
        self.channel = channel
        self.adc = MockADC()
        self.window_size = window_size
        self.readings = deque([1000] * window_size, maxlen=window_size)
        self.fixed_value = None
    
    def read_tds(self):
        """Simulate reading TDS value"""
        if self.fixed_value is not None:
            return self.fixed_value
            
        value = self.adc.read(self.channel)
        if value != 0:
            voltage = value * 3.3 / 4095.0 - 0.02
            tds_value = 5.11*np.exp(210.73*voltage) + 6038.51*voltage + 15.81
            return max(0, tds_value)
        return 0
    
    @property
    def TDS(self):
        """Get median TDS value from readings window"""
        tds_value = self.read_tds()
        self.readings.append(tds_value)
        return np.median(self.readings)
    
    def set_fixed_value(self, value):
        """Set a fixed TDS value for testing"""
        self.fixed_value = value

class MockGrovePH:
    """Mock pH sensor for testing"""
    
    def __init__(self, channel, window_size):
        """Initialize with test parameters"""
        self.channel = channel
        self.adc = MockADC()
        self.window_size = window_size
        self.readings = deque([6.5] * window_size, maxlen=window_size)
        self.fixed_value = None
    
    def read_ph(self):
        """Simulate reading pH value"""
        if self.fixed_value is not None:
            return self.fixed_value
            
        raw_voltage = self.adc.read_voltage(self.channel)
        voltage = (raw_voltage * 5.0 / 4095.0) - 0.384
        ph_value = 7 + ((2.5 - voltage) / 0.18)
        return ph_value
    
    @property
    def PH(self):
        """Get median pH value from readings window"""
        ph_value = self.read_ph()
        self.readings.append(ph_value)
        return np.median(self.readings)
    
    def set_fixed_value(self, value):
        """Set a fixed pH value for testing"""
        self.fixed_value = value

class MockMoistureSensor:
    """Mock moisture sensor for testing"""
    
    def __init__(self, pin):
        """Initialize with a default moisture value"""
        self.pin = pin
        self.moisture_value = 400  # Default to "moist" range
    
    @property
    def moisture(self):
        """Return the current moisture value"""
        return self.moisture_value
    
    def set_moisture(self, value):
        """Set moisture value for testing"""
        self.moisture_value = value

class MockDHTSensor:
    """Mock DHT temperature and humidity sensor"""
    
    def __init__(self, pin):
        """Initialize with default temperature and humidity values"""
        self.pin = pin
        self.temp_value = 25.0
        self.humidity_value = 60.0
    
    @property
    def temperature(self):
        """Return the current temperature value"""
        return self.temp_value
    
    @property
    def humidity(self):
        """Return the current humidity value"""
        return self.humidity_value
    
    def set_values(self, temp, humidity):
        """Set temperature and humidity values for testing"""
        self.temp_value = temp
        self.humidity_value = humidity

class MockOutputDevice:
    """Mock relay or output device"""
    
    def __init__(self, pin):
        """Initialize with inactive state"""
        self.pin = pin
        self._active = False
    
    def on(self):
        """Turn the device on"""
        self._active = True
    
    def off(self):
        """Turn the device off"""
        self._active = False
    
    @property
    def is_active(self):
        """Check if the device is active"""
        return self._active

class MockPicamera2:
    """Mock Picamera2 for testing"""
    
    def __init__(self):
        """Initialize mock camera"""
        self.is_started = False
        self.preview_active = False
    
    def start(self):
        """Start the camera"""
        self.is_started = True
    
    def stop(self):
        """Stop the camera"""
        self.is_started = False
    
    def close(self):
        """Close the camera"""
        self.is_started = False
    
    def capture_image(self):
        """Return a mock image"""
        return MagicMock()
    
    def start_and_capture_file(self, filepath):
        """Simulate capturing an image to a file"""
        self.start()
        # Create empty file
        with open(filepath, 'w') as f:
            f.write('test image')
        self.close()
#!/usr/bin/env python3
"""
Raspberry Pi implementation for DFRobot EC Sensor
Using Grove ADC for analog readings
"""

import time
import json
import os.path
import numpy as np
from collections import deque
from grove.adc import ADC

# Constants
RES2 = 16.27 #earlier 820
ECREF = 10.0  # eariler 200

# EC calibration solution ranges
RAWEC_1413_LOW = 0.70  # 1.413mS/cm
RAWEC_1413_HIGH = 1.80
RAWEC_276_LOW = 1.80   # 2.76mS/cm
RAWEC_276_HIGH = 3.70
RAWEC_1288_LOW = 3.70  # 12.88mS/cm
RAWEC_1288_HIGH = 16.80

class GroveEC:
    def __init__(self, channel, window_size=10):
        """
        Initialize EC sensor with Grove ADC
        
        Args:
            channel (int): ADC channel for the EC sensor
            window_size (int): Size of the moving window for readings
        """
        self.channel = channel
        self.adc = ADC()
        self.window_size = window_size
        self.voltage_readings = deque(maxlen=window_size)
        
        self._ecvalue = 0.0
        self._kvalue = 1.0
        self._kvalueLow = 1.0
        self._kvalueHigh = 1.0
        self._voltage = 0.0
        self._temperature = 25.0
        self._rawEC = 0.0
        
        # File to store calibration data
        self.config_file = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'ec_calibration.json')
        
        # Calibration state
        self._enter_calibration_flag = False
        self._ec_calibration_finish = False
        
    def begin(self):
        """Initialize sensor and load calibration values"""
        self._load_calibration_values()
        self._kvalue = self._kvalueLow  # Set default K value
        
    def _load_calibration_values(self):
        """Load calibration values from file"""
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r') as f:
                    calibration_data = json.load(f)
                    self._kvalueLow = calibration_data.get('kvalueLow', 1.0)
                    self._kvalueHigh = calibration_data.get('kvalueHigh', 1.0)
            except (json.JSONDecodeError, IOError):
                # If file is corrupted or can't be read, use default values
                self._kvalueLow = 1.0
                self._kvalueHigh = 1.0
                self._save_calibration_values()
        else:
            # If file doesn't exist, create it with default values
            self._kvalueLow = 1.0
            self._kvalueHigh = 1.0
            self._save_calibration_values()
            
    def _save_calibration_values(self):
        """Save calibration values to file"""
        try:
            with open(self.config_file, 'w') as f:
                json.dump({
                    'kvalueLow': self._kvalueLow,
                    'kvalueHigh': self._kvalueHigh
                }, f)
        except IOError:
            print("Failed to save calibration values")
    
    def read_voltage(self):
        """Read voltage from Grove ADC"""
        value = self.adc.read(self.channel)
        if value != 0:
            # Convert ADC value to voltage, similar to your TDS sensor code
            voltage = value * 3.3 / 1024.0  # Apply offset as in your code
            self.voltage_readings.append(voltage)
            return np.median(self.voltage_readings)  # Return stable voltage reading
        return 0
        
    def read_EC(self, voltage=None, temperature=25.0):
        """
        Calculate EC value based on voltage and temperature
        
        Args:
            voltage (float): Voltage reading from ADC (will read automatically if None)
            temperature (float): Temperature in Celsius for compensation
            
        Returns:
            float: EC value in mS/cm
        """
        if voltage is None:
            voltage = self.read_voltage()
            
        # Store voltage for calibration purposes
        self._voltage = voltage
        
        # Skip calculation if voltage is too low
        if voltage <= 0:
            return 0
            
        self._rawEC = 1000 * voltage / RES2 / ECREF
        print(f">>>rawEC: {self._rawEC:.4f}", end="")
        
        valueTemp = self._rawEC * self._kvalue
        
        # Automatic shift process based on range
        if valueTemp > 2.5:
            self._kvalue = self._kvalueHigh
        elif valueTemp < 2.0:
            self._kvalue = self._kvalueLow
            
        # Calculate the final EC value with temperature compensation
        value = self._rawEC * self._kvalue
        value = value / (1.0 + 0.0185 * (temperature - 25.0))
        self._ecvalue = value
        
        print(f", ecValue: {self._ecvalue:.4f}<<<")
        return self._ecvalue
        
    @property
    def EC(self):
        """Property to get stable EC reading"""
        return self.read_EC()
        
    def calibration(self, voltage=None, temperature=25.0, cmd=None):
        """
        Calibrate the EC sensor
        
        Args:
            voltage (float): Voltage reading (will read automatically if None)
            temperature (float): Temperature in Celsius
            cmd (str): Calibration command (ENTEREC, CALEC, EXITEC)
        """
        if voltage is None:
            voltage = self.read_voltage()
            
        self._voltage = voltage
        self._temperature = temperature
        
        if cmd:
            self._ec_calibration(self._parse_command(cmd.upper()))
        
    def _parse_command(self, cmd):
        """Parse command string and return mode index"""
        if "ENTEREC" in cmd:
            return 1
        elif "CALEC" in cmd:
            return 2
        elif "EXITEC" in cmd:
            return 3
        return 0
        
    def _ec_calibration(self, mode):
        """
        EC calibration process
        
        Args:
            mode (int): Calibration mode (1=enter, 2=calibrate, 3=exit)
        """
        if mode == 0:  # Invalid command
            if self._enter_calibration_flag:
                print(">>>Command Error<<<")
                
        elif mode == 1:  # Enter calibration mode
            self._enter_calibration_flag = True
            self._ec_calibration_finish = False
            print("\n>>>Enter EC Calibration Mode<<<")
            print(">>>Please put the probe into the 1413us/cm or 2.76ms/cm or 12.88ms/cm buffer solution<<<")
            print(">>>Only need two point for calibration one low (1413us/com) and one high(2.76ms/cm or 12.88ms/cm)<<<\n")
            
        elif mode == 2:  # Calibrate
            if self._enter_calibration_flag:
                comp_ec_solution = 0.0
                
                # Make sure we have a valid voltage reading
                if self._voltage <= 0:
                    print(self._voltage)
                    print(">>>Invalid voltage reading. Please check sensor connection<<<")
                    return
                
                # Calculate raw EC value for calibration
                self._rawEC = 1000 * self._voltage / RES2 / ECREF
                print(f">>>rawEC: {self._rawEC:.4f}", end="")
                
                # Identify which standard solution is being used
                if RAWEC_1413_LOW < self._rawEC < RAWEC_1413_HIGH:
                    print(">>>Buffer 1.413ms/cm<<<", end="")
                    comp_ec_solution = 1.413 * (1.0 + 0.0185 * (self._temperature - 25.0))
                    print(f">>>compECsolution: {comp_ec_solution}<<<")
                    
                elif RAWEC_276_LOW < self._rawEC < RAWEC_276_HIGH:
                    print(">>>Buffer 2.76ms/cm<<<", end="")
                    comp_ec_solution = 2.76 * (1.0 + 0.0185 * (self._temperature - 25.0))
                    print(f">>>compECsolution: {comp_ec_solution}<<<")
                    
                elif RAWEC_1288_LOW < self._rawEC < RAWEC_1288_HIGH:
                    print(">>>Buffer 12.88ms/cm<<<", end="")
                    comp_ec_solution = 12.88 * (1.0 + 0.0185 * (self._temperature - 25.0))
                    print(f">>>compECsolution: {comp_ec_solution}<<<")
                    
                else:
                    print(">>>Buffer Solution Error Try Again<<<")
                    self._ec_calibration_finish = False
                    return
                    
                print("\n>>>KValueTemp calculation formule: RES2 * ECREF * compECsolution / 1000.0 / voltage<<<")
                print(f">>>KValueTemp calculation: {RES2} * {ECREF} * {comp_ec_solution} / 1000.0 / {self._voltage}<<<")
                
                k_value_temp = RES2 * ECREF * comp_ec_solution / 1000.0 / self._voltage
                print(f"\n>>>KValueTemp: {k_value_temp}<<<")
                
                if 0.5 < k_value_temp < 2.0:
                    print(f"\n>>>Successful,K:{k_value_temp}, Send EXITEC to Save and Exit<<<")
                    
                    if RAWEC_1413_LOW < self._rawEC < RAWEC_1413_HIGH:
                        self._kvalueLow = k_value_temp
                        print(f">>>kvalueLow: {self._kvalueLow}<<<")
                    elif (RAWEC_276_LOW < self._rawEC < RAWEC_276_HIGH) or (RAWEC_1288_LOW < self._rawEC < RAWEC_1288_HIGH):
                        self._kvalueHigh = k_value_temp
                        print(f">>>kvalueHigh: {self._kvalueHigh}<<<")
                        
                    self._ec_calibration_finish = True
                else:
                    print("\n>>>KValueTemp out of range 0.5-2.0<<<")
                    print(f">>>KValueTemp: {k_value_temp:.4f}<<<")
                    print(">>>Failed,Try Again<<<\n")
                    self._ec_calibration_finish = False
                    
        elif mode == 3:  # Exit calibration mode
            if self._enter_calibration_flag:
                print()
                if self._ec_calibration_finish:
                    # Save calibration values
                    self._save_calibration_values()
                    print(">>>Calibration Successful", end="")
                else:
                    print(">>>Calibration Failed", end="")
                    
                print(",Exit EC Calibration Mode<<<\n")
                self._ec_calibration_finish = False
                self._enter_calibration_flag = False


# Example usage
def main():
    # Initialize EC sensor on channel 2 (matching your TDS sensor)
    ec_sensor = GroveEC(channel=2, window_size=50)
    ec_sensor.begin()
    
    print('Starting EC Sensor...')
    
    try:
        while True:
            voltage = ec_sensor.read_voltage()
            print(f'Voltage: {voltage:.4f}V')
            
            # Get EC value
            ec_value = ec_sensor.read_EC(voltage)
            print(f'EC Value: {ec_value:.4f} mS/cm')
            
            # Convert to approximate TDS
            tds_value = ec_value * 500  # Standard conversion factor
            print(f'Approximate TDS: {tds_value:.0f} ppm')
            print('-----------------')
            
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\nMeasurement stopped by user")

if __name__ == "__main__":
    main()
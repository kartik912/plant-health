#!/usr/bin/env python3
"""
Test runner script for the hydroponics system.
This script runs all the tests and generates a coverage report.
"""

import unittest
import coverage
import sys
import os

# Start code coverage
cov = coverage.Coverage(
    source=['app', 'models', 'checkSensorMail'],
    omit=['*/test/*', '*/venv/*', '*/env/*']
)
cov.start()

# Add the current directory to the path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Import test modules
from testSuite import HydroponicsUnitTests, HydroponicsIntegrationTests, MockWebSocketTest

# Set up the test suite
def create_test_suite():
    """Create a test suite with all tests"""
    test_suite = unittest.TestSuite()
    
    # Add the test cases
    test_suite.addTest(unittest.makeSuite(HydroponicsUnitTests))
    test_suite.addTest(unittest.makeSuite(HydroponicsIntegrationTests))
    test_suite.addTest(unittest.makeSuite(MockWebSocketTest))
    
    return test_suite

if __name__ == '__main__':
    # Run the tests
    print("Running hydroponics system tests...")
    
    # Create test runner
    runner = unittest.TextTestRunner(verbosity=2)
    
    # Run test suite
    result = runner.run(create_test_suite())
    
    # Stop coverage and generate report
    cov.stop()
    cov.save()
    
    # Print results
    print("\nTest Results:")
    print(f"Ran {result.testsRun} tests")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    # Generate coverage report
    print("\nGenerating coverage report...")
    cov.report()
    
    # Generate HTML report
    try:
        cov.html_report(directory='coverage_html')
        print(f"HTML coverage report generated in coverage_html directory")
    except Exception as e:
        print(f"Error generating HTML report: {e}")
    
    # Exit with appropriate status code
    sys.exit(not result.wasSuccessful())
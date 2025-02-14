import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import MoistureGauge from "../components/ui/MoistureGauge";
import TemperatureGauge from "../components/ui/TemperatureGauge";
import HumidityGauge from "../components/ui/HumidityGauge";
import TDSGauge from "../components/ui/TDSGauge";
import Gauge from "../components/ui/gauge";

const Dashboard = () => {
  const [sensorData, setSensorData] = useState([]);
  const [tdsPhData, setTdsPhData] = useState([]);

  const fetchSensorData = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/get_sensor_data");
      const data = await response.json();

      const formattedData = data.sensor_readings.map((item) => ({
        time: new Date(item.timestamp).toLocaleTimeString(),
        moisture: parseFloat(item.moisture),
        temperature: parseFloat(item.temperature),
        humidity: parseFloat(item.humidity),
      }));

      setSensorData(formattedData);
    } catch (error) {
      console.error("Error fetching sensor data:", error);
    }
  };

  const fetchTdsPhData = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/get_tds_ph_data");
      const data = await response.json();

      const formattedData = data.tds_ph_readings.map((item) => ({
        time: new Date(item.timestamp).toLocaleTimeString(),
        tds: parseFloat(item.tds),
        ph: parseFloat(item.ph),
      }));

      setTdsPhData(formattedData);
    } catch (error) {
      console.error("Error fetching TDS & PH data:", error);
    }
  };

  useEffect(() => {
    fetchSensorData();
    fetchTdsPhData();
    const interval = setInterval(() => {
      fetchSensorData();
      fetchTdsPhData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4">Sensor Dashboard</h1>

      {/* Gauges for Moisture, Temperature, Humidity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white shadow-lg p-4 rounded-xl">
          <MoistureGauge value={sensorData.length ? sensorData[sensorData.length - 1].moisture : 0} />
        </div>
        <div className="bg-white shadow-lg p-4 rounded-xl">
          <TemperatureGauge value={sensorData.length ? sensorData[sensorData.length - 1].temperature : 0} />
        </div>
        <div className="bg-white shadow-lg p-4 rounded-xl">
          <HumidityGauge value={sensorData.length ? sensorData[sensorData.length - 1].humidity : 0} />
        </div>
      </div>

      {/* Graph for Moisture, Temperature, Humidity */}
      <div className="w-[90%] bg-white shadow-lg p-4 rounded-xl mb-6">
        <h2 className="text-xl font-semibold mb-3">Moisture, Temperature & Humidity Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sensorData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="moisture" stroke="#007AFF" name="Moisture" />
            <Line type="monotone" dataKey="temperature" stroke="#FF5733" name="Temperature" />
            <Line type="monotone" dataKey="humidity" stroke="#33FF57" name="Humidity" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gauges for TDS & pH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow-lg p-4 rounded-xl">
          <TDSGauge value={tdsPhData.length ? tdsPhData[tdsPhData.length - 1].tds : 0} />
        </div>
        <div className="bg-white shadow-lg p-4 rounded-xl">
          <Gauge value={tdsPhData.length ? tdsPhData[tdsPhData.length - 1].ph : 0} />
        </div>
      </div>

      {/* Graph for TDS & pH */}
      <div className="w-[90%] bg-white shadow-lg p-4 rounded-xl">
        <h2 className="text-xl font-semibold mb-3">TDS & pH Level Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={tdsPhData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="tds" stroke="#FFAC33" name="TDS" />
            <Line type="monotone" dataKey="ph" stroke="#FF6384" name="pH Level" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;

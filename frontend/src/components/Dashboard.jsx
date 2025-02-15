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
  // Current sensor values
  const [currentMoisture, setCurrentMoisture] = useState({ level: 0, state: "" });
  const [currentTemperature, setCurrentTemperature] = useState(0);
  const [currentHumidity, setCurrentHumidity] = useState(0);
  const [currentPH, setCurrentPH] = useState(0);
  const [currentTDS, setCurrentTDS] = useState(0);

  // Historical data
  const [sensorData, setSensorData] = useState([]);
  const [phTdsData, setPhTdsData] = useState([]);

  // Fetch temperature, humidity, and moisture data
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const [tempHumCurrentRes, tempHumHistoryRes, moistureHistoryRes] = await Promise.all([
          fetch("http://127.0.0.1:5000/get_temperature_humidity"),
          fetch("http://127.0.0.1:5000/get_temperature_humidity_history"),
          fetch("http://127.0.0.1:5000/get_moisture_data")
        ]);

        const tempHumCurrent = await tempHumCurrentRes.json();
        const tempHumHistory = await tempHumHistoryRes.json();
        const moistureHistory = await moistureHistoryRes.json();

        // Update current values
        setCurrentTemperature(tempHumCurrent.temperature);
        setCurrentHumidity(tempHumCurrent.humidity);

        // Merge historical data
        const mergedData = tempHumHistory.temperature_humidity_data.map((item, index) => {
          const moistureItem = moistureHistory.moisture_data[index] || {};
          return {
            time: new Date(item.date).toLocaleTimeString(),
            temperature: parseFloat(item.temperature),
            humidity: parseFloat(item.humidity),
            moisture: moistureItem.moisture_level ? parseFloat(moistureItem.moisture_level) : null
          };
        });

        setSensorData(mergedData);
      } catch (error) {
        console.error("Error fetching sensor data:", error);
      }
    };

    fetchSensorData();
    const interval = setInterval(fetchSensorData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch moisture current data
  useEffect(() => {
    const fetchCurrentMoisture = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/check_moisture");
        const data = await response.json();
        setCurrentMoisture({
          level: data.moisture_level,
          state: data.state
        });
      } catch (error) {
        console.error("Error fetching current moisture:", error);
      }
    };

    fetchCurrentMoisture();
    const interval = setInterval(fetchCurrentMoisture, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch PH and TDS data
  useEffect(() => {
    const fetchPhTdsData = async () => {
      try {
        const [phCurrentRes, tdsCurrentRes, tdsHistoryRes, phHistoryRes] = await Promise.all([
          fetch("http://127.0.0.1:5000/get_ph"),
          fetch("http://127.0.0.1:5000/get_tds"),
          fetch("http://127.0.0.1:5000/get_tds_history"),
          fetch("http://127.0.0.1:5000/get_ph_history")
        ]);

        const phcurrentData = await phCurrentRes.json();
        const tdsCurrentData = await tdsCurrentRes.json();
        const tdsHistoryData = await tdsHistoryRes.json();
        const phHistoryData = await phHistoryRes.json();

        // Update current values
        setCurrentTDS(tdsCurrentData.tds_value);
        
        // Create arrays of the same length for proper data alignment
        const maxLength = Math.max(tdsHistoryData.tds_data.length, phHistoryData.ph_data.length);
        const mergedData = [];

        for (let i = 0; i < maxLength; i++) {
          const tdsItem = tdsHistoryData.tds_data[i] || {};
          const phItem = phHistoryData.ph_data[i] || {};
          
          mergedData.push({
            time: new Date(tdsItem.date || phItem.timestamp).toLocaleTimeString(),
            tds: tdsItem.tds_value ? parseFloat(tdsItem.tds_value) : null,
            ph: phItem.ph_value ? parseFloat(phItem.ph_value) : null
          });
        }

        setPhTdsData(mergedData);

        // Update current PH from the latest reading
        if (phHistoryData.ph_data.length > 0) {
          setCurrentPH(parseFloat(phHistoryData.ph_data[phHistoryData.ph_data.length - 1].ph_value));
        }
      } catch (error) {
        console.error("Error fetching PH and TDS data:", error);
      }
    };

    fetchPhTdsData();
    const interval = setInterval(fetchPhTdsData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-4">Sensor Dashboard</h1>
      
      {/* Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <MoistureGauge value={currentMoisture.level} />
        <TemperatureGauge value={currentTemperature} />
        <HumidityGauge value={currentHumidity} />
      </div>

      {/* Temperature, Humidity, and Moisture Chart */}
      <ResponsiveContainer width="90%" height={300}>
        <LineChart data={sensorData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="temperature" stroke="#FF5733" name="Temperature" />
          <Line type="monotone" dataKey="humidity" stroke="#33FF57" name="Humidity" />
          <Line type="monotone" dataKey="moisture" stroke="#337BFF" name="Moisture Level" />
        </LineChart>
      </ResponsiveContainer>

      {/* PH and TDS Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <TDSGauge value={currentTDS} />
        <Gauge value={currentPH} />
      </div>

      {/* PH and TDS Chart */}
      <ResponsiveContainer width="90%" height={300}>
        <LineChart data={phTdsData}>
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
  );
};

export default Dashboard;
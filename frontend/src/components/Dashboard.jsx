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

  // Historical data for all sensors
  const [sensorData, setSensorData] = useState([]);

  // Fetch all sensor data
  useEffect(() => {
    const fetchAllSensorData = async () => {
      try {
        const [tempHumRes, moistureRes, phRes, tdsRes] = await Promise.all([
          fetch("http://127.0.0.1:5000/get_temperature_humidity"),
          fetch("http://127.0.0.1:5000/check_moisture"),
          fetch("http://127.0.0.1:5000/get_ph"),
          fetch("http://127.0.0.1:5000/get_tds")
        ]);

        const tempHumData = await tempHumRes.json();
        const moistureData = await moistureRes.json();
        const phData = await phRes.json();
        const tdsData = await tdsRes.json();

        setCurrentTemperature(tempHumData.temperature);
        setCurrentHumidity(tempHumData.humidity);
        setCurrentMoisture({
          level: moistureData.moisture_level,
          state: moistureData.state
        });
        setCurrentPH(phData.ph_value);
        setCurrentTDS(tdsData.tds_value);
      } catch (error) {
        console.error("Error fetching current sensor data:", error);
      }
    };

    // Fetch historical data
    const fetchHistoricalData = async () => {
      try {
        const [tempHumHistoryRes, moistureHistoryRes, phHistoryRes, tdsHistoryRes] = await Promise.all([
          fetch("http://127.0.0.1:5000/get_temperature_humidity_history"),
          fetch("http://127.0.0.1:5000/get_moisture_data"),
          fetch("http://127.0.0.1:5000/get_ph_history"),
          fetch("http://127.0.0.1:5000/get_tds_history")
        ]);

        const tempHumHistory = await tempHumHistoryRes.json();
        const moistureHistory = await moistureHistoryRes.json();
        const phHistory = await phHistoryRes.json();
        const tdsHistory = await tdsHistoryRes.json();

        // Merge all historical data
        const mergedData = tempHumHistory.temperature_humidity_data.map((item, index) => {
          const moistureItem = moistureHistory.moisture_data[index] || {};
          const phItem = phHistory.ph_data[index] || {};
          const tdsItem = tdsHistory.tds_data[index] || {};
          
          return {
            time: new Date(item.date).toLocaleTimeString(),
            temperature: parseFloat(item.temperature),
            humidity: parseFloat(item.humidity),
            ph: phItem.ph_value ? parseFloat(phItem.ph_value) : null,
            moisture: moistureItem.moisture_level ? parseFloat(moistureItem.moisture_level) : null,
            tds: tdsItem.tds_value ? parseFloat(tdsItem.tds_value) : null
          };
        });

        setSensorData(mergedData);
      } catch (error) {
        console.error("Error fetching historical data:", error);
      }
    };

    fetchAllSensorData();
    fetchHistoricalData();
    const interval = setInterval(() => {
      fetchAllSensorData();
      fetchHistoricalData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-4">Sensor Dashboard</h1>
      
      {/* First Row: PH, Humidity, and Temperature Gauges */}
      <div className="gauge grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Gauge value={currentPH} />
        <HumidityGauge value={currentHumidity} />
        <TemperatureGauge value={currentTemperature} />
      </div>

      {/* Combined Graph for PH, Humidity, and Temperature */}
      <div className="panel w-full mb-8">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sensorData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ph" stroke="#FF6384" name="pH Level" />
            <Line type="monotone" dataKey="humidity" stroke="#FFFFFF" name="Humidity" />
            <Line type="monotone" dataKey="temperature" stroke="#FF5733" name="Temperature" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Second Row: TDS and Soil Moisture Gauges */}
      <div className="gauge grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <TDSGauge value={currentTDS} />
        <MoistureGauge value={currentMoisture.level} />
      </div>

      {/* Combined Graph for TDS and Soil Moisture */}
      <div className="panel w-full">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sensorData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="tds" stroke="#FFAC33" name="TDS" />
            <Line type="monotone" dataKey="moisture" stroke="#337BFF" name="Soil Moisture" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
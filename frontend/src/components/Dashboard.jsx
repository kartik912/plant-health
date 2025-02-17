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
  const [currentMoisture, setCurrentMoisture] = useState({ value: 0, state: "", time: "N/A" });
  const [currentTemperature, setCurrentTemperature] = useState({ value: 0, time: "N/A" });
  const [currentHumidity, setCurrentHumidity] = useState({ value: 0, time: "N/A" });
  const [currentPH, setCurrentPH] = useState({ value: 0, time: "N/A" });
  const [currentTDS, setCurrentTDS] = useState({ value: 0, time: "N/A" });

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
        
        setCurrentMoisture({
          value: moistureData.moisture_level,
          state: moistureData.state,
          time: new Date().toLocaleTimeString("en-GB", { hour12: false })
        });
        setCurrentTemperature({
          value: parseFloat(tempHumData.temperature),
          time: new Date().toLocaleTimeString("en-GB", { hour12: false })
        });
        setCurrentHumidity({
            value: parseFloat(tempHumData.humidity),
            time: new Date().toLocaleTimeString("en-GB", { hour12: false })
          });
        setCurrentPH({
          value: parseFloat(phData.ph_value),  // Make sure this is a number
          time: new Date().toLocaleTimeString("en-GB", { hour12: false })
        });
        setCurrentTDS({
          value: parseFloat(tdsData.tds_value),  // Make sure this is a number
          time: new Date().toLocaleTimeString("en-GB", { hour12: false })
        });
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
    <div className="w-full min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-8 text-white text-center">Sensor Dashboard</h1>
        
        {/* First Row: PH, Humidity, and Temperature Gauges */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="w-full h-full min-h-[200px]">
            <Gauge value={currentPH?.value} time={currentPH?.time} />
          </div>
          <div className="w-full h-full min-h-[200px]">
            <HumidityGauge value={currentHumidity?.value} time={currentHumidity?.time} />
          </div>
          <div className="w-full h-full min-h-[200px]">
            <TemperatureGauge value={currentTemperature?.value} time={currentTemperature?.time} />
          </div>
        </div>

        {/* Combined Graph for PH, Humidity, and Temperature */}
        <div className="w-full bg-gray-800 rounded-lg p-4 mb-8">
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
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="w-full h-full min-h-[200px]">
            <TDSGauge value={currentTDS?.value} time={currentTDS?.time} />
          </div>
          <div className="w-full h-full min-h-[200px]">
            <MoistureGauge value={currentMoisture?.value} state={currentMoisture?.state} time={currentMoisture?.time}/>
          </div>
        </div>

        {/* Combined Graph for TDS and Soil Moisture */}
        <div className="w-full bg-gray-800 rounded-lg p-4">
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
    </div>
  );
};

export default Dashboard;
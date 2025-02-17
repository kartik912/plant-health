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
          value: parseFloat(phData.ph_value),
          time: new Date().toLocaleTimeString("en-GB", { hour12: false })
        });
        setCurrentTDS({
          value: parseFloat(tdsData.tds_value),
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

  // Custom chart styling
  const chartStyle = {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: "12px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    border: "1px solid rgba(100, 116, 139, 0.1)"
  };

  // Custom tooltip styling
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg bg-slate-800 border border-slate-700 shadow-lg p-4">
          <p className="text-slate-300 text-sm mb-2">{`Time: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm font-medium">
              {`${entry.name}: ${entry.value?.toFixed(2) || 'N/A'}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header with glowing text */}
        <h1 className="text-4xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 text-center drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          Sensor Dashboard
        </h1>
        
        {/* First Row: PH, Humidity, and Temperature Gauges */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="w-full h-full min-h-[200px] transform hover:scale-[1.02] transition-all duration-300">
            <Gauge value={currentPH?.value} time={currentPH?.time} />
          </div>
          <div className="w-full h-full min-h-[200px] transform hover:scale-[1.02] transition-all duration-300">
            <HumidityGauge value={currentHumidity?.value} time={currentHumidity?.time} />
          </div>
          <div className="w-full h-full min-h-[200px] transform hover:scale-[1.02] transition-all duration-300">
            <TemperatureGauge value={currentTemperature?.value} time={currentTemperature?.time} />
          </div>
        </div>

        {/* Combined Graph for PH, Humidity, and Temperature */}
        <div className="w-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl p-6 mb-8 shadow-lg border border-slate-700/30 backdrop-blur-sm">
          <h3 className="text-xl font-semibold text-white mb-4 ml-2">Environmental Parameters</h3>
          <div style={chartStyle} className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sensorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis 
                  dataKey="time" 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8' }}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8' }}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '15px',
                    color: '#e2e8f0'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="ph" 
                  stroke="#FF6384" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, stroke: '#FF6384', strokeWidth: 2 }}
                  name="pH Level" 
                />
                <Line 
                  type="monotone" 
                  dataKey="humidity" 
                  stroke="#36A2EB" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, stroke: '#36A2EB', strokeWidth: 2 }}
                  name="Humidity" 
                />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#FF9F40" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, stroke: '#FF9F40', strokeWidth: 2 }}
                  name="Temperature" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Second Row: TDS and Soil Moisture Gauges */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="w-full h-full min-h-[200px] transform hover:scale-[1.02] transition-all duration-300">
            <TDSGauge value={currentTDS?.value} time={currentTDS?.time} />
          </div>
          <div className="w-full h-full min-h-[200px] transform hover:scale-[1.02] transition-all duration-300">
            <MoistureGauge value={currentMoisture?.value} state={currentMoisture?.state} time={currentMoisture?.time}/>
          </div>
        </div>

        {/* Combined Graph for TDS and Soil Moisture */}
        <div className="w-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl p-6 shadow-lg border border-slate-700/30 backdrop-blur-sm">
          <h3 className="text-xl font-semibold text-white mb-4 ml-2">Soil Parameters</h3>
          <div style={chartStyle} className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sensorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis 
                  dataKey="time" 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8' }}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8' }}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '15px',
                    color: '#e2e8f0'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="tds" 
                  stroke="#4BC0C0" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, stroke: '#4BC0C0', strokeWidth: 2 }}
                  name="TDS" 
                />
                <Line 
                  type="monotone" 
                  dataKey="moisture" 
                  stroke="#9966FF" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, stroke: '#9966FF', strokeWidth: 2 }}
                  name="Soil Moisture" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
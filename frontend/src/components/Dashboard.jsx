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
import { LocationMap } from "../components/Location"

const Dashboard = () => {
  // Current sensor values
  const [currentMoisture, setCurrentMoisture] = useState({ value: 0, state: "Dry", time: "N/A" });
  const [currentTemperature, setCurrentTemperature] = useState({ value: 0, time: "N/A" });
  const [currentHumidity, setCurrentHumidity] = useState({ value: 0, time: "N/A" });
  const [currentPH, setCurrentPH] = useState({ value: 0, time: "N/A" });
  const [currentTDS, setCurrentTDS] = useState({ value: 0, time: "N/A" });

  // Historical data for all sensors
  const [sensorData, setSensorData] = useState([]);

  // Helper function to safely parse numeric values
  const safeParseFloat = (value) => {
    if (value === null || value === undefined) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  const getLatestValue = (data, key) => {
    if (!data || data.length === 0) return null;
    
    // Start from the end of the array and find the first non-null value
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i] && data[i][key] !== null && data[i][key] !== undefined) {
        return {
          value: data[i][key],
          time: data[i].time
        };
      }
    }
    return null;
  };

  // Helper function to determine moisture state based on value
  const getMoistureState = (value) => {
    if (value === null || value === undefined) return "Unknown";
    
    // Ensure value is a number
    const moistureValue = safeParseFloat(value);
    if (moistureValue === null) return "Unknown";
    
    if (moistureValue < 300) return "Dry";
    if (moistureValue < 600) return "Moist";
    if (moistureValue < 1000) return "Wet";
    return "Wet";
  };

  // Fetch historical data
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const url = import.meta.env.VITE_API_URL;
        const [tempHumHistoryRes, moistureHistoryRes, phHistoryRes, tdsHistoryRes] = await Promise.all([
          fetch(`${url}/get_temperature_humidity_history`),
          fetch(`${url}/get_moisture_data`),
          fetch(`${url}/get_ph_history`),
          fetch(`${url}/get_tds_history`)
        ]);

        const tempHumHistory = await tempHumHistoryRes.json();
        const moistureHistory = await moistureHistoryRes.json();
        const phHistory = await phHistoryRes.json();
        const tdsHistory = await tdsHistoryRes.json();

        console.log("Moisture history data:", moistureHistory);
        
        // Enhanced error logging
        if (!moistureHistory.moisture_data || !Array.isArray(moistureHistory.moisture_data)) {
          console.error("Invalid moisture data format:", moistureHistory);
        }

        // Merge all historical data with more robust error handling
        const mergedData = [];
        
        const maxLength = Math.max(
          tempHumHistory.temperature_humidity_data?.length || 0,
          moistureHistory.moisture_data?.length || 0,
          phHistory.ph_data?.length || 0,
          tdsHistory.tds_data?.length || 0
        );
        
        for (let i = 0; i < maxLength; i++) {
          const tempHumItem = tempHumHistory.temperature_humidity_data?.[i];
          const moistureItem = moistureHistory.moisture_data?.[i];
          const phItem = phHistory.ph_data?.[i];
          const tdsItem = tdsHistory.tds_data?.[i];
          
          if (tempHumItem) {
            mergedData.push({
              time: new Date(tempHumItem.date).toLocaleTimeString(),
              temperature: safeParseFloat(tempHumItem.temperature),
              humidity: safeParseFloat(tempHumItem.humidity),
              ph: phItem ? safeParseFloat(phItem.ph_value) : null,
              moisture: moistureItem ? safeParseFloat(moistureItem.moisture_level) : null,
              tds: tdsItem ? safeParseFloat(tdsItem.tds_value) : null
            });
          }
        }

        setSensorData(mergedData);

        // Update current sensor values with the latest historical data
        const latestMoisture = getLatestValue(mergedData, 'moisture');
      if (latestMoisture) {
        setCurrentMoisture(prev => ({
          value: latestMoisture.value,
          state: getMoistureState(latestMoisture.value),
          time: latestMoisture.time
        }));
      }

      const latestTemperature = getLatestValue(mergedData, 'temperature');
      if (latestTemperature) {
        setCurrentTemperature(prev => ({
          value: latestTemperature.value,
          time: latestTemperature.time
        }));
      }

      const latestHumidity = getLatestValue(mergedData, 'humidity');
      if (latestHumidity) {
        setCurrentHumidity(prev => ({
          value: latestHumidity.value,
          time: latestHumidity.time
        }));
      }

      const latestPH = getLatestValue(mergedData, 'ph');
      if (latestPH) {
        setCurrentPH(prev => ({
          value: latestPH.value,
          time: latestPH.time
        }));
      }

      const latestTDS = getLatestValue(mergedData, 'tds');
      if (latestTDS) {
        setCurrentTDS(prev => ({
          value: latestTDS.value,
          time: latestTDS.time
        }));
      }
    } catch (error) {
      console.error("Error fetching historical data:", error);
    }
  };

    fetchHistoricalData();
    const interval = setInterval(() => {
      fetchHistoricalData();
    }, 300000); // Update every 5 minutes
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

  // Debugging current moisture value
  console.log("Current moisture state in render:", currentMoisture);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-2 sm:p-6">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header with glowing text, made more compact */}
        <h1 className="text-2xl sm:text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 text-center drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          Sensor Dashboard
        </h1>
        
        {/* First Row: PH, Humidity, and Temperature Gauges */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="w-full h-full min-h-[120px] sm:min-h-[200px] transform hover:scale-[1.02] transition-all duration-300">
            <Gauge value={currentPH?.value} time={currentPH?.time} />
          </div>
          <div className="w-full h-full min-h-[120px] sm:min-h-[200px] transform hover:scale-[1.02] transition-all duration-300">
            <HumidityGauge value={currentHumidity?.value} time={currentHumidity?.time} />
          </div>
          <div className="col-span-2 sm:col-span-1 w-full h-full min-h-[120px] sm:min-h-[200px] transform hover:scale-[1.02] transition-all duration-300">
            <TemperatureGauge value={currentTemperature?.value} time={currentTemperature?.time} />
          </div>
        </div>

        {/* Combined Graph for PH, Humidity, and Temperature */}
        <div className="w-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl p-2 sm:p-6 mb-4 sm:mb-8 shadow-lg border border-slate-700/30 backdrop-blur-sm">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-4 ml-2">Environmental Parameters</h3>
          <div style={chartStyle} className="p-1 sm:p-4">
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
                <Line 
                  type="monotone" 
                  dataKey="ph" 
                  stroke="#FF6384" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, stroke: '#FF6384', strokeWidth: 2 }}
                  name="pH Level" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Second Row: TDS and Soil Moisture Gauges */}
        <div className="w-full grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="w-full h-full min-h-[120px] sm:min-h-[200px] transform hover:scale-[1.02] transition-all duration-300">
            <TDSGauge value={currentTDS?.value} time={currentTDS?.time} />
          </div>
          <div className="w-full h-full min-h-[120px] sm:min-h-[200px] transform hover:scale-[1.02] transition-all duration-300">
            <MoistureGauge 
              value={currentMoisture?.value} 
              state={currentMoisture?.state} 
              time={currentMoisture?.time}
            />
          </div>
        </div>

        {/* Combined Graph for TDS and Soil Moisture */}
        <div className="w-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl p-2 sm:p-6 shadow-lg border border-slate-700/30 backdrop-blur-sm">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-4 ml-2">Soil Parameters</h3>
          <div style={chartStyle} className="p-1 sm:p-4">
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
                  dataKey="moisture" 
                  stroke="#9966FF" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, stroke: '#9966FF', strokeWidth: 2 }}
                  name="Soil Moisture" 
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
                
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-4 sm:mt-8">
          <LocationMap />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
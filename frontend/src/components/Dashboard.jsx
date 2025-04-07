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
  const [currentPH, setCurrentPH] = useState({ value: 0, state: "Neutral", time: "N/A" });
  const [currentTDS, setCurrentTDS] = useState({ value: 0, time: "N/A" });

  // Historical data for all sensors
  const [sensorData, setSensorData] = useState([]);
  // Specific pH data with state information
  const [phData, setPHData] = useState([]);
  // Specific moisture data with state information
  const [moistureData, setMoistureData] = useState([]);
  // Specific TDS data - New separate state for TDS data
  const [tdsData, setTdsData] = useState([]);
  
  const maxPHDataPoints = 20; // Limit the number of points shown on pH graph
  const maxMoistureDataPoints = 20; // Limit the number of points shown on moisture graph

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

  // Helper function to determine pH state based on value (from PHSensor component)
  const getPHState = (ph) => {
    if (isNaN(ph)) return "Neutral"; // Handle NaN values
    if (ph < 6.5) return "Acidic";
    if (ph > 7.5) return "Alkaline";
    return "Neutral";
  };

  // Separate TDS data fetching function (NEW - based on TDS component)
  const fetchTDSData = async () => {
    try {
      const url = import.meta.env.VITE_API_URL;
      const response = await fetch(`${url}/get_tds_history`);
      const historyData = await response.json();
      
      if (!historyData.tds_data || !Array.isArray(historyData.tds_data)) {
        console.error("Invalid TDS data format:", historyData);
        return [];
      }
      
      const formattedData = historyData.tds_data.map(item => {
        return {
          time: item.date,
          tds_value: safeParseFloat(item.tds_value)
        };
      });
      
      // Set TDS historical data
      setTdsData(formattedData);
      
      // Set current TDS value from the latest entry
      if (formattedData.length > 0) {
        const latestEntry = formattedData[formattedData.length - 1];
        setCurrentTDS({
          value: latestEntry.tds_value,
          time: latestEntry.time
        });
      }
      
      return formattedData;
    } catch (error) {
      console.error("Error fetching TDS data:", error);
      return [];
    }
  };

  // Separate moisture data fetching function
  const fetchMoistureData = async () => {
    try {
      const url = import.meta.env.VITE_API_URL;
      const response = await fetch(`${url}/get_moisture_data`);
      const data = await response.json();
      
      if (!data.moisture_data || !Array.isArray(data.moisture_data)) {
        console.error("Invalid moisture data format:", data);
        return [];
      }
      
      const formattedData = data.moisture_data.map((item) => {
        const moistureLevel = safeParseFloat(item.moisture_level);
        return {
          time: item.date,
          value: moistureLevel,
          state: item.state || getMoistureState(moistureLevel)
        };
      });
      
      // Set historical moisture data
      const recentData = formattedData.slice(-maxMoistureDataPoints);
      setMoistureData(recentData);
      
      // Set current moisture value from the latest entry
      if (recentData.length > 0) {
        const latestEntry = recentData[recentData.length - 1];
        setCurrentMoisture({
          value: latestEntry.value,
          state: latestEntry.state,
          time: latestEntry.time
        });
      }
      
      return formattedData;
    } catch (error) {
      console.error("Error fetching moisture data:", error);
      return [];
    }
  };

  // Separate pH data fetching function (from PHSensor component)
  const fetchPHData = async () => {
    try {
      const url = import.meta.env.VITE_API_URL;
      const response = await fetch(`${url}/get_ph_history`);
      const data = await response.json();
      
      const formattedData = data.ph_data.map((item) => {
        const phValue = parseFloat(item.ph_value);
        return {
          time: item.timestamp,
          value: isNaN(phValue) ? 0 : parseFloat(phValue.toFixed(1)),
          state: getPHState(isNaN(phValue) ? 0 : phValue)
        };
      });
      
      // Set historical pH data
      const recentData = formattedData.slice(-maxPHDataPoints);
      setPHData(recentData);
      
      // Set current pH value from the latest entry
      if (recentData.length > 0) {
        const latestEntry = recentData[recentData.length - 1];
        setCurrentPH({
          value: latestEntry.value,
          state: latestEntry.state,
          time: latestEntry.time
        });
      }
      
      return formattedData;
    } catch (error) {
      console.error("Error fetching PH data:", error);
      return [];
    }
  };

  // Fetch historical data
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const url = import.meta.env.VITE_API_URL;
        // Only fetch temperature and humidity history
        const tempHumHistoryRes = await fetch(`${url}/get_temperature_humidity_history`);
        const tempHumHistory = await tempHumHistoryRes.json();
        
        // Fetch pH data using the dedicated function
        const phFormattedData = await fetchPHData();
        
        // Fetch moisture data using the dedicated function
        const moistureFormattedData = await fetchMoistureData();
        
        // Fetch TDS data using the dedicated function
        const tdsFormattedData = await fetchTDSData();

        // Merge temperature and humidity data with more robust error handling
        const mergedData = [];
        
        if (tempHumHistory.temperature_humidity_data && Array.isArray(tempHumHistory.temperature_humidity_data)) {
          tempHumHistory.temperature_humidity_data.forEach(tempHumItem => {
            mergedData.push({
              time: tempHumItem.date,
              temperature: safeParseFloat(tempHumItem.temperature),
              humidity: safeParseFloat(tempHumItem.humidity)
            });
          });
        }

        setSensorData(mergedData);

        // Temperature and humidity are already updated from merged data
        // pH, TDS and moisture are handled in their respective fetch functions
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

  // Moisture-specific tooltip
  const MoistureTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg bg-slate-800 border border-slate-700 shadow-lg p-4">
          <p className="text-slate-300 text-sm mb-2">{`Time: ${label}`}</p>
          {payload.map((entry, index) => {
            const moistureValue = entry.value;
            const moistureState = getMoistureState(moistureValue);
            let stateColor;
            switch (moistureState.toLowerCase()) {
              case 'dry': stateColor = '#FBBF24'; break; // yellow-400
              case 'moist': stateColor = '#4ADE80'; break; // green-400
              case 'wet': stateColor = '#60A5FA'; break; // blue-400
              default: stateColor = '#9CA3AF'; break; // gray-400
            }
            
            return (
              <div key={`item-${index}`} className="text-sm">
                <p style={{ color: entry.color }} className="font-medium">
                  {`${entry.name}: ${moistureValue?.toFixed(2) || 'N/A'}`}
                </p>
                <p style={{ color: stateColor }} className="font-medium mt-1 capitalize">
                  Status: {moistureState}
                </p>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // TDS-specific tooltip (NEW)
  const TDSTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg bg-slate-800 border border-slate-700 shadow-lg p-4">
          <p className="text-slate-300 text-sm mb-2">{`Time: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm font-medium">
              {`${entry.name}: ${entry.value?.toFixed(2) || 'N/A'} ms/cm`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // pH-specific tooltip
  const PHTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg bg-slate-800 border border-slate-700 shadow-lg p-4">
          <p className="text-slate-300 text-sm mb-2">{`Time: ${label}`}</p>
          {payload.map((entry, index) => {
            const phValue = entry.value;
            const phState = getPHState(phValue);
            let stateColor;
            switch (phState.toLowerCase()) {
              case 'acidic': stateColor = '#FBBF24'; break; // yellow-400
              case 'neutral': stateColor = '#4ADE80'; break; // green-400
              case 'alkaline': stateColor = '#60A5FA'; break; // blue-400
              default: stateColor = '#9CA3AF'; break; // gray-400
            }
            
            return (
              <div key={`item-${index}`} className="text-sm">
                <p style={{ color: entry.color }} className="font-medium">
                  {`${entry.name}: ${phValue?.toFixed(1) || 'N/A'}`}
                </p>
                <p style={{ color: stateColor }} className="font-medium mt-1 capitalize">
                  Status: {phState}
                </p>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

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
            <Gauge 
              value={currentPH?.value} 
              time={currentPH?.time} 
              state={currentPH?.state}
            />
          </div>
          <div className="w-full h-full min-h-[120px] sm:min-h-[200px] transform hover:scale-[1.02] transition-all duration-300">
            <HumidityGauge value={currentHumidity?.value} time={currentHumidity?.time} />
          </div>
          <div className="col-span-2 sm:col-span-1 w-full h-full min-h-[120px] sm:min-h-[200px] transform hover:scale-[1.02] transition-all duration-300">
            <TemperatureGauge value={currentTemperature?.value} time={currentTemperature?.time} />
          </div>
        </div>

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
                  yAxisId="temp"
                />
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8' }}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                  orientation="right"
                  yAxisId="ph"
                  domain={[0, 14]}
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
                  yAxisId="temp"
                />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#FF9F40" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, stroke: '#FF9F40', strokeWidth: 2 }}
                  name="Temperature" 
                  yAxisId="temp"
                />
                <Line 
                  type="monotone" 
                  dataKey="ph_value" 
                  stroke="#4ade80" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, stroke: '#4ade80', strokeWidth: 2 }}
                  name="pH Level" 
                  yAxisId="ph"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Second Row: TDS and Soil Moisture Gauges */}
        <div className="w-full grid grid-cols-1 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="w-full h-full min-h-[120px] sm:min-h-[200px] transform hover:scale-[1.02] transition-all duration-300">
            <TDSGauge value={currentTDS?.value} time={currentTDS?.time} />
          </div>
          
        </div>

        
        
        {/* NEW: Separate TDS Graph following TDS.js pattern */}
        <div className="w-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl p-2 sm:p-6 mb-4 sm:mb-8 shadow-lg border border-slate-700/30 backdrop-blur-sm">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-4 ml-2">EC Measurements</h3>
          <div style={chartStyle} className="p-1 sm:p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tdsData}>
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
                <Tooltip content={<TDSTooltip />} />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '15px',
                    color: '#e2e8f0'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="tds_value" 
                  stroke="#fb7185" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, stroke: '#fb7185', strokeWidth: 2 }}
                  name="EC (ms/cm)" 
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
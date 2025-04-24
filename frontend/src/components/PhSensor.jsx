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
import { RefreshCw } from "lucide-react";

const PHSensor = () => {
  const [currentPH, setCurrentPH] = useState({
    value: 0,
    state: "Neutral"
  });
  const [phData, setPHData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const maxDataPoints = 20; // Limit the number of points shown on graph
  const url = import.meta.env.VITE_API_URL;

  const fetchPHData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${url}/get_ph`);
      const data = await response.json();
      
      // Update current PH value
      if (data && data.ph_value !== undefined) {
        const phValue = parseFloat(data.ph_value);
        setCurrentPH({
          value: isNaN(phValue) ? 0 : parseFloat(phValue.toFixed(1)),
          state: getPHState(isNaN(phValue) ? 0 : phValue)
        });
        
        // Add to history
        const newEntry = {
          time: new Date().toLocaleTimeString(),
          value: isNaN(phValue) ? 0 : parseFloat(phValue.toFixed(1)),
          state: getPHState(isNaN(phValue) ? 0 : phValue)
        };
        
        setPHData(prevData => {
          const newData = [...prevData, newEntry];
          // Keep only the last maxDataPoints
          return newData.slice(-maxDataPoints);
        });
      }
    } catch (error) {
      console.error("Error fetching PH data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPHHistoryData = async () => {
    setIsLoading(true);
    try {
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
      
      // Set historical data
      const recentData = formattedData.slice(-maxDataPoints);
      setPHData(recentData);
      
      // Set current value from the latest entry
      if (recentData.length > 0) {
        const latestEntry = recentData[recentData.length - 1];
        setCurrentPH({
          value: latestEntry.value,
          state: latestEntry.state
        });
      }
    } catch (error) {
      console.error("Error fetching PH history data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPHHistoryData();
    const phInterval = setInterval(fetchPHHistoryData, 300000); // Update every 5 minutes
    return () => clearInterval(phInterval);
  }, []);

  const getPHState = (ph) => {
    if (isNaN(ph)) return "Neutral"; // Handle NaN values
    if (ph < 6.5) return "Acidic";
    if (ph > 7.5) return "Alkaline";
    return "Neutral";
  };

  const getStateColor = (state) => {
    switch (state?.toLowerCase()) {
      case 'acidic':
        return 'text-yellow-400';
      case 'neutral':
        return 'text-green-400';
      case 'alkaline':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6">
      <div className="rounded-lg bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/30 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700/30">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-indigo-500">
            PH Monitor
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Current Reading */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-lg font-medium text-green-400">
                    PH Level
                  </div>
                  <button 
                    onClick={fetchPHData}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-1 rounded-md bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={`${isLoading ? "animate-spin" : ""}`} />
                    <span>Update</span>
                  </button>
                </div>
                <div className="mt-2 text-3xl font-bold text-white">
                  {currentPH.value}
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30">
                <div className="flex items-center gap-2 text-lg font-medium text-indigo-400">
                  Status
                </div>
                <div className={`mt-2 text-3xl font-bold capitalize ${getStateColor(currentPH.state)}`}>
                  {currentPH.state || "Neutral"}
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={phData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8' }}
                    domain={[0, 14]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '0.5rem'
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(value) => isNaN(value) ? "N/A" : value}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#94a3b8' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#4ade80"
                    strokeWidth={2}
                    dot={false}
                    name="PH Level"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PHSensor;
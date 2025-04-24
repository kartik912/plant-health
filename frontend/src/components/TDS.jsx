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

const TDS = () => {
  const [tdsData, setTdsData] = useState([]);
  const [currentTDS, setCurrentTDS] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const url = import.meta.env.VITE_API_URL;
  const maxDataPoints = 20; // Limit the number of points shown on graph

  const fetchSingleTDSData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${url}/get_tds`);
      const data = await response.json();
      
      // Update current TDS value
      if (data && data.tds_value !== undefined) {
        const tdsValue = parseFloat(data.tds_value);
        setCurrentTDS(isNaN(tdsValue) ? 0 : tdsValue.toFixed(1));
        
        // Add to history
        const newEntry = {
          time: new Date().toLocaleTimeString(),
          tds_value: isNaN(tdsValue) ? 0 : tdsValue
        };
        
        setTdsData(prevData => {
          const newData = [...prevData, newEntry];
          // Keep only the last maxDataPoints
          return newData.slice(-maxDataPoints);
        });
      }
    } catch (error) {
      console.error("Error fetching TDS data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTDSHistoryData = async () => {
    setIsLoading(true);
    try {
      const historyResponse = await fetch(`${url}/get_tds_history`);
      const historyData = await historyResponse.json();
      const formattedData = historyData.tds_data.map(item => {
        return {
          time: item.date,
          tds_value: parseFloat(item.tds_value)
        };
      });
      
      // Set historical data
      const recentData = formattedData.slice(-maxDataPoints);
      setTdsData(recentData);
      
      // Set current value from the latest entry
      if (recentData.length > 0) {
        const latestEntry = recentData[recentData.length - 1];
        setCurrentTDS(parseFloat(latestEntry.tds_value).toFixed(1));
      }
    } catch (error) {
      console.error("Error fetching TDS history data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTDSHistoryData();
    const interval = setInterval(fetchTDSHistoryData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6">
      <div className="rounded-lg bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/30 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700/30">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500">
            TDS Monitor
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Current Reading */}
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-lg font-medium text-rose-400">
                    Current EC Level
                  </div>
                  <button 
                    onClick={fetchSingleTDSData}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-1 rounded-md bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={`${isLoading ? "animate-spin" : ""}`} />
                    <span>Update</span>
                  </button>
                </div>
                <div className="mt-2 text-3xl font-bold text-white">
                  {currentTDS} ms/cm
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={tdsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '0.5rem'
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#94a3b8' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tds_value"
                    stroke="#fb7185"
                    strokeWidth={2}
                    dot={false}
                    name="EC (ms/cm)"
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

export default TDS;
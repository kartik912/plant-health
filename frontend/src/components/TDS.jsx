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

const TDS = () => {
  const [tdsData, setTdsData] = useState([]);
  const [currentTDS, setCurrentTDS] = useState(0);

  useEffect(() => {
    const fetchTDSData = async () => {
      try {
        const historyResponse = await fetch("https://api.hydrophonic.site/get_tds_history");
        const historyData = await historyResponse.json();
        const formattedData = historyData.tds_data.map(item => ({
          time: new Date(item.date).toLocaleTimeString(),
          tds_value: parseFloat(item.tds_value)
        }));
        
        // Set historical data
        setTdsData(formattedData);
        
        // Set current value from the latest entry
        if (formattedData.length > 0) {
          const latestEntry = formattedData[formattedData.length - 1];
          setCurrentTDS(parseFloat(latestEntry.tds_value).toFixed(1));
        }
      } catch (error) {
        console.error("Error fetching TDS data:", error);
      }
    };
    
    fetchTDSData();
    const interval = setInterval(fetchTDSData, 10000);
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
                <div className="flex items-center gap-2 text-lg font-medium text-rose-400">
                  Current TDS Level
                </div>
                <div className="mt-2 text-3xl font-bold text-white">
                  {currentTDS} ppm
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
                    name="TDS (ppm)"
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
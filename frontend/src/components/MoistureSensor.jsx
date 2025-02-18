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

const MoistureSensor = () => {
  const [currentMoisture, setCurrentMoisture] = useState({
    level: 0,
    state: "Dry",
  });
  const [moistureData, setMoistureData] = useState([]);
  const maxDataPoints = 20; // Limit the number of points shown on graph

  useEffect(() => {
    // Initial fetch of historical data
    const fetchMoistureData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/get_moisture_data");
        const data = await response.json();
        const formattedData = data.moisture_data.map((item) => ({
          time: new Date(item.date).toLocaleTimeString(),
          level: parseFloat(item.moisture_level),
          state: item.state,
        }));
        setMoistureData(formattedData.slice(-maxDataPoints));
      } catch (error) {
        console.error("Error fetching moisture data:", error);
      }
    };

    fetchMoistureData();
  }, []); // Only fetch historical data once on mount

  useEffect(() => {
    const pollMoisture = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/check_moisture");
        const data = await response.json();
        
        const newReading = {
          time: new Date().toLocaleTimeString(),
          level: data.moisture_level,
          state: data.state
        };

        setCurrentMoisture({
          level: data.moisture_level,
          state: data.state
        });

        // Update graph data with new reading
        setMoistureData(prevData => {
          const newData = [...prevData, newReading];
          // Keep only the last maxDataPoints readings
          return newData.slice(-maxDataPoints);
        });
      } catch (error) {
        console.error("Error checking moisture:", error);
      }
    };

    pollMoisture();
    const moistureInterval = setInterval(pollMoisture, 5000);
    return () => clearInterval(moistureInterval);
  }, []);

  const getStateColor = (state) => {
    switch (state?.toLowerCase()) {
      case 'wet':
        return 'text-blue-400';
      case 'moist':
        return 'text-green-400';
      case 'dry':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6">
      <div className="rounded-lg bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/30 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700/30">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
            Moisture Monitor
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Current Reading */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30">
                <div className="flex items-center gap-2 text-lg font-medium text-blue-400">
                  Moisture Level
                </div>
                <div className="mt-2 text-3xl font-bold text-white">
                  {currentMoisture.level}
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30">
                <div className="flex items-center gap-2 text-lg font-medium text-indigo-400">
                  Status
                </div>
                <div className={`mt-2 text-3xl font-bold capitalize ${getStateColor(currentMoisture.state)}`}>
                  {currentMoisture.state || "Dry"}
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={moistureData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8' }}
                    domain={[0, 1000]}
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
                    dataKey="level"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    dot={false}
                    name="Moisture Level"
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

export default MoistureSensor;
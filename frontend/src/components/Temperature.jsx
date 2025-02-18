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
import { HiOutlineCloud } from "react-icons/hi";

const Temperature = () => {
  const [currentTemperatureHumidity, setCurrentTemperatureHumidity] = useState({
    temperature: 0,
    humidity: 0,
  });

  const [temperatureHumidityData, setTemperatureHumidityData] = useState([]);

  useEffect(() => {
    const fetchTemperatureHumidityData = async () => {
      try {
        const currentResponse = await fetch("http://127.0.0.1:5000/get_temperature_humidity");
        const currentData = await currentResponse.json();
        
        setCurrentTemperatureHumidity({
          temperature: currentData.temperature,
          humidity: currentData.humidity
        });

        const historyResponse = await fetch("http://127.0.0.1:5000/get_temperature_humidity_history");
        const historyData = await historyResponse.json();
        
        const formattedData = historyData.temperature_humidity_data.map((item) => ({
          time: new Date(item.date).toLocaleTimeString(),
          temperature: parseFloat(item.temperature),
          humidity: parseFloat(item.humidity)
        }));
        
        setTemperatureHumidityData(formattedData);
      } catch (error) {
        console.error("Error fetching temperature and humidity data:", error);
      }
    };

    fetchTemperatureHumidityData();
    const interval = setInterval(fetchTemperatureHumidityData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6">
      <div className="rounded-lg bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/30 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700/30">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            Temperature & Humidity Monitor
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Current Readings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30">
                <div className="flex items-center gap-2 text-lg font-medium text-emerald-400">  
                  Temperature
                </div>
                <div className="mt-2 text-3xl font-bold text-white">
                  {currentTemperatureHumidity.temperature}°C
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30">
                <div className="flex items-center gap-2 text-lg font-medium text-cyan-400">
                  <HiOutlineCloud className="w-6 h-6" />
                  Humidity
                </div>
                <div className="mt-2 text-3xl font-bold text-white">
                  {currentTemperatureHumidity.humidity}%
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={temperatureHumidityData}>
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
                    dataKey="temperature"
                    stroke="#34d399"
                    strokeWidth={2}
                    dot={false}
                    name="Temperature (°C)"
                  />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    dot={false}
                    name="Humidity (%)"
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

export default Temperature;
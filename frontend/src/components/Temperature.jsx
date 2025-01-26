import React, { useState } from "react";
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
const Temperature = () => {
  const [currentTemperatureHumidity, setCurrentTemperatureHumidity] = useState({
    temperature: 0,
    humidity: 0,
  });

  const [temperatureHumidityData, setTemperatureHumidityData] = useState([]);

  const deleteTemperatureHumidityHistory = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/delete_temperature_humidity_data",
        {
          method: "POST",
        }
      );
      if (response.ok) {
        setTemperatureHumidityData([]);
      }
    } catch (error) {
      console.error("Error clearing temperature and humidity history:", error);
    }
  };

  return (
    <>
      {/* Temperature and Humidity Panel */}
      <div className="panel">
        <h2 className="panel-title">Temperature & Humidity</h2>
        <div className="panel-content">
          <div className="sensor-readings">
            <div>Temperature: {currentTemperatureHumidity.temperature}°C</div>
            <div>Humidity: {currentTemperatureHumidity.humidity}%</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={temperatureHumidityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#FF6384"
                name="Temperature (°C)"
              />
              <Line
                type="monotone"
                dataKey="humidity"
                stroke="#36A2EB"
                name="Humidity (%)"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="history">
            <div className="history-header">
              <h3>Temperature & Humidity History</h3>
              <button
                onClick={deleteTemperatureHumidityHistory}
                className="button clear-button"
              >
                Clear History
              </button>
            </div>
            <ul>
              {temperatureHumidityData.length ? (
                temperatureHumidityData.map((data, index) => (
                  <li key={index}>
                    Temp: {data.temperature}°C, Humidity: {data.humidity}% at{" "}
                    {data.time}
                  </li>
                ))
              ) : (
                <li>No temperature and humidity history available.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Temperature;

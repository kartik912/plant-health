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

  
const MoistureSensor = () => {
  const [currentMoisture, setCurrentMoisture] = useState({
    level: 0,
    state: "",
  });
  const [moistureData, setMoistureData] = useState([]);

  const deleteMoistureHistory = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/delete_moisture_data",
        {
          method: "POST",
        }
      );
      if (response.ok) {
        setMoistureData([]);
      }
    } catch (error) {
      console.error("Error clearing moisture history:", error);
    }
  };

  return (
    <>
      {/* Moisture Sensor Panel */}
      <div className="panel">
        <h2 className="panel-title">Moisture Sensor</h2>
        <div className="panel-content">
          <div className={`status-indicator ${currentMoisture.state}`}>
            {currentMoisture.state || "No reading"}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={moistureData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="level" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
          <div className="history">
            <div className="history-header">
              <h3>Moisture History</h3>
              <button
                onClick={deleteMoistureHistory}
                className="button clear-button"
              >
                Clear History
              </button>
            </div>
            <ul>
              {moistureData.length ? (
                moistureData.map((data, index) => (
                  <li key={index}>
                    {data.state} - {data.level} at {data.time}
                  </li>
                ))
              ) : (
                <li>No moisture history available.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default MoistureSensor;

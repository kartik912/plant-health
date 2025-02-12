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
    state: "",
  });
  const [moistureData, setMoistureData] = useState([]);

  
  
  useEffect(() => {
    const fetchMoistureData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/get_moisture_data");
        const data = await response.json();
        const formattedData = data.moisture_data.map((item) => ({
          time: new Date(item.date).toLocaleTimeString(),
          level: parseFloat(item.moisture_level),
          state: item.state,
        }));
        setMoistureData(formattedData);
      } catch (error) {
        console.error("Error fetching moisture data:", error);
      }
    };
  
    fetchMoistureData(); // Fetch data initially
    const interval = setInterval(fetchMoistureData, 5000); // Fetch every 5 seconds
  
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);
  
  
  // useEffect(() => {
  //   const pollMoisture = async () => {
  //     try {
  //       const response = await fetch("http://127.0.0.1:5000/check_moisture");
  //       const data = await response.json();
        
  //       setCurrentMoisture({
  //         level: data.moisture_level,
  //         state: data.state
  //       });

  //       if (data.state === "dry" || data.state === "wet") {
  //         fetchMoistureData();
  //       }
  //     } catch (error) {
  //       console.error("Error checking moisture:", error);
  //     }
  //   };

  //   const moistureInterval = setInterval(pollMoisture, 500);
  //   pollMoisture();
  //   return () => clearInterval(moistureInterval);
  // }, []);


  return (
    <>
      {/* Moisture Sensor Panel */}
      <div className="panel w-[80%] mb-4 md:mb-0">
        <h2 className="panel-title">Moisture Sensor</h2>
        <div className="panel-content text-center">
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
          
        </div>
      </div>
    </>
  );
};

export default MoistureSensor;

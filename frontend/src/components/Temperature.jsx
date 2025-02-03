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

   
  // useEffect(() => {
  //   const fetchTemperatureHumidityData = async () => {
  //     try {
  //       // Fetch current temperature and humidity
  //       const currentResponse = await fetch("http://127.0.0.1:5000/get_temperature_humidity");
  //       const currentData = await currentResponse.json();
        
  //       setCurrentTemperatureHumidity({
  //         temperature: currentData.temperature,
  //         humidity: currentData.humidity
  //       });

  //       // Fetch temperature and humidity history
  //       const historyResponse = await fetch("http://127.0.0.1:5000/get_temperature_humidity_history");
  //       const historyData = await historyResponse.json();
        
  //       const formattedData = historyData.temperature_humidity_data.map((item) => ({
  //         time: new Date(item.date).toLocaleTimeString(),
  //         temperature: parseFloat(item.temperature),
  //         humidity: parseFloat(item.humidity)
  //       }));
        
  //       setTemperatureHumidityData(formattedData);
  //     } catch (error) {
  //       console.error("Error fetching temperature and humidity data:", error);
  //     }
  //   };
  
  //   fetchTemperatureHumidityData(); // Fetch data initially
  //   const interval = setInterval(fetchTemperatureHumidityData, 5000); // Fetch every 5 seconds
  
  //   return () => clearInterval(interval); // Cleanup on unmount
  // }, []);


  return (
    <>
      {/* Temperature and Humidity Panel */}
      <div className="panel w-[80%] mb-4 md:mb-0">
        <h2 className="panel-title">Temperature & Humidity</h2>
        <div className="panel-content">
          <div className="sensor-readings mb-4 font-semibold">
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
        </div>
      </div>
    </>
  );
};

export default Temperature;

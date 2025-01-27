import { useState, useEffect } from "react";
import io from 'socket.io-client/dist/socket.io.js';
import "./SensorDashboard.css";
import { Route, Routes } from "react-router-dom";
import PlantCamera from "./components/PlantCamera";
import LightControl from "./components/LightControl";
import MoistureSensor from "./components/MoistureSensor";
import Temperature from "./components/Temperature";

const SensorDashboard = () => {
  
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [socket, setSocket] = useState(null);

  // useEffect(() => {
  //   const newSocket = io('http://127.0.0.1:5000');
  //   setSocket(newSocket);

  //   newSocket.on('camera_frame', (data) => {
  //     setLiveStreamImage(`data:image/jpeg;base64,${data.image}`);
  //   });

  //   return () => newSocket.close();
  // }, []);

  
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

  // useEffect(() => {
  //   const testBackend = async () => {
  //     try {
  //       const response = await fetch("http://127.0.0.1:5000/test");
  //       const data = await response.json();
  //     } catch (error) {
  //       console.error("Backend test error:", error);
  //     }
  //   };
    
  //   testBackend();
  // }, []);

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

  // useEffect(() => {
  //   const pollLightStatus = async () => {
  //     try {
  //       const response = await fetch("http://127.0.0.1:5000/get_relay_status");
  //       const data = await response.json();
  //       setLightStatus(data.status);
  //     } catch (error) {
  //       console.error("Error fetching light status:", error);
  //     }
  //   };

  //   const lightInterval = setInterval(pollLightStatus, 1000);
  //   pollLightStatus();
  //   fetchLightHistory();

  //   return () => clearInterval(lightInterval);
  // }, []);

  // const fetchLightHistory = async () => {
  //   try {
  //     const response = await fetch("http://127.0.0.1:5000/get_contacts");
  //     const data = await response.json();
  //     setLightData(data.contacts);
  //   } catch (error) {
  //     console.error("Error fetching light history:", error);
  //   }
  // };

  // useEffect(() => {
  //   const fetchMoistureData = async () => {
  //     try {
  //       const response = await fetch("http://127.0.0.1:5000/get_moisture_data");
  //       const data = await response.json();
  //       const formattedData = data.moisture_data.map((item) => ({
  //         time: new Date(item.date).toLocaleTimeString(),
  //         level: parseFloat(item.moisture_level),
  //         state: item.state,
  //       }));
  //       setMoistureData(formattedData);
  //     } catch (error) {
  //       console.error("Error fetching moisture data:", error);
  //     }
  //   };
  
  //   fetchMoistureData(); // Fetch data initially
  //   const interval = setInterval(fetchMoistureData, 5000); // Fetch every 5 seconds
  
  //   return () => clearInterval(interval); // Cleanup on unmount
  // }, []);
  

  const downloadPDF = async () => {
    try {
        const response = await fetch("http://127.0.0.1:5000/download_database_pdf");
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'PlantCareDashboard.pdf'; // Set the desired file name
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url); // Clean up the URL object
        } else {
            console.error("Failed to fetch database PDF:", response.statusText);
        }
    } catch (error) {
        console.error("Error downloading database PDF:", error);
    }
  };

  return (
    <>
    <div className="sensor-dashboard">
      <h1 className="text-center font-bold text-4xl">Plant Care Dashboard</h1>
      <button onClick={downloadPDF} className="button download-button ">
        Download PDF
      </button>
      <div id="dashboard-content" className="dashboard-grid">
    <Routes>
      <Route path="/camera" element={<PlantCamera/>}/>
      <Route path="/light" element={<LightControl/>}/>
      <Route path="/moist" element={<MoistureSensor/>}/>
      <Route path="/temp" element={<Temperature/>}/>
    </Routes>
        
        
        
      </div>
    </div>
    </>
  );
};

export default SensorDashboard;
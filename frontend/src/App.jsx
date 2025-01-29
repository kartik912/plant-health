import { useState, useEffect } from "react";
import io from 'socket.io-client/dist/socket.io.js';
import "./SensorDashboard.css";
import { Route, Routes } from "react-router-dom";
import PlantCamera from "./components/PlantCamera";
import LightControl from "./components/LightControl";
import MoistureSensor from "./components/MoistureSensor";
import Temperature from "./components/Temperature";
import NavBar from "./components/NavBar";
import Layout from "./Layout";
import History from "./pages/History";

const SensorDashboard = () => {
  
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [socket, setSocket] = useState(null);

 
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
    <div className="grid md:grid-rows-1 md:grid-cols-[max-content_1fr] w-[100vw] h-[100vh] bg-green-200">
      <NavBar/>
      <div className="flex items-center justify-center md:w-[100%]">
        <Routes>
          <Route path="/" element={<PlantCamera/>}/>
          <Route path="/history" element={<History/>}/>
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
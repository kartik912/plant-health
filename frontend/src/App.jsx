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
    <NavBar/>
    <div className="sensor-dashboard pt-6 bg-green-200 h-[100vh]">
      {/* <h1 className="text-center font-bold text-4xl">Plant Care Dashboard</h1>
      <button onClick={downloadPDF} className="button download-button ">
        Download PDF
      </button> */}
      {/* <div id="dashboard-content" className="dashboard-grid"> */}
      <Routes>
        <Route path="/" element={<PlantCamera/>}/>
        <Route path="/history" element={<History/>}/>
        <Route path="/light" element={<LightControl/>}/>
        <Route path="/moist" element={<MoistureSensor/>}/>
        <Route path="/temp" element={<Temperature/>}/>
      </Routes>
        
        
        
      {/* </div> */}
    </div>
    </>
  );
};

export default SensorDashboard;
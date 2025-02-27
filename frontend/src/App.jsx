import { useState, useEffect } from "react";
import io from 'socket.io-client/dist/socket.io.js';
import "./SensorDashboard.css";
import { Navigate, Route, Routes } from "react-router-dom";
import PlantCamera from "./components/PlantCamera";
import LightControl from "./components/LightControl";
import MoistureSensor from "./components/MoistureSensor";
import Temperature from "./components/Temperature";
import TDS from './components/TDS';
import NavBar from "./components/NavBar";
import History from "./pages/History";
import PHSensor from "./components/PhSensor";
import Dashboard from "./components/Dashboard";
import Pump from './components/Pump';

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

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#1E3E62]">
      <NavBar />
      <main className="flex-1 md:ml-[20vw] md:min-ml-[250px] p-4 pt-20 md:pt-4 overflow-y-auto">
        <div className="flex justify-center items-start w-full">
          <Routes>
            <Route path="/" element={<Navigate to="dashboard"/>}/>
            <Route path="/camera" element={<PlantCamera/>}/>
            <Route path="/history" element={<History/>}/>
            <Route path="/light" element={<LightControl/>}/>
            <Route path="/moist" element={<MoistureSensor/>}/>
            <Route path="/temp" element={<Temperature/>}/>
            <Route path="/tds" element={<TDS/>}/>
            <Route path="/ph" element={<PHSensor/>}/>
            <Route path="/dashboard" element={<Dashboard/>}/>
            <Route path="/pump" element={<Pump/>}/>
            <Route path="/*" element={<Navigate to="/dashboard"/>}/>
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default SensorDashboard;
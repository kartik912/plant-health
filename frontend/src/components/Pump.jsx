import React, { useState, useEffect } from "react";
// import './pump.css';

const Pump = (props) => {
  const [pumpStatus, setPumpStatus] = useState({
    pump1: "stopped",
    pump2: "stopped",
    pump3: "stopped",
    pump4: "stopped"
  });
  const [duration, setDuration] = useState(5);
  const [saveStatus, setSaveStatus] = useState("");
  
  // Added states for sensor limits
  const [phLimits, setPhLimits] = useState({
    min: 5.5,
    max: 7.5,
    active: true
  });
  
  const [tdsLimits, setTdsLimits] = useState({
    min: 500,
    max: 1500,
    active: true
  });

  // Start an individual pump
  const startPump = async (pumpId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/pump/${pumpId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ duration }),
      });
      if (response.ok) {
        await response.json();
        fetchPumpStatus();
      }
    } catch (error) {
      console.error(`Error starting pump ${pumpId}:`, error);
    }
  };

  // Stop an individual pump
  const stopPump = async (pumpId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/pump/${pumpId}/stop`, {
        method: "POST",
      });
      if (response.ok) {
        await response.json();
        fetchPumpStatus();
      }
    } catch (error) {
      console.error(`Error stopping pump ${pumpId}:`, error);
    }
  };

  // Start all pumps
  const startAllPumps = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/pump/all/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ duration }),
      });
      if (response.ok) {
        await response.json();
        fetchPumpStatus();
      }
    } catch (error) {
      console.error("Error starting all pumps:", error);
    }
  };

  // Stop all pumps
  const stopAllPumps = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/pump/all/stop", {
        method: "POST",
      });
      if (response.ok) {
        await response.json();
        fetchPumpStatus();
      }
    } catch (error) {
      console.error("Error stopping all pumps:", error);
    }
  };

  // Fetch the status of all pumps
  const fetchPumpStatus = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/pump/status");
      if (response.ok) {
        const data = await response.json();
        setPumpStatus(data);
      }
    } catch (error) {
      console.error("Error fetching pump status:", error);
    }
  };
  
  // Fetch current limits on component mount
  useEffect(() => {
    fetchLimits();
  }, []);

  const fetchLimits = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/sensor/limits");
      if (response.ok) {
        const data = await response.json();
        if (data.ph) setPhLimits(data.ph);
        if (data.tds) setTdsLimits(data.tds);
      }
    } catch (error) {
      console.error("Error fetching sensor limits:", error);
    }
  };
  
  
  const updateSensorLimits = async () => {
    try {
      setSaveStatus("Saving...");
      const response = await fetch("http://127.0.0.1:5000/sensor/limits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          ph: phLimits,
          tds: tdsLimits
        }),
      });
      
      if (response.ok) {
        setSaveStatus("Saved successfully!");
        setTimeout(() => setSaveStatus(""), 3000);
      } else {
        setSaveStatus("Error saving");
        setTimeout(() => setSaveStatus(""), 3000);
      }
    } catch (error) {
      console.error("Error updating sensor limits:", error);
      setSaveStatus("Error saving");
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  const handleInputChange = (sensor, field, value) => {
    if (sensor === "ph") {
      setPhLimits({
        ...phLimits,
        [field]: field === "active" ? value : parseFloat(value)
      });
    } else {
      setTdsLimits({
        ...tdsLimits,
        [field]: field === "active" ? value : parseFloat(value)
      });
    }
  };
  

  // Poll for pump status
  useEffect(() => {
    const pollPumpStatus = async () => {
      await fetchPumpStatus();
    };

    const statusInterval = setInterval(pollPumpStatus, 1000);
    pollPumpStatus();

    return () => clearInterval(statusInterval);
  }, []);

  // Helper function to get status class name
  const getStatusClass = (pump) => {
    return pumpStatus[pump] === "running" ? "text-emerald-400" : "text-slate-400";
  };

  return (
    <div className="w-full min-h-screen py-6 px-4 md:px-6 lg:px-8 md:pt-6">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 mt-12 md:mt-2">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Pump Control System</h2>
          <p className="text-slate-400 mt-2">Monitor and control your plant watering system</p>
          
          {/* System Overview Card */}
          <div className="mt-6 bg-gradient-to-r from-slate-800/80 to-slate-900/80 rounded-xl p-4 border border-slate-700/30 shadow-lg">
            <div className="flex flex-wrap gap-6 justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${Object.values(pumpStatus).some(status => status === "running") ? "bg-emerald-400" : "bg-slate-400"}`}></div>
                <div>
                  <p className="text-slate-300 text-sm font-medium">System Status</p>
                  <p className="text-sm font-semibold text-white">
                    {Object.values(pumpStatus).some(status => status === "running") ? "Active" : "Idle"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${phLimits.active ? "bg-blue-400" : "bg-slate-400"}`}></div>
                <div>
                  <p className="text-slate-300 text-sm font-medium">pH Monitoring</p>
                  <p className="text-sm font-semibold text-white">
                    {phLimits.active ? `${phLimits.min} - ${phLimits.max}` : "Disabled"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${tdsLimits.active ? "bg-purple-400" : "bg-slate-400"}`}></div>
                <div>
                  <p className="text-slate-300 text-sm font-medium">TDS Monitoring</p>
                  <p className="text-sm font-semibold text-white">
                    {tdsLimits.active ? `${tdsLimits.min} - ${tdsLimits.max} ppm` : "Disabled"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div>
                  <p className="text-slate-300 text-sm font-medium">Pump Duration</p>
                  <p className="text-sm font-semibold text-emerald-400">{duration} seconds</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
  {/* Sensor Limits Panel */}
  <div className="w-full lg:w-1/2">
    <div className="bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 rounded-xl p-6 shadow-lg border border-slate-700/30 backdrop-blur-sm text-white h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Sensor Limits
        </h3>
        <div className="flex items-center bg-slate-800/70 px-3 py-1 rounded-full border border-slate-700/50">
          <div className={`w-2 h-2 rounded-full mr-2 ${phLimits.active || tdsLimits.active ? "bg-blue-400" : "bg-slate-400"}`}></div>
          <span className="text-xs font-medium text-slate-300">
            {phLimits.active || tdsLimits.active ? "Monitoring Active" : "Monitoring Off"}
          </span>
        </div>
      </div>
      
      {/* pH Sensor Limits */}
      <div className="mb-6 bg-slate-800/40 rounded-lg p-5 border border-slate-700/30 hover:border-blue-500/20 transition-colors duration-300">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${phLimits.active ? "bg-blue-400" : "bg-slate-400"}`}></div>
            <span className={`text-sm font-medium ${phLimits.active ? "text-blue-400" : "text-slate-500"}`}>
              pH Sensor
            </span>
          </div>
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={phLimits.active}
                onChange={(e) => handleInputChange("ph", "active", e.target.checked)}
              />
              <div className={`block w-12 h-6 rounded-full ${phLimits.active ? 'bg-blue-500/50' : 'bg-slate-600/30'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${phLimits.active ? 'transform translate-x-6' : ''}`}></div>
            </div>
            <span className="ml-2 text-xs font-medium text-slate-300">{phLimits.active ? 'ON' : 'OFF'}</span>
          </label>
        </div>
        
        {phLimits.active && (
          <>
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Min pH</label>
                <input 
                  type="number" 
                  value={phLimits.min}
                  onChange={(e) => handleInputChange("ph", "min", e.target.value)}
                  min="0" 
                  max="14"
                  step="0.1"
                  className="w-full py-2 px-3 rounded bg-slate-700/50 border border-slate-600/50 text-blue-300 text-sm focus:border-blue-500/50 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-500">When pH drops below this value, base solution (Pump 3) will activate</p>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Max pH</label>
                <input 
                  type="number" 
                  value={phLimits.max}
                  onChange={(e) => handleInputChange("ph", "max", e.target.value)}
                  min="0" 
                  max="14"
                  step="0.1"
                  className="w-full py-2 px-3 rounded bg-slate-700/50 border border-slate-600/50 text-blue-300 text-sm focus:border-blue-500/50 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-500">When pH rises above this value, acid solution (Pump 4) will activate</p>
              </div>
            </div>
            
            {/* pH Range Visualization */}
            <div className="mt-4">
              <div className="h-2 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500 rounded-full"></div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-slate-400">0</span>
                <span className="text-xs text-blue-400">{phLimits.min}</span>
                <span className="text-xs text-blue-400">{phLimits.max}</span>
                <span className="text-xs text-slate-400">14</span>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* TDS Sensor Limits */}
      <div className="mb-6 bg-slate-800/40 rounded-lg p-5 border border-slate-700/30 hover:border-purple-500/20 transition-colors duration-300">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${tdsLimits.active ? "bg-purple-400" : "bg-slate-400"}`}></div>
            <span className={`text-sm font-medium ${tdsLimits.active ? "text-purple-400" : "text-slate-500"}`}>
              TDS Sensor
            </span>
          </div>
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={tdsLimits.active}
                onChange={(e) => handleInputChange("tds", "active", e.target.checked)}
              />
              <div className={`block w-12 h-6 rounded-full ${tdsLimits.active ? 'bg-purple-500/50' : 'bg-slate-600/30'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${tdsLimits.active ? 'transform translate-x-6' : ''}`}></div>
            </div>
            <span className="ml-2 text-xs font-medium text-slate-300">{tdsLimits.active ? 'ON' : 'OFF'}</span>
          </label>
        </div>
        
        {tdsLimits.active && (
          <>
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Min TDS (ppm)</label>
                <input 
                  type="number" 
                  value={tdsLimits.min}
                  onChange={(e) => handleInputChange("tds", "min", e.target.value)}
                  min="0" 
                  max="3000"
                  step="10"
                  className="w-full py-2 px-3 rounded bg-slate-700/50 border border-slate-600/50 text-purple-300 text-sm focus:border-purple-500/50 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-500">When TDS drops below this value, nutrient solution (Pump 1) will activate</p>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Max TDS (ppm)</label>
                <input 
                  type="number" 
                  value={tdsLimits.max}
                  onChange={(e) => handleInputChange("tds", "max", e.target.value)}
                  min="0" 
                  max="3000"
                  step="10"
                  className="w-full py-2 px-3 rounded bg-slate-700/50 border border-slate-600/50 text-purple-300 text-sm focus:border-purple-500/50 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-500">When TDS rises above this value, water (Pump 2) will activate to dilute</p>
              </div>
            </div>
            
            {/* TDS Range Visualization */}
            <div className="mt-4">
              <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-slate-400">0</span>
                <span className="text-xs text-purple-400">{tdsLimits.min}</span>
                <span className="text-xs text-purple-400">{tdsLimits.max}</span>
                <span className="text-xs text-slate-400">3000</span>
              </div>
            </div>
          </>
        )}
      </div>
      {/* Save Button */}
      <div className="flex items-center">
        <button
          onClick={updateSensorLimits}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-2 px-4 rounded-lg shadow-md transition-all duration-300"
        >
          Save Settings
        </button>
        {saveStatus && (
          <span className={`ml-4 text-sm ${saveStatus.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
            {saveStatus}
          </span>
        )}
      </div>
              
              {/* Information Card */}
              <div className="mt-6 bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
                <div className="flex items-start">
                  <div className="text-blue-400 mr-3 text-lg">ℹ️</div>
                  <p className="text-xs text-slate-400">
                    Sensor monitoring automatically prevents pumps from activating when pH or TDS levels are outside the specified ranges.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Pump Controls Panel */}
          <div className="w-full lg:w-1/2">
            <div className="bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 rounded-xl p-6 shadow-lg border border-slate-700/30 backdrop-blur-sm text-white h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                  Pump Controls
                </h3>
                <div className="flex items-center bg-slate-800/70 px-3 py-1 rounded-full border border-slate-700/50">
                  <div className={`w-2 h-2 rounded-full mr-2 ${Object.values(pumpStatus).some(status => status === "running") ? "bg-emerald-400" : "bg-slate-400"}`}></div>
                  <span className="text-xs font-medium text-slate-300">
                    {Object.values(pumpStatus).some(status => status === "running") ? "Pumps Active" : "All Idle"}
                  </span>
                </div>
              </div>
              
              {/* Duration Selector */}
              <div className="mb-8 bg-slate-800/40 rounded-lg p-5 border border-slate-700/30 hover:border-emerald-500/20 transition-colors duration-300">
                <label className="block mb-3 text-slate-300 text-sm font-medium">Duration (seconds):</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    value={duration} 
                    onChange={(e) => setDuration(Number(e.target.value))} 
                    min="1" 
                    max="60"
                    step="1"
                    className="flex-grow h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="w-12 text-center font-bold text-lg text-emerald-400">{duration}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-slate-400">1s</span>
                  <span className="text-xs text-slate-400">30s</span>
                  <span className="text-xs text-slate-400">60s</span>
                </div>
                
                {/* Quick Duration Buttons */}
                <div className="flex gap-2 mt-4">
                  {[5, 10, 30, 60].map((value) => (
                    <button
                      key={value}
                      onClick={() => setDuration(value)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors duration-300 ${
                        duration === value
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                          : "bg-slate-700/50 text-slate-400 border border-slate-600/30 hover:bg-slate-700"
                      }`}
                    >
                      {value}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Individual Pump Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {[1, 2, 3, 4].map((pumpId) => (
                  <div key={pumpId} className={`bg-slate-800/40 rounded-lg p-4 border ${
                    pumpStatus[`pump${pumpId}`] === "running" 
                      ? "border-emerald-500/30" 
                      : "border-slate-700/30 hover:border-slate-600/50"
                  } transition-colors duration-300`}>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${pumpStatus[`pump${pumpId}`] === "running" ? "bg-emerald-400" : "bg-slate-400"}`}></div>
                        <span className={`text-sm font-medium ${getStatusClass(`pump${pumpId}`)}`}>
                          Pump {pumpId}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        pumpStatus[`pump${pumpId}`] === "running" 
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                          : "bg-slate-700/50 text-slate-400 border border-slate-700/30"
                      }`}>
                        {pumpStatus[`pump${pumpId}`] === "running" ? "ACTIVE" : "IDLE"}
                      </span>
                    </div>
                    <button 
                      onClick={() => pumpStatus[`pump${pumpId}`] === "running" ? stopPump(pumpId) : startPump(pumpId)}
                      className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                        pumpStatus[`pump${pumpId}`] === "running" 
                          ? "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30" 
                          : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {pumpStatus[`pump${pumpId}`] === "running" ? "Stop" : "Start"}
                    </button>
                  </div>
                ))}
              </div>

              {/* All Pumps Controls */}
              <div className="grid grid-cols-2 gap-6 mt-8">
                <button 
                  onClick={startAllPumps}
                  className="py-3 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 text-emerald-300 font-medium border border-emerald-500/30 transition-colors duration-300 shadow-lg"
                >
                  Start All
                </button>
                <button 
                  onClick={stopAllPumps}
                  className="py-3 rounded-lg bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 text-red-300 font-medium border border-red-500/30 transition-colors duration-300 shadow-lg"
                >
                  Stop All
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

export default Pump;
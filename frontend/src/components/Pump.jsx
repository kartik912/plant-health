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
  const { isLiveStreaming, liveStreamImage } = props;

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
    <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-20 max-w-md w-full md:w-80">
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl p-6 shadow-lg border border-slate-700/30 backdrop-blur-sm text-white">
        <h3 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
          Pump Controls
        </h3>
        
        {/* Duration Selector */}
        <div className="mb-6">
          <label className="block mb-2 text-slate-300 text-sm font-medium">Duration (seconds):</label>
          <input 
            type="range" 
            value={duration} 
            onChange={(e) => setDuration(Number(e.target.value))} 
            min="1" 
            max="60"
            step="1"
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-slate-400">1s</span>
            <span className="text-sm font-medium text-emerald-400">{duration}s</span>
            <span className="text-xs text-slate-400">60s</span>
          </div>
        </div>

        {/* Individual Pump Controls */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[1, 2, 3, 4].map((pumpId) => (
            <div key={pumpId} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
              <div className="flex justify-between items-center mb-2">
                <span className={`text-sm font-medium ${getStatusClass(`pump${pumpId}`)}`}>
                  Pump {pumpId}
                </span>
                <span className={`text-xs ${pumpStatus[`pump${pumpId}`] === "running" ? "text-emerald-400" : "text-slate-500"}`}>
                  {pumpStatus[`pump${pumpId}`] === "running" ? "ACTIVE" : "IDLE"}
                </span>
              </div>
              <button 
                onClick={() => pumpStatus[`pump${pumpId}`] === "running" ? stopPump(pumpId) : startPump(pumpId)}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-300 ${
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
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={startAllPumps}
            className="py-3 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 text-emerald-300 font-medium border border-emerald-500/30 transition-colors duration-300"
          >
            Start All
          </button>
          <button 
            onClick={stopAllPumps}
            className="py-3 rounded-lg bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 text-red-300 font-medium border border-red-500/30 transition-colors duration-300"
          >
            Stop All
          </button>
        </div>
        
        {/* Status Indicator */}
        <div className="mt-6 pt-4 border-t border-slate-700/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">System Status</span>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${Object.values(pumpStatus).some(status => status === "running") ? "bg-emerald-400" : "bg-slate-400"}`}></div>
              <span className="text-xs font-medium text-slate-300">
                {Object.values(pumpStatus).some(status => status === "running") ? "Pumps Active" : "All Pumps Idle"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pump;
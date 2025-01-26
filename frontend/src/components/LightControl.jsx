import React, { useState } from "react";

const LightControl = () => {
  const [lightStatus, setLightStatus] = useState("OFF");
  const [lightData, setLightData] = useState([]);

  const toggleLight = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/toggle_relay", {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        setLightStatus(data.status);
        fetchLightHistory();
      }
    } catch (error) {
      console.error("Error toggling light:", error);
    }
  };

  const deleteLightHistory = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/delete_all_data", {
        method: "POST",
      });
      if (response.ok) {
        setLightData([]);
      }
    } catch (error) {
      console.error("Error clearing light history:", error);
    }
  };

  return (
    <>
      {/* Light Control Panel */}
      <div className="panel">
        <h2 className="panel-title">Light Control</h2>
        <div className="panel-content">
          <div className={`status-indicator ${lightStatus.toLowerCase()}`}>
            {lightStatus}
          </div>
          <button onClick={toggleLight} className="button toggle-button">
            {lightStatus === "ON" ? "Turn OFF" : "Turn ON"}
          </button>
          <div className="history">
            <div className="history-header">
              <h3>Light History</h3>
              <button
                onClick={deleteLightHistory}
                className="button clear-button"
              >
                Clear History
              </button>
            </div>
            <ul>
              {lightData.length ? (
                lightData.map((data) => (
                  <li key={data.id}>
                    {data.status} at {data.date}
                  </li>
                ))
              ) : (
                <li>No light history available.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default LightControl;

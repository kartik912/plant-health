import { useState, useEffect } from "react";
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
import io from 'socket.io-client/dist/socket.io.js';
import "./SensorDashboard.css";

const SensorDashboard = () => {
  const [lightStatus, setLightStatus] = useState("OFF");
  const [lightData, setLightData] = useState([]);
  const [moistureData, setMoistureData] = useState([]);
  const [currentMoisture, setCurrentMoisture] = useState({ level: 0, state: "" });
  const [temperatureHumidityData, setTemperatureHumidityData] = useState([]);
  const [currentTemperatureHumidity, setCurrentTemperatureHumidity] = useState({
    temperature: 0,
    humidity: 0
  });
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [liveStreamImage, setLiveStreamImage] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://127.0.0.1:5000');
    setSocket(newSocket);

    newSocket.on('camera_frame', (data) => {
      setLiveStreamImage(`data:image/jpeg;base64,${data.image}`);
    });

    return () => newSocket.close();
  }, []);

  const toggleLiveStream = async () => {
    try {
      if (isLiveStreaming) {
        await fetch("http://127.0.0.1:5000/stop_stream", { method: "POST" });
        setIsLiveStreaming(false);
        setLiveStreamImage(null);
      } else {
        await fetch("http://127.0.0.1:5000/start_stream", { method: "POST" });
        setIsLiveStreaming(true);
      }
    } catch (error) {
      console.error("Error toggling live stream:", error);
    }
  };

  const capturePhoto = async () => {
    try {
      setIsCapturing(true);
      const response = await fetch("http://127.0.0.1:5000/capture_photo", {
        method: "POST",
      });
      
      if (response.ok) {
        const photoResponse = await fetch("http://127.0.0.1:5000/get_latest_photo");
        
        if (photoResponse.ok) {
          const blob = await photoResponse.blob();
          const imageUrl = URL.createObjectURL(blob);
          setCapturedPhoto(imageUrl);
        }
      }
    } catch (error) {
      console.error("Error capturing photo:", error);
    } finally {
      setIsCapturing(false);
    }
  };

  const stopCapture = async () => {
    setIsCapturing(false);
    setCapturedPhoto(null);
  };

  useEffect(() => {
    const fetchTemperatureHumidityData = async () => {
      try {
        // Fetch current temperature and humidity
        const currentResponse = await fetch("http://127.0.0.1:5000/get_temperature_humidity");
        const currentData = await currentResponse.json();
        
        setCurrentTemperatureHumidity({
          temperature: currentData.temperature,
          humidity: currentData.humidity
        });

        // Fetch temperature and humidity history
        const historyResponse = await fetch("http://127.0.0.1:5000/get_temperature_humidity_history");
        const historyData = await historyResponse.json();
        
        const formattedData = historyData.temperature_humidity_data.map((item) => ({
          time: new Date(item.date).toLocaleTimeString(),
          temperature: parseFloat(item.temperature),
          humidity: parseFloat(item.humidity)
        }));
        
        setTemperatureHumidityData(formattedData);
      } catch (error) {
        console.error("Error fetching temperature and humidity data:", error);
      }
    };
  
    fetchTemperatureHumidityData(); // Fetch data initially
    const interval = setInterval(fetchTemperatureHumidityData, 5000); // Fetch every 5 seconds
  
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const deleteTemperatureHumidityHistory = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/delete_temperature_humidity_data", {
        method: "POST",
      });
      if (response.ok) {
        setTemperatureHumidityData([]);
      }
    } catch (error) {
      console.error("Error clearing temperature and humidity history:", error);
    }
  };

  useEffect(() => {
    const testBackend = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/test");
        const data = await response.json();
      } catch (error) {
        console.error("Backend test error:", error);
      }
    };
    
    testBackend();
  }, []);

  useEffect(() => {
    const pollMoisture = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/check_moisture");
        const data = await response.json();
        
        setCurrentMoisture({
          level: data.moisture_level,
          state: data.state
        });

        if (data.state === "dry" || data.state === "wet") {
          fetchMoistureData();
        }
      } catch (error) {
        console.error("Error checking moisture:", error);
      }
    };

    const moistureInterval = setInterval(pollMoisture, 500);
    pollMoisture();
    return () => clearInterval(moistureInterval);
  }, []);

  useEffect(() => {
    const pollLightStatus = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/get_relay_status");
        const data = await response.json();
        setLightStatus(data.status);
      } catch (error) {
        console.error("Error fetching light status:", error);
      }
    };

    const lightInterval = setInterval(pollLightStatus, 1000);
    pollLightStatus();
    fetchLightHistory();

    return () => clearInterval(lightInterval);
  }, []);

  const fetchLightHistory = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/get_contacts");
      const data = await response.json();
      setLightData(data.contacts);
    } catch (error) {
      console.error("Error fetching light history:", error);
    }
  };

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

  const deleteMoistureHistory = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/delete_moisture_data", {
        method: "POST",
      });
      if (response.ok) {
        setMoistureData([]);
      }
    } catch (error) {
      console.error("Error clearing moisture history:", error);
    }
  };

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
    <div className="sensor-dashboard">
      <h1 className="title">Plant Care Dashboard</h1>
      <button onClick={downloadPDF} className="button download-button">
        Download PDF
      </button>
      <div id="dashboard-content" className="dashboard-grid">
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
                <button onClick={deleteLightHistory} className="button clear-button">
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
        {/* Photo and live stream panel */}
        <div className="panel">
          <h2 className="panel-title">Plant Camera</h2>
          <div className="panel-content">
            <div className="camera-controls">
              <button 
                onClick={capturePhoto} 
                disabled={isCapturing || isLiveStreaming}
                className="button capture-button"
              >
                Capture Photo
              </button>
              {isCapturing && (
                <button 
                  onClick={stopCapture} 
                  className="button stop-button"
                >
                  Stop Capture
                </button>
              )}
              <button 
                onClick={toggleLiveStream} 
                className={`button ${isLiveStreaming ? 'stop-stream' : 'start-stream'}`}
              >
                {isLiveStreaming ? 'Stop Live Feed' : 'Start Live Feed'}
              </button>
            </div>

            {capturedPhoto && (
              <div className="photo-display">
                <img 
                  src={capturedPhoto} 
                  alt="Captured Plant" 
                  style={{ maxWidth: '100%', height: 'auto' }} 
                />
              </div>
            )}

            {isLiveStreaming && liveStreamImage && (
              <div className="live-stream-display">
                <img 
                  src={liveStreamImage} 
                  alt="Live Plant Feed" 
                  style={{ maxWidth: '100%', height: 'auto' }} 
                />
              </div>
            )}
          </div>
        </div>

        {/* Temperature and Humidity Panel */}
        <div className="panel">
          <h2 className="panel-title">Temperature & Humidity</h2>
          <div className="panel-content">
            <div className="sensor-readings">
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
            <div className="history">
              <div className="history-header">
                <h3>Temperature & Humidity History</h3>
                <button
                  onClick={deleteTemperatureHumidityHistory}
                  className="button clear-button"
                >
                  Clear History
                </button>
              </div>
              <ul>
                {temperatureHumidityData.length ? (
                  temperatureHumidityData.map((data, index) => (
                    <li key={index}>
                      Temp: {data.temperature}°C, Humidity: {data.humidity}% at {data.time}
                    </li>
                  ))
                ) : (
                  <li>No temperature and humidity history available.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorDashboard;
import React, { useEffect, useState } from 'react'

const History = () => {

  
  const [temperatureHumidityData, setTemperatureHumidityData] = useState([]);
  const [moistureData, setMoistureData] = useState([]);
  
  
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

  const deleteMoistureHistory = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/delete_moisture_data",
        {
          method: "POST",
        }
      );
      if (response.ok) {
        setMoistureData([]);
      }
    } catch (error) {
      console.error("Error clearing moisture history:", error);
    }
  };


  
  useEffect(() => {
    const fetchTemperatureHumidityData = async () => {
      try {
        // Fetch current temperature and humidity
        // const currentResponse = await fetch("http://127.0.0.1:5000/get_temperature_humidity");
        // const currentData = await currentResponse.json();
        
        // setCurrentTemperatureHumidity({
        //   temperature: currentData.temperature,
        //   humidity: currentData.humidity
        // });

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
      <div className="panel overflow-hidden md:min-w-[80%] flex items-center flex-col">
        <h2 className="panel-title">History</h2>
        <div className="grid grid-cols-2 gap-4 w-[100%]">
          <div className="temperature-history history">
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
                      Temp: {data.temperature}°C, Humidity: {data.humidity}% at{" "}
                      {data.time}
                    </li>
                  ))
                ) : (
                  <li>No temperature and humidity history available.</li>
                )}
              </ul>
          </div>

          <div className="moisture-history history">
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
  );
}

export default History
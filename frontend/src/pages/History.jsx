import React, { useEffect, useState } from 'react'
import { capitalizeFirstLetter } from '../hooks/capitalize';

const History = () => {

  
  const [temperatureHumidityData, setTemperatureHumidityData] = useState([]);
  const [moistureData, setMoistureData] = useState([]);
  const [change, setChange] = useState(false)
  
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
    // const interval = setInterval(fetchTemperatureHumidityData, 5000); // Fetch every 5 seconds
  
    // return () => clearInterval(interval); // Cleanup on unmount
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
    // const interval = setInterval(fetchMoistureData, 5000); // Fetch every 5 seconds
  
    // return () => clearInterval(interval); // Cleanup on unmount
  }, []);
  
  
  return (
      <div className="History panel overflow-hidden w-[90%] max-h-[80%] mt-20 md:mt-0 flex items-center flex-col">
        <h2 className="panel-title">History</h2>
        <div className="grid md:grid-cols-2 gap-4 w-[100%] overflow-y-scroll ">
          <div className="temperature-history hist flex flex-col items-center border-2 p-2 rounded-xl">
              <div className="flex flex-col w-full">
                <h3 className="text-xl font-semibold mb-2 text-center">Temperature & Humidity History</h3>
                <button
                  onClick={deleteTemperatureHumidityHistory}
                  className="button clear-button mb-2 "
                >
                  Clear History
                </button>
              </div>
              <ul className="text-center w-[80%] ">
                {temperatureHumidityData.length ? (
                  temperatureHumidityData.map((data, index) => (
                    <li key={index} className='mb-1 text-1xl border-b-2 pb-2'>
                      Temperature: {data.temperature}°C and Humidity: {data.humidity}% at{" "}
                      {data.time}
                    </li>
                  ))
                ) : (
                  <li>No temperature and humidity history available.</li>
                )}
              </ul>
          </div>

          <div className="moisture-history hist flex flex-col items-center border-2 p-2 rounded-xl">
            <div className="flex flex-col w-full">
              <h3 className="text-xl font-semibold mb-2 text-center">Moisture History</h3>
              <button
                onClick={deleteMoistureHistory}
                className="button clear-button mb-2"
              >
                Clear History
              </button>
            </div>
            <ul className="text-center w-[80%]  ">
              {moistureData.length ? (
                moistureData.map((data, index) => (
                  <li key={index} className='mb-1 text-1xl border-b-2 pb-2'>
                    {capitalizeFirstLetter(data.state)} - {data.level} at {data.time}
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
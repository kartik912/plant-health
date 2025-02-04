import React, { useState } from "react";

const LightControl = (props) => {
  const [lightStatus, setLightStatus] = useState("OFF");
  const [lightData, setLightData] = useState([]);

  const {isLiveStreaming, liveStreamImage} = props;
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

  return (
    <>
      {/* Light Control Panel */}
      <div className={`absolute ${ isLiveStreaming && liveStreamImage ? "top-[20%]" : "top-[30%]"} md:left-[85%] z-20`}>
        <div className="panel-content items-center">
          {/* <div className={`status-indicator ${lightStatus.toLowerCase()}`}>
            {lightStatus}
          </div> */}
          <button onClick={toggleLight} className={`status-indicator ${lightStatus.toLowerCase()} w-[5rem] h-[5rem] rounded-full shrink-0 grow-0 text-white cursor-pointer border-none toggle-button font-semibold`}>
            {lightStatus === "ON" ? "Turn OFF" : "Turn ON"}
          </button>
          
        </div>
      </div>
    </>
  );
};

export default LightControl;

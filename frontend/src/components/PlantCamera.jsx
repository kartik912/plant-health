import React, { useEffect, useState } from "react";
import img1 from "/src/photo_20250124_072811.jpg";
import io from 'socket.io-client/dist/socket.io.js';
import LightControl from "./LightControl";

const PlantCamera = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [liveStreamImage, setLiveStreamImage] = useState(null);
  const [socket, setSocket] = useState(null);

  const capturePhoto = async () => {
    try {
      setIsCapturing(true);
      const response = await fetch("http://127.0.0.1:5000/capture_photo", {
        method: "POST",
      });

      if (response.ok) {
        const photoResponse = await fetch(
          "http://127.0.0.1:5000/get_latest_photo"
        );

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

  
  // useEffect(() => {
  //   const newSocket = io('http://127.0.0.1:5000');
  //   setSocket(newSocket);

  //   newSocket.on('camera_frame', (data) => {
  //     setLiveStreamImage(`data:image/jpeg;base64,${data.image}`);
  //   });

  //   return () => newSocket.close();
  // }, []);


  return (
    <div className="flex max-w-[80%] items-center justify-center flex-col-reverse md:flex-row gap-4">
      {/* Photo and live stream panel */}
      <div className="panel overflow-hidden  flex items-center flex-col">
        <h2 className="panel-title">Plant Camera</h2>
        <div className="panel-content flex flex-col gap-10 overflow-hidden m-4">
          <div className="camera-controls flex justify-center gap-2">
            {!isCapturing && (
            <button
              onClick={capturePhoto}
              disabled={isCapturing || isLiveStreaming}
              className="button capture-button"
            >
              Capture Photo
            </button>
            )}
            {isCapturing && (
              <button onClick={stopCapture} className="button stop-button">
                Stop Capture
              </button>
            )}
            <button
              onClick={toggleLiveStream}
              className={`button ${
                isLiveStreaming ? "stop-stream" : "start-stream"
              }`}
            >
              {isLiveStreaming ? "Stop Live Feed" : "Start Live Feed"}
            </button>
          </div>

          {!capturedPhoto && (
            <div className="photo-display">
              <img
                // src={capturedPhoto}
                src={img1}
                alt="Captured Plant"
                className="md:max-w-[800px]"
              />
            </div>
          )}

          {isLiveStreaming && liveStreamImage && (
            <div className="live-stream-display flex flex-col items-center justify-center z-10 fixed left-0 top-0 bg-[rgba(0,0,0,0.9)] w-[100vw] h-[100vh]">
              
              <img
                // src={liveStreamImage}
                src={img1}
                alt="Live Plant Feed"
                className="max-w-[80%] max-h-[80%]"
              />
              <button
              onClick={toggleLiveStream}
              className="button stop-stream mt-4"
              >Stop Live Feed</button>
            </div>
          )}
        </div>
      </div>
      <LightControl isLiveStreaming={isLiveStreaming} liveStreamImage={liveStreamImage}/>
    </div>
  );
};

export default PlantCamera;

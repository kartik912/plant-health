import React, { useState } from "react";

const PlantCamera = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [liveStreamImage, setLiveStreamImage] = useState(null);

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

  return (
    <>
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

          {capturedPhoto && (
            <div className="photo-display">
              <img
                src={capturedPhoto}
                alt="Captured Plant"
                style={{ maxWidth: "100%", height: "auto" }}
              />
            </div>
          )}

          {isLiveStreaming && liveStreamImage && (
            <div className="live-stream-display">
              <img
                src={liveStreamImage}
                alt="Live Plant Feed"
                style={{ maxWidth: "100%", height: "auto" }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PlantCamera;

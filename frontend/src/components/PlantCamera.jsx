import React, { useState, useEffect } from 'react';
import { Camera, Square, Lightbulb } from 'lucide-react';
import { io } from "socket.io-client";

const PlantCamera = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [liveStreamFrame, setLiveStreamFrame] = useState(null);
  const [lightStatus, setLightStatus] = useState('OFF');

  useEffect(() => {
    // Initial fetch of light status
    fetchLightStatus();

    let socket;
    if (isLiveStreaming) {
      socket = io('https://api.hydrophonic.site', {
        transports: ['websocket'],
        reconnectionAttempts: 5
      });

      socket.on('connect', () => {
        console.log('Connected to server');
      });

      socket.on('camera_frame', (data) => {
        setLiveStreamFrame(`data:image/jpeg;base64,${data.image}`);
      });

      socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isLiveStreaming]);

  const fetchLightStatus = async () => {
    try {
      const response = await fetch('https://api.hydrophonic.site/get_relay_status');
      if (response.ok) {
        const data = await response.json();
        setLightStatus(data.status);
      }
    } catch (error) {
      console.error('Error fetching light status:', error);
    }
  };

  const toggleLight = async () => {
    try {
      const response = await fetch('https://api.hydrophonic.site/toggle_relay', {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setLightStatus(data.status);
      }
    } catch (error) {
      console.error('Error toggling light:', error);
    }
  };

  const capturePhoto = async () => {
    try {
      setIsCapturing(true);
      const response = await fetch('https://api.hydrophonic.site/capture_photo', {
        method: 'POST',
      });

      if (response.ok) {
        const photoResponse = await fetch('https://api.hydrophonic.site/get_latest_photo');
        if (photoResponse.ok) {
          const blob = await photoResponse.blob();
          const imageUrl = URL.createObjectURL(blob);
          setCapturedPhoto(imageUrl);
        }
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleLiveStream = async () => {
    try {
      if (isLiveStreaming) {
        await fetch('https://api.hydrophonic.site/stop_stream', { method: 'POST' });
        setIsLiveStreaming(false);
        setLiveStreamFrame(null);
      } else {
        await fetch('https://api.hydrophonic.site/start_stream', { method: 'POST' });
        setIsLiveStreaming(true);
      }
    } catch (error) {
      console.error('Error toggling live stream:', error);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="rounded-lg bg-slate-900 border border-slate-700 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            Plant Camera Monitor
          </h2>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={capturePhoto}
              disabled={isCapturing || isLiveStreaming}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-5 h-5" />
              {isCapturing ? 'Capturing...' : 'Capture Photo'}
            </button>

            <button
              onClick={toggleLiveStream}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg ${
                isLiveStreaming
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-cyan-600 hover:bg-cyan-700'
              } text-white font-medium transition-all duration-300`}
            >
              {isLiveStreaming ? (
                <>
                  <Square className="w-5 h-5" />
                  Stop Live Feed
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  Start Live Feed
                </>
              )}
            </button>

            <button
              onClick={toggleLight}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg ${
                lightStatus === 'ON'
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : 'bg-gray-600 hover:bg-gray-700'
              } text-white font-medium transition-all duration-300`}
            >
              <Lightbulb className="w-5 h-5" />
              Light: {lightStatus}
            </button>
          </div>

          {/* Image Display */}
          <div className="relative rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
            {capturedPhoto && !isLiveStreaming ? (
              <img
                src={capturedPhoto}
                alt="Captured Plant"
                className="w-full h-96 object-contain"
              />
            ) : (
              <div className="w-full h-96 flex items-center justify-center text-slate-400">
                {isLiveStreaming ? (
                  <img
                    src={liveStreamFrame}
                    alt="Live Plant Feed"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  "No image captured"
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Stream Modal */}
      {isLiveStreaming && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl space-y-4">
            <div className="relative bg-slate-800 rounded-lg overflow-hidden">
              {liveStreamFrame ? (
                <img
                  src={liveStreamFrame}
                  alt="Live Plant Feed"
                  className="w-full h-64 object-contain"
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center text-white">
                  Connecting to live stream...
                </div>
              )}
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={toggleLiveStream}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-all duration-300"
              >
                <Square className="w-5 h-5" />
                Stop Live Feed
              </button>
              <button
                onClick={toggleLight}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg ${
                  lightStatus === 'ON'
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : 'bg-gray-600 hover:bg-gray-700'
                } text-white font-medium transition-all duration-300`}
              >
                <Lightbulb className="w-5 h-5" />
                Light: {lightStatus}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantCamera;
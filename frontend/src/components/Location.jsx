import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
const L = window.L;
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export const LocationMap = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/get-location');
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
        } else {
          setLocation(data);
        }
      } catch (err) {
        setError('Failed to fetch location data');
      }
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl shadow-lg border border-slate-700/30 backdrop-blur-sm overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">System Location</h2>
        
        {location ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-slate-300">
              <div>
                <p className="text-sm text-slate-400">IP Address</p>
                <p className="font-medium">{location.ip}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Location</p>
                <p className="font-medium">{`${location.city}, ${location.region}, ${location.country}`}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">ISP</p>
                <p className="font-medium">{location.isp}</p>
              </div>
            </div>
            
            <div className="w-full h-64 rounded-lg overflow-hidden border border-slate-700">
              <MapContainer 
                center={[location.lat, location.lon]} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[location.lat, location.lon]}>
                  <Popup>
                    System Location<br />
                    {location.city}, {location.region}
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-slate-400">Loading location data...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationMap;
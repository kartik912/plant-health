import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiExternalLink, HiMenu, HiX } from "react-icons/hi";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [locationData, setLocationData] = useState({ state: "", country: "" });
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Fetch location from Flask API
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/get-location");
        if (!response.ok) {
          throw new Error("Failed to fetch location");
        }
        const data = await response.json();
        setLocationData({ state: data.city, country: data.country });
      } catch (error) {
        console.error("Error fetching location:", error);
      }
    };

    fetchLocation();
  }, []);

  const navigationLinks = [
    { to: "/dashboard", text: "Dashboard" },
    { to: "/camera", text: "Camera" },
    { to: "/temp", text: "Temperature" },
    { to: "/moist", text: "Moisture" },
    { to: "/tds", text: "TDS" },
    { to: "/ph", text: "PH Level" },
    { to: "/history", text: "History" },
    { to: "/pump", text: "Pump" }
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-slate-800 border-b border-slate-700/30 z-30 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
          Plant Care
        </h1>
        <button
          onClick={toggleMenu}
          className="text-slate-200 hover:text-white p-2"
        >
          {isOpen ? (
            <HiX className="h-6 w-6" />
          ) : (
            <HiMenu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <div className={`fixed top-0 left-0 h-full flex flex-col items-center bg-gradient-to-b from-slate-800 to-slate-900 w-full md:w-[20vw] md:min-w-[250px] border-r border-slate-700/30 shadow-lg z-20 overflow-y-auto transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Logo and Title */}
        <div className="w-full text-center p-6 border-b border-slate-700/30 hidden md:block">
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            Plant Care
          </h1>
        </div>

        {/* Display Location */}
        <div className="text-center text-slate-300 mt-2 text-sm">
          📍 {locationData.state}, {locationData.country}
        </div>

        {/* Navigation Links */}
        <div className="w-full px-4 py-8 flex md:flex-col flex-wrap justify-center gap-1 mt-4 md:mt-0">
          {navigationLinks.map((link) => (
            <Link 
              key={link.to}
              to={link.to} 
              onClick={() => setIsOpen(false)}
              className={`w-full font-medium px-4 py-3 my-1 rounded-lg flex items-center transition-all duration-300 text-slate-200 hover:text-white hover:bg-slate-800/50 ${
                location.pathname === link.to ? 'bg-slate-800/50 text-white' : ''
              }`}
            >
              <HiExternalLink className="mr-3 text-xl text-slate-400" />
              {link.text}
            </Link>
          ))}
        </div>

        {/* Bottom decorative gradient */}
        <div className="mt-auto w-full h-px bg-gradient-to-r from-transparent via-slate-600/20 to-transparent"></div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default NavBar;

import React from 'react';
import { Link } from 'react-router-dom';
import { HiExternalLink } from "react-icons/hi";

const NavBar = () => {
  return (
    <div className="fixed top-0 left-0 h-full flex flex-col items-center bg-gradient-to-b from-slate-800 to-slate-900 w-full md:w-[20vw] md:min-w-[250px] border-r border-slate-700/30 shadow-lg z-10 overflow-y-auto">
      {/* Logo and Title */}
      <div className="w-full text-center p-6 border-b border-slate-700/30">
        <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
          Plant Care
          <br />
          Dashboard
        </h1>
      </div>
      
      {/* Navigation Links */}
      <div className="w-full px-4 py-8 flex md:flex-col flex-wrap justify-center gap-1">
        <Link 
          to="/dashboard" 
          className="w-full font-medium px-4 py-3 my-1 rounded-lg flex items-center transition-all duration-300 text-slate-200 hover:text-white hover:bg-slate-800/50"
        >
          <HiExternalLink className="mr-3 text-xl text-slate-400" />
          Dashboard
        </Link>
        <Link 
          to="/camera" 
          className="w-full font-medium px-4 py-3 my-1 rounded-lg flex items-center transition-all duration-300 text-slate-200 hover:text-white hover:bg-slate-800/50"
        >
          <HiExternalLink className="mr-3 text-xl text-slate-400" />
          Camera
        </Link>
        <Link 
          to="/temp" 
          className="w-full font-medium px-4 py-3 my-1 rounded-lg flex items-center transition-all duration-300 text-slate-200 hover:text-white hover:bg-slate-800/50"
        >
          <HiExternalLink className="mr-3 text-xl text-slate-400" />
          Temperature
        </Link>
        <Link 
          to="/moist" 
          className="w-full font-medium px-4 py-3 my-1 rounded-lg flex items-center transition-all duration-300 text-slate-200 hover:text-white hover:bg-slate-800/50"
        >
          <HiExternalLink className="mr-3 text-xl text-slate-400" />
          Moisture
        </Link>
        <Link 
          to="/tds" 
          className="w-full font-medium px-4 py-3 my-1 rounded-lg flex items-center transition-all duration-300 text-slate-200 hover:text-white hover:bg-slate-800/50"
        >
          <HiExternalLink className="mr-3 text-xl text-slate-400" />
          TDS
        </Link>
        <Link 
          to="/ph" 
          className="w-full font-medium px-4 py-3 my-1 rounded-lg flex items-center transition-all duration-300 text-slate-200 hover:text-white hover:bg-slate-800/50"
        >
          <HiExternalLink className="mr-3 text-xl text-slate-400" />
          PH Level
        </Link>
        <Link 
          to="/history" 
          className="w-full font-medium px-4 py-3 my-1 rounded-lg flex items-center transition-all duration-300 text-slate-200 hover:text-white hover:bg-slate-800/50"
        >
          <HiExternalLink className="mr-3 text-xl text-slate-400" />
          History
        </Link>
      </div>
      
      {/* Bottom decorative gradient */}
      <div className="mt-auto w-full h-px bg-gradient-to-r from-transparent via-slate-600/20 to-transparent"></div>
    </div>
  );
};

export default NavBar;
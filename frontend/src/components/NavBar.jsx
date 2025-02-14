import React from 'react'
import { Link } from 'react-router-dom'
import { HiExternalLink } from "react-icons/hi";
const NavBar = () => {

  return (
    <div className={`flex flex-col items-center bg-[#27667B] w-[100%]  md:min-w-[20vw] md:h-full `}>
        <div className="left text-center p-4">
            <h1 className='mt-7 text-2xl md:text-3xl font-bold text-white'>Plant Care <br /> DashBoard</h1>
        </div>
        <div className="right md:mt-5 gap-3 flex md:flex-col text-center md:text-xl flex-wrap justify-center text-white">
            <Link to="/" className='font-semibold mb-4 flex items-center md:gap-2'><HiExternalLink /> Camera</Link>
            <Link to="/temp" className='font-semibold mb-4 flex items-center md:gap-2'><HiExternalLink /> Temperature</Link>
            <Link to="/moist" className='font-semibold mb-4 flex items-center md:gap-2'><HiExternalLink /> Moisture</Link>
            <Link to="/tds" className='font-semibold mb-4 flex items-center md:gap-2'><HiExternalLink /> TDS</Link>
            <Link to="/ph" className='font-semibold mb-4 flex items-center md:gap-2'><HiExternalLink /> PH Level</Link>
            <Link to="/dashboard" className='font-semibold mb-4 flex items-center md:gap-2'><HiExternalLink /> Dashboard</Link>
            <Link to="/history" className='font-semibold mb-4 flex items-center md:gap-2'><HiExternalLink /> History</Link>
        </div>
    </div>
  )
}

export default NavBar
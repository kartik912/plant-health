import React from 'react'
import { Link } from 'react-router-dom'
import { HiExternalLink } from "react-icons/hi";
const NavBar = () => {
  let toggle = false;
  return (
    <div className='flex flex-col items-center bg-green-300 md:fixed  md:w-[25vw] md:h-full md:rounded-xl'>
        <div className="left">
            <h1 className='mt-7 text-2xl md:text-3xl font-bold'>Plant Care DashBoard</h1>
        </div>
        <div className="right mt-8 mb-4 gap-3 flex md:flex-col text-center md:text-xl">
            <Link to="/" className='font-semibold mb-4 flex items-center gap-2'><HiExternalLink /> Camera</Link>
            <Link to="/temp" className='font-semibold mb-4 flex items-center gap-2'><HiExternalLink /> Temperature</Link>
            <Link to="/moist" className='font-semibold mb-4 flex items-center gap-2'><HiExternalLink /> Moisture</Link>
            <Link to="/history" className='font-semibold mb-4 flex items-center gap-2'><HiExternalLink /> History</Link>
        </div>
    </div>
  )
}

export default NavBar
import React from 'react'
import { Link } from 'react-router-dom'
import { HiExternalLink } from "react-icons/hi";
const NavBar = () => {

  return (
    <div className='flex flex-col items-center bg-green-300 w-[100%] h-[25vh] md:min-w-[20vw] md:h-full md:rounded-xl'>
        <div className="left text-center p-4">
            <h1 className='mt-7 text-2xl md:text-3xl font-bold'>Plant Care <br /> DashBoard</h1>
        </div>
        <div className="right md:mt-5 gap-3 flex md:flex-col text-center md:text-xl">
            <Link to="/" className='font-semibold mb-4 flex items-center md:gap-2'><HiExternalLink /> Camera</Link>
            <Link to="/temp" className='font-semibold mb-4 flex items-center md:gap-2'><HiExternalLink /> Temperature</Link>
            <Link to="/moist" className='font-semibold mb-4 flex items-center md:gap-2'><HiExternalLink /> Moisture</Link>
            <Link to="/history" className='font-semibold mb-4 flex items-center md:gap-2'><HiExternalLink /> History</Link>
        </div>
    </div>
  )
}

export default NavBar
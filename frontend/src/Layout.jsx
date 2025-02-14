import React from 'react'
import PlantCamera from './components/PlantCamera'
import LightControl from './components/LightControl'
import MoistureSensor from './components/MoistureSensor'
import Temperature from './components/Temperature'
import TDS from './components/TDS'
import Dashboard from './components/Dashboard'
const Layout = () => {
  return (
    <>
        <PlantCamera/>
        <LightControl/>
        <MoistureSensor/>
        <Temperature/>
        <TDS/>
        <Dashboard/>
    </>
  )
}

export default Layout
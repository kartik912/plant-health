import React from 'react'
import PlantCamera from './components/PlantCamera'
import LightControl from './components/LightControl'
import MoistureSensor from './components/MoistureSensor'
import Temperature from './components/Temperature'

const Layout = () => {
  return (
    <>
        <PlantCamera/>
        <LightControl/>
        <MoistureSensor/>
        <Temperature/>
    </>
  )
}

export default Layout
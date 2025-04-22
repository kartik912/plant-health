import React, { useState, useEffect } from 'react';
import { HiInformationCircle } from 'react-icons/hi';

const PlantPresets = () => {
  const [isAutomatic, setIsAutomatic] = useState(false);
  const [plantStatus, setPlantStatus] = useState({
    plant_name: '',
    plant_stage: '',
    state: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const url = import.meta.env.VITE_API_URL;

  // Plant catalog with EC and pH ranges for different stages
  const plantCatalog = [
    {
      name: 'Lettuce',
      stages: {
        germination: { ec: { min: 0.8, max: 1.2 }, ph: { min: 6.0, max: 6.5 } },
        vegetative: { ec: { min: 1.0, max: 1.4 }, ph: { min: 5.8, max: 6.3 } }
      },
      image: 'plant-health/frontend/src/images/lettuce.jpg'  // Changed to relative path
    },
    {
      name: 'Tomato',
      stages: {
        germination: { ec: { min: 1.5, max: 2.0 }, ph: { min: 5.8, max: 6.3 } },
        vegetative: { ec: { min: 2.0, max: 3.5 }, ph: { min: 5.5, max: 6.5 } }
      },
      image: '/images/strawberry.png'  // Changed to relative path and fixed typo
    }
  ];

  // Fetch current plant status from backend
  useEffect(() => {
    const fetchPlantStatus = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${url}/get_plant_status`);
        if (!response.ok) {
          throw new Error('Failed to fetch plant status');
        }
        const data = await response.json();
        setPlantStatus(data);
        setIsAutomatic(data.state);
      } catch (error) {
        console.error('Error fetching plant status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlantStatus();
  }, [url]);

  // Toggle between automatic and manual mode
  const toggleMode = async () => {
    try {
      const response = await fetch(`${url}/update_plant_status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state: !isAutomatic }),
      });

      if (!response.ok) {
        throw new Error('Failed to update mode');
      }

      setIsAutomatic(!isAutomatic);
      // Update the local state to reflect changes
      setPlantStatus(prev => ({ ...prev, state: !isAutomatic }));
    } catch (error) {
      console.error('Error updating mode:', error);
    }
  };

  // Set active plant
  const setActivePlant = async (plantName) => {
    try {
      const response = await fetch(`${url}/set_active_plant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plant_name: plantName }),
      });

      if (!response.ok) {
        throw new Error('Failed to set active plant');
      }

      const data = await response.json();
      setPlantStatus(data);
    } catch (error) {
      console.error('Error setting active plant:', error);
    }
  };

  return (
    <div className="pt-14 md:pt-0 md:pl-[3vw] min-h-screen bg-slate-900 text-slate-200 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            Plant Presets
          </h1>
          <p className="text-slate-400 mt-2">
            Configure automated controls based on plant needs and growth stages
          </p>
        </div>
        
        {/* Mode Toggle */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8 shadow-lg border border-slate-700/30">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Control Mode</h2>
              <p className="text-slate-400 text-sm mt-1">Switch between automatic and manual control</p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <div className="flex items-center">
                <span className={`mr-3 ${!isAutomatic ? 'text-white font-medium' : 'text-slate-400'}`}>
                  Manual
                </span>
                <div 
                  onClick={toggleMode}
                  className={`w-16 h-8 flex items-center rounded-full p-1 cursor-pointer ${
                    isAutomatic ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
                      isAutomatic ? 'translate-x-8' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className={`ml-3 ${isAutomatic ? 'text-white font-medium' : 'text-slate-400'}`}>
                  Automatic
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Current Plant Status */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8 shadow-lg border border-slate-700/30">
          <h2 className="text-xl font-semibold text-slate-100">Current Plant Status</h2>
          {isLoading ? (
            <div className="text-slate-400 mt-4">Loading...</div>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <p className="text-slate-400 text-sm">Plant Name</p>
                <p className="text-lg font-medium text-white">{plantStatus.plant_name || 'None selected'}</p>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <p className="text-slate-400 text-sm">Growth Stage</p>
                <p className="text-lg font-medium text-white">{plantStatus.plant_stage || 'Unknown'}</p>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <p className="text-slate-400 text-sm">Control Mode</p>
                <p className="text-lg font-medium text-white">{plantStatus.state ? 'Automatic' : 'Manual'}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Plant Catalog */}
        <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700/30">
          <h2 className="text-xl font-semibold text-slate-100 mb-6">Plant Catalog</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plantCatalog.map((plant) => (
              <div key={plant.name} className="bg-slate-700/30 rounded-lg overflow-hidden border border-slate-600/30">
                <div className="w-full h-48 relative">
                  <img 
                    src={plant.image} 
                    alt={plant.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/api/placeholder/400/320";
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-white mb-3">{plant.name}</h3>
                  
                  {/* Germination Stage */}
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <span className="text-emerald-400 font-medium">Germination Stage</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-slate-800/80 p-2 rounded">
                        <span className="text-slate-400">EC Range:</span>
                        <p className="text-white">{plant.stages.germination.ec.min} - {plant.stages.germination.ec.max} mS/cm</p>
                      </div>
                      <div className="bg-slate-800/80 p-2 rounded">
                        <span className="text-slate-400">pH Range:</span>
                        <p className="text-white">{plant.stages.germination.ph.min} - {plant.stages.germination.ph.max}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Vegetative Stage */}
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <span className="text-emerald-400 font-medium">Vegetative Stage</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-slate-800/80 p-2 rounded">
                        <span className="text-slate-400">EC Range:</span>
                        <p className="text-white">{plant.stages.vegetative.ec.min} - {plant.stages.vegetative.ec.max} mS/cm</p>
                      </div>
                      <div className="bg-slate-800/80 p-2 rounded">
                        <span className="text-slate-400">pH Range:</span>
                        <p className="text-white">{plant.stages.vegetative.ph.min} - {plant.stages.vegetative.ph.max}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setActivePlant(plant.name)}
                    disabled={!isAutomatic}
                    className={`w-full py-2 rounded-lg mt-2 transition-all duration-300 ${
                      !isAutomatic 
                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600'
                    }`}
                  >
                    Set as Active Plant
                  </button>
                  
                  {!isAutomatic && (
                    <div className="flex items-center mt-2 text-amber-400 text-sm">
                      <HiInformationCircle className="mr-1" />
                      <span>Disabled in manual mode</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantPresets;
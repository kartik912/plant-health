import React, { useState, useEffect } from "react";

const PlantPresets = () => {
  // Plant presets with EC and pH ranges for different growth stages
  const plantPresets = [
    {
      id: 1,
      name: "Lettuce",
      image: "src/images/lettuce.PNG",
      stages: [
        {
          id: "seedling",
          name: "Seedling",
          ec: { min: 0.8, max: 1.2 },
          ph: { min: 5.0, max: 6.0 },
          description: "From seed germination until first true leaves appear"
        },
        {
          id: "growth",
          name: "Growth",
          ec: { min: 1.5, max: 2.5 },
          ph: { min: 5.0, max: 6.0 },
          description: "From true leaves until harvest"
        }
      ],
      description: "Leafy green vegetable that grows quickly in hydroponic systems."
    },
    {
      id: 2,
      name: "Strawberry",
      image: "src/images/strawberrry.PNG",
      stages: [
        {
          id: "seedling",
          name: "Seedling",
          ec: { min: 0.8, max: 1.2 },
          ph: { min: 5.0, max: 6.0 },
          description: "From planting until first true leaves develop"
        },
        {
          id: "growth",
          name: "Growth",
          ec: { min: 1.7, max: 2.2 },
          ph: { min: 5.0, max: 6.0 },
          description: "From leaf development through flowering and fruiting"
        }
      ],
      description: "Sweet berries that thrive in slightly acidic conditions."
    }
  ];

  // Current sensor states
  const [phLimits, setPhLimits] = useState({
    min: 5.5,
    max: 7.5,
    active: true
  });
  
  const [tdsLimits, setTdsLimits] = useState({
    min: 1,
    max: 3,
    active: true
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);
  const url = import.meta.env.VITE_API_URL;

  // Fetch current limits on component mount
  useEffect(() => {
    fetchLimits();
  }, []);

  const fetchLimits = async () => {
    try {
      const response = await fetch(`${url}/sensor/limits`);
      if (response.ok) {
        const data = await response.json();
        if (data.ph) {
          setPhLimits(data.ph);
        }
        if (data.tds) {
          setTdsLimits(data.tds);
        }
      }
    } catch (error) {
      console.error("Error fetching sensor limits:", error);
    }
  };

  // Apply plant preset to sensor limits
  const applyPlantPreset = async (plant, stageIndex) => {
    const stage = plant.stages[stageIndex];
    setSelectedPlant(plant.id);
    setSelectedStage(`${plant.id}-${stage.id}`);
    
    // Update local state first for immediate UI feedback
    setPhLimits({
      ...phLimits,
      min: stage.ph.min,
      max: stage.ph.max,
      active: true
    });
    
    setTdsLimits({
      ...tdsLimits,
      min: stage.ec.min,
      max: stage.ec.max,
      active: true
    });

    try {
      // Send updates to API
      const response = await fetch(`${url}/sensor/limits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          ph: {
            min: stage.ph.min,
            max: stage.ph.max,
            active: true
          },
          tds: {
            min: stage.ec.min,
            max: stage.ec.max,
            active: true
          }
        }),
      });
      
      if (response.ok) {
        setSuccessMessage(`Applied ${plant.name} - ${stage.name} preset successfully!`);
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      }
    } catch (error) {
      console.error("Error updating sensor limits:", error);
    }
  };

  return (
    <div className="w-full min-h-screen py-6 px-4 md:px-6 lg:px-8 md:pt-6">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 mt-12 md:mt-2">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Plant Presets</h2>
          <p className="text-slate-400 mt-2">Optimize your hydroponic system for specific plants and growth stages</p>
          
          {/* Current Settings Overview */}
          <div className="mt-6 bg-gradient-to-r from-slate-800/80 to-slate-900/80 rounded-xl p-4 border border-slate-700/30 shadow-lg">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${phLimits.active ? "bg-blue-400" : "bg-slate-400"}`}></div>
                <div>
                  <p className="text-slate-300 text-sm font-medium">Current pH Range</p>
                  <p className="text-sm font-semibold text-white">
                    {phLimits.min.toFixed(1)} - {phLimits.max.toFixed(1)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${tdsLimits.active ? "bg-purple-400" : "bg-slate-400"}`}></div>
                <div>
                  <p className="text-slate-300 text-sm font-medium">Current EC Range</p>
                  <p className="text-sm font-semibold text-white">
                    {tdsLimits.min.toFixed(1)} - {tdsLimits.max.toFixed(1)} mS/cm
                  </p>
                </div>
              </div>
              
              {successMessage && (
                <div className="flex items-center ml-auto">
                  <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                    <p className="text-sm font-medium text-green-400">
                      {successMessage}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Plant Presets Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {plantPresets.map((plant) => (
            <div 
              key={plant.id} 
              className="bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 rounded-xl p-5 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-300"
            >
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden mr-3 bg-slate-700/50">
                  <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{plant.name}</h3>
                  <div className="text-xs px-2 py-1 rounded-full inline-flex bg-slate-700/50 text-slate-400 border border-slate-700/30">
                    Plant Preset
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-slate-400 mb-4">{plant.description}</p>
              
              {/* Growth Stages Cards */}
              <div className="space-y-4 mb-2">
                {plant.stages.map((stage, stageIndex) => (
                  <div 
                    key={stage.id}
                    className={`bg-slate-800/40 rounded-lg p-4 border transition-all duration-300 ${
                      selectedStage === `${plant.id}-${stage.id}` 
                        ? "border-green-500/50 shadow-green-500/10 shadow-lg" 
                        : "border-slate-700/30"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-white">
                        Stage: {stage.name}
                        {selectedStage === `${plant.id}-${stage.id}` && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                            Active
                          </span>
                        )}
                      </h4>
                    </div>
                    
                    <p className="text-xs text-slate-400 mb-3">{stage.description}</p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-slate-800/60 rounded p-2 border border-slate-700/30">
                        <h5 className="text-xs text-blue-400 font-medium">pH Range</h5>
                        <p className="text-sm font-semibold text-white">{stage.ph.min.toFixed(1)} - {stage.ph.max.toFixed(1)}</p>
                      </div>
                      
                      <div className="bg-slate-800/60 rounded p-2 border border-slate-700/30">
                        <h5 className="text-xs text-purple-400 font-medium">EC Range</h5>
                        <p className="text-sm font-semibold text-white">{stage.ec.min.toFixed(1)} - {stage.ec.max.toFixed(1)} mS/cm</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => applyPlantPreset(plant, stageIndex)}
                      className={`w-full py-1.5 rounded text-xs font-medium transition-all duration-300 ${
                        selectedStage === `${plant.id}-${stage.id}` 
                          ? "bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30" 
                          : "bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      {selectedStage === `${plant.id}-${stage.id}` ? "Applied" : "Apply Stage Preset"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Information Section */}
        <div className="mt-8 bg-slate-800/40 rounded-xl p-6 border border-slate-700/30">
          <h3 className="text-lg font-semibold text-white mb-3">Growth Stage Guidelines</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex">
              <div className="text-green-400 mr-3 text-xl">🌱</div>
              <div>
                <h4 className="text-sm font-medium text-slate-200 mb-1">Seedling Stage</h4>
                <p className="text-sm text-slate-400">
                  Young plants need lower EC levels as their root systems are developing. Maintain consistent moisture and humidity.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="text-emerald-400 mr-3 text-xl">🌿</div>
              <div>
                <h4 className="text-sm font-medium text-slate-200 mb-1">Growth Stage</h4>
                <p className="text-sm text-slate-400">
                  As plants mature, they require higher EC levels to support leaf development, flowering, and fruiting.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="text-blue-400 mr-3 text-xl">💧</div>
              <div>
                <h4 className="text-sm font-medium text-slate-200 mb-1">pH Balance</h4>
                <p className="text-sm text-slate-400">
                  Most plants prefer consistent pH levels throughout their life cycle. Monitor pH daily for best results.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="text-red-400 mr-3 text-xl">🌡️</div>
              <div>
                <h4 className="text-sm font-medium text-slate-200 mb-1">Temperature</h4>
                <p className="text-sm text-slate-400">
                  Seedlings often prefer slightly warmer temperatures than mature plants. Aim for 20-24°C for most seedlings.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

export default PlantPresets;
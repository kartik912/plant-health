import React from "react";
import GaugeChart from "react-gauge-chart";

const TemperatureGauge = ({ value = 25 }) => {
  return (
    <div className="flex flex-col items-center relative">
      <h2 className="text-lg font-semibold mb-2">Temperature (°C)</h2>
      <div className="relative">
        <GaugeChart
          id="temperature-gauge"
          nrOfLevels={20}
          arcsLength={[0.2, 0.6, 0.2]}
          colors={["blue", "green", "red"]}
          percent={value / 50}
          arcPadding={0.02}
          textColor="#000"
          formatTextValue={(val) => `${val}°C`}
        />
        <div className="absolute top-[75%] left-0 text-sm font-medium">0</div>
        <div className="absolute top-[-10%] left-[47%] text-sm font-medium">25</div>
        <div className="absolute top-[75%] right-0 text-sm font-medium">50</div>
      </div>
    </div>
  );
};

export default TemperatureGauge;

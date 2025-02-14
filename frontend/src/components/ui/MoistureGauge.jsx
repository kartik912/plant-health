import React from "react";
import GaugeChart from "react-gauge-chart";

const MoistureGauge = ({ value = 500 }) => {
  return (
    <div className="flex flex-col items-center relative">
      <h2 className="text-lg font-semibold mb-2">Soil Moisture</h2>
      <div className="relative">
        <GaugeChart
          id="moisture-gauge"
          nrOfLevels={20}
          arcsLength={[0.2, 0.6, 0.2]}
          colors={["red", "green", "red"]}
          percent={value / 1000}
          arcPadding={0.02}
          textColor="#000"
          formatTextValue={(val) => `${val}`}
        />
        <div className="absolute top-[75%] left-0 text-sm font-medium">0</div>
        <div className="absolute top-[-10%] left-[47%] text-sm font-medium">500</div>
        <div className="absolute top-[75%] right-0 text-sm font-medium">1000</div>
      </div>
    </div>
  );
};

export default MoistureGauge;

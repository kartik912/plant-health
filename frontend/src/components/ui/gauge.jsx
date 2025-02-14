import React from "react";
import GaugeChart from "react-gauge-chart";

const Gauge = ({ value = 7 }) => {
  return (
    <div className="flex flex-col items-center relative">
      {/* Title */}
      <h2 className="text-lg font-semibold mb-2">Water pH</h2>
      
      {/* Gauge Chart */}
      <div className="relative">
        <GaugeChart
          id="ph-gauge"
          nrOfLevels={20}
          arcsLength={[0.2, 0.6, 0.2]} // Define color segments
          colors={["red", "green", "red"]} // Red for acidic, green for neutral, red for alkaline
          percent={value / 14} // Normalize value to range 0-1
          arcPadding={0.02}
          textColor="#000"
          formatTextValue={(val) => val.toFixed(1)}
        />

        {/* Labels */}
        <div className="absolute top-[75%] left-0 text-sm font-medium">0</div>
        <div className="absolute top-[-10%] left-[47%] text-sm font-medium">7</div>
        <div className="absolute top-[75%] right-0 text-sm font-medium">14</div>
      </div>
    </div>
  );
};

export default Gauge;

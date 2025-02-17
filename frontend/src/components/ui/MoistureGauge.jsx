import React from "react";
import GaugeChart from "react-gauge-chart";

const MoistureGauge = ({ value, state, time }) => {
  const normalizedValue = Math.min(Math.max(Number(value) || 0, 0), 4000);
  console.log('Normalized value:', normalizedValue);
  const percentValue = normalizedValue / 4000;

  return (
    <div className="w-full h-full p-4 rounded-lg bg-gradient-to-r from-teal-700 to-blue-900 flex flex-col">
      <h2 className="text-lg font-bold text-white mb-4">Water Moisture</h2>
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <GaugeChart
          id="ph-gauge"
          nrOfLevels={20}
          arcsLength={[5 / 14, 2.5 / 14, 6.5 / 14]}
          colors={["red", "green", "red"]}
          percent={percentValue}
          arcWidth={0.1}
          arcPadding={0.02}
          needleColor="white"
          needleBaseColor="black"
          textColor="transparent"
          formatTextValue={() => ""}
          style={{ width: "150px" }}
        />
        <div className="absolute top-1/2 left-1/4 text-xs text-white">0</div>
        <div className="absolute top-0 left-1/4 text-xs text-white">5</div>
        <div className="absolute -top-2 left-1/2 text-xs text-white">7.5</div>
        <div className="absolute bottom-0 right-0 text-xs text-white">14</div>
        <div className="mt-4 text-white text-sm text-center">
          <p>{normalizedValue.toFixed(1)} / {state} /{time}</p>
        </div>
      </div>
    </div>
  );
};

export default MoistureGauge;
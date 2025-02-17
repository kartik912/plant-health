import React from "react";
import GaugeChart from "react-gauge-chart";

const TemperatureGauge = ({ value, time }) => {
  const normalizedValue = Math.min(Math.max(Number(value) || 0, 0), 100);
  const percentValue = normalizedValue / 100;

  return (
    <div className="w-full h-full p-4 rounded-lg bg-gradient-to-r from-teal-700 to-blue-900 flex flex-col">
      <h2 className="text-lg font-bold text-white mb-4">Temperature</h2>
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
        <div className="absolute top-[47%] left-1/4 text-xs text-white">0</div>
        <div className="absolute top-[-10%] left-[39%] text-xs text-white">5</div>
        <div className="absolute -top-[15%] left-1/2 text-xs text-white">7.5</div>
        <div className="absolute top-[47%] right-[25%] text-xs text-white">14</div>
        <div className="mt-2 text-white text-sm text-center">
          <p>{normalizedValue.toFixed(1)}C / {time}</p>
        </div>
      </div>
    </div>
  );
};

export default TemperatureGauge;

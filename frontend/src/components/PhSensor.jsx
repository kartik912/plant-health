import React, { useState, useEffect } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const PHSensor = () => {
    const [phData, setPHData] = useState([]);
    const [currentPH, setCurrentPH] = useState(0);

    const fetchPHData = async () => {
        try {
            const historyResponse = await fetch("http://127.0.0.1:5000/get_ph_history");
            const historyData = await historyResponse.json();
            const formattedData = historyData.ph_data.map(item => ({
                time: new Date(item.timestamp).toLocaleTimeString(),
                ph_value: parseFloat(item.ph_value)
            }));
            setPHData(formattedData);
            
            if (formattedData.length > 0) {
                setCurrentPH(formattedData[formattedData.length - 1].ph_value);
            }
        } catch (error) {
            console.error("Error fetching PH data:", error);
        }
    };

    useEffect(() => {
        fetchPHData();
        const interval = setInterval(fetchPHData, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <div className="panel w-[80%] mb-4 md:mb-0">
                <h2 className="panel-title">PH Value</h2>
                <div className="panel-content">
                    <div className="sensor-readings mb-4 font-semibold">
                        <div>Current PH: {currentPH} </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={phData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="ph_value"
                                stroke="#FF6384"
                                name="PH Level"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    );
};

export default PHSensor;

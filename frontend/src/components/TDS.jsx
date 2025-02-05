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

const TDS = () => {
    const [tdsData, setTdsData] = useState([]);
    const [currentTDS, setCurrentTDS] = useState(0);

    const fetchTDSData = async () => {
        try {
            const response = await fetch("http://127.0.0.1:5000/get_tds");
            const data = await response.json();
            setCurrentTDS(data.tds_value);

            const historyResponse = await fetch("http://127.0.0.1:5000/get_tds_history");
            const historyData = await historyResponse.json();
            const formattedData = historyData.tds_data.map(item => ({
                time: new Date(item.date).toLocaleTimeString(),
                tds_value: parseFloat(item.tds_value)
            }));
            setTdsData(formattedData);
        } catch (error) {
            console.error("Error fetching TDS data:", error);
        }
    };

    useEffect(() => {
        fetchTDSData();
        const interval = setInterval(fetchTDSData, 10000);
        return () => clearInterval(interval);
    }, []);

    const deleteTDSHistory = async () => {
        try {
            const response = await fetch("http://127.0.0.1:5000/delete_tds_data", {
                method: "POST"
            });
            if (response.ok) {
                setTdsData([]);
            }
        } catch (error) {
            console.error("Error clearing TDS history:", error);
        }
    };

    return (
        <>
            <div className="panel w-[80%] mb-4 md:mb-0">
                <h2 className="panel-title">TDS Levels</h2>
                <div className="panel-content">
                    <div className="sensor-readings mb-4 font-semibold">
                        <div>Current TDS: {currentTDS} ppm</div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={tdsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="tds_value"
                                stroke="#FF6384"
                                name="TDS (ppm)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                    <button onClick={deleteTDSHistory} className="btn btn-danger mt-4">Clear Data</button>
                </div>
            </div>
        </>
    );
};

export default TDS;

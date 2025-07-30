import { useState, useEffect } from "react";
import Charts from "./Charts";

export default function CropYieldPrediction() {
  const [formData, setFormData] = useState({
    soilType: "Loam",
    cropType: "Soybean",
    daysToHarvest: 100,
    fertilizerUsed: true,
    irrigationUsed: true,
  });

  const [location, setLocation] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null,
  });

  const [predictionResult, setPredictionResult] = useState<string | null>(null);
  const [yieldValue, setYieldValue] = useState<number | null>(null);
  const [averageYield, setAverageYield] = useState<number | null>(null);
  const [optimalYield, setOptimalYield] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    const newValue = type === "checkbox" ? target.checked : value;

    setFormData({
      ...formData,
      [name]: newValue,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (location.latitude === null || location.longitude === null) {
      setPredictionResult("Error: Unable to fetch location. Please enable location services.");
      return;
    }

    const requestData = {
      soil_type: formData.soilType,
      crop: formData.cropType,
      days_to_harvest: formData.daysToHarvest,
      fertilizer_used: formData.fertilizerUsed,
      irrigation_used: formData.irrigationUsed,
      latitude: location.latitude,
      longitude: location.longitude,
    };

    try {
      const response = await fetch("https://crop-yield-backend.onrender.com/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      const data = await response.json();

      if (data.predicted_yield !== undefined) {
        setYieldValue(data.predicted_yield);
        setAverageYield(data.average_yield);
        setOptimalYield(data.optimal_yield);
        setPredictionResult(`Estimated yield: ${data.predicted_yield} tons per hectare`);
        setRecommendations(data.recommendation?.advice ?? []);
      } else {
        setPredictionResult("Error: Could not get prediction");
      }
    } catch (error) {
      console.error(error);
      setPredictionResult("Error: Unable to connect to the server");
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 bg-gray-900 text-white p-6 md:p-12 flex flex-col justify-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-2">Crop Yield Predictor!</h1>
          <h4 className="text-lg md:text-2xl font-bold mb-6">Forecast and get recommendations for your crops</h4>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
            <label>Soil Type
              <select name="soilType" value={formData.soilType} onChange={handleChange} className="w-full bg-gray-800 p-2 rounded mt-1">
                <option>Loam</option>
                <option>Clay</option>
                <option>Sandy</option>
                <option>Silt</option>
                <option>Peaty</option>
                <option>Chalky</option>
              </select>
            </label>
            <label>Crop Type 🌾
              <select name="cropType" value={formData.cropType} onChange={handleChange} className="w-full bg-gray-800 p-2 rounded mt-1">
                <option>Soybean</option>
                <option>Wheat</option>
                <option>Maize</option>
                <option>Rice</option>
                <option>Cotton</option>
                <option>Barley</option>
              </select>
            </label>
            <label>Days To Harvest
              <input type="number" name="daysToHarvest" value={formData.daysToHarvest} onChange={handleChange} className="w-full bg-gray-800 p-2 rounded mt-1" />
            </label>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="fertilizerUsed" checked={formData.fertilizerUsed} onChange={handleChange} /> Fertilizer Used
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="irrigationUsed" checked={formData.irrigationUsed} onChange={handleChange} /> Irrigation Used
            </div>
            <button type="submit" className="w-full bg-blue-600 py-2 rounded col-span-2">Predict Yield</button>
          </form>
        </div>

        {/* Right Side - Info */}
        <div className="w-full md:w-1/2 bg-blue-700 text-white p-6 md:p-12 flex flex-col justify-center text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Get Meaningful Insight About What You Grow</h2>
          <p className="text-sm">This can aid you in making better decisions about your farm</p>

          {predictionResult && (
            <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">{predictionResult}</div>
          )}

          {recommendations.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-100 text-yellow-700 rounded">
              <h3 className="font-bold">Farming Recommendations:</h3>
              <ul className="list-disc list-inside">
                {recommendations.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Charts Section */}
      {yieldValue !== null && averageYield !== null && optimalYield !== null && (
        <div className="w-full p-6 bg-slate-950">
          <h2 className="text-2xl font-bold text-center mb-4 text-white">Yield Analysis</h2>
          <Charts
            predictedYield={yieldValue}
            cropType={formData.cropType}
            region="Auto-detected"
            averageYield={averageYield}
            optimalYield={optimalYield}
          />
        </div>
      )}
    </div>
  );
}

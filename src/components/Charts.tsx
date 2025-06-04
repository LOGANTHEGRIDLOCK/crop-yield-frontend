/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import axios from "axios";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, Legend, 
  ComposedChart, Area, PieChart, Pie, Cell
} from "recharts";

// Define interfaces for props and historical data
interface PredictionHistory {
  date: string;
  yield: number;
  crop: string;
  region: string;
}

interface ChartsProps {
  predictedYield: number;
  cropType: string;
  region: string;
  averageYield: number;
  optimalYield: number;
}

const Charts: React.FC<ChartsProps> = ({ 
  predictedYield, 
  cropType, 
  region, 
  averageYield, 
  optimalYield 
}) => {
  // State for time period selection
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'year'>('month');
  
  // State for prediction history
  const [predictionHistory, setPredictionHistory] = useState<PredictionHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [historyStats, setHistoryStats] = useState<any>(null);

  // Fetch prediction history from the backend with time period parameter
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`https://crop-yield-backend.onrender.com/history`, {
          params: { time_period: timePeriod }
        });
        // Transform data to ensure it matches our interface
        const formattedHistory = response.data.history.map((item: any) => ({
          date: item.date,
          yield: Number(item.yield),
          crop: item.crop,
          region: item.region
        }));
        setPredictionHistory(formattedHistory);
        setError(null);
      } catch (error) {
        console.error("Error fetching history:", error);
        setError("Failed to load prediction history. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [timePeriod]);

  // Fetch history stats
  useEffect(() => {
    const fetchHistoryStats = async () => {
      try {
        const response = await axios.get("https://crop-yield-backend.onrender.com/history/stats");
        setHistoryStats(response.data);
      } catch (error) {
        console.error("Error fetching history stats:", error);
      }
    };

    fetchHistoryStats();
  }, [predictionHistory]);

  // Generate comparison data
  const comparisonData = [
    { name: "Your Prediction", yield: predictedYield },
    { name: `Avg. ${cropType}`, yield: averageYield },
    { name: "Optimal Yield", yield: optimalYield }
  ];

  // Process historical data for display
  const getFilteredHistory = () => {
    if (!predictionHistory.length) return [];
    
    return predictionHistory.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString(),
      cropType: item.crop // Map crop to cropType for display
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const historyData = getFilteredHistory();

  const archiveHistory = async () => {
    try {
      setIsLoading(true);
      await axios.post("https://crop-yield-backend.onrender.com/archive");
      // Refresh the history data
      const historyResponse = await axios.get(`https://crop-yield-backend.onrender.com/history`, {
        params: { time_period: timePeriod }
      });
      setPredictionHistory(historyResponse.data.history || []);
      setError(null);
    } catch (error) {
      console.error("Error archiving history:", error);
      setError("Failed to archive history. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateDaysToHarvestData = () => {
    const data = [];
    const totalDays = 100; // Assuming 100 days to harvest
    const interval = 5; // Update every 5 days
  
    for (let day = 0; day <= totalDays; day += interval) {
      let growthFactor;
      
      if (day < totalDays * 0.2) {
        // Slow initial growth phase
        growthFactor = day / (totalDays * 0.4);
      } else if (day < totalDays * 0.8) {
        // Rapid middle growth phase
        growthFactor = 0.5 + (day - totalDays * 0.2) / (totalDays * 1.2);
      } else {
        // Slower final growth phase
        growthFactor = 0.9 + (day - totalDays * 0.8) / (totalDays * 2);
      }
  
      if (growthFactor > 1) growthFactor = 1; // Max growth factor is 1 (100%)
  
      data.push({
        day,
        projectedYield: parseFloat((predictedYield * growthFactor).toFixed(2)),
      });
    }
    
    return data;
  };

  const daysToHarvestData = generateDaysToHarvestData();

  // Prepare data for pie chart if historyStats is available
  const getPieChartData = () => {
    if (!historyStats || !historyStats.by_crop) return [];
    
    return Object.entries(historyStats.by_crop).map(([crop, count]: [string, any]) => ({
      name: crop,
      value: count
    }));
  };

  const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

  return (
    <div className="bg-white">
      <div className="w-full max-w-6xl mx-auto mt-6 px-4">
        {/* Time period selector */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium border ${
                timePeriod === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              } rounded-l-lg`}
              onClick={() => setTimePeriod('week')}
            >
              Week
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${
                timePeriod === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
              onClick={() => setTimePeriod('month')}
            >
              Month
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${
                timePeriod === 'year' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              } rounded-r-lg`}
              onClick={() => setTimePeriod('year')}
            >
              Year
            </button>
          </div>
        </div>

        {/* Display error message if any */}
        {error && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center my-6">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Data summary card */}
        {historyStats && (
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold text-center mb-4">Prediction History Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="text-sm font-medium text-blue-800">Total Predictions</h4>
                <p className="text-2xl font-bold text-blue-600">{historyStats.total_predictions}</p>
                <p className="text-xs text-blue-500 mt-1">Active in database</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h4 className="text-sm font-medium text-green-800">Archived Records</h4>
                <p className="text-2xl font-bold text-green-600">{historyStats.total_archived}</p>
                <p className="text-xs text-green-500 mt-1">Historical data saved</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h4 className="text-sm font-medium text-purple-800">Current Time Period</h4>
                <p className="text-2xl font-bold text-purple-600">
                  {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}
                </p>
                <p className="text-xs text-purple-500 mt-1">
                  Showing data from the last {timePeriod === 'week' ? '7 days' : timePeriod === 'month' ? '30 days' : '365 days'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Comparison Chart */}
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold text-center mb-2">Yield Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value} tons/ha`, 'Yield']} />
                <Legend />
                <Bar dataKey="yield" name="Yield (tons/ha)" fill="#4CAF50" barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Historical Yield Trend Chart */}
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold text-center mb-2">Historical Yield Trend</h3>
            {historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historyData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip formatter={(value: any) => [`${value} tons/ha`, 'Yield']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="yield" 
                    name="Yield (tons/ha)" 
                    stroke="#007bff" 
                    strokeWidth={3} 
                    dot={{ r: 4 }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No historical data available for this time period
              </div>
            )}
          </div>
        </div>

        {/* Days to Harvest Projection Chart */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mt-6">
          <h3 className="text-lg font-semibold text-center mb-2">Growth Projection by Days to Harvest</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={daysToHarvestData}>
              <XAxis dataKey="day" label={{ value: 'Days', position: 'insideBottomRight', offset: -5 }} />
              <YAxis label={{ value: 'Yield (tons/ha)', angle: -90, position: 'insideLeft' }} />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip formatter={(value: any) => [`${value} tons/ha`, 'Projected Yield']} />
              <Area 
                type="monotone" 
                dataKey="projectedYield" 
                name="Projected Yield"
                fill="#82ca9d" 
                stroke="#4CAF50" 
                fillOpacity={0.3} 
              />
              <Line 
                type="monotone" 
                dataKey="projectedYield" 
                name="Projected Yield"
                stroke="#4CAF50" 
                strokeWidth={2} 
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Crop Distribution Pie Chart (if history stats available) */}
        {historyStats && Object.keys(historyStats.by_crop || {}).length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mt-6">
            <h3 className="text-lg font-semibold text-center mb-2">Crop Distribution</h3>
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-1/2">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getPieChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {getPieChartData().map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} predictions`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 flex items-center">
                <div className="w-full">
                  <h4 className="text-md font-semibold mb-2">Crop Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(historyStats.by_crop || {}).map(([crop, count]: [string, any], index) => (
                      <div key={crop} className="flex items-center">
                        <div className="w-4 h-4 mr-2" style={{ backgroundColor: pieColors[index % pieColors.length] }}></div>
                        <span className="text-sm">{crop}: {count} predictions</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prediction History Table */}
        {predictionHistory.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Prediction History Summary</h3>
              <button 
                onClick={archiveHistory}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-red-300"
                disabled={isLoading}
              >
                {isLoading ? 'Archiving...' : 'Archive History'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Crop Type
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Region
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Yield (tons/ha)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {predictionHistory.slice(-10).reverse().map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-2 px-4 text-sm text-gray-500">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-500">{item.crop}</td>
                      <td className="py-2 px-4 text-sm text-gray-500">{item.region}</td>
                      <td className="py-2 px-4 text-sm text-gray-500">{item.yield.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mt-6">
          <h3 className="text-lg font-semibold text-center mb-4">Yield Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h4 className="text-sm font-medium text-green-800">Current Prediction</h4>
              <p className="text-2xl font-bold text-green-600">{predictedYield.toFixed(2)} tons/ha</p>
              <p className="text-xs text-green-500 mt-1">For {cropType} in {region}</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="text-sm font-medium text-blue-800">Average Yield</h4>
              <p className="text-2xl font-bold text-blue-600">{averageYield.toFixed(2)} tons/ha</p>
              <p className="text-xs text-blue-500 mt-1">Regional average for {cropType}</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h4 className="text-sm font-medium text-purple-800">Potential Improvement</h4>
              <p className="text-2xl font-bold text-purple-600">
                {((predictedYield / averageYield - 1) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-purple-500 mt-1">
                Compared to regional average
              </p>
            </div>
          </div>
        </div>

        {/* Recommendations based on data */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mt-6">
          <h3 className="text-lg font-semibold mb-4">Yield Improvement Recommendations</h3>
          <div className="space-y-4">
            {predictedYield < averageYield ? (
              <>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Below Average Yield</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      Your predicted yield is {((averageYield - predictedYield) / averageYield * 100).toFixed(1)}% below the regional average for {cropType}.
                    </p>
                  </div>
                </div>
                <div className="pl-8 space-y-2">
                  <p className="text-sm text-gray-800">Consider the following improvements:</p>
                  <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                    <li>Optimize soil fertility with targeted fertilizer application</li>
                    <li>Review irrigation practices and schedules</li>
                    <li>Consider crop rotation or companion planting</li>
                    <li>Implement pest and disease management strategies</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Above Average Yield</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      Your predicted yield is {((predictedYield - averageYield) / averageYield * 100).toFixed(1)}% above the regional average for {cropType}.
                    </p>
                  </div>
                </div>
                <div className="pl-8 space-y-2">
                  <p className="text-sm text-gray-800">To maintain or improve your yield:</p>
                  <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                    <li>Continue with current best practices</li>
                    <li>Consider soil testing to maintain optimal conditions</li>
                    <li>Monitor weather patterns for timely interventions</li>
                    <li>Document your methods for future reference</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer with disclaimer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Yield predictions are based on historical data and environmental factors.</p>
          <p>Actual yields may vary based on weather conditions, management practices, and other factors.</p>
        </div>
      </div>
    </div>
  );
};

export default Charts;
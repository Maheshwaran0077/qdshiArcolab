import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import MetricCard from './components/MetricCard'; 
import { dashboardMetrics as initialData, getInitialStatusArray } from './dashboardData'; 
import QualityPage from './pages/Quality';
import SafetyPage from './pages/Safety';
import Health from './pages/Health';



const API_BASE_URL = 'http://localhost:5000/api/metrics';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const monthData = getInitialStatusArray();

  // Fetch live data from DB to update the cards on the main page
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        const dbData = await response.json();

        if (dbData && dbData.length > 0) {
          // Merge DB data with the blueprint
          const merged = initialData.map(blueprint => {
            const liveRecord = dbData.find(d => d.letter === blueprint.letter);
            // If DB has data for this letter, use it (alerts, success, etc.)
            return liveRecord ? { ...blueprint, ...liveRecord } : blueprint;
          });
          setMetrics(merged);
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-slate-400 font-bold animate-pulse uppercase tracking-widest">
          Syncing with Database...
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-[1400px] mx-auto p-6 lg:p-10">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {metrics.map((item) => (
          <MetricCard 
            key={item.id} 
            data={item} 
            monthData={item.daysData || monthData} // Use DB array if it exists
          />
        ))} 
      </div>
    </main>
  );
};

// Sub-page Placeholders
// const SafetyPage = () => <div className="p-10 text-2xl font-bold text-slate-800">Safety Detailed Analytics Page</div>;
// const Health = () => <div className="p-10 text-2xl font-bold text-slate-800">Budget & Cost Breakdown</div>;
const DeliveryPage = () => <div className="p-10 text-2xl font-bold text-slate-800">Delivery Performance Tracking</div>;
const Idea = () => <div className="p-10 text-2xl font-bold text-slate-800">Training & People Management</div>;

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/q" element={<QualityPage />} />
          <Route path="/d" element={<DeliveryPage />} />
          <Route path="/s" element={<SafetyPage />} />
          <Route path="/h" element={<Health />} />
          <Route path="/i" element={<Idea />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
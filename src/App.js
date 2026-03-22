import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import MetricCard from './components/MetricCard'; 
import { dashboardMetrics, generateMonthData } from './/dashboardData'; 
import QualityPage from './pages/Quality';
 
 const Dashboard = () => {
  const monthData = generateMonthData();
  return (
    <main className="max-w-[1400px] mx-auto p-6 lg:p-10">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {dashboardMetrics.map((item) => (
          <MetricCard 
            key={item.id} 
            data={item} 
            monthData={monthData} 
          />
        ))} 
      </div>
    </main>
  );
};

// 2. Sub-page Placeholders
const SafetyPage = () => <div className="p-10 text-2xl font-bold text-slate-800">Safety Detailed Analytics Page</div>;
 const Health = () => <div className="p-10 text-2xl font-bold text-slate-800">Budget & Cost Breakdown</div>;
const DeliveryPage = () => <div className="p-10 text-2xl font-bold text-slate-800">Delivery Performance Tracking</div>;
const Idea = () => <div className="p-10 text-2xl font-bold text-slate-800">Training & People Management</div>;

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/s" element={<SafetyPage />} />
          <Route path="/q" element={<QualityPage />} />
          <Route path="/c" element={<Health />} />
          <Route path="/d" element={<DeliveryPage />} />
          <Route path="/p" element={<Idea />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
import React, { useState } from 'react';
import { Plus, X, Save } from 'lucide-react';

const Health = () => {
  // 1. State for our Data (Initialized for 31 days)
  const [data, setData] = useState(
    Array.from({ length: 31 }, (_, i) => ({
      date: i + 1,
      attendance: null,
      meetingTime: null,
      shift: 1
    }))
  );

  // 2. State for Modal & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [formData, setFormData] = useState({ attendance: '', meetingTime: '' });

  // Open Modal for a specific date
  const openEntryModal = (entry) => {
    setSelectedEntry(entry);
    setFormData({ 
      attendance: entry.attendance || '', 
      meetingTime: entry.meetingTime || '' 
    });
    setIsModalOpen(true);
  };

  // Handle Save
  const handleSave = () => {
    const updatedData = data.map(item => 
      item.date === selectedEntry.date 
        ? { ...item, attendance: formData.attendance, meetingTime: formData.meetingTime }
        : item
    );
    setData(updatedData);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
      <header className="mb-8 border-b-2 border-yellow-500 pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wider">Minor Metric: Health Attendance Score</h1>
        <p className="text-sm text-gray-500 italic">Updated Weekly - Shift 1</p>
      </header>

       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.map((item) => (
          <div 
            key={item.date}
            onClick={() => openEntryModal(item)}
            className="cursor-pointer border border-gray-300 rounded-lg overflow-hidden transition-all hover:shadow-md"
          >
            <div className="bg-yellow-400 text-center py-1 font-bold border-b border-gray-300">
              Date: {item.date}
            </div>
            <div className={`p-3 h-20 flex flex-col justify-center items-center ${item.attendance ? 'bg-green-100' : 'bg-white'}`}>
              {item.attendance ? (
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Att: <span className="font-bold text-gray-800">{item.attendance}%</span></p>
                  <p className="text-xs text-gray-500 uppercase">On Time: <span className="font-bold text-gray-800">{item.meetingTime}</span></p>
                </div>
              ) : (
                <Plus className="text-gray-300 w-5 h-5" />
              )}
            </div>
          </div>
        ))}
      </div>

       {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
              <h2 className="font-bold">Update Data: Day {selectedEntry.date}</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">% of Attendance of CFT</label>
                <input 
                  type="number" 
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-yellow-500 outline-none"
                  value={formData.attendance}
                  onChange={(e) => setFormData({...formData, attendance: e.target.value})}
                  placeholder="e.g. 95"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Meeting Start & End on Time</label>
                <select 
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-yellow-500 outline-none"
                  value={formData.meetingTime}
                  onChange={(e) => setFormData({...formData, meetingTime: e.target.value})}
                >
                  <option value="">Select Status</option>
                  <option value="Yes">Yes (On Time)</option>
                  <option value="No">No (Delayed)</option>
                </select>
              </div>
              
              <button 
                onClick={handleSave}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Save size={18}/> Update Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Health;
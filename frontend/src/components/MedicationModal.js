import { useState } from 'react';

export default function MedicationModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && time) {
      onAdd({
        id: Date.now().toString(),
        name,
        dosage,
        time
      });
      setName('');
      setDosage('');
      setTime('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Log Medication</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">Γ£ò</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Medication Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="e.g. Albuterol"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Dosage (Optional)</label>
            <input 
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="e.g. 2 puffs"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Time Taken</label>
            <input 
              type="time" 
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors mt-6"
          >
            Save Log
          </button>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BatchSummary } from '../types';
import { Search, Package, Calendar, Award, ChevronRight, QrCode } from 'lucide-react';

interface BatchListProps {
  onSelectBatch: (id: string) => void;
}

const BatchList: React.FC<BatchListProps> = ({ onSelectBatch }) => {
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const data = await api.getBatches(1, 20); // Fetch first 20 for list
      setBatches(data.batches);
    } catch (err) {
      setError('Failed to load recent batches.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      onSelectBatch(searchId.trim());
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header & Search */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">
          Bio Trace <span className="text-purple-700">Amazônia</span>
        </h1>
        <p className="text-slate-500 mb-8 text-lg">
          Transparent supply chain tracking for premium Açaí
        </p>

        <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
          <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
             <input
              type="text"
              placeholder="Scan or enter Batch ID (e.g. B176...)"
              className="w-full pl-12 pr-12 py-4 rounded-full border border-slate-200 shadow-sm focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all text-lg"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
            <button 
              type="button" 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-purple-600 transition-colors"
              title="QR Scanner (Mock)"
            >
              <QrCode size={20} />
            </button>
          </div>
        </form>
      </div>

      {/* Recent Batches List */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <Package className="text-emerald-600" size={18} />
                Recent Batches
            </h2>
            <span className="text-xs font-medium px-2 py-1 bg-slate-200 text-slate-600 rounded-md">Live Data</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            Loading supply chain data...
          </div>
        ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {batches.map((batch) => (
              <div 
                key={batch.batchId}
                onClick={() => onSelectBatch(batch.batchId)}
                className="group p-6 hover:bg-purple-50/50 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {batch.batchId}
                    </span>
                    {batch.certificate && batch.certificate !== 'None' && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                            batch.certificate === 'Gold' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                            batch.certificate === 'Silver' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                            'bg-orange-100 text-orange-800 border-orange-200'
                        }`}>
                            {batch.certificate} Certified
                        </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(batch.firstEvent).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                        <Award size={14} />
                        GI Score: <span className="font-semibold text-slate-700">{batch.gi}</span>
                    </div>
                    <div className="text-slate-400">
                        {batch.eventCount} events logged
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center text-purple-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                    View Details
                    <ChevronRight size={16} className="ml-1" />
                </div>
              </div>
            ))}
            
            {batches.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                    No batches found.
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchList;

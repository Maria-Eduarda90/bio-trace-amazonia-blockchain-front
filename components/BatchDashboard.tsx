import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { HistoryEvent, CertificateResponse, MapResponse } from '../types';
import RouteMap from './RouteMap';
import { 
  ArrowLeft, Truck, CheckCircle2, Star, 
  MapPin, Thermometer, Droplets, Clock, AlertCircle, Share2, Award
} from 'lucide-react';

interface BatchDashboardProps {
  batchId: string;
  onBack: () => void;
}

const BatchDashboard: React.FC<BatchDashboardProps> = ({ batchId, onBack }) => {
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [cert, setCert] = useState<CertificateResponse | null>(null);
  const [mapData, setMapData] = useState<MapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'actions'>('timeline');

  // Action Form States
  const [location, setLocation] = useState('');
  const [rating, setRating] = useState(10);
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [hData, cData, mData] = await Promise.all([
        api.getHistory(batchId),
        api.getCertificate(batchId),
        api.getMap(batchId)
      ]);
      setHistory(hData);
      setCert(cData);
      setMapData(mData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchData();
    // Try to get user location on mount for actions
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.log("Loc error", err)
        );
    }
  }, [fetchData]);

  // Use simple fallback coords if geolocation fails/denied for the sake of the hackathon demo
  const getCoords = () => userCoords || { lat: -8.751, lng: -63.872 };

  const handleDispatch = async () => {
    if (!location) return alert("Please enter a location");
    setActionLoading(true);
    try {
      const coords = getCoords();
      await api.postDispatch({ batchId, location, ...coords });
      await fetchData();
      setLocation('');
      alert("Batch Dispatched Successfully!");
    } catch (e) { alert("Error dispatching"); }
    setActionLoading(false);
  };

  const handleReceive = async () => {
    if (!location) return alert("Please enter a location");
    setActionLoading(true);
    try {
        const coords = getCoords();
      await api.postReceived({ batchId, location, ...coords });
      await fetchData();
      setLocation('');
      alert("Batch Received Successfully!");
    } catch (e) { alert("Error receiving"); }
    setActionLoading(false);
  };

  const handleRate = async () => {
    setActionLoading(true);
    try {
        const coords = getCoords();
      await api.postRating({ batchId, rating, ...coords });
      await fetchData();
      alert("Rating submitted!");
    } catch (e) { alert("Error rating"); }
    setActionLoading(false);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
        case 'BATCH_CREATED': return <CheckCircle2 size={16} className="text-emerald-500" />;
        case 'IOT_UPDATE': return <Thermometer size={16} className="text-blue-500" />;
        case 'DISPATCHED': return <Truck size={16} className="text-amber-500" />;
        case 'RECEIVED': return <MapPin size={16} className="text-purple-500" />;
        case 'RATING': return <Star size={16} className="text-pink-500" />;
        default: return <Clock size={16} className="text-slate-400" />;
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Tracing Batch {batchId}...</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
        {/* Navbar */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
            <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                <button onClick={onBack} className="flex items-center text-slate-600 hover:text-slate-900 font-medium transition-colors">
                    <ArrowLeft size={20} className="mr-2" /> Back
                </button>
                <div className="font-mono text-sm bg-slate-100 px-3 py-1 rounded text-slate-700">
                    {batchId}
                </div>
            </div>
        </div>

        <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
            
            {/* Top Grid: Certificate & Map */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Certificate Card */}
                <div className="md:col-span-1 bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    
                    <div>
                        <h2 className="text-emerald-100 text-sm font-semibold uppercase tracking-wider mb-1">Authenticity Certificate</h2>
                        <div className="flex items-baseline gap-2">
                             <span className="text-5xl font-bold tracking-tighter">{cert?.gi || 0}</span>
                             <span className="text-emerald-200 font-medium">GI Score</span>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-inner ${
                            cert?.certificate === 'Gold' ? 'bg-yellow-400 border-yellow-200 text-yellow-900' : 
                            cert?.certificate === 'Silver' ? 'bg-slate-300 border-slate-200 text-slate-800' :
                            'bg-orange-400 border-orange-200 text-orange-900'
                        }`}>
                            <Award size={32} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{cert?.certificate || 'Standard'}</div>
                            <div className="text-emerald-200 text-sm">Quality Tier</div>
                        </div>
                    </div>
                </div>

                {/* Map Visualization */}
                <div className="md:col-span-2">
                    <RouteMap coordinates={mapData?.coordinates || []} loading={loading} />
                </div>
            </div>

            {/* Tabs for Mobile / Organization */}
            <div className="flex border-b border-slate-200 mb-6">
                <button 
                    onClick={() => setActiveTab('timeline')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'timeline' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Full History
                </button>
                <button 
                    onClick={() => setActiveTab('actions')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'actions' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Manage Batch
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'timeline' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Clock className="text-slate-400" size={20} />
                        Event Timeline
                    </h3>
                    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                        {history.map((event, idx) => (
                            <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                {/* Icon */}
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                    {getEventIcon(event.eventType)}
                                </div>
                                
                                {/* Card */}
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-slate-700 text-sm">{event.eventType.replace('_', ' ')}</span>
                                        <time className="font-mono text-xs text-slate-400">{new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</time>
                                    </div>
                                    <div className="text-sm text-slate-600 space-y-1">
                                        {event.eventData.location && (
                                            <div className="flex items-center gap-1.5"><MapPin size={12}/> {event.eventData.location}</div>
                                        )}
                                        {event.eventData.temperature && (
                                            <div className="flex items-center gap-1.5"><Thermometer size={12}/> {event.eventData.temperature}°C</div>
                                        )}
                                        {event.eventData.humidity && (
                                            <div className="flex items-center gap-1.5"><Droplets size={12}/> {event.eventData.humidity}%</div>
                                        )}
                                        {event.eventData.rating && (
                                            <div className="flex items-center gap-1.5 text-pink-600 font-semibold"><Star size={12} fill="currentColor"/> Rating: {event.eventData.rating}/10</div>
                                        )}
                                        <div className="text-xs text-slate-400 mt-2 font-mono">
                                            {new Date(event.timestamp).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'actions' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dispatch / Receive Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Truck className="text-amber-500" size={20} />
                            Log Logistics
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Current Location Name</label>
                                <input 
                                    type="text" 
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g. Manaus Processing Hub"
                                    className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-200 outline-none text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={handleDispatch}
                                    disabled={actionLoading}
                                    className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium py-2.5 rounded-lg text-sm transition-colors"
                                >
                                    {actionLoading ? 'Saving...' : 'Dispatch Batch'}
                                </button>
                                <button 
                                    onClick={handleReceive}
                                    disabled={actionLoading}
                                    className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-medium py-2.5 rounded-lg text-sm transition-colors"
                                >
                                    {actionLoading ? 'Saving...' : 'Receive Batch'}
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 text-center">
                                * Uses your current GPS coordinates automatically
                            </p>
                        </div>
                    </div>

                    {/* Quality Rating Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Star className="text-pink-500" size={20} />
                            Quality Control
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Batch Rating</label>
                                    <span className="text-sm font-bold text-pink-600">{rating}/10</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" max="10" 
                                    step="0.5"
                                    value={rating}
                                    onChange={(e) => setRating(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                />
                                <div className="flex justify-between text-xs text-slate-400 mt-1">
                                    <span>Poor</span>
                                    <span>Excellent</span>
                                </div>
                            </div>
                            <button 
                                onClick={handleRate}
                                disabled={actionLoading}
                                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-medium py-3 rounded-lg shadow-lg shadow-pink-200 transition-all active:scale-95"
                            >
                                {actionLoading ? 'Submitting...' : 'Submit Quality Report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    </div>
  );
};

export default BatchDashboard;
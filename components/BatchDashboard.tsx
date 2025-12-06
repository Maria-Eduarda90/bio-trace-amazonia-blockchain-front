import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { HistoryEvent, CertificateResponse, MapResponse, EventType } from '../types';
import RouteMap from './RouteMap';
import {
    ArrowLeft, Truck, CheckCircle2, Star,
    MapPin, Thermometer, Droplets, Clock, Award,
    ClipboardCheck, Flag, User, FileText
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
    }, [fetchData]);

    const getEventIcon = (type: EventType) => {
        switch (type) {
            case 'BATCH_CREATED': return <CheckCircle2 size={16} className="text-emerald-500" />;
            case 'IOT_UPDATE': return <Thermometer size={16} className="text-blue-500" />;
            case 'DISPATCHED': return <Truck size={16} className="text-amber-500" />;
            case 'RECEIVED': return <MapPin size={16} className="text-purple-500" />;
            case 'RATING': return <Star size={16} className="text-pink-500" />;
            case 'INSPECTION': return <ClipboardCheck size={16} className="text-pink-600" />;
            case 'FINALIZED': return <Flag size={16} className="text-emerald-700" />;
            default: return <Clock size={16} className="text-slate-400" />;
        }
    };

    const getActorName = (event: HistoryEvent) => {
        return event.eventData.dispatchedBy ||
            event.eventData.receivedBy ||
            event.eventData.inspector ||
            event.eventData.finalizedBy;
    }

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
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-inner ${cert?.certificate === 'Gold' ? 'bg-yellow-400 border-yellow-200 text-yellow-900' :
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
                        <RouteMap mData={mapData} loading={loading} />
                    </div>
                </div>

                {/* Timeline (Consumer View Only) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Clock className="text-slate-400" size={20} />
                        Complete Journey
                    </h3>
                    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                        {history.map((event, idx) => (
                            <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                {/* Icon */}
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                    {getEventIcon(event.eventType)}
                                </div>

                                {/* Card */}
                                <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border shadow-sm ${event.eventType === 'FINALIZED' ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100'
                                    }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`font-bold text-sm ${event.eventType === 'FINALIZED' ? 'text-emerald-700' : 'text-slate-700'
                                            }`}>{event.eventType.replace('_', ' ')}</span>
                                        <time className="font-mono text-xs text-slate-400">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                                    </div>
                                    <div className="text-sm text-slate-600 space-y-1">
                                        {event.eventData.location && (
                                            <div className="flex items-center gap-1.5"><MapPin size={12} /> {event.eventData.location}</div>
                                        )}
                                        {event.eventData.temperature && (
                                            <div className="flex items-center gap-1.5"><Thermometer size={12} /> {event.eventData.temperature}°C</div>
                                        )}
                                        {event.eventData.humidity && (
                                            <div className="flex items-center gap-1.5"><Droplets size={12} /> {event.eventData.humidity}%</div>
                                        )}
                                        {event.eventData.rating && (
                                            <div className="flex items-center gap-1.5 text-pink-600 font-semibold"><Star size={12} fill="currentColor" /> Rating: {event.eventData.rating}/10</div>
                                        )}

                                        {/* Actor info (New) */}
                                        {getActorName(event) && (
                                            <div className="flex items-center gap-1.5 text-slate-500 mt-2 text-xs border-t border-slate-100 pt-1">
                                                <User size={10} />
                                                {event.eventType === 'DISPATCHED' ? 'Dispatched by: ' :
                                                    event.eventType === 'RECEIVED' ? 'Received by: ' :
                                                        event.eventType === 'FINALIZED' ? 'Finalized by: ' : 'Inspector: '}
                                                <span className="font-medium">{getActorName(event)}</span>
                                            </div>
                                        )}

                                        {/* Notes (New) */}
                                        {event.eventData.notes && (
                                            <div className="flex items-start gap-1.5 text-slate-500 text-xs italic bg-slate-50 p-2 rounded mt-1">
                                                <FileText size={10} className="mt-0.5 shrink-0" />
                                                "{event.eventData.notes}"
                                            </div>
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
            </main>
        </div>
    );
};

export default BatchDashboard;

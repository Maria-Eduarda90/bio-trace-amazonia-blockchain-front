import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { HistoryEvent, CertificateResponse } from '../types';
import { 
  ArrowLeft, Truck, MapPin, Star, 
  AlertCircle, ScanLine, Box, Lock, CheckCircle2, ClipboardCheck,
  User, FileText, Navigation
} from 'lucide-react';

interface BatchManagerProps {
  batchId: string;
  onBack: () => void;
}

type LogisticsState = 'AT_LOCATION' | 'IN_TRANSIT' | 'FINALIZED' | 'UNKNOWN';

// --- Reusable UI Components ---

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: React.ElementType;
}

const ModernInput: React.FC<InputProps> = ({ label, icon: Icon, className, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors pointer-events-none">
        <Icon size={18} />
      </div>
      <input 
        {...props}
        className={`w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 
        focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:bg-slate-900/80 transition-all text-sm font-medium ${className}`}
      />
    </div>
  </div>
);

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  icon: React.ElementType;
}

const ModernTextArea: React.FC<TextAreaProps> = ({ label, icon: Icon, className, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-3 top-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors pointer-events-none">
        <Icon size={18} />
      </div>
      <textarea 
        {...props}
        className={`w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 
        focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:bg-slate-900/80 transition-all text-sm font-medium min-h-[100px] resize-none ${className}`}
      />
    </div>
  </div>
);

// --- Main Component ---

const BatchManager: React.FC<BatchManagerProps> = ({ batchId, onBack }) => {
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [cert, setCert] = useState<CertificateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Logic States
  const [logisticsState, setLogisticsState] = useState<LogisticsState>('UNKNOWN');
  const [canFinalize, setCanFinalize] = useState(false);
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);

  // Independent Form States
  const [logisticsData, setLogisticsData] = useState({ name: '', location: '', notes: '' });
  const [inspectionData, setInspectionData] = useState({ name: '', location: '', notes: '', rating: 10 });
  const [finalizeData, setFinalizeData] = useState({ name: '', location: '', notes: '' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [hData, cData] = await Promise.all([
        api.getHistory(batchId),
        api.getCertificate(batchId)
      ]);
      setHistory(hData);
      setCert(cData);
      analyzeHistory(hData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  const analyzeHistory = (events: HistoryEvent[]) => {
    let state: LogisticsState = 'AT_LOCATION';
    let dispatchCount = 0;
    let receiveCount = 0;

    const isFinalized = events.some(e => e.eventType === 'FINALIZED');
    if (isFinalized) {
        setLogisticsState('FINALIZED');
        setCanFinalize(false);
        return;
    }

    const sorted = [...events].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    sorted.forEach(e => {
        if (e.eventType === 'DISPATCHED') {
            state = 'IN_TRANSIT';
            dispatchCount++;
        } else if (e.eventType === 'RECEIVED' || e.eventType === 'BATCH_CREATED') {
            state = 'AT_LOCATION';
            if (e.eventType === 'RECEIVED') receiveCount++;
        }
    });

    setLogisticsState(state);
    setCanFinalize(dispatchCount >= 1 && receiveCount >= 1);
  };

  useEffect(() => {
    fetchData();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.log("Erro de localização", err)
        );
    }
  }, [fetchData]);

  const getCoords = () => userCoords || { lat: -8.751, lng: -63.872 };

  // --- Handlers ---

  const handleDispatch = async () => {
    const { name, location, notes } = logisticsData;
    if (!name.trim() || !location.trim() || !notes.trim()) { alert("Todos os campos são obrigatórios."); return; }
    
    setActionLoading(true);
    try {
      await api.postDispatch({ 
          batchId, 
          location, 
          dispatchedBy: name,
          notes,
          ...getCoords() 
      });
      await fetchData();
      setLogisticsData({ name: '', location: '', notes: '' });
      alert("Lote despachado com sucesso!");
    } catch (e) { alert("Erro ao despachar lote."); }
    setActionLoading(false);
  };

  const handleReceive = async () => {
    const { name, location, notes } = logisticsData;
    if (!name.trim() || !location.trim() || !notes.trim()) { alert("Todos os campos são obrigatórios."); return; }

    setActionLoading(true);
    try {
      await api.postReceived({ 
          batchId, 
          location, 
          receivedBy: name,
          notes,
          ...getCoords() 
      });
      await fetchData();
      setLogisticsData({ name: '', location: '', notes: '' });
      alert("Lote recebido com sucesso!");
    } catch (e) { alert("Erro ao receber lote."); }
    setActionLoading(false);
  };

  const handleInspection = async () => {
    const { name, location, notes, rating } = inspectionData;
    if (!name.trim() || !location.trim() || !notes.trim()) { alert("Todos os campos são obrigatórios."); return; }

    setActionLoading(true);
    try {
      await api.postInspection({ 
          batchId, 
          rating, 
          inspector: name,
          notes,
          location,
          ...getCoords() 
      });
      await fetchData();
      setInspectionData({ name: '', location: '', notes: '', rating: 10 });
      alert("Relatório de inspeção enviado!");
    } catch (e) { alert("Erro ao enviar inspeção."); }
    setActionLoading(false);
  };

  const handleFinalize = async () => {
    const { name, location, notes } = finalizeData;
    console.log(finalizeData)
    if (!name.trim() || !location.trim() || !notes.trim()) { alert("Todos os campos são obrigatórios."); return; }
    
    setActionLoading(true);
    try {
      await api.postFinalized({
          batchId,
          location,
          finalizedBy: name,
          notes,
          ...getCoords()
      });
      await fetchData();
      setFinalizeData({ name: '', location: '', notes: '' });
      alert("Lote finalizado com sucesso!");
    } catch (e) { console.log(e) }
    setActionLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="font-mono text-emerald-500/80">Sincronizando dados da cadeia...</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans selection:bg-emerald-500/30">

        {/* Admin Header */}
        <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
            <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white transition-colors text-sm font-medium">
                    <ArrowLeft size={18} className="mr-2" /> Voltar
                </button>
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    <ScanLine size={14} />
                    CONSOLE ADMIN
                </div>
            </div>
        </div>

        <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
            
            {/* Batch Identity Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700/50 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-20 -mt-20 blur-3xl transition-opacity group-hover:opacity-100 opacity-50"></div>
                
                <div className="flex items-start justify-between mb-6 relative z-10">
                    <div>
                        <h2 className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">Identificador do Lote</h2>
                        <div className="text-3xl font-mono font-bold text-white tracking-tight">{batchId}</div>
                    </div>

                    {cert && (
                        <div className="text-right">
                             <div className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">Nível de Qualidade</div>
                             <div className={`text-lg font-bold ${
                                cert.certificate === 'Gold' ? 'text-yellow-400' : 
                                cert.certificate === 'Silver' ? 'text-slate-300' : 'text-orange-400'
                             }`}>{cert.certificate}</div>
                        </div>
                    )}
                </div>

{/* Status Indicator */}
<div className="bg-slate-950/50 rounded-xl p-4 flex items-center gap-4 border border-slate-800 relative z-10 backdrop-blur-sm">
    <div className={`p-3 rounded-xl shadow-lg ${
        logisticsState === 'FINALIZED' ? 'bg-slate-700 text-slate-300' :
        logisticsState === 'IN_TRANSIT' ? 'bg-amber-500/20 text-amber-500 shadow-amber-900/10' : 
        'bg-emerald-500/20 text-emerald-500 shadow-emerald-900/10'
    }`}>
        {logisticsState === 'FINALIZED' ? <Lock size={24} /> :
         logisticsState === 'IN_TRANSIT' ? <Truck size={24} /> : <Box size={24} />}
    </div>
    <div>
        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Status Atual</div>
        <div className="font-semibold text-white text-lg">
            {logisticsState === 'FINALIZED' ? 'Cadeia Finalizada' :
             logisticsState === 'IN_TRANSIT' ? 'Em Trânsito' : 'No Centro'}
        </div>
    </div>
</div>

{logisticsState === 'FINALIZED' && (
    <div className="absolute -bottom-6 -right-6 text-slate-800 opacity-20 pointer-events-none">
        <Lock size={140} />
    </div>
)}
</div>

{/* LOCKED STATE BANNER */}
{logisticsState === 'FINALIZED' ? (
    <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-2xl text-center space-y-4 backdrop-blur-sm">
        <div className="inline-flex p-4 bg-emerald-500/10 rounded-full text-emerald-500 mb-2 ring-1 ring-emerald-500/20">
            <CheckCircle2 size={40} />
        </div>
        <h3 className="text-2xl font-bold text-white">Rastreamento Concluído</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
            Este lote chegou ao destino final e o registro está selado. Nenhuma modificação adicional é permitida.
        </p>
        <button onClick={onBack} className="mt-6 px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-semibold transition-all border border-slate-700 hover:border-slate-600">
            Voltar ao Painel
        </button>
    </div>
) : (
    <div className="space-y-8">
        
    {/* 1. LOGISTICS ACTIONS */}
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <AlertCircle size={20} />
            </div>
            <h3 className="font-bold text-white text-lg">Atualização Logística</h3>
        </div>

        <div className="p-6">
            {logisticsState === 'IN_TRANSIT' ? (
                /* RECEIVE FORM */
                <div className="space-y-6">
                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl text-sm text-blue-300 flex gap-3 items-start">
                        <Truck size={18} className="shrink-0 mt-0.5" />
                        <div className="leading-relaxed">
                            <span className="font-semibold block mb-0.5 text-blue-200">Lote em Trânsito</span>
                            Confirme o recebimento para marcar como "No Local".
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-5">
                        <ModernInput 
                            label="Nome do Recebedor" 
                            icon={User} 
                            placeholder="ex: Gerente da Fábrica" 
                            value={logisticsData.name}
                            onChange={(e) => setLogisticsData({...logisticsData, name: e.target.value})}
                        />
                        <ModernInput 
                            label="Local / Instalação" 
                            icon={MapPin} 
                            placeholder="ex: Unidade de Processamento B" 
                            value={logisticsData.location}
                            onChange={(e) => setLogisticsData({...logisticsData, location: e.target.value})}
                        />
                        <ModernTextArea 
                            label="Notas de Condição" 
                            icon={FileText} 
                            placeholder="Descreva a condição na chegada..." 
                            value={logisticsData.notes}
                            onChange={(e) => setLogisticsData({...logisticsData, notes: e.target.value})}
                        />
                    </div>

                    <button onClick={handleReceive} disabled={actionLoading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {actionLoading ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/> : <Box size={18} />}
                        {actionLoading ? 'Processando...' : 'Confirmar Recebimento'}
                    </button>
                </div>
            ) : (
                /* DISPATCH FORM */
                <div className="space-y-6">
                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl text-sm text-amber-300 flex gap-3 items-start">
                        <Box size={18} className="shrink-0 mt-0.5" />
                        <div className="leading-relaxed">
                            <span className="font-semibold block mb-0.5 text-amber-200">Lote em Armazenamento</span>
                            Despache para iniciar o transporte para a próxima instalação.
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        <ModernInput 
                            label="Nome do Despachante" 
                            icon={User} 
                            placeholder="ex: Oficial de Logística" 
                            value={logisticsData.name}
                            onChange={(e) => setLogisticsData({...logisticsData, name: e.target.value})}
                        />
                        <ModernInput 
                            label="Destino" 
                            icon={Navigation} 
                            placeholder="ex: Mercado Central" 
                            value={logisticsData.location}
                            onChange={(e) => setLogisticsData({...logisticsData, location: e.target.value})}
                        />
                        <ModernTextArea 
                            label="Notas de Envio" 
                            icon={FileText} 
                            placeholder="Detalhes sobre o envio..." 
                            value={logisticsData.notes}
                            onChange={(e) => setLogisticsData({...logisticsData, notes: e.target.value})}
                        />
                    </div>

                    <button onClick={handleDispatch} disabled={actionLoading} className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {actionLoading ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/> : <Truck size={18} />}
                        {actionLoading ? 'Processando...' : 'Despachar Lote'}
                    </button>
                </div>
            )}
        </div>
    </div>

    {/* 2. QUALITY INSPECTION */}
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-3">
            <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500">
                <ClipboardCheck size={20} />
            </div>
            <h3 className="font-bold text-white text-lg">Inspeção de Qualidade</h3>
        </div>

        <div className="p-6 space-y-6">
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-end mb-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pontuação de Qualidade</label>
                    <span className="text-2xl font-bold text-pink-500">{inspectionData.rating}<span className="text-sm text-slate-500 font-medium">/10</span></span>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    step="0.5" 
                    value={inspectionData.rating} 
                    onChange={(e) => setInspectionData({...inspectionData, rating: parseFloat(e.target.value)})} 
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500" 
                />
                <div className="flex justify-between mt-2 text-xs text-slate-600 font-medium px-1">
                    <span>Ruim</span>
                    <span>Excelente</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
                <ModernInput 
                    label="Nome do Inspetor" 
                    icon={User} 
                    placeholder="ex: Inspetor Certificado" 
                    value={inspectionData.name}
                    onChange={(e) => setInspectionData({...inspectionData, name: e.target.value})}
                />
                <ModernInput 
                    label="Local da Inspeção" 
                    icon={MapPin} 
                    placeholder="ex: Laboratório 3" 
                    value={inspectionData.location}
                    onChange={(e) => setInspectionData({...inspectionData, location: e.target.value})}
                />
                <ModernTextArea 
                    label="Constatações" 
                    icon={FileText} 
                    placeholder="Relatório detalhado sobre a qualidade do lote..." 
                    value={inspectionData.notes}
                    onChange={(e) => setInspectionData({...inspectionData, notes: e.target.value})}
                />
            </div>

            <button onClick={handleInspection} disabled={actionLoading} className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 hover:border-slate-600 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                 {actionLoading ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/> : <Star size={18} className="text-pink-500" />}
                {actionLoading ? 'Enviando...' : 'Enviar Relatório de Inspeção'}
            </button>
        </div>
    </div>

    <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 rounded-2xl border border-emerald-900 shadow-xl overflow-hidden relative">
             <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <div className="px-6 py-4 border-b border-emerald-900/50 flex items-center gap-3 relative z-10">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <CheckCircle2 size={20} />
                </div>
                <h3 className="font-bold text-emerald-100 text-lg">Finalizar Cadeia</h3>
            </div>

            <div className="p-6 space-y-6 relative z-10">
                <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-xl text-sm text-emerald-200">
                    Requisitos mínimos de jornada atendidos. A finalização bloqueia o lote permanentemente.
                </div>

                <div className="grid grid-cols-1 gap-5">
                    <ModernInput 
                        label="Autorizado Por" 
                        icon={User} 
                        placeholder="ex: Administrador do Sistema" 
                        value={finalizeData.name}
                        onChange={(e) => setFinalizeData({...finalizeData, name: e.target.value})}
                        className="!bg-emerald-950/30 !border-emerald-900/50 focus:!border-emerald-500"
                    />
                    <ModernInput 
                        label="Local Final" 
                        icon={MapPin} 
                        placeholder="ex: Loja de Varejo" 
                        value={finalizeData.location}
                        onChange={(e) => setFinalizeData({...finalizeData, location: e.target.value})}
                        className="!bg-emerald-950/30 !border-emerald-900/50 focus:!border-emerald-500"
                    />
                    <ModernTextArea 
                        label="Declaração de Encerramento" 
                        icon={FileText} 
                        placeholder="Observações finais..." 
                        value={finalizeData.notes}
                        onChange={(e) => setFinalizeData({...finalizeData, notes: e.target.value})}
                        className="!bg-emerald-950/30 !border-emerald-900/50 focus:!border-emerald-500"
                    />
                </div>

                <button onClick={handleFinalize} disabled={actionLoading} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {actionLoading ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/> : <Lock size={18} />}
                    {actionLoading ? 'Finalizando...' : 'Finalizar e Encerrar Lote'}
                </button>
            </div>
        </div>
    </div>
)}
</main>
</div>
);
};

export default BatchManager;

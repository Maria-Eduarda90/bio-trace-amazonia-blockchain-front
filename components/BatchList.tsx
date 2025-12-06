import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { BatchSummary } from '../types';
import { Search, Package, Calendar, Award, ChevronRight, QrCode, X, Upload, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';

interface BatchListProps {
  onSelectBatch: (id: string) => void;
}

// Define basic shape for BarcodeDetector (Native Browser API)
declare class BarcodeDetector {
  constructor(options?: { formats: string[] });
  detect(image: ImageBitmapSource): Promise<Array<{ rawValue: string }>>;
  static getSupportedFormats(): Promise<string[]>;
}

const BatchList: React.FC<BatchListProps> = ({ onSelectBatch }) => {
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const data = await api.getBatches(1, 20);
      setBatches(data.batches);
    } catch (err) {
      setError('Falha ao carregar lotes recentes.');
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

  const handleScanSuccess = (rawValue: string) => {
    if (rawValue) {
      console.log(rawValue)
      setShowScanner(false);
      const id = rawValue.trim();
      navigate(`/manage/${id}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!('BarcodeDetector' in window)) {
      alert("Seu navegador não suporta leitura de QR nativa. Tente usar a câmera ou Chrome/Edge.");
      return;
    }

    try {
      const detector = new BarcodeDetector({ formats: ['qr_code'] });
      const bitmap = await createImageBitmap(file);
      const matches = await detector.detect(bitmap);

      if (matches.length > 0) {
        console.log(matches)
        handleScanSuccess(matches[0].rawValue);
      } else {
        alert("Nenhum QR Code encontrado na imagem.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao analisar a imagem.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* NAVBAR FIXA */}
      <div className="w-full flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold text-slate-900">
          Bio Trace <span className="text-purple-700">Amazônia</span>
        </h1>

        <button
          onClick={() => setShowScanner(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow transition-colors flex items-center gap-2"
        >
          <QrCode size={18} />
          Acesso Admin
        </button>
      </div>

      {/* Cabeçalho e Busca */}
      <div className="text-center mb-10">
        <p className="text-slate-500 mb-8 text-lg">
          Rastreamento transparente da cadeia produtiva do Açaí Premium
        </p>

        <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Digite o ID do Lote (ex: B176...)"
              className="w-full pl-12 pr-4 py-4 rounded-full border border-slate-200 shadow-sm focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all text-lg"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
          </div>

          <p className="text-xs text-slate-400 mt-2">
            Dica: Pressione <span className="font-bold">Enter</span> para rastrear um lote.
          </p>
        </form>
      </div>

      {/* MODAL DO SCANNER */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">

            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2 font-bold">
                <QrCode size={18} className="text-emerald-400" />
                <span>Escanear Tag do Lote</span>
              </div>
              <button onClick={() => setShowScanner(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Scanner */}
            <div className="relative aspect-square bg-black overflow-hidden group">
              <Scanner
                onScan={(detectedCodes) => {
                  if (detectedCodes && detectedCodes.length > 0) {
                    console.log(detectedCodes)
                    handleScanSuccess(detectedCodes[0].rawValue);
                  }
                }}
                onError={(error) => console.log(error)}
                components={{
                  audio: false,
                  onOff: true,
                  torch: true,
                  zoom: true,
                  finder: true
                }}
                styles={{
                  container: { width: '100%', height: '100%' }
                }}
              />
              <div className="absolute inset-0 pointer-events-none border-[40px] border-slate-900/60 z-10 flex items-center justify-center">
                <div className="text-white/50 text-xs font-mono mt-32">Aponte a câmera para o QR Code</div>
              </div>
            </div>

            {/* Upload Manual */}
            <div className="p-6 bg-slate-50 text-center">
              <p className="text-slate-500 text-sm mb-4">Ou envie uma imagem contendo um QR Code</p>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-white border border-slate-200 hover:border-purple-300 hover:text-purple-600 text-slate-700 font-semibold rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
              >
                <Upload size={18} />
                Enviar Imagem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Lotes Recentes */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2">
            <Package className="text-emerald-600" size={18} />
            Lotes Recentes
          </h2>
          <span className="text-xs font-medium px-2 py-1 bg-slate-200 text-slate-600 rounded-md">Dados em Tempo Real</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            Carregando dados da cadeia produtiva...
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
                        batch.certificate === 'Gold'
                          ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                          : batch.certificate === 'Silver'
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-orange-100 text-orange-800 border-orange-200'
                        }`}>
                        Certificação {batch.certificate}
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
                      {batch.eventCount} eventos registados
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-purple-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                  Ver Detalhes
                  <ChevronRight size={16} className="ml-1" />
                </div>
              </div>
            ))}

            {batches.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                Nenhum lote encontrado.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchList;

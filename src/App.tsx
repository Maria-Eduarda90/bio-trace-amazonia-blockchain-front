import { useState, useEffect } from 'react';
import { Package, MapPin, Star, TrendingUp, Clock, Thermometer, Droplets } from 'lucide-react';

const API_URL = 'http://localhost:3000';

const App = () => {
  const [view, setView] = useState('list');
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newBatch, setNewBatch] = useState(null);

  useEffect(() => {
    if (view === 'list') {
      loadBatches();
    }
  }, [view]);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/batches?page=1&limit=20`);
      const data = await res.json();
      setBatches(data.batches);
    } catch (err) {
      console.error('Error loading batches:', err);
    }
    setLoading(false);
  };

  const createBatch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/batches/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setNewBatch(data);
      setView('created');
    } catch (err) {
      console.error('Error creating batch:', err);
    }
    setLoading(false);
  };

  const viewBatchDetails = async (batchId) => {
    setLoading(true);
    try {
      const [cert, history, map] = await Promise.all([
        fetch(`${API_URL}/batches/${batchId}/certificate`).then(r => r.json()),
        fetch(`${API_URL}/batches/${batchId}/history`).then(r => r.json()),
        fetch(`${API_URL}/batches/${batchId}/map`).then(r => r.json())
      ]);
      setSelectedBatch({ ...cert, map });
      setView('details');
    } catch (err) {
      console.error('Error loading batch details:', err);
    }
    setLoading(false);
  };

  const getCertificateColor = (cert) => {
    const colors = {
      'Diamond': 'from-cyan-400 to-blue-500',
      'Gold': 'from-yellow-400 to-orange-500',
      'Silver': 'from-gray-300 to-gray-500',
      'Bronze': 'from-orange-700 to-orange-900',
      'None': 'from-gray-600 to-gray-800'
    };
    return colors[cert] || colors['None'];
  };

  const getCertificateIcon = (cert) => {
    if (cert === 'Diamond') return '💎';
    if (cert === 'Gold') return '🥇';
    if (cert === 'Silver') return '🥈';
    if (cert === 'Bronze') return '🥉';
    return '📦';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="bg-black bg-opacity-40 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                BlockChain Supply
              </span>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-lg transition-all ${view === 'list'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:bg-purple-600/20'
                  }`}
              >
                Batches
              </button>
              <button
                onClick={createBatch}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
              >
                + Novo Batch
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'list' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6">Todos os Batches</h1>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {batches.map((batch) => (
                  <div
                    key={batch.batchId}
                    onClick={() => viewBatchDetails(batch.batchId)}
                    className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/50 transition-all cursor-pointer hover:transform hover:scale-105"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-1">
                          {batch.batchId}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {batch.eventCount} eventos
                        </p>
                      </div>
                      <div className="text-4xl">
                        {getCertificateIcon(batch.certificate)}
                      </div>
                    </div>

                    <div className={`bg-gradient-to-r ${getCertificateColor(batch.certificate)} rounded-lg p-3 mb-4`}>
                      <div className="flex items-center justify-between text-white">
                        <span className="font-semibold">{batch.certificate}</span>
                        <span className="text-sm">GI: {batch.gi}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Criado: {new Date(batch.firstEvent).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        <span>Atualizado: {new Date(batch.lastEvent).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'created' && newBatch && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-8 border border-purple-500/20 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Batch Criado!</h2>
              <p className="text-xl text-gray-300 mb-6">ID: {newBatch.batchId}</p>

              <div className="bg-white p-6 rounded-lg mb-6">
                <img src={newBatch.qrCode} alt="QR Code" className="mx-auto" />
              </div>

              <p className="text-gray-400 mb-6">
                Escaneie este QR Code para rastrear o batch
              </p>

              <button
                onClick={() => setView('list')}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                Ver Todos os Batches
              </button>
            </div>
          </div>
        )}

        {view === 'details' && selectedBatch && (
          <div>
            <button
              onClick={() => setView('list')}
              className="mb-6 text-purple-400 hover:text-purple-300 flex items-center"
            >
              ← Voltar
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-purple-500/20">
                <h3 className="text-lg font-semibold text-white mb-2">Batch ID</h3>
                <p className="text-2xl font-bold text-purple-400">{selectedBatch.batchId}</p>
              </div>

              <div className={`bg-gradient-to-r ${getCertificateColor(selectedBatch.certificate)} rounded-xl p-6`}>
                <h3 className="text-lg font-semibold text-white mb-2">Certificado</h3>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-white">{selectedBatch.certificate}</p>
                  <span className="text-5xl">{getCertificateIcon(selectedBatch.certificate)}</span>
                </div>
              </div>

              <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-purple-500/20">
                <h3 className="text-lg font-semibold text-white mb-2">Information Gain</h3>
                <p className="text-3xl font-bold text-green-400">{selectedBatch.gi}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-purple-500/20">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Clock className="w-6 h-6 mr-2" />
                  Histórico de Eventos
                </h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedBatch.events.map((event, idx) => (
                    <div key={idx} className="border-l-4 border-purple-500 pl-4 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-white">{event.eventType}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {event.eventType === 'IOT_UPDATE' && (
                        <div className="flex space-x-4 text-sm text-gray-300">
                          <span className="flex items-center">
                            <Thermometer className="w-4 h-4 mr-1" />
                            {event.eventData.temperature}°C
                          </span>
                          <span className="flex items-center">
                            <Droplets className="w-4 h-4 mr-1" />
                            {event.eventData.humidity}%
                          </span>
                        </div>
                      )}
                      {event.eventData.location && (
                        <p className="text-sm text-gray-300 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {event.eventData.location}
                        </p>
                      )}
                      {event.eventData.rating && (
                        <p className="text-sm text-yellow-400 flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          {event.eventData.rating}/5
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-purple-500/20">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <MapPin className="w-6 h-6 mr-2" />
                  Rotas e Localizações
                </h3>
                <div className="space-y-3">
                  {selectedBatch.map.coordinates.map((coord, idx) => (
                    <div key={idx} className="bg-purple-900 bg-opacity-30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-purple-300">{coord.type}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(coord.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">
                        Lat: {coord.lat.toFixed(4)}, Lng: {coord.lng.toFixed(4)}
                      </p>
                    </div>
                  ))}
                  {selectedBatch.map.coordinates.length === 0 && (
                    <p className="text-gray-400 text-center py-8">
                      Nenhuma localização registrada
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
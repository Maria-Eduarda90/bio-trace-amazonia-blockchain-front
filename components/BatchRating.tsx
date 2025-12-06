import React, { useState } from 'react';
import { ArrowLeft, Star, FileText } from 'lucide-react';
import { api } from '../services/api';

interface BatchRatingProps {
    batchId: string;
    onBack: () => void;
}

const BatchRating: React.FC<BatchRatingProps> = ({ batchId, onBack }) => {
    const [rating, setRating] = useState<number>(0);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const submitRating = async () => {
        const ipResponse = await fetch('https://api.ipify.org/?format=json')
        const { ip } = await ipResponse.json() as any

        console.log(ip)

        if (rating < 1 || rating > 10) {
            alert("A nota deve ser entre 1 e 10.");
            return;
        }

        try {
            setLoading(true);
            await api.postRating({
                batchId,
                rating,
                notes: notes.trim() ? notes : undefined,
                ip
            });
            setSuccess(true);
            setLoading(false);
        } catch (err) {
            console.error(err);
            alert("Falha ao enviar a avaliação.");
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
                    <Star size={48} className="text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Obrigado!</h2>
                    <p className="text-slate-500 mb-6">Sua avaliação foi registrada com sucesso.</p>
                    <button
                        onClick={onBack}
                        className="w-full bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700"
                    >
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 flex flex-col items-center">
            <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-md">

                {/* Back */}
                <button
                    onClick={onBack}
                    className="flex items-center text-slate-600 hover:text-slate-900 mb-4"
                >
                    <ArrowLeft size={20} className="mr-2" /> Voltar
                </button>

                {/* Title */}
                <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
                    Avaliar Lote
                </h2>

                <p className="text-center text-slate-500 mb-6">
                    ID do Lote: <span className="font-mono font-bold">{batchId}</span>
                </p>

                {/* Rating Slider */}
                <div className="mb-6">
                    <span className="text-sm font-medium text-slate-700">Nota (1–10)</span>

                    {/* Valor exibido */}
                    <div className="text-center mt-2 mb-3">
                        <span className="text-4xl font-bold text-emerald-600">{rating}</span>
                    </div>

                    {/* Slider */}
                    <input
                        type="range"
                        min={1}
                        max={10}
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="
                            w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer
                            accent-emerald-600
                        "
                    />

                    {/* Números abaixo */}
                    <div className="flex justify-between mt-1 text-xs text-slate-500">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <span key={n}>{n}</span>
                        ))}
                    </div>
                </div>

                {/* Notes Input */}
                <label className="block mb-4">
                    <span className="text-sm font-medium text-slate-700">Observações (opcional)</span>
                    <div className="flex items-start gap-2 border rounded-xl p-3 border-slate-200 bg-slate-50">
                        <FileText size={18} className="mt-1 text-slate-400" />
                        <textarea
                            rows={3}
                            className="w-full bg-transparent outline-none"
                            placeholder="Escreva seu feedback..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </label>

                {/* Submit */}
                <button
                    disabled={loading}
                    onClick={submitRating}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition disabled:opacity-50"
                >
                    {loading ? "Enviando..." : "Enviar Avaliação"}
                </button>
            </div>
        </div>
    );
};

export default BatchRating;

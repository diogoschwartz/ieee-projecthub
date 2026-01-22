
import React, { useState, useEffect } from 'react';
import { X, Target, Loader2, Save, Trash2, AlignLeft, Activity, Hash, Palette, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useData } from '../context/DataContext';

interface NewGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: number;
  goalToEdit?: any;
}

const COLORS = [
  'bg-blue-600', 'bg-red-600', 'bg-green-600', 
  'bg-yellow-500', 'bg-purple-600', 'bg-pink-600', 
  'bg-indigo-600', 'bg-orange-500', 'bg-teal-600'
];

const PERIODS = ['Mensal', 'Trimestral', 'Semestral', 'Anual'];

export const NewGoalModal = ({ isOpen, onClose, chapterId, goalToEdit }: NewGoalModalProps) => {
  const { fetchData } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    indicatorLabel: '',
    currentValue: 0,
    targetValue: 0,
    color: 'bg-blue-600',
    period: 'Anual'
  });

  useEffect(() => {
    if (isOpen) {
      if (goalToEdit) {
        setFormData({
          title: goalToEdit.title,
          description: goalToEdit.description || '',
          indicatorLabel: goalToEdit.indicator_label,
          currentValue: goalToEdit.current_value,
          targetValue: goalToEdit.target_value,
          color: goalToEdit.color || 'bg-blue-600',
          period: goalToEdit.period || 'Anual'
        });
      } else {
        setFormData({
          title: '',
          description: '',
          indicatorLabel: '',
          currentValue: 0,
          targetValue: 100,
          color: 'bg-blue-600',
          period: 'Anual'
        });
      }
    }
  }, [isOpen, goalToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      chapter_id: chapterId,
      title: formData.title,
      description: formData.description,
      indicator_label: formData.indicatorLabel,
      current_value: formData.currentValue,
      target_value: formData.targetValue,
      color: formData.color,
      period: formData.period
    };

    try {
      if (goalToEdit) {
        const { error } = await supabase
          .from('chapter_goals')
          .update(payload)
          .eq('id', goalToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('chapter_goals')
          .insert([payload]);
        if (error) throw error;
      }
      await fetchData(true);
      onClose();
    } catch (e) {
      console.error("Erro ao salvar meta:", e);
      alert("Erro ao salvar meta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!goalToEdit || !window.confirm("Tem certeza que deseja excluir esta meta?")) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('chapter_goals').delete().eq('id', goalToEdit.id);
      if (error) throw error;
      await fetchData(true);
      onClose();
    } catch (e) {
      console.error("Erro ao deletar:", e);
      alert("Erro ao deletar meta.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-100 flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            {goalToEdit ? 'Editar Meta' : 'Nova Meta do Capítulo'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
               <Target className="w-3.5 h-3.5" /> Título da Meta
            </label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
              placeholder="Ex: Crescimento 2026.1"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Período
            </label>
            <select
               value={formData.period}
               onChange={e => setFormData({...formData, period: e.target.value})}
               className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
            >
               {PERIODS.map(p => (
                  <option key={p} value={p}>{p}</option>
               ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <AlignLeft className="w-3.5 h-3.5" /> Descrição (Tooltip)
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none resize-none"
              placeholder="Explicação breve da meta..."
            />
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
               <Activity className="w-3.5 h-3.5" /> Nome do Indicador
             </label>
             <input
               required
               type="text"
               value={formData.indicatorLabel}
               onChange={e => setFormData({ ...formData, indicatorLabel: e.target.value })}
               className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
               placeholder="Ex: Novos Membros, Workshops"
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" /> Valor Atual
              </label>
              <input
                required
                type="number"
                value={formData.currentValue}
                onChange={e => setFormData({ ...formData, currentValue: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                 <Target className="w-3.5 h-3.5" /> Valor Alvo
              </label>
              <input
                required
                type="number"
                value={formData.targetValue}
                onChange={e => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" /> Cor do Indicador
             </label>
             <div className="flex flex-wrap gap-2">
                {COLORS.map(c => (
                   <button
                     key={c}
                     type="button"
                     onClick={() => setFormData({...formData, color: c})}
                     className={`w-8 h-8 rounded-full ${c} hover:scale-110 transition-transform ${formData.color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                   />
                ))}
             </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
             {goalToEdit ? (
               <button
                 type="button"
                 onClick={handleDelete}
                 disabled={isDeleting}
                 className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
               >
                 {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                 Excluir
               </button>
             ) : <div></div>}
            
             <div className="flex gap-3">
               <button
                 type="button"
                 onClick={onClose}
                 className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors"
               >
                 Cancelar
               </button>
               <button
                 type="submit"
                 disabled={isSubmitting}
                 className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-500/20 flex items-center gap-2"
               >
                 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 Salvar
               </button>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
};


import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, Palette, Image, AlignLeft, LayoutGrid, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useData } from '../context/DataContext';
import { iconMap } from '../lib/utils';

interface ChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterToEdit: any;
}

// Lista de cores do Tailwind para o seletor (Mesma do Settings)
const TW_COLORS = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime', 
  'green', 'emerald', 'teal', 'cyan', 'sky', 
  'blue', 'indigo', 'violet', 'purple', 'fuchsia', 
  'pink', 'rose'
];

export const ChapterModal = ({ isOpen, onClose, chapterToEdit }: ChapterModalProps) => {
  const { fetchData } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    description: '',
    color_theme: '',
    icon_name: 'FolderKanban',
    cover_image_url: ''
  });

  // Gradient Picker State
  const [showGradientPicker, setShowGradientPicker] = useState(false);
  const [gradientState, setGradientState] = useState({
    from: 'blue',
    to: 'indigo'
  });
  const pickerRef = useRef<HTMLDivElement>(null);

  // Icon Picker State
  const [showIconPicker, setShowIconPicker] = useState(false);
  const iconPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && chapterToEdit) {
      setFormData({
        description: chapterToEdit.descricao || '',
        color_theme: chapterToEdit.cor || 'from-blue-600 to-indigo-600',
        icon_name: Object.keys(iconMap).find(key => iconMap[key] === chapterToEdit.icon) || 'FolderKanban',
        cover_image_url: chapterToEdit.coverImage || ''
      });
      
      // Tentar extrair cores do tema atual para inicializar o picker
      if (chapterToEdit.cor) {
        const parts = chapterToEdit.cor.split(' ');
        const fromPart = parts.find((p: string) => p.startsWith('from-'));
        const toPart = parts.find((p: string) => p.startsWith('to-'));
        
        if (fromPart && toPart) {
          const fromColor = fromPart.replace('from-', '').split('-')[0];
          const toColor = toPart.replace('to-', '').split('-')[0];
          setGradientState({ from: fromColor, to: toColor });
        }
      }
    }
  }, [isOpen, chapterToEdit]);

  // Click outside listeners
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowGradientPicker(false);
      }
      if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
        setShowIconPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen || !chapterToEdit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('chapters')
        .update({
          description: formData.description,
          color_theme: formData.color_theme,
          icon_name: formData.icon_name,
          cover_image_url: formData.cover_image_url
        })
        .eq('id', chapterToEdit.id);

      if (error) throw error;
      
      await fetchData(true);
      onClose();
    } catch (e) {
      console.error("Erro ao atualizar capítulo:", e);
      alert("Erro ao atualizar capítulo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyGradient = () => {
    const config = `from-${gradientState.from}-600 to-${gradientState.to}-800`;
    setFormData(prev => ({ ...prev, color_theme: config }));
    setShowGradientPicker(false);
  };

  const SelectedIcon = iconMap[formData.icon_name] || iconMap['FolderKanban'];

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-100 flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-600" />
            Editar Capítulo: {chapterToEdit.sigla}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          
          {/* Descrição */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <AlignLeft className="w-4 h-4" /> Descrição do Capítulo
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 outline-none resize-none text-sm"
              placeholder="Descreva o propósito e as atividades do capítulo..."
            />
          </div>

          {/* URL da Capa */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Image className="w-4 h-4" /> Imagem de Capa (URL)
            </label>
            <input
              type="text"
              value={formData.cover_image_url}
              onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 outline-none text-sm"
              placeholder="https://..."
            />
            {formData.cover_image_url && (
               <div className="h-24 w-full rounded-lg overflow-hidden border border-gray-200 mt-2 relative group">
                  <img src={formData.cover_image_url} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Preview</div>
               </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Gradient Picker */}
             <div className="space-y-2 relative" ref={pickerRef}>
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                   <Palette className="w-4 h-4" /> Tema (Cor)
                </label>
                
                <div 
                   onClick={() => setShowGradientPicker(!showGradientPicker)}
                   className={`h-12 w-full rounded-xl cursor-pointer shadow-sm border border-gray-200 flex items-center justify-center relative bg-gradient-to-br ${formData.color_theme}`}
                >
                   <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded shadow-sm border border-white/30">
                     Alterar Cor
                   </span>
                </div>

                {showGradientPicker && (
                  <div className="absolute left-0 bottom-full mb-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 p-4 animate-in fade-in slide-in-from-bottom-2">
                     <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                       <span className="text-sm font-bold text-gray-800">Gerador de Tema</span>
                       <button type="button" onClick={() => setShowGradientPicker(false)}><X className="w-4 h-4 text-gray-400" /></button>
                     </div>

                     <div className="space-y-3">
                       <div>
                         <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Cor Principal</label>
                         <div className="grid grid-cols-6 gap-1.5">
                            {TW_COLORS.map(color => (
                              <button
                                key={`from-${color}`}
                                type="button"
                                onClick={() => setGradientState(prev => ({ ...prev, from: color }))}
                                className={`w-6 h-6 rounded-full shadow-sm hover:scale-110 transition-transform bg-${color}-600 ${gradientState.from === color ? 'ring-2 ring-offset-2 ring-purple-500' : ''}`}
                              />
                            ))}
                         </div>
                       </div>

                       <div>
                         <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Cor Secundária</label>
                         <div className="grid grid-cols-6 gap-1.5">
                            {TW_COLORS.map(color => (
                              <button
                                key={`to-${color}`}
                                type="button"
                                onClick={() => setGradientState(prev => ({ ...prev, to: color }))}
                                className={`w-6 h-6 rounded-full shadow-sm hover:scale-110 transition-transform bg-${color}-800 ${gradientState.to === color ? 'ring-2 ring-offset-2 ring-purple-500' : ''}`}
                              />
                            ))}
                         </div>
                       </div>

                       <button 
                        type="button" 
                        onClick={applyGradient}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                       >
                         Aplicar
                       </button>
                     </div>
                  </div>
                )}
             </div>

             {/* Icon Picker */}
             <div className="space-y-2 relative" ref={iconPickerRef}>
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                   <LayoutGrid className="w-4 h-4" /> Ícone
                </label>
                
                <button
                   type="button"
                   onClick={() => setShowIconPicker(!showIconPicker)}
                   className="w-full h-12 flex items-center justify-between px-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                >
                   <div className="flex items-center gap-2">
                      <SelectedIcon className="w-5 h-5 text-gray-700" />
                      <span className="text-sm font-medium text-gray-700">{formData.icon_name}</span>
                   </div>
                   <LayoutGrid className="w-4 h-4 text-gray-400" />
                </button>

                {showIconPicker && (
                   <div className="absolute right-0 bottom-full mb-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 p-4 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                         <span className="text-sm font-bold text-gray-800">Selecione um Ícone</span>
                         <button type="button" onClick={() => setShowIconPicker(false)}><X className="w-4 h-4 text-gray-400" /></button>
                      </div>
                      <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                         {Object.keys(iconMap).map(iconKey => {
                            const IconComponent = iconMap[iconKey];
                            const isSelected = formData.icon_name === iconKey;
                            return (
                               <button
                                  key={iconKey}
                                  type="button"
                                  onClick={() => {
                                     setFormData(prev => ({ ...prev, icon_name: iconKey }));
                                     setShowIconPicker(false);
                                  }}
                                  className={`p-2 rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-purple-100 text-purple-600 ring-2 ring-purple-500' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                  title={iconKey}
                               >
                                  <IconComponent className="w-5 h-5" />
                               </button>
                            );
                         })}
                      </div>
                   </div>
                )}
             </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
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
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium shadow-lg shadow-purple-500/20 flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Alterações
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

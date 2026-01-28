
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Calendar, MapPin, AlignLeft, Flag, Briefcase, Loader2, Save, Trash2, Tag, Layers, ChevronDown, Check, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useData } from '../context/DataContext';
import { ConfirmationModal } from './ConfirmationModal';

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: any;
}

const EVENT_CATEGORIES: Record<string, string[]> = {
  'Administrativo (Administrative)': [
    'Reunião da Diretoria (ExCom)',
    'Treinamento de Equipe (Officer Training)'
  ],
  'Humanitário (Humanitarian)': [
    'Outros (Other)',
    'SIGHT'
  ],
  'Não Técnico (Nontechnical)': [
    'Jantar de Premiação (Awards Dinner)',
    'Não Técnico - Outros (Nontechnical - Other)',
    'Atividades Pré-Universitárias (Pre-University Activities)',
    'Social (Social)'
  ],
  'Programa STEM Pré-Universitário (Pre-U STEM Program)': [
    'Acampamento (Camp)',
    'Dia de Carreira (Career Day)',
    'Competições/Feiras STEM (Competition/STEM Fairs)',
    'Meninas em STEM (Girls in STEM)',
    'Visita Técnica/Indústria (Industry/Company Tour)',
    'Mentoria (Mentoring)',
    'Programa para Pais (Parent Program)',
    'Workshop para Alunos (Student Workshop)',
    'Workshop para Professores (Teacher Workshop)'
  ],
  'Profissional (Professional)': [
    'Educação Continuada (Continuing Education)',
    'Relações com a Indústria (Industry Relations)',
    'Profissional - Outros (Professional - Other)',
    'Desenvolvimento Profissional (Professional Development)'
  ],
  'Técnico (Technical)': [
    'N/A'
  ]
};

export const NewEventModal = ({ isOpen, onClose, eventToEdit }: NewEventModalProps) => {
  const { chapters, projects, fetchData } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Custom Dropdown State
  const [showChapterDropdown, setShowChapterDropdown] = useState(false);
  const chapterDropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    location: '',
    description: '',
    chapterId: '',
    projectId: '',
    category: 'Administrativo (Administrative)',
    subCategory: 'Reunião da Diretoria (ExCom)',
    isPublic: false
  });

  // Helper to format Date object to input datetime-local string (YYYY-MM-DDTHH:MM)
  const toDateTimeString = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        setFormData({
          title: eventToEdit.title,
          startDate: toDateTimeString(eventToEdit.startDate),
          endDate: toDateTimeString(eventToEdit.endDate),
          location: eventToEdit.location || '',
          description: eventToEdit.description || '',
          chapterId: eventToEdit.chapterId ? String(eventToEdit.chapterId) : '',
          projectId: eventToEdit.projectId ? String(eventToEdit.projectId) : '',
          category: eventToEdit.category || 'Administrativo (Administrative)',
          subCategory: eventToEdit.subCategory || 'Reunião da Diretoria (ExCom)',
          isPublic: eventToEdit.isPublic || false
        });
      } else {
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        setFormData({
          title: '',
          startDate: toDateTimeString(now.toISOString()),
          endDate: toDateTimeString(oneHourLater.toISOString()),
          location: '',
          description: '',
          chapterId: '',
          projectId: '',
          category: 'Administrativo (Administrative)',
          subCategory: 'Reunião da Diretoria (ExCom)',
          isPublic: false
        });
      }
    }
  }, [isOpen, eventToEdit]);

  // Click outside listener for chapter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chapterDropdownRef.current && !chapterDropdownRef.current.contains(event.target as Node)) {
        setShowChapterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Category Change logic
  const handleCategoryChange = (newCategory: string) => {
    const subCategories = EVENT_CATEGORIES[newCategory] || [];
    let newSub = '';
    
    // Default subcategory logic
    if (subCategories.length === 1 && subCategories[0] === 'N/A') {
        newSub = 'N/A';
    } else if (subCategories.length > 0) {
        newSub = subCategories[0];
    }

    setFormData(prev => ({
        ...prev,
        category: newCategory,
        subCategory: newSub
    }));
  };

  // Logic to filter projects based on selected Chapter
  const filteredProjects = useMemo(() => {
    if (!formData.chapterId) return [];
    
    return projects.filter((p: any) => {
      // Normalize to array to handle both data structures
      const pChapters = Array.isArray(p.capituloId) ? p.capituloId : [p.capituloId];
      // Check if the selected chapter ID is in the project's chapters
      return pChapters.includes(Number(formData.chapterId));
    });
  }, [projects, formData.chapterId]);

  const selectedChapter = chapters.find((c: any) => c.id === Number(formData.chapterId));

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.chapterId) {
      alert("Por favor, selecione um Capítulo.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      title: formData.title,
      start_date: new Date(formData.startDate).toISOString(),
      end_date: new Date(formData.endDate).toISOString(),
      location: formData.location,
      description: formData.description,
      chapter_id: Number(formData.chapterId),
      project_id: formData.projectId ? Number(formData.projectId) : null,
      category: formData.category,
      sub_category: formData.subCategory,
      is_public: formData.isPublic
    };

    try {
      if (eventToEdit) {
        const { error } = await supabase
          .from('events')
          .update(payload)
          .eq('id', eventToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('events')
          .insert([payload]);
        if (error) throw error;
      }
      await fetchData(true);
      onClose();
    } catch (e) {
      console.error("Erro ao salvar evento:", e);
      alert("Erro ao salvar evento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToEdit || !eventToEdit.id) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('events').delete().eq('id', eventToEdit.id);
      if (error) throw error;
      
      await fetchData(true);
      onClose();
    } catch (e: any) {
      console.error("Erro ao deletar:", e);
      alert(`Erro ao deletar evento: ${e.message || 'Erro desconhecido'}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <ConfirmationModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Evento"
        message="Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita."
        type="danger"
        confirmLabel="Sim, excluir"
      />

      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-100 flex flex-col animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              {eventToEdit ? 'Editar Evento' : 'Novo Evento'}
            </h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Título</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                placeholder="Ex: Reunião Geral"
              />
            </div>

            {/* Categorização vTools (Obrigatória) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="md:col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 border-b border-gray-200 pb-1">
                  Classificação vTools (Obrigatório)
              </div>
              
              <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Categoria
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-xs"
                  >
                    {Object.keys(EVENT_CATEGORIES).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
              </div>

              <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Sub-Categoria
                  </label>
                  <select
                    required
                    value={formData.subCategory}
                    onChange={(e) => setFormData({...formData, subCategory: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-xs"
                  >
                    {EVENT_CATEGORIES[formData.category]?.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Início <span className="text-red-500">*</span></label>
                <input
                  required
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Fim <span className="text-red-500">*</span></label>
                <input
                  required
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Local <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                placeholder="Ex: Auditório ou Link Meet"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Custom Chapter Selector */}
              <div className="relative" ref={chapterDropdownRef}>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Flag className="w-3.5 h-3.5" /> Capítulo <span className="text-red-500">*</span>
                </label>
                
                <div 
                  onClick={() => setShowChapterDropdown(!showChapterDropdown)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer flex items-center justify-between hover:bg-gray-100 transition-colors h-[42px]"
                >
                  {selectedChapter ? (
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold text-white bg-gradient-to-br ${selectedChapter.cor}`}>
                        {selectedChapter.sigla}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Selecione...</span>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>

                {showChapterDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                    {chapters.map((c: any) => {
                        const isSelected = String(c.id) === formData.chapterId;
                        return (
                          <div 
                            key={c.id}
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev, 
                                chapterId: String(c.id), 
                                projectId: '' // Reset project when chapter changes
                              }));
                              setShowChapterDropdown(false);
                            }}
                            className={`px-4 py-2.5 hover:bg-gray-50 cursor-pointer flex items-center justify-between text-sm ${isSelected ? 'bg-blue-50' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${c.cor}`}></div>
                                <span className="font-medium text-gray-700">{c.sigla}</span>
                                <span className="text-xs text-gray-400">- {c.nome}</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                          </div>
                        );
                    })}
                  </div>
                )}
              </div>

              {/* Project Selector (Filtered) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" /> Projeto
                </label>
                <select
                  value={formData.projectId}
                  disabled={!formData.chapterId}
                  onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer"
                >
                  <option value="">{formData.chapterId ? "Sem Projeto (Geral)" : "Selecione um Capítulo primeiro"}</option>
                  {filteredProjects.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <AlignLeft className="w-3.5 h-3.5" /> Descrição
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                placeholder="Detalhes sobre o evento..."
              />
            </div>

            {/* VISIBILITY TOGGLE (Divulgação Geral) - MOVED TO BOTTOM & COLOR CHANGED TO LIGHT BLUE */}
            <div className="flex items-center gap-3 p-4 bg-sky-50 rounded-xl border border-sky-200">
              <div 
                onClick={() => setFormData({...formData, isPublic: !formData.isPublic})}
                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 flex-shrink-0 ${formData.isPublic ? 'bg-sky-500' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${formData.isPublic ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
              <div>
                  <label className="text-sm font-bold text-gray-800 cursor-pointer block" onClick={() => setFormData({...formData, isPublic: !formData.isPublic})}>
                    Divulgar na Agenda Geral do Ramo?
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formData.isPublic 
                      ? "Este evento será visível para todo o Ramo na agenda pública." 
                      : "Evento interno, visível apenas no calendário do capítulo."}
                  </p>
              </div>
              <Globe className={`w-6 h-6 ml-auto ${formData.isPublic ? 'text-sky-600' : 'text-gray-300'}`} />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              {eventToEdit ? (
                <button
                  type="button"
                  onClick={handleDeleteClick}
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
    </>
  );
};

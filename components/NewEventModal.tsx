
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Calendar, MapPin, AlignLeft, Flag, Briefcase, Loader2, Save, Trash2, Tag, Layers, ChevronDown, Check, Globe, Video } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
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
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Custom Dropdown State
  const [showChapterDropdown, setShowChapterDropdown] = useState(false);
  const chapterDropdownRef = useRef<HTMLDivElement>(null);

  // New state for multi-day and duration
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(60); // Default 1 hour

  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '', // Will be calculated or manually set
    location: '',
    description: '',
    chapterId: '',
    projectId: '',
    category: 'Administrativo (Administrative)',
    subCategory: 'Reunião da Diretoria (ExCom)',
    isPublic: false,
    eventType: 'Virtual'
  });

  // Filter Chapters based on Permissions
  const allowedChapters = useMemo(() => {
    if (!profile) return [];
    const chaptersList = (profile as any).profile_chapters || (profile as any).profileChapters || [];
    const isGlobalAdmin = chaptersList.some((pc: any) => pc.chapter_id === 1 && pc.permission_slug === 'admin');

    if (isGlobalAdmin) return chapters; // Global Admin sees all

    const myManagedChapterIds = chaptersList
      .filter((pc: any) => ['admin', 'chair', 'manager'].includes(pc.permission_slug))
      .map((pc: any) => pc.chapter_id) || [];

    return chapters.filter((c: any) => myManagedChapterIds.includes(c.id));
  }, [chapters, profile]);

  // Helper to format Date object to input datetime-local string (YYYY-MM-DDTHH:MM)
  const toDateTimeString = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  // Helper to add minutes to a date string
  const addMinutes = (dateString: string, minutes: number) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const newDate = new Date(date.getTime() + minutes * 60000);
    return toDateTimeString(newDate.toISOString());
  };

  // Logic to calculate duration from start and end dates
  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 60;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.round(diffMs / 60000); // Minutes
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
          isPublic: eventToEdit.isPublic || false,
          eventType: eventToEdit.eventType || 'Virtual'
        });

        // Determine if multi-day based on duration > 24h (1440 mins) or just logic preference
        const duration = calculateDuration(eventToEdit.startDate, eventToEdit.endDate);
        setDurationMinutes(duration);
        // If duration is greater than 24 hours, treat as multi-day automatically?
        // Or check if end date is on a different day?
        // For simplicity, let's say if it's longer than a typical meeting (e.g. > 8h) or user explicitly sets it.
        // But better yet, check if end date day != start date day
        const s = new Date(eventToEdit.startDate);
        const e = new Date(eventToEdit.endDate);
        const isDifferentDay = s.getDate() !== e.getDate() || s.getMonth() !== e.getMonth() || s.getFullYear() !== e.getFullYear();
        setIsMultiDay(isDifferentDay);

      } else {
        const now = new Date();
        const startString = toDateTimeString(now.toISOString());
        // Default to first allowed chapter if available and not editing
        const defaultChapterId = allowedChapters.length === 1 ? String(allowedChapters[0].id) : '';

        // Default duration 1h
        const defaultDuration = 60;
        const endString = addMinutes(startString, defaultDuration);

        setFormData({
          title: '',
          startDate: startString,
          endDate: endString,
          location: '',
          description: '',
          chapterId: defaultChapterId,
          projectId: '',
          category: 'Administrativo (Administrative)',
          subCategory: 'Reunião da Diretoria (ExCom)',
          isPublic: false,
          eventType: 'Virtual'
        });
        setDurationMinutes(defaultDuration);
        setIsMultiDay(false);
      }
    }
  }, [isOpen, eventToEdit?.id]);

  // Recalculate End Date when Start Date or Duration changes (ONLY if NOT multi-day)
  useEffect(() => {
    if (!isMultiDay && formData.startDate) {
      const newEndDate = addMinutes(formData.startDate, durationMinutes);
      setFormData(prev => {
        if (prev.endDate !== newEndDate) {
          return { ...prev, endDate: newEndDate };
        }
        return prev;
      });
    }
  }, [formData.startDate, durationMinutes, isMultiDay]);

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

  const selectedChapter = allowedChapters.find((c: any) => c.id === Number(formData.chapterId));

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
      is_public: formData.isPublic,
      event_type: formData.eventType
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

  // Duration Options
  const durationOptions = [
    { label: '30 minutos', value: 30 },
    { label: '45 minutos', value: 45 },
    { label: '1 hora', value: 60 },
    { label: '1.5 horas', value: 90 },
    { label: '2 horas', value: 120 },
    { label: '3 horas', value: 180 },
    { label: '4 horas', value: 240 },
    { label: 'Dia todo (8h)', value: 480 },
  ];

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
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-xs"
                >
                  {EVENT_CATEGORIES[formData.category]?.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Selection Logic */}
            <div className={`space-y-4 border rounded-xl p-4 ${isMultiDay ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Data e Horário</span>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="multiDay"
                    checked={isMultiDay}
                    onChange={(e) => setIsMultiDay(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="multiDay" className="text-sm text-gray-600 cursor-pointer select-none">
                    Evento de múltiplos dias?
                  </label>
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
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                  />
                </div>

                {isMultiDay ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Fim <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                      min={formData.startDate}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Duração</label>
                    <select
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                    >
                      {durationOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                      {/* Add custom duration if current value is not in options */}
                      {!durationOptions.find(opt => opt.value === durationMinutes) && (
                        <option value={durationMinutes}>{durationMinutes} minutos (Personalizado)</option>
                      )}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Fim calculado: {formData.endDate ? new Date(formData.endDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </p>
                  </div>
                )}
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

            {/* Event Type Toggle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Evento</label>
              <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 w-full">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, eventType: 'Virtual' })}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${formData.eventType === 'Virtual' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Video className="w-4 h-4" /> Virtual
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, eventType: 'InPerson' })}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${formData.eventType === 'InPerson' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <MapPin className="w-4 h-4" /> Presencial
                </button>
              </div>
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
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold text-white bg-gradient-to-br shrink-0 ${selectedChapter.color_theme || selectedChapter.cor}`}>
                        {selectedChapter.icon && <selectedChapter.icon className="w-3 h-3" />}
                        {selectedChapter.sigla}
                      </span>
                      <span className="text-gray-700 text-sm font-medium truncate">
                        {selectedChapter.nome || selectedChapter.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Selecione...</span>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-1" />
                </div>

                {showChapterDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                    {allowedChapters.map((c: any) => {
                      const isSelected = String(c.id) === formData.chapterId;
                      const ChapterIcon = c.icon;
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
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className={`w-2 h-2 rounded-full shrink-0 bg-gradient-to-br ${c.color_theme || c.cor}`}></div>
                            {ChapterIcon && <ChapterIcon className="w-4 h-4 text-gray-500 shrink-0" />}
                            <span className="font-bold text-gray-800 shrink-0">{c.sigla}</span>
                            <span className="text-gray-600 truncate">- {c.nome || c.name}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
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
                onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 flex-shrink-0 ${formData.isPublic ? 'bg-sky-500' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${formData.isPublic ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-800 cursor-pointer block" onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}>
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

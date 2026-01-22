
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, 
  ArrowLeft, 
  Target, 
  Plus, 
  Edit2, 
  HelpCircle, 
  Briefcase, 
  ChevronDown, 
  Palette, 
  Image, 
  AlignLeft, 
  LayoutGrid, 
  Save, 
  Loader2, 
  X, 
  ExternalLink,
  Calendar,
  Mail,
  Hash,
  Globe,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { NewGoalModal } from '../../components/NewGoalModal';
import { supabase } from '../../lib/supabase';
import { iconMap } from '../../lib/utils';

// Interfaces & Constants
interface LinkItem {
  title: string;
  url: string;
  emoji: string;
}

const COMMON_EMOJIS = [
  '🔗', '📌', '📎', '📁', '📂', 
  '📄', '📝', '📊', '📑', '📕', 
  '💡', '🧠', '⚙️', '🛠️', '💻', 
  '🖥️', '📱', '📷', '🎥', '🎬',
  '🌐', '📧', '💬', '📢', '✅', 
  '⚠️', '🚨', '🚧', '📅', '⭐'
];

const TW_COLORS = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime', 
  'green', 'emerald', 'teal', 'cyan', 'sky', 
  'blue', 'indigo', 'violet', 'purple', 'fuchsia', 
  'pink', 'rose'
];

export const ChapterChairPage = () => {
  const navigate = useNavigate();
  const { chapters, chapterGoals, users, fetchData } = useData();
  
  // States Gerais
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [activePeriod, setActivePeriod] = useState<string>('');
  
  // Modal States (Metas)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);

  // --- States do Formulário de Edição (Incorporado) ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    email: '',
    color_theme: '',
    icon_name: 'FolderKanban',
    cover_image_url: '',
    calendar_url: '',
    keywords: '' 
  });

  // Links State
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [newLink, setNewLink] = useState<LinkItem>({ title: '', url: '', emoji: '🔗' });
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

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

  // Inicializa com o primeiro capítulo se disponível
  useEffect(() => {
    if (chapters.length > 0 && !selectedChapterId) {
      setSelectedChapterId(String(chapters[0].id));
    }
  }, [chapters, selectedChapterId]);

  // Filtragem de Dados
  const currentChapter = chapters.find((c: any) => c.id === Number(selectedChapterId));
  
  // Atualiza o form quando muda o capítulo
  useEffect(() => {
    if (currentChapter) {
      setFormData({
        description: currentChapter.descricao || '',
        email: currentChapter.email || '',
        color_theme: currentChapter.cor || 'from-blue-600 to-indigo-600',
        icon_name: currentChapter.icon_name || Object.keys(iconMap).find(key => iconMap[key] === currentChapter.icon) || 'FolderKanban',
        cover_image_url: currentChapter.coverImage || '',
        calendar_url: currentChapter.calendarUrl || '',
        keywords: Array.isArray(currentChapter.keywords) ? currentChapter.keywords.join(', ') : ''
      });
      
      setLinks(currentChapter.links || []);

      if (currentChapter.cor) {
        const parts = currentChapter.cor.split(' ');
        const fromPart = parts.find((p: string) => p.startsWith('from-'));
        const toPart = parts.find((p: string) => p.startsWith('to-'));
        
        if (fromPart && toPart) {
          const fromColor = fromPart.replace('from-', '').split('-')[0];
          const toColor = toPart.replace('to-', '').split('-')[0];
          setGradientState({ from: fromColor, to: toColor });
        }
      }
    }
  }, [currentChapter]);

  // Click outside listeners para os pickers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowGradientPicker(false);
      }
      if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
        setShowIconPicker(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredGoals = useMemo(() => 
    chapterGoals.filter((g: any) => g.chapter_id === Number(selectedChapterId)),
  [chapterGoals, selectedChapterId]);

  const availablePeriods = useMemo(() => {
    const periods = Array.from(new Set(filteredGoals.map((g: any) => g.period || 'Anual')));
    const sortOrder: Record<string, number> = { 'Mensal': 1, 'Trimestral': 2, 'Semestral': 3, 'Anual': 4 };
    return periods.sort((a: any, b: any) => (sortOrder[a] || 9) - (sortOrder[b] || 9));
  }, [filteredGoals]);

  useEffect(() => {
    if (availablePeriods.length > 0 && !availablePeriods.includes(activePeriod)) {
      setActivePeriod(availablePeriods[0]);
    } else if (availablePeriods.length === 0) {
      setActivePeriod('Anual'); 
    }
  }, [availablePeriods, activePeriod]);

  const goalsToDisplay = filteredGoals.filter((g: any) => (g.period || 'Anual') === activePeriod);
  const chapterMembers = users.filter((u: any) => u.chapterIds && u.chapterIds.includes(Number(selectedChapterId)));

  // Handlers
  const handleEditGoal = (goal: any) => {
    setSelectedGoal(goal);
    setIsGoalModalOpen(true);
  };

  const handleNewGoal = () => {
    if (!selectedChapterId) {
        alert("Selecione um capítulo primeiro.");
        return;
    }
    setSelectedGoal(null);
    setIsGoalModalOpen(true);
  };

  // Handler de Update do Capítulo
  const handleUpdateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentChapter) return;
    setIsSubmitting(true);

    try {
      // Parse keywords: split by comma, trim whitespace, ensure hashtag
      const keywordsArray = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k !== '')
        .map(k => k.startsWith('#') ? k : `#${k}`); // Ensure hashtag prefix

      const { error } = await supabase
        .from('chapters')
        .update({
          description: formData.description,
          email: formData.email,
          color_theme: formData.color_theme,
          icon_name: formData.icon_name,
          cover_image_url: formData.cover_image_url,
          calendar_url: formData.calendar_url || null,
          keywords: keywordsArray
        })
        .eq('id', currentChapter.id);

      if (error) throw error;
      
      await fetchData(true);
      alert("Capítulo atualizado com sucesso!");
    } catch (e) {
      console.error("Erro ao atualizar capítulo:", e);
      alert("Erro ao atualizar capítulo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Links
  const handleAddLink = async () => {
    if (!newLink.url || !newLink.title || !currentChapter) return;
    setIsAddingLink(true);
    const updatedLinks = [...links, newLink];
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ content_url: JSON.stringify(updatedLinks) })
        .eq('id', currentChapter.id);
      
      if (error) throw error;
      setNewLink({ title: '', url: '', emoji: '🔗' });
      await fetchData(true);
    } catch (e) {
      console.error("Error saving link", e);
      alert("Erro ao salvar link");
    } finally {
      setIsAddingLink(false);
    }
  };

  const handleDeleteLink = async (index: number) => {
    if (!currentChapter) return;
    const updatedLinks = links.filter((_, i) => i !== index);
    setLinks(updatedLinks); // Optimistic UI
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ content_url: JSON.stringify(updatedLinks) })
        .eq('id', currentChapter.id);
      
      if (error) throw error;
      await fetchData(true);
    } catch (e) {
      console.error("Error removing link", e);
      alert("Erro ao remover link");
    }
  };

  const applyGradient = () => {
    const config = `from-${gradientState.from}-600 to-${gradientState.to}-800`;
    setFormData(prev => ({ ...prev, color_theme: config }));
    setShowGradientPicker(false);
  };

  // Ícone visualizado no botão principal (usa fallback se o nome digitado não existir no mapa)
  const SelectedIcon = iconMap[formData.icon_name] || iconMap['FolderKanban'];

  return (
    <div className="space-y-6 pb-20">
      {/* Modal de Metas */}
      {selectedChapterId && (
        <NewGoalModal 
          isOpen={isGoalModalOpen} 
          onClose={() => setIsGoalModalOpen(false)}
          chapterId={Number(selectedChapterId)}
          goalToEdit={selectedGoal}
        />
      )}

      {/* Header e Navegação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão do Capítulo</h1>
            <p className="text-gray-500 text-sm">Administração de metas e OKRs por unidade.</p>
          </div>
        </div>

        {/* Seletor de Capítulo */}
        <div className="relative min-w-[250px]">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <Briefcase className="h-4 w-4 text-gray-400" />
           </div>
           <select
             value={selectedChapterId}
             onChange={(e) => setSelectedChapterId(e.target.value)}
             className="block w-full pl-10 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-xl border bg-white shadow-sm appearance-none cursor-pointer"
           >
             {chapters.map((c: any) => (
               <option key={c.id} value={c.id}>{c.sigla} - {c.nome}</option>
             ))}
           </select>
           <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
             <ChevronDown className="h-4 w-4 text-gray-400" />
           </div>
        </div>
      </div>

      {currentChapter ? (
        <div className="space-y-8">
          {/* Cartão de Resumo do Capítulo */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between relative group/card">
             <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${currentChapter.cor} flex items-center justify-center text-white shadow-md transition-all duration-300`}>
                   <Users className="w-7 h-7" />
                </div>
                <div>
                   <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                     {currentChapter.nome}
                   </h2>
                   <p className="text-gray-500 text-sm">{chapterMembers.length} Membros Ativos</p>
                </div>
             </div>
             <div className="text-right hidden sm:block">
                <span className="text-3xl font-bold text-gray-900">{filteredGoals.length}</span>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Metas Totais</p>
             </div>
          </div>

          {/* Área de Metas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
               <div className="flex items-center gap-2">
                 <Target className="w-6 h-6 text-purple-600" />
                 <h2 className="text-xl font-bold text-gray-900">Painel de Metas e OKRs</h2>
               </div>
               
               <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                  {availablePeriods.length > 0 && availablePeriods.map(period => (
                    <button
                      key={period}
                      onClick={() => setActivePeriod(period)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border whitespace-nowrap ${
                        activePeriod === period 
                          ? 'bg-purple-100 text-purple-700 border-purple-200 shadow-sm' 
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      {period}
                    </button>
                  ))}

                  <div className="w-px h-6 bg-gray-200 mx-2 hidden md:block"></div>

                  <button 
                      onClick={handleNewGoal}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
                  >
                      <Plus className="w-4 h-4" />
                      Nova Meta
                  </button>
               </div>
            </div>
            
            <div className="space-y-6">
              {goalsToDisplay.length > 0 ? (
                goalsToDisplay.map((goal: any) => {
                  const percentage = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
                  const createdDate = goal.created_at ? new Date(goal.created_at).toLocaleDateString('pt-BR') : 'Data desconhecida';
                  
                  return (
                    <div key={goal.id} className="group relative border border-gray-50 hover:border-gray-100 rounded-xl p-4 transition-all hover:bg-gray-50">
                      <button 
                        onClick={() => handleEditGoal(goal)}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                        title="Editar Meta"
                      >
                         <Edit2 className="w-4 h-4" />
                      </button>
                      
                      <div className="flex justify-between items-end mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900 text-lg">{goal.title}</h4>
                            {goal.description && (
                              <div className="group/desc relative">
                                <HelpCircle className="w-4 h-4 text-gray-300 hover:text-gray-500 cursor-help transition-colors" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 text-white text-xs p-3 rounded-lg opacity-0 group-hover/desc:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                  {goal.description}
                                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                                </div>
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-gray-500 font-medium flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${goal.color || 'bg-blue-600'}`}></div>
                             {goal.indicator_label}: {goal.current_value} / {goal.target_value}
                          </span>
                        </div>
                        
                        <div className="group/perc relative">
                          <span className="font-bold text-gray-900 text-xl cursor-default">{percentage}%</span>
                          <div className="absolute bottom-full right-0 mb-2 w-max bg-gray-900 text-white text-xs p-2 rounded-lg opacity-0 group-hover/perc:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl whitespace-nowrap">
                             Criada em: {createdDate}
                             <div className="absolute -bottom-1 right-2 w-2 h-2 bg-gray-900 rotate-45"></div>
                          </div>
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-3 rounded-full ${goal.color || 'bg-blue-600'} transition-all duration-1000`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center">
                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Target className="w-8 h-8 text-gray-300" />
                   </div>
                   <p className="text-base font-medium text-gray-600">Nenhuma meta {activePeriod ? activePeriod.toLowerCase() : ''} definida.</p>
                   <p className="text-sm text-gray-400 mt-1 max-w-xs">Crie metas para acompanhar o progresso deste capítulo.</p>
                   <button onClick={handleNewGoal} className="mt-4 text-blue-600 hover:text-blue-800 font-bold text-sm">
                      Criar primeira meta
                   </button>
                </div>
              )}
            </div>
          </div>

          {/* Área de Edição do Capítulo (INCORPORADA) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
             <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                <Palette className="w-6 h-6 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-900">Configurações Gerais</h2>
             </div>

             <form onSubmit={handleUpdateChapter} className="space-y-6">
                
                {/* Descrição */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <AlignLeft className="w-4 h-4" /> Descrição do Capítulo
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 outline-none resize-none text-sm"
                    placeholder="Descreva o propósito e as atividades do capítulo..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> E-mail de Contato
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 outline-none text-sm"
                    placeholder="exemplo@ieee.unb.br"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    {/* URL do Calendário */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Calendário Externo (ICS)
                      </label>
                      <input
                        type="text"
                        value={formData.calendar_url}
                        onChange={(e) => setFormData({ ...formData, calendar_url: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 outline-none text-sm"
                        placeholder="https://calendar.google.com/..."
                      />
                      <p className="text-[10px] text-gray-500">
                        Link público no formato iCal (.ics) para sincronizar eventos externos.
                      </p>
                    </div>
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
                         <div className="absolute right-0 bottom-full mb-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 p-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                               <span className="text-sm font-bold text-gray-800">Selecione ou Digite</span>
                               <button type="button" onClick={() => setShowIconPicker(false)}><X className="w-4 h-4 text-gray-400" /></button>
                            </div>

                            {/* Manual Input & Link Section */}
                            <div className="mb-3 space-y-2">
                               <input 
                                 type="text" 
                                 value={formData.icon_name}
                                 onChange={(e) => setFormData({...formData, icon_name: e.target.value})}
                                 onKeyDown={(e) => {
                                   // Previne que o Enter envie o formulário principal
                                   if(e.key === 'Enter') {
                                     e.preventDefault();
                                     setShowIconPicker(false);
                                   }
                                 }}
                                 className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300 transition-all placeholder-gray-400"
                                 placeholder="Nome do ícone (ex: adjustments-horizontal)"
                               />
                               <div className="flex justify-end">
                                  <a 
                                    href="https://heroicons.com/" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-[10px] text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1 transition-colors"
                                  >
                                    Ver biblioteca de ícones (Heroicons/Lucide) <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                               </div>
                            </div>

                            <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1 border-t border-gray-50 pt-2">
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

                {/* --- SEÇÃO VTOOLS (KEYWORDS) --- */}
                <div className="border-t border-gray-100 pt-6 mt-2">
                   <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white">
                         <Hash className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Configurações vTools</h3>
                   </div>
                   
                   <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Keywords / Hashtags</label>
                      <textarea
                        rows={3}
                        value={formData.keywords}
                        onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-200 outline-none text-sm font-mono"
                        placeholder="robotics, engineering, unb"
                      />
                      <p className="text-[10px] text-gray-500">
                         Insira as palavras-chave separadas por vírgula. Elas são usadas para categorização no vTools.
                      </p>
                      
                      {/* Preview das Tags */}
                      {formData.keywords && (
                         <div className="flex flex-wrap gap-2 mt-2">
                            {formData.keywords.split(',').map(k => k.trim()).filter(k => k !== '').map((k, idx) => (
                               <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono border border-gray-200">
                                  {k.startsWith('#') ? k : `#${k}`}
                               </span>
                            ))}
                         </div>
                      )}
                   </div>
                </div>

                {/* --- SEÇÃO DE RECURSOS E LINKS (ADD/REMOVE) --- */}
                <div className="border-t border-gray-100 pt-6 mt-2">
                   <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                         <Globe className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Recursos e Links</h3>
                   </div>

                   {/* Gallery Grid */}
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                      {links.map((link, idx) => (
                        <div 
                            key={idx} 
                            className="group relative bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:shadow-md hover:border-blue-200 transition-all h-32"
                        >
                            <span className="text-3xl mb-2 block">{link.emoji}</span>
                            <span className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight">{link.title}</span>
                            
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteLink(idx); }}
                                className="absolute top-1 right-1 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                                title="Remover link"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                      ))}
                      
                      {/* Add Link Card */}
                      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-3 flex flex-col items-center justify-center text-center h-32 relative">
                          {!isAddingLink ? (
                              <div className="cursor-pointer w-full h-full flex flex-col items-center justify-center" onClick={() => setIsAddingLink(true)}>
                                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-2 shadow-sm text-blue-600">
                                  <Plus className="w-5 h-5" />
                                  </div>
                                  <span className="text-xs font-medium text-gray-500">Adicionar Link</span>
                              </div>
                          ) : (
                              <div className="w-full h-full flex flex-col gap-2">
                                <div className="flex gap-1 items-center">
                                    {/* Emoji Picker Trigger */}
                                    <div className="relative" ref={emojiPickerRef}>
                                      <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="w-8 h-8 text-center text-lg border border-gray-200 rounded bg-white hover:bg-gray-50 flex items-center justify-center transition-colors outline-none focus:ring-2 focus:ring-blue-100 overflow-hidden"
                                      >
                                        {newLink.emoji || '🔗'}
                                      </button>

                                      {/* Mini Emoji Picker */}
                                      {showEmojiPicker && (
                                        <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 shadow-xl rounded-xl p-3 z-50 w-64 animate-in fade-in zoom-in-95 duration-200">
                                          <div className="grid grid-cols-6 gap-2">
                                            {COMMON_EMOJIS.map((emoji) => (
                                                <button
                                                  key={emoji}
                                                  type="button"
                                                  onClick={() => {
                                                    setNewLink({ ...newLink, emoji });
                                                    setShowEmojiPicker(false);
                                                  }}
                                                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-lg transition-colors"
                                                >
                                                  {emoji}
                                                </button>
                                            ))}
                                          </div>
                                          <div className="mt-2 pt-2 border-t border-gray-100">
                                            <input 
                                                type="text"
                                                className="w-full px-2 py-1.5 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all placeholder:text-gray-400"
                                                placeholder="Ou digite..."
                                                value={newLink.emoji}
                                                onChange={(e) => setNewLink({ ...newLink, emoji: e.target.value })}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <input 
                                      className="flex-1 px-2 text-xs border border-gray-200 rounded bg-white outline-none focus:border-blue-500 h-8"
                                      placeholder="Título"
                                      value={newLink.title}
                                      onChange={e => setNewLink({...newLink, title: e.target.value})} 
                                    />
                                </div>
                                <input 
                                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-white outline-none focus:border-blue-500"
                                    placeholder="URL (https://...)"
                                    value={newLink.url}
                                    onChange={e => setNewLink({...newLink, url: e.target.value})} 
                                />
                                <div className="flex gap-1 mt-auto">
                                    <button onClick={() => setIsAddingLink(false)} className="flex-1 py-1 text-[10px] bg-gray-200 hover:bg-gray-300 rounded text-gray-600">Cancelar</button>
                                    <button onClick={handleAddLink} className="flex-1 py-1 text-[10px] bg-blue-600 hover:bg-blue-700 rounded text-white font-medium">Salvar</button>
                                </div>
                              </div>
                          )}
                      </div>
                   </div>
                </div>

                <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium shadow-lg shadow-purple-500/20 flex items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Alterações
                  </button>
                </div>
             </form>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-100">
           <p>Carregando capítulos ou nenhum capítulo disponível...</p>
        </div>
      )}
    </div>
  );
};

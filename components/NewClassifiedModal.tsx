
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, Lightbulb, HandHelping, Image as ImageIcon, Briefcase, FolderKanban, User, Check, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from '../lib/utils';

interface NewClassifiedModalProps {
  isOpen: boolean;
  onClose: () => void;
  classifiedToEdit?: any; // Novo prop para edição
}

export const NewClassifiedModal = ({ isOpen, onClose, classifiedToEdit }: NewClassifiedModalProps) => {
  const { tasks, chapters, projects, users, fetchData } = useData();
  const { user, profile } = useAuth(); // Assuming useAuth exists
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'help' | 'idea'>('help');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    taskId: '',
    // responsibleName removed
    chapterIds: [] as number[]
  });

  const [newOfferText, setNewOfferText] = useState('');
  const isOwnerOrAdmin = profile?.role === 'admin' || (classifiedToEdit && classifiedToEdit.responsible_id === profile?.id);
  const isEditingAnotherUser = classifiedToEdit && !isOwnerOrAdmin;

  // States para lógica de seleção
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const [chapterDropdownOpen, setChapterDropdownOpen] = useState(false);
  const chapterDropdownRef = useRef<HTMLDivElement>(null);



  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chapterDropdownRef.current && !chapterDropdownRef.current.contains(event.target as Node)) {
        setChapterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Populate form on Open
  useEffect(() => {
    if (isOpen) {
      if (classifiedToEdit) {
        // Modo Edição
        setActiveTab(classifiedToEdit.type as 'help' | 'idea');
        setFormData({
          title: classifiedToEdit.title,
          description: classifiedToEdit.description,
          imageUrl: classifiedToEdit.imageUrl || '',
          taskId: classifiedToEdit.taskId ? String(classifiedToEdit.taskId) : '',
          chapterIds: classifiedToEdit.chapterIds || []
        });

        // Se tiver tarefa vinculada, tentar encontrar o projeto para pré-selecionar
        if (classifiedToEdit.taskId) {
          const task = tasks.find((t: any) => t.id === Number(classifiedToEdit.taskId));
          if (task) {
            setSelectedProjectId(String(task.projetoId));
          }
        } else {
          setSelectedProjectId('');
        }

      } else {
        // Modo Criação (Reset)
        setFormData({
          title: '',
          description: '',
          imageUrl: '',
          taskId: '',
          chapterIds: []
        });
        setSelectedProjectId('');
        setActiveTab('help');
      }
    }
  }, [isOpen, classifiedToEdit, tasks]);

  if (!isOpen) return null;

  const handleAppendOffer = async () => {
    if (!newOfferText.trim()) return;
    setIsSubmitting(true);
    try {
      // Formata a oferta com nome e data
      const timestamp = new Date().toLocaleString('pt-BR');
      const senderName = profile?.full_name || user?.email || 'Anônimo';
      const formattedOffer = `--- Oferta de: ${senderName} (${timestamp}) ---\n${newOfferText}\n`;

      const { error } = await supabase.rpc('append_classified_offer', {
        p_classified_id: classifiedToEdit.id,
        p_offer_text: formattedOffer
      });

      if (error) throw error;

      await fetchData(true);
      onClose();
      alert("Proposta de ajuda enviada com sucesso!");
    } catch (e: any) {
      console.error("Erro ao enviar oferta:", e);
      alert(`Erro ao enviar oferta: ${e.message || JSON.stringify(e)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload: any = {
      type: activeTab,
      title: formData.title,
      description: formData.description,
      image_url: formData.imageUrl || null,
      responsible_id: profile?.id, // Use logged profile ID
      chapter_ids: formData.chapterIds.length > 0 ? formData.chapterIds : null,
      task_id: activeTab === 'help' && formData.taskId ? Number(formData.taskId) : null
    };

    try {
      if (classifiedToEdit) {
        const { error } = await supabase
          .from('classifieds')
          .update(payload)
          .eq('id', classifiedToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('classifieds').insert([payload]);
        if (error) throw error;
      }

      await fetchData(true);
      onClose();
    } catch (e: any) {
      console.error("Erro ao salvar classificado:", e);
      alert(`Erro ao salvar classificado: ${e.message || JSON.stringify(e)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChapterToggle = (id: number) => {
    setFormData(prev => {
      const exists = prev.chapterIds.includes(id);
      return {
        ...prev,
        chapterIds: exists ? prev.chapterIds.filter(c => c !== id) : [...prev.chapterIds, id]
      };
    });
  };



  const projectTasks = tasks.filter((t: any) => t.projetoId === Number(selectedProjectId) && t.status !== 'done' && t.status !== 'archived');

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-paper rounded-sm shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border-4 border-double border-gray-400 flex flex-col animate-in zoom-in-95 duration-200 font-serif">

        {/* Header Newspaper Style */}
        <div className="border-b-2 border-gray-800 p-6 bg-[#f4f1ea] relative">
          <button onClick={onClose} className="absolute right-4 top-4 text-gray-500 hover:text-black">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-3xl font-bold text-gray-900 text-center font-newspaper uppercase tracking-wider">
            {classifiedToEdit ? 'Editar Anúncio' : 'Criar Anúncio'}
          </h2>
          <div className="w-full h-px bg-gray-400 mt-2 mb-1"></div>
          <div className="w-full h-px bg-gray-400"></div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-300">
          {/* Se estiver editando outro user, esconde tabs de Type */}
          {!isEditingAnotherUser && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('help')}
                className={`flex-1 py-4 text-center font-bold text-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'help' ? 'bg-[#f4f1ea] text-black border-b-2 border-black' : 'bg-gray-200 text-gray-500 hover:bg-gray-100'}`}
              >
                <HandHelping className="w-5 h-5" />
                Pedir Ajuda
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('idea')}
                className={`flex-1 py-4 text-center font-bold text-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'idea' ? 'bg-[#f4f1ea] text-black border-b-2 border-black' : 'bg-gray-200 text-gray-500 hover:bg-gray-100'}`}
              >
                <Lightbulb className="w-5 h-5" />
                Nova Ideia
              </button>
            </>
          )}
          {isEditingAnotherUser && (
            <div className="w-full py-4 text-center font-bold text-lg bg-[#f4f1ea] text-black uppercase tracking-widest border-b-2 border-black">
              Propor Ajuda / Solução
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-[#fbfae9]">

          {/* SEÇÃO PROPOR AJUDA (Topo para Não-Donos) */}
          {isEditingAnotherUser && (
            <div className="bg-yellow-50 border-2 border-yellow-400 p-4 mb-6 shadow-md">
              <label className="block text-sm font-bold text-yellow-800 uppercase tracking-wide mb-2 flex items-center gap-2">
                <HandHelping className="w-4 h-4" /> Propor Ajuda
              </label>
              <textarea
                rows={4}
                className="w-full p-3 border border-yellow-600 bg-white font-sans text-sm mb-3 focus:ring-2 focus:ring-yellow-500 outline-none"
                placeholder="Olá! Posso ajudar com isso. Meu nome é [Seu Nome], meu contato é [Zap/Email]..."
                value={newOfferText}
                onChange={(e) => setNewOfferText(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAppendOffer}
                disabled={isSubmitting || !newOfferText.trim()}
                className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold uppercase tracking-widest text-xs transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Enviando...' : 'Publicar Proposta de Ajuda'}
              </button>
            </div>
          )}

          {/* Campo de Ajuda Específico: Vincular Tarefa (2 Etapas) */}
          {activeTab === 'help' && !isEditingAnotherUser && (
            <div className="space-y-3 bg-white p-3 border border-gray-300 shadow-sm">
              <label className="block text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">Vincular Tarefa (Opcional)</label>

              {/* 1. Selecionar Projeto */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">1. Selecione o Projeto</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      setFormData(prev => ({ ...prev, taskId: '' })); // Reset task when project changes
                    }}
                    className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-300 text-sm font-sans focus:ring-1 focus:ring-black outline-none"
                  >
                    <option value="">Selecione um projeto...</option>
                    {projects.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* 2. Selecionar Tarefa */}
              <div className="space-y-1">
                <label className={`text-xs font-bold uppercase ${!selectedProjectId ? 'text-gray-300' : 'text-gray-500'}`}>2. Selecione a Tarefa</label>
                <div className="relative">
                  <Check className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${!selectedProjectId ? 'text-gray-300' : 'text-gray-500'}`} />
                  <select
                    value={formData.taskId}
                    disabled={!selectedProjectId}
                    onChange={(e) => {
                      const tId = e.target.value;
                      const task = tasks.find((t: any) => t.id === Number(tId));
                      setFormData(prev => ({
                        ...prev,
                        taskId: tId,
                        title: (!prev.title || (task && prev.title === `Ajuda: ${task.titulo}`)) && task ? `Ajuda: ${task.titulo}` : prev.title
                      }));
                    }}
                    className="w-full pl-10 pr-8 py-2 bg-white border border-gray-300 text-sm font-sans focus:ring-1 focus:ring-black outline-none disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">
                      {!selectedProjectId ? 'Selecione um projeto primeiro' : (projectTasks.length === 0 ? 'Nenhuma tarefa ativa neste projeto' : 'Selecione a tarefa...')}
                    </option>
                    {projectTasks.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.titulo}</option>
                    ))}
                  </select>
                  <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${!selectedProjectId ? 'text-gray-300' : 'text-gray-400'}`} />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-800 uppercase tracking-wide">Título do Anúncio *</label>
            <input
              required
              disabled={isEditingAnotherUser}
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-white border border-gray-400 rounded-none focus:ring-1 focus:ring-black focus:border-black outline-none font-serif text-lg font-bold disabled:bg-gray-100 disabled:text-gray-500"
              placeholder={activeTab === 'help' ? "Preciso de ajuda com..." : "Minha grande ideia..."}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-800 uppercase tracking-wide">Descrição da Proposta *</label>
            <textarea
              required
              disabled={isEditingAnotherUser}
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-white border border-gray-400 rounded-none focus:ring-1 focus:ring-black focus:border-black outline-none font-sans leading-relaxed disabled:bg-gray-100 disabled:text-gray-500"
              placeholder={activeTab === 'help' ? "Descreva o que precisa ser feito e quais habilidades são necessárias..." : "Descreva sua ideia, o público alvo e o impacto esperado..."}
            />
          </div>

          {/* Campos Opcionais para IDEIA ou AJUDA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-300 border-dashed">

            {/* Capítulos - Multi Select */}
            <div className="space-y-2 relative" ref={chapterDropdownRef}>
              <label className="block text-xs font-bold text-gray-600 uppercase">Capítulos Envolvidos</label>
              <div
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-none text-sm font-sans min-h-[38px] cursor-pointer flex flex-wrap gap-1 items-center"
                onClick={() => setChapterDropdownOpen(!chapterDropdownOpen)}
              >
                {formData.chapterIds.length === 0 && <span className="text-gray-400 text-xs">Selecione...</span>}
                {formData.chapterIds.map(id => {
                  const chap = chapters.find((c: any) => c.id === id);
                  return chap ? (
                    <span key={id} className="bg-gray-200 text-gray-700 px-1.5 py-0.5 text-xs font-bold flex items-center gap-1">
                      {chap.sigla}
                      <button
                        type="button"
                        className="hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChapterToggle(id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ) : null;
                })}
                <ChevronDown className="w-3 h-3 ml-auto text-gray-400" />
              </div>

              {chapterDropdownOpen && (
                <div className="absolute top-full left-0 w-full bg-white border border-gray-400 shadow-lg z-10 max-h-40 overflow-y-auto mt-1">
                  {chapters.map((c: any) => (
                    <div
                      key={c.id}
                      className={`px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between text-sm ${formData.chapterIds.includes(c.id) ? 'bg-gray-50 font-bold' : ''}`}
                      onClick={() => handleChapterToggle(c.id)}
                    >
                      <div className="flex items-center gap-2">
                        <FolderKanban className="w-3 h-3 text-gray-500" />
                        {c.sigla} - {c.nome}
                      </div>
                      {formData.chapterIds.includes(c.id) && <Check className="w-3 h-3 text-green-600" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> URL da Imagem (Opcional)
            </label>
            <input
              type="text"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-4 py-2 bg-white border border-gray-400 rounded-none focus:ring-1 focus:ring-black focus:border-black outline-none font-sans text-sm"
              placeholder="https://exemplo.com/imagem.jpg"
            />
            {formData.imageUrl && (
              <div className="mt-2 h-32 w-full bg-gray-200 border border-gray-400 overflow-hidden flex items-center justify-center">
                <img src={formData.imageUrl} alt="Preview" className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all" />
              </div>
            )}
          </div>

          {/* Seção de Ofertas de Ajuda (Visualização do Histórico) */}
          {classifiedToEdit && classifiedToEdit.offers_text && (
            <div className="space-y-4 pt-4 border-t border-gray-300">
              <h3 className="text-lg font-bold font-newspaper uppercase tracking-wide">
                Histórico de Propostas
              </h3>

              <div className="bg-white p-4 border border-gray-300 text-sm text-gray-800 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                {classifiedToEdit.offers_text}
              </div>
            </div>
          )}

          <div className="pt-6 flex gap-3">
            {/* Esconde BOTÕES de submit normal se estiver editando outro user (pois usa o botão de Propor Ajuda em cima) */}
            {!isEditingAnotherUser && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border-2 border-black text-black font-bold hover:bg-black hover:text-white transition-colors uppercase tracking-widest text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] px-4 py-3 bg-black text-white border-2 border-black font-bold hover:bg-gray-800 transition-colors uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {classifiedToEdit ? 'Salvar Alterações' : 'Publicar Anúncio'}
                </button>
              </>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};


import React, { useState, useEffect, useRef } from 'react';
import { X, User, Mail, GraduationCap, Briefcase, Flag, Save, Loader2, Check, ChevronDown, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useData } from '../context/DataContext';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberToEdit?: any;
}

const ROLES = [
  'Conselheiro',
  'Presidente',
  'Vice-Presidente',
  'Diretor de Projetos',
  'Diretor de Marketing',
  'Tesoureiro',
  'Secretário',
  'Membro',
  'Trainee'
];

export const MemberModal = ({ isOpen, onClose, memberToEdit }: MemberModalProps) => {
  const { chapters, fetchData } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    matricula: '',
    role: 'Membro', // Cargo principal / Título
    chapterIds: [] as number[],
    chapterRoles: {} as Record<string, string> // Mapa { chapterId: role }
  });

  // Dropdown UI State
  const [showChapterDropdown, setShowChapterDropdown] = useState(false);
  const chapterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (memberToEdit) {
        setFormData({
          nome: memberToEdit.nome,
          email: memberToEdit.email,
          matricula: memberToEdit.matricula === 'N/D' ? '' : memberToEdit.matricula,
          role: memberToEdit.role || 'Membro',
          chapterIds: memberToEdit.chapterIds || [],
          chapterRoles: memberToEdit.chapterRoles || {}
        });
      } else {
        setFormData({
          nome: '',
          email: '',
          matricula: '',
          role: 'Membro',
          chapterIds: [],
          chapterRoles: {}
        });
      }
    }
  }, [isOpen, memberToEdit]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chapterDropdownRef.current && !chapterDropdownRef.current.contains(event.target as Node)) {
        setShowChapterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload: any = {
      full_name: formData.nome,
      email: formData.email,
      matricula: formData.matricula,
      role: formData.role, // Título principal
      chapter_ids: formData.chapterIds,
      chapter_roles: formData.chapterRoles, // Salva o mapa de cargos
      // Se for criação, adicionar iniciais básicas
      ...(!memberToEdit && { 
        avatar_initials: formData.nome.split(' ').map((n:string) => n[0]).slice(0, 2).join('').toUpperCase() 
      })
    };

    try {
      if (memberToEdit) {
        const { error } = await supabase
          .from('profiles')
          .update(payload)
          .eq('id', memberToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert([payload]);
        if (error) throw error;
      }
      
      await fetchData(true);
      onClose();
    } catch (e) {
      console.error("Erro ao salvar membro:", e);
      alert("Erro ao salvar dados do membro. Verifique o console para mais detalhes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddChapter = (id: number) => {
    setFormData(prev => {
      // Se já existe, não faz nada
      if (prev.chapterIds.includes(id)) return prev;
      
      // Adiciona o ID e define cargo padrão como 'Membro'
      return {
        ...prev,
        chapterIds: [...prev.chapterIds, id],
        chapterRoles: { ...prev.chapterRoles, [id]: 'Membro' }
      };
    });
    setShowChapterDropdown(false);
  };

  const handleRemoveChapter = (id: number) => {
    setFormData(prev => {
      const newRoles = { ...prev.chapterRoles };
      delete newRoles[id];
      return {
        ...prev,
        chapterIds: prev.chapterIds.filter(c => c !== id),
        chapterRoles: newRoles
      };
    });
  };

  const handleChangeRole = (chapterId: number, newRole: string) => {
    setFormData(prev => ({
      ...prev,
      chapterRoles: { ...prev.chapterRoles, [chapterId]: newRole }
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            {memberToEdit ? 'Editar Membro' : 'Cadastrar Novo Aluno'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  required
                  type="text"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ex: João da Silva"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                    placeholder="joao@exemplo.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Matrícula</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.matricula}
                    onChange={e => setFormData({ ...formData, matricula: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                    placeholder="Ex: 200012345"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 my-2"></div>

          {/* Dados Organizacionais */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Atribuição Organizacional</h3>
            
            <div className="space-y-4">
               {/* Cargo Principal (Visual) */}
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Título Principal (Sistema)</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-sm"
                      placeholder="Ex: Presidente do Ramo, Membro Ativo"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Cargo exibido no card principal e listas gerais.</p>
               </div>

               {/* Multi-Select Capítulos com Cargos Específicos */}
               <div className="relative" ref={chapterDropdownRef}>
                  <div className="flex justify-between items-center mb-2">
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Cargos por Capítulo</label>
                     <button
                        type="button"
                        onClick={() => setShowChapterDropdown(!showChapterDropdown)}
                        className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                     >
                        + Adicionar Capítulo
                     </button>
                  </div>

                  {/* Dropdown de Adição */}
                  {showChapterDropdown && (
                    <div className="absolute top-6 right-0 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        {chapters.filter((c:any) => !formData.chapterIds.includes(c.id)).length === 0 && (
                           <div className="p-3 text-xs text-gray-500 text-center">Todos os capítulos adicionados.</div>
                        )}
                        {chapters.map((c: any) => {
                            const isSelected = formData.chapterIds.includes(c.id);
                            if (isSelected) return null;
                            return (
                                <div 
                                    key={c.id}
                                    className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-sm text-gray-700 border-b border-gray-50 last:border-0"
                                    onClick={() => handleAddChapter(c.id)}
                                >
                                    <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${c.cor}`}></div>
                                    {c.sigla} - {c.nome}
                                </div>
                            );
                        })}
                    </div>
                  )}

                  {/* Lista de Capítulos Selecionados e seus Cargos */}
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                     {formData.chapterIds.length === 0 && (
                        <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 text-sm">
                           Nenhum capítulo vinculado.
                        </div>
                     )}
                     
                     {formData.chapterIds.map(id => {
                        const chapter = chapters.find((c: any) => c.id === id);
                        if (!chapter) return null;
                        
                        return (
                           <div key={id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                 <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${chapter.cor} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                                    {chapter.sigla}
                                 </div>
                                 <span className="text-sm font-medium text-gray-700 truncate" title={chapter.nome}>
                                    {chapter.nome}
                                 </span>
                              </div>
                              
                              <select
                                 value={formData.chapterRoles[id] || 'Membro'}
                                 onChange={(e) => handleChangeRole(id, e.target.value)}
                                 className="bg-white border border-gray-300 text-gray-700 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-32 p-1.5 outline-none"
                              >
                                 {ROLES.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                 ))}
                              </select>

                              <button 
                                 type="button"
                                 onClick={() => handleRemoveChapter(id)}
                                 className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        );
                     })}
                  </div>
               </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-2 flex-shrink-0">
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
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-2"
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

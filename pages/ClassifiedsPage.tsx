import React, { useState, useMemo } from 'react';
import {
   Newspaper,
   Search,
   Filter,
   Plus,
   HandHelping,
   Lightbulb,
   ExternalLink,
   User,
   MapPin,
   Calendar,
   Pencil,
   Trash2,
   Trophy,
   Megaphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useData } from '../context/DataContext';
import { NewClassifiedModal } from '../components/NewClassifiedModal';
import { useNavigate } from 'react-router-dom';

export const ClassifiedsPage = () => {
   const { classifieds, fetchData } = useData();
   const { profile } = useAuth(); // Get current user
   const navigate = useNavigate();
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedClassified, setSelectedClassified] = useState<any>(null); // Estado para edição
   const [filterType, setFilterType] = useState<'all' | 'help' | 'idea'>('all');
   const [searchTerm, setSearchTerm] = useState('');

   // Delete Handler
   const handleDelete = async (item: any) => {
      if (!confirm('Tem certeza que deseja apagar este classificado?')) return;

      try {
         const { error } = await supabase.from('classifieds').delete().eq('id', item.id);
         if (error) throw error;
         await fetchData(true);
      } catch (e) {
         console.error("Erro ao deletar:", e);
         alert("Erro ao apagar classificado. Verifique se você tem permissão.");
      }
   };

   const isOwnerOrAdmin = (item: any) => {
      if (!profile) return false;
      const isAdmin = ((profile as any).profile_chapters || (profile as any).profileChapters || []).some((pc: any) => pc.chapter_id === 1 && pc.permission_slug === 'admin');
      return isAdmin || item.responsible_id === profile.id;
   };

   // Função para verificar se é destaque (Capítulo Ramo)
   const isHighlight = (item: any) => {
      return item.chapters?.some((c: any) =>
         c.nome.toLowerCase().includes('ramo') ||
         c.sigla.toLowerCase().includes('ramo') ||
         c.nome.toLowerCase().includes('ieee unb')
      );
   };

   const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
   };

   const handleEdit = (item: any) => {
      setSelectedClassified(item);
      setIsModalOpen(true);
   };

   const handleCreate = () => {
      setSelectedClassified(null);
      setIsModalOpen(true);
   };

   // Filtragem e Ordenação
   const processedItems = useMemo(() => {
      // 1. Filtrar
      const filtered = classifieds.filter((item: any) => {
         const matchesType = filterType === 'all' || item.type === filterType;
         const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase());
         return matchesType && matchesSearch;
      });

      // 2. Ordenar (Destaques primeiro, depois por data)
      return filtered.sort((a: any, b: any) => {
         const highlightA = isHighlight(a);
         const highlightB = isHighlight(b);

         if (highlightA && !highlightB) return -1; // A vem primeiro
         if (!highlightA && highlightB) return 1;  // B vem primeiro

         // Desempate por data (mais recente primeiro)
         return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
   }, [classifieds, filterType, searchTerm]);

   return (
      <div className="min-h-full bg-[#f4f1ea] -m-4 md:-m-6 p-4 md:p-8 font-serif text-gray-900">

         <NewClassifiedModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            classifiedToEdit={selectedClassified}
         />

         {/* HEADER DO JORNAL */}
         <div className="max-w-6xl mx-auto mb-8 text-center border-b-4 border-double border-gray-900 pb-6">
            <div className="flex items-center justify-center gap-3 mb-2 opacity-80">
               <Newspaper className="w-6 h-6" />
               <span className="uppercase tracking-[0.3em] text-xs font-sans font-bold">Edição Semanal • IEEE Brasil</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold font-newspaper uppercase tracking-tight mb-4 text-gray-900">
               Classificados
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm font-sans font-medium text-gray-600 border-t border-b border-gray-300 py-2 mt-4 max-w-2xl mx-auto">
               <span>Oportunidades</span>
               <span>•</span>
               <span>Ideias</span>
               <span>•</span>
               <span>Parcerias</span>
               <span>•</span>
               <span>Colaboração</span>
            </div>
         </div>

         {/* TOOLBAR */}
         <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row gap-4 items-center justify-between font-sans">
            <div className="flex items-center gap-2 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                     type="text"
                     placeholder="Buscar nos classificados..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full pl-9 pr-4 py-2 bg-white border border-gray-400 rounded-none focus:ring-1 focus:ring-black outline-none shadow-sm"
                  />
               </div>
               <div className="flex border border-gray-400 bg-white">
                  <button
                     onClick={() => setFilterType('all')}
                     className={`px-3 py-2 text-sm font-bold uppercase hover:bg-gray-100 ${filterType === 'all' ? 'bg-gray-200' : ''}`}
                  >
                     Todos
                  </button>
                  <button
                     onClick={() => setFilterType('help')}
                     className={`px-3 py-2 text-sm font-bold uppercase hover:bg-gray-100 border-l border-gray-300 ${filterType === 'help' ? 'bg-gray-200' : ''}`}
                  >
                     Ajudas
                  </button>
                  <button
                     onClick={() => setFilterType('idea')}
                     className={`px-3 py-2 text-sm font-bold uppercase hover:bg-gray-100 border-l border-gray-300 ${filterType === 'idea' ? 'bg-gray-200' : ''}`}
                  >
                     Ideias
                  </button>
               </div>
            </div>

            <button
               onClick={handleCreate}
               className="w-full md:w-auto px-6 py-2.5 bg-black text-white font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center gap-2"
            >
               <Plus className="w-4 h-4" />
               Anunciar
            </button>
         </div>

         {/* GRID MASONRY */}
         <div className="max-w-6xl mx-auto columns-1 md:columns-2 lg:columns-3 gap-6">

            {processedItems.map((item: any) => {
               const highlighted = isHighlight(item);

               if (highlighted) {
                  // RENDERIZAÇÃO DO CARD DE DESTAQUE (Listrado Laranja/Amarelo)
                  return (
                     <div key={item.id} className="break-inside-avoid mb-8 relative z-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group">
                        {/* Fundo Listrado Estilo Alerta */}
                        <div className="p-3 border-4 border-black" style={{
                           backgroundImage: 'repeating-linear-gradient(-45deg, #ea580c, #ea580c 20px, #facc15 20px, #facc15 40px)'
                        }}>
                           {/* Conteúdo em Caixa Branca para Leitura */}
                           <div className="bg-white p-5 border-2 border-black relative">

                              {/* Badge Destaque (Centralizado no Topo) */}
                              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-black text-yellow-400 px-4 py-1 border-2 border-yellow-400 shadow-md flex items-center gap-2 z-20">
                                 <Megaphone className="w-4 h-4 animate-pulse" />
                                 <span className="text-[10px] font-sans font-black uppercase tracking-widest whitespace-nowrap">Comunicado Oficial</span>
                              </div>

                              {/* Edit Button (Direita) */}
                              <button
                                 onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                 className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded opacity-0 group-hover:opacity-100 transition-all z-20"
                                 title="Editar Classificado"
                              >
                                 <Pencil className="w-4 h-4" />
                              </button>

                              {/* Badge Tipo (Esquerda) */}
                              <div className="absolute -top-3 left-4 px-2 py-0.5 bg-black border border-yellow-500 text-yellow-500 shadow-sm z-10">
                                 {item.type === 'help' ? (
                                    <span className="flex items-center gap-1 text-[10px] font-sans font-bold uppercase tracking-wider text-yellow-400">
                                       <HandHelping className="w-3 h-3" /> Pedido de Ajuda
                                    </span>
                                 ) : (
                                    <span className="flex items-center gap-1 text-[10px] font-sans font-bold uppercase tracking-wider text-cyan-400">
                                       <Lightbulb className="w-3 h-3" /> Ideia / Solução
                                    </span>
                                 )}
                              </div>

                              {/* Data */}
                              <div className="text-right mb-2 mt-4">
                                 <span className="text-[10px] font-sans uppercase tracking-wide border-b border-gray-300 pb-0.5 text-gray-500">
                                    {formatDate(item.createdAt)}
                                 </span>
                              </div>

                              {/* Imagem (Se houver) */}
                              {item.imageUrl && (
                                 <div className="mb-4 border-2 border-black p-1 bg-gray-100">
                                    <img src={item.imageUrl} alt="Classified" className="w-full h-auto grayscale-0" />
                                 </div>
                              )}

                              {/* Conteúdo */}
                              <h3 className="text-2xl font-bold font-newspaper leading-tight mb-3 text-gray-900">
                                 <Trophy className="w-6 h-6 text-orange-600 inline-block mr-2 -mt-1" fill="currentColor" fillOpacity={0.2} />
                                 {item.title}
                              </h3>

                              <p className="text-sm leading-relaxed font-serif text-justify mb-4 text-gray-800">
                                 {item.description}
                              </p>

                              {/* Footer Info */}
                              <div className="border-t-2 border-gray-100 pt-3 mt-4 space-y-2 font-sans text-xs text-gray-600">
                                 {item.responsible && (
                                    <div className="flex items-center gap-2">
                                       <User className="w-3.5 h-3.5" />
                                       <span className="font-bold">Contato:</span> {item.responsible}
                                    </div>
                                 )}

                                 {item.chapters && item.chapters.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2">
                                       <div className="flex items-center gap-1">
                                          <MapPin className="w-3.5 h-3.5" />
                                          <span className="font-bold">Capítulos:</span>
                                       </div>
                                       {item.chapters.map((c: any) => (
                                          <span key={c.id} className="bg-black text-yellow-400 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border border-yellow-600">
                                             {c.sigla}
                                          </span>
                                       ))}
                                    </div>
                                 )}

                                 {item.task && (
                                    <div
                                       className="p-2 mt-2 border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                                       onClick={() => navigate(`/tasks/${item.task.id}`)}
                                    >
                                       <div className="flex items-center gap-1 font-bold mb-1 text-gray-800">
                                          <ExternalLink className="w-3 h-3" />
                                          Tarefa Vinculada
                                       </div>
                                       <p className="italic truncate text-gray-500">{item.task.titulo}</p>
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                     </div>
                  );
               }

               // RENDERIZAÇÃO DO CARD NORMAL
               return (
                  <div
                     key={item.id}
                     className="break-inside-avoid mb-6 relative group bg-[#fffdf5] text-gray-900 border-b border-r border-gray-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all p-5"
                  >
                     <div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-all">
                        {isOwnerOrAdmin(item) && (
                           <>
                              <button
                                 onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                 className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                                 title="Editar Classificado"
                              >
                                 <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                 onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                                 className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                 title="Apagar Classificado"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </>
                        )}
                     </div>

                     {/* Badge Tipo */}
                     <div className="absolute -top-3 left-4 px-2 py-0.5 border shadow-sm z-10 bg-white border-gray-400">
                        {item.type === 'help' ? (
                           <span className="flex items-center gap-1 text-[10px] font-sans font-bold uppercase tracking-wider text-red-700">
                              <HandHelping className="w-3 h-3" /> Pedido de Ajuda
                           </span>
                        ) : (
                           <span className="flex items-center gap-1 text-[10px] font-sans font-bold uppercase tracking-wider text-blue-800">
                              <Lightbulb className="w-3 h-3" /> Ideia / Solução
                           </span>
                        )}
                     </div>

                     {/* Data */}
                     <div className="text-right mb-2 mt-2">
                        <span className="text-[10px] font-sans uppercase tracking-wide border-b pb-0.5 text-gray-500 border-gray-300">
                           {formatDate(item.createdAt)}
                        </span>
                     </div>

                     {/* Imagem (Se houver) */}
                     {item.imageUrl && (
                        <div className="mb-4 border-4 border-double p-1 border-gray-300">
                           <img src={item.imageUrl} alt="Classified" className="w-full h-auto transition-all duration-500 grayscale group-hover:grayscale-0" />
                        </div>
                     )}

                     {/* Conteúdo */}
                     <h3 className="text-2xl font-bold font-newspaper leading-tight mb-3 transition-colors text-gray-900 group-hover:text-blue-900">
                        {item.title}
                     </h3>

                     <p className="text-sm leading-relaxed font-serif text-justify mb-4 text-gray-800">
                        {item.description}
                     </p>

                     {/* Footer Info */}
                     <div className="border-t border-dashed pt-3 mt-4 space-y-2 font-sans text-xs border-gray-400 text-gray-600">

                        {item.responsible && (
                           <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5" />
                              <span className="font-bold">Contato:</span> {item.responsible}
                           </div>
                        )}

                        {item.chapters && item.chapters.length > 0 && (
                           <div className="flex flex-wrap items-center gap-2">
                              <div className="flex items-center gap-1">
                                 <MapPin className="w-3.5 h-3.5" />
                                 <span className="font-bold">Capítulos:</span>
                              </div>

                              {item.chapters.map((c: any) => (
                                 <span key={c.id} className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-gray-200 text-gray-700">
                                    {c.sigla}
                                 </span>
                              ))}
                           </div>
                        )}

                        {item.task && (
                           <div
                              className="p-2 mt-2 border cursor-pointer bg-gray-100 border-gray-200 hover:bg-gray-200"
                              onClick={() => navigate(`/tasks/${item.task.id}`)}
                           >
                              <div className="flex items-center gap-1 font-bold mb-1 text-gray-800">
                                 <ExternalLink className="w-3 h-3" />
                                 Tarefa Vinculada
                              </div>
                              <p className="italic truncate text-gray-500">{item.task.titulo}</p>
                           </div>
                        )}

                     </div>
                  </div>
               );
            })}
         </div>

         {processedItems.length === 0 && (
            <div className="text-center py-20 font-sans text-gray-500">
               <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-20" />
               <h3 className="text-xl font-bold uppercase tracking-widest mb-2">Sem Classificados</h3>
               <p>Não encontramos nenhum anúncio para os filtros selecionados.</p>
            </div>
         )}

         {/* Footer Newspaper Style */}
         <div className="max-w-6xl mx-auto mt-12 border-t-2 border-black pt-6 text-center font-sans text-xs text-gray-500 uppercase tracking-widest">
            IEEE Student Branch Brasil • Todos os direitos reservados • {new Date().getFullYear()}
         </div>
      </div>
   );
};

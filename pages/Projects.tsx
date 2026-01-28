
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, ClipboardList, ChevronRight, FolderKanban, Calendar } from 'lucide-react';
import { useData } from '../context/DataContext';
import { getProjectUrl } from '../lib/utils';

import { useAuth } from '../context/AuthContext';

export const Projects = () => {
  const navigate = useNavigate();
  const { projects, tasks } = useData();
  const { user, profile } = useAuth(); // Get authenticated user and profile

  // Filter projects based on user participation (only for non-admins if strictness needed, but request says "person can only see...")
  // We'll filter for everyone based on the request "person only sees projects they are on the team (team or management)"
  const activeProjects = projects.filter((p: any) => {
    const isNotArchived = p.status !== 'Arquivado';

    // If no profile, we can't check permissions (loading or not logged in).
    // Safest default is to show nothing or wait.
    if (!profile) return false;

    // Check ownership
    // ownerIds usually contains numbers (profile IDs)
    const isOwner = p.ownerIds && p.ownerIds.includes(profile.id);

    // Check team membership
    // teamIds usually contains numbers (profile IDs)
    const isTeam = p.teamIds && p.teamIds.includes(profile.id);

    // Check generic project members list if available (fallback)
    const isMember = p.projectMembers && p.projectMembers.some((pm: any) => pm.profile_id === profile.id);

    return isNotArchived && (isOwner || isTeam || isMember);
  });

  return (
    <div className="space-y-4 md:space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Meus Projetos</h1>
          <p className="text-gray-500 mt-1">Visão geral de todos os projetos que você participa.</p>
        </div>
      </div>

      {activeProjects.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Nenhum projeto ativo no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeProjects.map((projeto: any) => {
            // Definição de Cores e Imagens
            const themeGradient = projeto.cor || 'from-blue-600 to-indigo-600';

            // Logic to use Project Cover OR Chapter Cover as fallback
            const displayCover = projeto.coverImage ||
              (projeto.capitulos && projeto.capitulos.length > 0 ? projeto.capitulos[0].cover_image_url : null);

            const hasCover = !!displayCover;

            // Status Color Map
            const statusColors: any = {
              'Planejamento': 'bg-gray-100 text-gray-700',
              'Em Andamento': 'bg-blue-100 text-blue-700',
              'Pausado': 'bg-yellow-100 text-yellow-700',
              'Concluído': 'bg-green-100 text-green-700'
            };

            return (
              <div
                key={projeto.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all overflow-hidden group cursor-pointer flex flex-col h-full hover:-translate-y-1"
                onClick={() => navigate(getProjectUrl(projeto), { state: { from: '/projects' } })}
              >
                {/* Header Section (Image or Gradient) */}
                <div className="h-32 relative shrink-0">
                  {hasCover ? (
                    <>
                      <img
                        src={displayCover}
                        alt={projeto.nome}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
                    </>
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${themeGradient}`}></div>
                  )}

                  {/* Badges on Top */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold shadow-sm backdrop-blur-md ${hasCover ? 'bg-white/90 text-gray-800' : 'bg-white text-gray-800'}`}>
                      {projeto.status}
                    </span>
                  </div>

                  {projeto.parceria && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-lg font-bold shadow-sm flex items-center gap-1">
                        Parceria
                      </span>
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-5 pt-12 relative flex-1 flex flex-col">
                  {/* Floating Icon */}
                  <div className="absolute -top-6 left-5 p-1 bg-white rounded-xl shadow-sm">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${themeGradient} flex items-center justify-center text-white shadow-inner`}>
                      <Briefcase className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-900 text-lg line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">
                      {projeto.nome}
                    </h3>

                    {/* Capítulos Chips */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {projeto.capitulos && projeto.capitulos.length > 0 ? (
                        projeto.capitulos.map((cap: any) => {
                          const Icon = cap.icon || FolderKanban;
                          return (
                            <span key={cap.id} className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                              <Icon className="w-3 h-3" />
                              {cap.sigla}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-gray-400">{projeto.capitulo}</span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px] leading-relaxed">
                      {projeto.descricao || 'Sem descrição definida.'}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4 mt-auto">
                    {projeto.tags && projeto.tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="px-2 py-1 bg-gray-50 border border-gray-100 text-gray-600 rounded-md text-[10px] font-medium uppercase tracking-wide">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Progress & Meta */}
                  <div className="space-y-3 pt-3 border-t border-gray-50">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-gray-500 font-medium">Progresso</span>
                        <span className="font-bold text-gray-900">{projeto.progresso}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${themeGradient} transition-all duration-500`}
                          style={{ width: `${projeto.progresso}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1.5 min-w-0 max-w-[65%]" title={projeto.responsavel}>
                        <Users className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate font-medium">{projeto.responsavel}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{projeto.dataFim ? new Date(projeto.dataFim).toLocaleDateString('pt-BR') : 'Sem data'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

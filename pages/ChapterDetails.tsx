
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, FolderKanban, Briefcase, Target, HelpCircle,
  ChevronLeft, ChevronRight, Globe, Calendar as CalendarIcon,
  ChevronDown, ChevronUp, MapPin
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { EventDetailsModal } from '../components/EventDetailsModal';
import { getProjectUrl } from '../lib/utils';
import { useLocation } from 'react-router-dom';

export const ChapterDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const location = useLocation();
  const { chapters, users, projects, chapterGoals, events } = useData();

  const [activePeriod, setActivePeriod] = useState<string>('');



  // Events/Agenda State
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<any>(null);

  // Ref para o carrossel de membros
  const membersScrollRef = useRef<HTMLDivElement>(null);

  const chapter = chapters.find((c: any) =>
    String(c.id) === id ||
    (c.acronym && c.acronym.toLowerCase() === id?.toLowerCase())
  );

  const allChapterGoals = useMemo(() => {
    if (!chapter) return [];
    return chapterGoals.filter((g: any) => g.chapter_id === chapter.id);
  }, [chapterGoals, chapter]);

  // Calcula os períodos disponíveis dinamicamente
  const availablePeriods = useMemo(() => {
    const periods = Array.from(new Set(allChapterGoals.map((g: any) => g.period || 'Anual')));
    const sortOrder: Record<string, number> = { 'Mensal': 1, 'Trimestral': 2, 'Semestral': 3, 'Anual': 4 };
    return periods.sort((a: any, b: any) => (sortOrder[a] || 9) - (sortOrder[b] || 9));
  }, [allChapterGoals]);

  // Define o período ativo inicial se ainda não estiver definido
  useEffect(() => {
    if (availablePeriods.length > 0 && !availablePeriods.includes(activePeriod)) {
      setActivePeriod(availablePeriods[0]);
    } else if (availablePeriods.length === 0) {
      setActivePeriod('Anual'); // Fallback visual
    }
  }, [availablePeriods, activePeriod]);

  // --- Events Logic (Chapter Only, No Project) ---
  const chapterEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    // Filter events: Matches Chapter ID AND Project ID is null/falsy AND Date >= today
    return events
      .filter((e: any) =>
        e.chapterId === Number(id) &&
        !e.projectId &&
        new Date(e.startDate) >= now
      )
      .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [events, id]);

  const handleEventClick = (rawEvent: any) => {
    const formattedEvent = {
      title: rawEvent.title,
      start: new Date(rawEvent.startDate),
      end: new Date(rawEvent.endDate),
      resource: rawEvent,
      isExternal: false
    };
    setSelectedEventForDetails(formattedEvent);
    setIsDetailsModalOpen(true);
  };

  if (!chapter) {
    return <div className="p-6">Capítulo não encontrado</div>;
  }

  const Icon = chapter.icon;
  const links = chapter.links || [];

  // Lógica de Ordenação de Cargos
  const getRolePriority = (role: string = '') => {
    const r = role.toLowerCase();
    if (r.includes('conselheiro')) return 0;
    if (r.includes('presidente') && !r.includes('vice')) return 1;
    if (r.includes('vice')) return 2;
    if (r.includes('diretor')) return 3;
    if (r.includes('secretário') || r.includes('tesoureiro')) return 4;
    if (r.includes('assessor') || r.includes('líder') || r.includes('lider')) return 5;
    if (r.includes('membro')) return 6;
    if (r.includes('trainee')) return 7;
    return 99;
  };

  // Filtra e Ordena membros
  const chapterMembers = users
    .filter((u: any) => u.chapterIds && u.chapterIds.includes(chapter.id))
    .sort((a: any, b: any) => {
      const roleA = a.chapterRoles?.[chapter.id] || a.role || '';
      const roleB = b.chapterRoles?.[chapter.id] || b.role || '';
      return getRolePriority(roleA) - getRolePriority(roleB);
    });

  // Filtra projetos do capítulo e remove os arquivados
  const chapterProjects = projects.filter((p: any) => {
    const belongsToChapter = Array.isArray(p.capituloId)
      ? p.capituloId.includes(chapter.id)
      : p.capituloId === chapter.id;
    return belongsToChapter && p.status !== 'Arquivado';
  });

  const currentGoals = allChapterGoals.filter((g: any) => (g.period || 'Anual') === activePeriod);

  // Função de scroll para membros
  const scrollMembers = (direction: 'left' | 'right') => {
    if (membersScrollRef.current) {
      const scrollAmount = 300;
      membersScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const canAccessProject = (projeto: any) => {
    if (!profile) return false;
    const isGlobalAdmin = profile.profileChapters?.some((pc: any) => pc.chapter_id === 1 && pc.permission_slug === 'admin');
    if (isGlobalAdmin) return true;
    const userChapterRole = profile.profileChapters?.find((pc: any) => pc.chapter_id === chapter.id)?.permission_slug;
    if (userChapterRole && ['admin', 'chair', 'manager'].includes(userChapterRole)) return true;
    if (projeto.ownerIds?.includes(profile.id) || projeto.owners?.some((o: any) => o.id === profile.id)) return true;
    return false;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ... previous content ... */}

      <EventDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        event={selectedEventForDetails}
      // Read-only in ChapterDetails
      />

      <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-100 group">
        <div className="h-48 md:h-64 overflow-hidden relative">
          <img
            src={chapter.cover_image_url || chapter.coverImage}
            alt={chapter.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent" />
        </div>

        <div className="absolute top-4 left-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/90 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg transition-all text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>

        <div className="absolute -bottom-12 left-6 md:left-10 flex items-end">
          <div className={`w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br ${chapter.color_theme || chapter.cor || 'from-blue-600 to-blue-800'} p-1 shadow-2xl ring-4 ring-white`}>
            <div className="w-full h-full bg-white rounded-xl flex items-center justify-center">
              {Icon && <Icon className="w-10 h-10 md:w-14 md:h-14 text-gray-800" />}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-14 px-2 md:px-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{chapter.name || chapter.nome}</h1>
            <p className="text-lg text-gray-500 font-medium mb-4">{chapter.acronym || chapter.sigla}</p>
            <p className="text-gray-700 leading-relaxed max-w-3xl">
              {chapter.description || chapter.descricao}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-blue-50 px-4 py-3 rounded-xl border border-blue-100 text-center min-w-[100px]">
              <span className="block text-2xl font-bold text-blue-600">{chapterMembers.length}</span>
              <span className="text-xs font-medium text-blue-600/80 uppercase tracking-wider">Membros</span>
            </div>
            <div className="bg-purple-50 px-4 py-3 rounded-xl border border-purple-100 text-center min-w-[100px]">
              <span className="block text-2xl font-bold text-purple-600">{chapterProjects.length}</span>
              <span className="text-xs font-medium text-purple-600/80 uppercase tracking-wider">Projetos</span>
            </div>
          </div>
        </div>
      </div>

      {/* AGENDA DO CAPÍTULO (Collapsible) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsEventsOpen(!isEventsOpen)}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-gray-900">Agenda do Capítulo</h2>
            <span className="text-xs font-medium bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
              {chapterEvents.length} Eventos Gerais
            </span>
          </div>
          <button className="text-gray-400">
            {isEventsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {isEventsOpen && (
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            {chapterEvents.length > 0 ? (
              <div className="space-y-3">
                {chapterEvents.map((event: any) => {
                  const date = new Date(event.startDate);
                  const day = date.getDate();
                  const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();

                  return (
                    <div key={event.id} className="relative pl-6 cursor-pointer group" onClick={() => handleEventClick(event)}>
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-orange-400 group-hover:scale-125 transition-transform"></div>
                      <div className="flex gap-4 p-3 bg-white rounded-lg border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all">
                        <div className="flex flex-col items-center justify-center bg-orange-50 rounded-lg w-12 h-12 flex-shrink-0 border border-orange-100">
                          <span className="text-xs font-bold text-orange-400">{month}</span>
                          <span className="text-lg font-bold text-orange-600 leading-none">{day}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{event.title}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            {event.location && (
                              <span className="text-[10px] text-gray-400 flex items-center gap-0.5 truncate">
                                <MapPin className="w-3 h-3" /> {event.location}
                              </span>
                            )}
                          </div>
                          <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] rounded-full font-medium bg-blue-50 text-blue-600 truncate max-w-full">
                            {event.category || 'Geral'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 italic text-sm">
                Nenhum evento geral agendado para este capítulo.
              </div>
            )}
          </div>
        )}
      </div>

      {/* METAS E OBJETIVOS SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900">Metas de {chapter.sigla}</h2>
          </div>

          <div className="flex items-center gap-2">
            {availablePeriods.length > 0 && availablePeriods.map(period => (
              <button
                key={period}
                onClick={() => setActivePeriod(period)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all border ${activePeriod === period
                  ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {currentGoals.length > 0 ? (
            currentGoals.map((goal: any) => {
              const percentage = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
              const createdDate = goal.created_at ? new Date(goal.created_at).toLocaleDateString('pt-BR') : 'Data desconhecida';

              return (
                <div key={goal.id} className="group relative">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-medium text-gray-900">{goal.title}</h4>
                        {goal.description && (
                          <div className="group/desc relative">
                            <HelpCircle className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 cursor-help transition-colors" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs p-2 rounded-lg opacity-0 group-hover/desc:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                              {goal.description}
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {goal.indicator_label}: {goal.current_value} / {goal.target_value}
                      </span>
                    </div>

                    <div className="group/perc relative">
                      <span className="font-bold text-gray-900 cursor-default">{percentage}%</span>
                      <div className="absolute bottom-full right-0 mb-2 w-max bg-gray-900 text-white text-xs p-2 rounded-lg opacity-0 group-hover/perc:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl whitespace-nowrap">
                        {percentage}% Concluído &rarr; Meta Criada em {createdDate}
                        <div className="absolute -bottom-1 right-2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${goal.color || 'bg-blue-600'} transition-all duration-1000`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma meta {activePeriod ? activePeriod.toLowerCase() : ''} definida.</p>
            </div>
          )}
        </div>
      </div>

      {/* RESOURCES & LINKS SECTION (READ ONLY) */}
      {links.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            Recursos e Links
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {links.map((link: any, idx: number) => (
              <div
                key={idx}
                className="group relative bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:shadow-md hover:border-blue-200 transition-all cursor-pointer h-32"
                onClick={() => window.open(link.url, '_blank')}
              >
                <span className="text-3xl mb-2 block">{link.emoji}</span>
                <span className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight">{link.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MEMBERS SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            Diretoria e Membros
          </h2>

          <div className="flex gap-2">
            <button
              onClick={() => scrollMembers('left')}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollMembers('right')}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={membersScrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
        >
          {chapterMembers.map((member: any) => {
            const roleInChapter = member.chapterRoles?.[chapter.id] || member.role;
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all cursor-pointer min-w-[260px] snap-center flex-shrink-0"
                onClick={() => navigate(`/team/${member.id}`)}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 text-white flex items-center justify-center font-medium text-sm overflow-hidden shrink-0 border-2 border-white shadow-sm">
                  {member.foto ? <img src={member.foto} alt={member.nome} className="w-full h-full object-cover" /> : member.avatar}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{member.nome}</p>
                  <p className="text-xs text-blue-600 font-medium truncate">{roleInChapter}</p>
                </div>
              </div>
            );
          })}
          {chapterMembers.length === 0 && (
            <div className="w-full text-center py-4 text-gray-400 text-sm italic bg-gray-50 rounded-lg">
              Nenhum membro encontrado neste capítulo.
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 px-2">
          <FolderKanban className="w-5 h-5 text-gray-500" />
          Projetos do Capítulo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chapterProjects.map((projeto: any) => {
            const hasAccess = canAccessProject(projeto);
            return (
              <div
                key={projeto.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group transition-all ${hasAccess ? 'cursor-pointer hover:shadow-md' : 'cursor-default opacity-80'
                  }`}
                onClick={() => {
                  if (hasAccess) {
                    navigate(getProjectUrl(projeto), { state: { from: location.pathname } });
                  }
                }}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${chapter.cor} flex items-center justify-center`}>
                          <Briefcase className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900">{projeto.nome}</h3>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">{projeto.descricao}</p>

                      <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                        <div
                          className={`bg-gradient-to-r ${chapter.cor} h-2 rounded-full`}
                          style={{ width: `${projeto.progresso}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{projeto.status}</span>
                        <span className="font-medium text-gray-900">{projeto.progresso}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

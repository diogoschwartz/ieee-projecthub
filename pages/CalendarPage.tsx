
import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft, Plus, Grid, Maximize, Clock, Filter, Briefcase, FolderKanban,
  Loader2, X, List, Check, Video, Edit, ChevronDown, ChevronUp, MapPin,
  ChevronRight, Calendar as CalendarIconUI, Send
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { NewEventModal } from '../components/NewEventModal';
import { EventDetailsModal } from '../components/EventDetailsModal';
import { VToolsReportModal } from '../components/VToolsReportModal';

// React Big Calendar Imports
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export const CalendarPage = () => {
  const { events, chapters, projects } = useData();
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('month');

  // Modals State
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<any>(null);
  const [eventToEdit, setEventToEdit] = useState<any>(null);
  const [isVToolsModalOpen, setIsVToolsModalOpen] = useState(false);
  const [eventToReport, setEventToReport] = useState<any>(null);

  // --- Internal Filter States (For Admins) ---
  const [filterType, setFilterType] = useState<'all' | 'chapter' | 'project'>('all');
  const [filterId, setFilterId] = useState<string>('');

  // --- Toggle Filter States (For Members) ---
  const [disabledSourceIds, setDisabledSourceIds] = useState<string[]>([]);

  // --- Permissions Logic ---
  const userRoles = useMemo(() => {
    if (!profile) return { isAdmin: false, managerChapters: [], memberChapters: [], projectIds: [] };

    const chaptersList = (profile as any).profile_chapters || (profile as any).profileChapters || [];
    const isAdmin = chaptersList.some((pc: any) => pc.chapter_id === 1 && pc.permission_slug === 'admin');
    const managerChapters: number[] = [];
    const memberChapters: number[] = [];

    chaptersList.forEach((pc: any) => {
      memberChapters.push(pc.chapter_id);
      if (['admin', 'chair', 'manager'].includes(pc.permission_slug)) {
        managerChapters.push(pc.chapter_id);
      }
    });

    // Project Teams
    const myProjectIds = projects
      .filter((p: any) => p.projectMembers?.some((pm: any) => pm.profile_id === profile.id))
      .map((p: any) => p.id);

    return { isAdmin, managerChapters, memberChapters, projectIds: myProjectIds };
  }, [profile, projects]);

  const canCreateEvent = userRoles.isAdmin || userRoles.managerChapters.length > 0;

  // Logic to determine "Available Sources" for the Member Toggle UI
  const availableSources = useMemo(() => {
    // If Admin/Manager, this might not be used, or used differently. 
    // But we calculate it for the "Member View".

    const sources: { id: string, type: 'public' | 'chapter' | 'project', label: string, colorClass: string }[] = [];

    // 1. General Public Calendar
    sources.push({ id: 'public_calendar', type: 'public', label: 'Agenda Geral (Pública)', colorClass: 'bg-blue-500' });

    // 2. My Chapters
    if (userRoles.memberChapters.length > 0) {
      // Find chapter details
      userRoles.memberChapters.forEach(cid => {
        const chap = chapters.find((c: any) => c.id === cid);
        if (chap) {
          sources.push({
            id: `chapter_${cid}`,
            type: 'chapter',
            label: chap.sigla,
            colorClass: chap.cor ? `bg-gradient-to-r ${chap.cor}` : 'bg-gray-500' // Use chapter color if avail
          });
        }
      });
    }

    // 3. My Projects
    if (userRoles.projectIds.length > 0) {
      userRoles.projectIds.forEach(pid => {
        const proj = projects.find((p: any) => p.id === pid);
        if (proj) {
          sources.push({
            id: `project_${pid}`,
            type: 'project',
            label: proj.nome,
            colorClass: 'bg-purple-500'
          });
        }
      });
    }

    return sources;
  }, [userRoles, chapters, projects]);

  // Toggle Handler
  const toggleSource = (sourceId: string) => {
    setDisabledSourceIds(prev => {
      if (prev.includes(sourceId)) return prev.filter(id => id !== sourceId); // Enable
      return [...prev, sourceId]; // Disable
    });
  };

  // --- Data Transformation & Filtering ---
  const calendarEvents = useMemo(() => {

    // Base Visibility Filter
    const visibleEvents = events.filter(e => {
      // --- ADMIN / MANAGER VIEW (Uses Dropdown Filter logic later, but base is "Can I see it?") ---
      if (canCreateEvent) {
        // Admin/Managers see everything, or filter later.
        // Wait, Managers only see "Their Chapters" + Public? 
        // Previous logic: Admin sees all. Manager sees Own + Public. 
        if (userRoles.isAdmin) return true;

        // Manager matches Member logic logic for visibility base
        if (e.isPublic) return true;
        if (e.chapterId && userRoles.memberChapters.includes(e.chapterId)) return true; // Covers Managers too
        if (e.projectId && userRoles.projectIds.includes(e.projectId)) return true;

        return false;
      }

      // --- MEMBER TOGGLE VIEW Logic ---
      // Member matches if event belongs to an AVAILABLE SOURCE that is ENABLED.

      // Check 1: Public
      if (e.isPublic) {
        if (!disabledSourceIds.includes('public_calendar')) return true;
      }

      // Check 2: Chapter
      if (e.chapterId && userRoles.memberChapters.includes(e.chapterId)) {
        const sourceId = `chapter_${e.chapterId}`;
        if (!disabledSourceIds.includes(sourceId)) return true;
      }

      // Check 3: Project
      if (e.projectId && userRoles.projectIds.includes(e.projectId)) {
        const sourceId = `project_${e.projectId}`;
        if (!disabledSourceIds.includes(sourceId)) return true;
      }

      return false;
    });

    // 2. Aplicar Filtros de UI (Only relevant for Admin/Manager Dropdown)
    const finalFiltered = visibleEvents.filter(e => {
      if (!canCreateEvent) return true; // Members already filtered by Toggles above

      // Admin/Manager Dropdown Logic
      if (filterType === 'all') return true;
      if (filterType === 'chapter') return e.chapterId?.toString() === filterId;
      if (filterType === 'project') return e.projectId?.toString() === filterId;
      return true;
    });

    // 3. Transformar para formato RBC
    const internalMapped = finalFiltered.map(evt => ({
      id: evt.id,
      title: evt.title,
      start: new Date(evt.startDate),
      end: new Date(evt.endDate),
      resource: evt,
      isExternal: false
    }));

    return [...internalMapped];
  }, [events, filterType, filterId, userRoles, canCreateEvent, disabledSourceIds]);

  // --- Handlers ---
  const onSelectEvent = (calendarEvent: any) => {
    setSelectedEventForDetails(calendarEvent);
    setIsDetailsModalOpen(true);
  };

  const handleEditInternalEvent = (rawEvent: any) => {
    const canEdit = userRoles.isAdmin || (rawEvent.chapterId && userRoles.managerChapters.includes(rawEvent.chapterId));

    if (!canEdit) {
      alert("Você não tem permissão para editar este evento.");
      return;
    }

    setEventToEdit(rawEvent);
    setIsNewEventModalOpen(true);
  };

  const handleNewEvent = () => {
    setEventToEdit(null);
    setIsNewEventModalOpen(true);
  };

  const handleOpenVToolsReport = (evt: any) => {
    setEventToReport(evt);
    setIsVToolsModalOpen(true);
  };

  // --- Custom Styling via eventPropGetter ---
  const eventPropGetter = (event: any) => {
    let className = '';
    const chapter = event.resource.chapter;

    if (chapter?.cor) {
      className = `bg-gradient-to-r ${chapter.cor} text-white border-0 shadow-sm hover:brightness-95`;
    } else {
      className = 'bg-blue-600 text-white border-0 shadow-sm';
    }

    return { className };
  };

  // Label do Header Personalizado
  const headerLabel = view === 'month'
    ? currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : currentDate.toLocaleDateString('pt-BR', { dateStyle: 'full' });

  // --- Manager Insight Logic ---
  const [isEventsExpanded, setIsEventsExpanded] = useState(true);
  const myEvents = useMemo(() => {
    if (!profile || !canCreateEvent) return [];

    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    // For managers, show events from THEIR chapters or PROJECTS
    const filtered = events.filter((e: any) => {
      const isMine = (e.chapterId && userRoles.memberChapters.includes(e.chapterId)) ||
        (e.projectId && userRoles.projectIds.includes(e.projectId));

      if (!isMine) return false;

      const eventStart = new Date(e.startDate);
      const eventEnd = new Date(e.endDate);

      return eventStart <= endOfToday && eventEnd >= startOfToday;
    });

    return filtered.sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [events, profile, userRoles, canCreateEvent]);

  return (
    <div className="space-y-6 relative pb-20">

      {/* Modals */}
      {canCreateEvent && (
        <NewEventModal
          isOpen={isNewEventModalOpen}
          onClose={() => setIsNewEventModalOpen(false)}
          eventToEdit={eventToEdit}
        />
      )}

      <EventDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        event={selectedEventForDetails}
        onEdit={handleEditInternalEvent}
      />

      <VToolsReportModal
        isOpen={isVToolsModalOpen}
        onClose={() => setIsVToolsModalOpen(false)}
        eventToReport={eventToReport}
      />

      {/* MANAGER INSIGHT SECTION */}
      {canCreateEvent && myEvents.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden shrink-0">
          <button
            onClick={() => setIsEventsExpanded(!isEventsExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                <CalendarIconUI className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h2 className="text-base font-bold text-gray-900 leading-none">Meus Eventos de Hoje</h2>
                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                  Insight de Gestor
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {myEvents.length} {myEvents.length === 1 ? 'evento' : 'eventos'}
              </span>
              {isEventsExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </button>

          {isEventsExpanded && (
            <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
              <div className="space-y-3">
                {myEvents.map((event: any) => {
                  const chapter = chapters.find((c: any) => c.id === event.chapterId);
                  const project = projects.find((p: any) => p.id === event.projectId);
                  const startDate = new Date(event.startDate);
                  const meetingUrl = event.location && (event.location.startsWith('http') || event.location.includes('zoom') || event.location.includes('meet.google')) ? event.location : null;

                  return (
                    <div
                      key={event.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all group flex flex-col md:flex-row md:items-center gap-4 relative overflow-hidden"
                    >
                      {/* Chapter/Project Stripe */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${chapter?.cor ? `bg-gradient-to-b ${chapter.cor}` : (project ? 'bg-purple-500' : 'bg-blue-500')}`}></div>

                      {/* Main Content */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer pl-2"
                        onClick={() => onSelectEvent({
                          id: event.id,
                          title: event.title,
                          start: new Date(event.startDate),
                          end: new Date(event.endDate),
                          resource: { ...event, chapter }
                        })}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {event.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {chapter && (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100 font-medium whitespace-nowrap">
                              <Briefcase className="w-3 h-3" />
                              {chapter.sigla}
                            </span>
                          )}
                          {project && !chapter && (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100 font-medium whitespace-nowrap">
                              <Briefcase className="w-3 h-3" />
                              {project.nome}
                            </span>
                          )}

                          <div className="flex items-center gap-2 ml-auto md:ml-0 font-medium text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3" />
                            {startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto pl-2 md:pl-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-50">
                        {meetingUrl && (
                          <a
                            href={meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg border border-green-100 font-bold text-xs transition-all shadow-sm whitespace-nowrap"
                          >
                            <Video className="w-3.5 h-3.5" />
                            Acessar Reunião
                          </a>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenVToolsReport(event); }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg border border-red-100 font-bold text-xs transition-all shadow-sm whitespace-nowrap"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Gerar Ata/Report Vtools
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditInternalEvent(event); }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-100 font-bold text-xs transition-all shadow-sm whitespace-nowrap"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Editar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CUSTOM TOOLBAR */}
      <div className="flex flex-col gap-4 shrink-0">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Calendário</h1>
            <p className="text-gray-500 mt-1">Acompanhe eventos internos e cronogramas.</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button onClick={() => setView('month')} className={`p-1.5 rounded-md transition-all flex items-center gap-1 text-xs font-medium ${view === 'month' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                <Maximize className="w-4 h-4" /> <span className="hidden sm:inline">Mês</span>
              </button>
              <button onClick={() => setView('week')} className={`p-1.5 rounded-md transition-all flex items-center gap-1 text-xs font-medium ${view === 'week' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                <Grid className="w-4 h-4" /> <span className="hidden sm:inline">Semana</span>
              </button>
              <button onClick={() => setView('agenda')} className={`p-1.5 rounded-md transition-all flex items-center gap-1 text-xs font-medium ${view === 'agenda' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                <List className="w-4 h-4" /> <span className="hidden sm:inline">Agenda</span>
              </button>
            </div>

            <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm p-1">
              <button onClick={() => {
                if (view === 'month') setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
                else if (view === 'week') setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
                else setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)));
              }} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="min-w-[140px] text-center font-bold text-gray-800 capitalize select-none text-sm sm:text-base">
                {headerLabel}
              </span>
              <button onClick={() => {
                if (view === 'month') setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
                else if (view === 'week') setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
                else setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)));
              }} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {canCreateEvent && (
              <button onClick={handleNewEvent} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap">
                <Plus className="w-5 h-5" />
                <span className="hidden lg:inline">Novo</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Area */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-end bg-white p-3 rounded-xl border border-gray-100 shadow-sm min-h-[60px]">

          {/* MEMBER VIEW: Toggle Pills */}
          {!canCreateEvent && (
            <div className="flex flex-wrap items-center gap-2 w-full">
              <span className="text-sm font-medium text-gray-500 mr-2 flex items-center gap-1">
                <Filter className="w-4 h-4" /> Visualizando:
              </span>

              {availableSources.map(source => {
                const isActive = !disabledSourceIds.includes(source.id);
                // If Chapter has gradient, we need to handle text color carefully. 
                // Assuming chapter.cor is 'from-X to-Y', we add 'bg-gradient-to-r'.
                // But for pill background we need solid or gradient.
                const bgClass = isActive
                  ? (source.type === 'chapter' && !source.colorClass.startsWith('bg-') ? `bg-gradient-to-r ${source.colorClass}` : source.colorClass)
                  : 'bg-gray-100';

                const textClass = isActive ? 'text-white' : 'text-gray-500';

                return (
                  <button
                    key={source.id}
                    onClick={() => toggleSource(source.id)}
                    className={`
                                    px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 
                                    flex items-center gap-1.5 border border-transparent shadow-sm
                                    ${bgClass} ${textClass}
                                    ${!isActive && 'hover:bg-gray-200'}
                                `}
                  >
                    {isActive && <Check className="w-3 h-3" />}
                    {source.label}
                  </button>
                );
              })}

              {availableSources.length === 0 && (
                <span className="text-xs text-gray-400 italic">Nenhum calendário disponível.</span>
              )}
            </div>
          )}

          {/* ADMIN / MANAGER VIEW: Dropdowns */}
          {canCreateEvent && (
            <div className="flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-2 px-2 py-1 text-gray-500 text-sm">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Filtrar:</span>
              </div>
              <select
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value as any); setFilterId(''); }}
                className="bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer outline-none px-2 py-1.5"
              >
                <option value="all">Todos</option>
                <option value="chapter">Por Capítulo</option>
                <option value="project">Por Projeto</option>
              </select>
              {filterType === 'chapter' && (
                <select value={filterId} onChange={(e) => setFilterId(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-blue-600 focus:ring-0 cursor-pointer outline-none px-2 py-1.5 max-w-[120px]">
                  <option value="">Selecione...</option>
                  {chapters.map((c: any) => <option key={c.id} value={c.id}>{c.sigla}</option>)}
                </select>
              )}
              {filterType === 'project' && (
                <select value={filterId} onChange={(e) => setFilterId(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-purple-600 focus:ring-0 cursor-pointer outline-none px-2 py-1.5 max-w-[120px]">
                  <option value="">Selecione...</option>
                  {projects.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              )}
            </div>
          )}
        </div>
      </div>

      {/* REACT BIG CALENDAR COMPONENT */}
      <div className="h-[600px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          date={currentDate}
          view={view}
          onNavigate={(date) => setCurrentDate(date)}
          onView={(v) => setView(v)}
          onSelectEvent={onSelectEvent}
          eventPropGetter={eventPropGetter}
          culture='pt-BR'
          messages={{
            next: "Próximo",
            previous: "Anterior",
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia",
            agenda: "Agenda",
            date: "Data",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "Não há eventos neste período."
          }}
          toolbar={false} // Usamos nossa própria toolbar acima
        />
      </div>
    </div>
  );
};

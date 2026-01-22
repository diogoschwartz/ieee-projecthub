
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, 
  Grid, Maximize, Clock, Filter, Briefcase, FolderKanban, 
  CloudDownload, Loader2, RefreshCw, Terminal, X, List, Check
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { NewEventModal } from '../components/NewEventModal';
import { EventDetailsModal } from '../components/EventDetailsModal'; // Imported new modal
import { fetchIcsEvents, IcsEvent } from '../services/icsService';

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('month');
  
  // Modals State
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<any>(null);
  const [eventToEdit, setEventToEdit] = useState<any>(null); // For passing to NewEventModal from Details

  // --- External Calendars State ---
  // Store cached events for each chapter ID: { [chapterId]: IcsEvent[] }
  const [externalEventsCache, setExternalEventsCache] = useState<Record<number, IcsEvent[]>>({});
  // Store which chapter calendars are active (IDs)
  const [activeCalendarIds, setActiveCalendarIds] = useState<number[]>([]);
  // Store loading state per chapter ID
  const [loadingCalendars, setLoadingCalendars] = useState<number[]>([]);
  
  // --- DEBUG STATE ---
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // --- Internal Filter States ---
  const [filterType, setFilterType] = useState<'all' | 'chapter' | 'project'>('all');
  const [filterId, setFilterId] = useState<string>('');

  const addLog = (msg: string) => {
    setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()} > ${msg}`]);
  };

  // --- Helper to fetch specific calendar ---
  const fetchChapterCalendar = async (chapterId: number, url: string, forceRefresh = false) => {
    // If cached and not force refresh, don't fetch
    if (!forceRefresh && externalEventsCache[chapterId]) return;

    setLoadingCalendars(prev => [...prev, chapterId]);
    if (forceRefresh) {
        setShowDebug(true);
        setDebugLogs([]);
        addLog(`Recarregando calendário do Cap ID: ${chapterId}`);
    }

    try {
        const icsEvents = await fetchIcsEvents(url, forceRefresh ? addLog : undefined);
        
        // Attach chapter metadata to each event for color/naming
        const chapter = chapters.find((c: any) => c.id === chapterId);
        const enrichedEvents = icsEvents.map(evt => ({
            ...evt,
            chapter: {
                cor: chapter?.cor || 'from-gray-500 to-gray-700',
                sigla: chapter?.sigla || 'EXT',
                nome: chapter?.nome
            }
        }));

        setExternalEventsCache(prev => ({ ...prev, [chapterId]: enrichedEvents }));
        if(forceRefresh) addLog(`Sucesso! ${icsEvents.length} eventos carregados.`);
    } catch (e) {
        if(forceRefresh) addLog(`Erro: ${e}`);
        console.error(`Failed to fetch calendar for chapter ${chapterId}`, e);
    } finally {
        setLoadingCalendars(prev => prev.filter(id => id !== chapterId));
    }
  };

  // Toggle Handler
  const toggleCalendar = async (chapter: any) => {
    if (!chapter.calendarUrl) return;

    const isActive = activeCalendarIds.includes(chapter.id);
    
    if (isActive) {
        // Deactivate
        setActiveCalendarIds(prev => prev.filter(id => id !== chapter.id));
    } else {
        // Activate
        setActiveCalendarIds(prev => [...prev, chapter.id]);
        // Fetch if not in cache
        if (!externalEventsCache[chapter.id]) {
            await fetchChapterCalendar(chapter.id, chapter.calendarUrl);
        }
    }
  };

  const refreshActiveCalendars = async () => {
      setShowDebug(true);
      setDebugLogs([]);
      addLog("Iniciando refresh total...");
      
      for (const id of activeCalendarIds) {
          const chap = chapters.find((c: any) => c.id === id);
          if (chap?.calendarUrl) {
              await fetchChapterCalendar(id, chap.calendarUrl, true);
          }
      }
      addLog("Refresh concluído.");
  };

  // --- Data Transformation & Filtering ---
  const calendarEvents = useMemo(() => {
    // 1. Filtrar Eventos Internos (DB)
    const internalFiltered = events.filter(e => {
      if (filterType === 'all') return true;
      if (filterType === 'chapter') return e.chapterId?.toString() === filterId;
      if (filterType === 'project') return e.projectId?.toString() === filterId;
      return true;
    });

    // 2. Transformar Internos para formato RBC
    const internalMapped = internalFiltered.map(evt => ({
      id: evt.id,
      title: evt.title,
      start: new Date(evt.startDate),
      end: new Date(evt.endDate),
      resource: evt, 
      isExternal: false
    }));

    // 3. Coletar Eventos Externos Ativos
    let externalMapped: any[] = [];
    activeCalendarIds.forEach(id => {
        const evts = externalEventsCache[id] || [];
        const mapped = evts.map(evt => ({
            id: evt.id,
            title: evt.title,
            start: new Date(evt.startDate),
            end: new Date(evt.endDate),
            resource: evt,
            isExternal: true
        }));
        externalMapped = [...externalMapped, ...mapped];
    });

    return [...internalMapped, ...externalMapped];
  }, [events, filterType, filterId, activeCalendarIds, externalEventsCache]);

  // --- Handlers ---
  const onSelectEvent = (calendarEvent: any) => {
    setSelectedEventForDetails(calendarEvent);
    setIsDetailsModalOpen(true);
  };

  const handleEditInternalEvent = (rawEvent: any) => {
      setEventToEdit(rawEvent);
      setIsNewEventModalOpen(true);
  };

  const handleNewEvent = () => {
    setEventToEdit(null);
    setIsNewEventModalOpen(true);
  };

  // --- Custom Styling via eventPropGetter ---
  const eventPropGetter = (event: any) => {
    let className = '';
    const chapter = event.resource.chapter; // Available on both internal (if populated) and external (enriched)

    if (event.isExternal) {
      // Eventos externos
      if (chapter?.cor) {
         className = `bg-gradient-to-r ${chapter.cor} text-white border-0 opacity-80 hover:opacity-100 border-l-4 border-white/50`;
      } else {
         className = 'bg-green-600 text-white border-0 opacity-80 hover:opacity-100';
      }
    } else {
      // Eventos internos
      if (chapter?.cor) {
        className = `bg-gradient-to-r ${chapter.cor} text-white border-0 shadow-sm hover:brightness-95`;
      } else {
        // Default Blue
        className = 'bg-blue-600 text-white border-0 shadow-sm';
      }
    }

    return { className };
  };

  // Label do Header Personalizado
  const headerLabel = view === 'month' 
    ? currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : currentDate.toLocaleDateString('pt-BR', { dateStyle: 'full' });

  // Get list of chapters that actually have calendar URLs
  const chaptersWithCalendar = chapters.filter((c: any) => c.calendarUrl);

  return (
    <div className="space-y-6 h-full flex flex-col relative pb-6">
      
      {/* Modals */}
      <NewEventModal 
        isOpen={isNewEventModalOpen} 
        onClose={() => setIsNewEventModalOpen(false)} 
        eventToEdit={eventToEdit}
      />

      <EventDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        event={selectedEventForDetails}
        onEdit={handleEditInternalEvent}
      />

      {/* DEBUG CONSOLE OVERLAY */}
      {showDebug && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-green-400 font-mono text-xs z-[100] shadow-2xl border-t border-gray-700 max-h-64 flex flex-col">
            <div className="flex justify-between items-center bg-gray-800 px-4 py-1 border-b border-gray-700">
                <span className="flex items-center gap-2 font-bold uppercase tracking-wider">
                    <Terminal className="w-3 h-3" /> Console de Debug ICS
                </span>
                <button onClick={() => setShowDebug(false)} className="hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-1">
                {debugLogs.length === 0 && <div className="opacity-50">Aguardando logs...</div>}
                {debugLogs.map((log, i) => (
                    <div key={i} className="break-all border-b border-gray-800 pb-0.5 mb-0.5">{log}</div>
                ))}
            </div>
        </div>
      )}

      {/* CUSTOM TOOLBAR */}
      <div className="flex flex-col gap-4 shrink-0">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Calendário</h1>
            <p className="text-gray-500 mt-1">Acompanhe eventos internos e cronogramas externos.</p>
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

                <button onClick={handleNewEvent} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap">
                <Plus className="w-5 h-5" />
                <span className="hidden lg:inline">Novo</span>
                </button>
            </div>
        </div>

        {/* Filters and Calendars Row */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
            
            {/* Toggle External Calendars */}
            <div className="flex-1 overflow-x-auto pb-2 lg:pb-0 w-full custom-scrollbar">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1 mr-2">
                        <CloudDownload className="w-3 h-3" /> Calendários Externos:
                    </span>
                    
                    {chaptersWithCalendar.length === 0 ? (
                        <span className="text-xs text-gray-400 italic">Nenhum configurado.</span>
                    ) : (
                        chaptersWithCalendar.map((cap: any) => {
                            const isActive = activeCalendarIds.includes(cap.id);
                            const isLoading = loadingCalendars.includes(cap.id);
                            
                            return (
                                <button
                                    key={cap.id}
                                    onClick={() => toggleCalendar(cap)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${
                                        isActive 
                                            ? `bg-gray-800 text-white border-gray-800 shadow-sm` 
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${cap.cor}`}></div>}
                                    {cap.sigla}
                                    {isActive && <Check className="w-3 h-3 ml-1" />}
                                </button>
                            );
                        })
                    )}
                    
                    {activeCalendarIds.length > 0 && (
                        <button onClick={refreshActiveCalendars} className="ml-2 p-1.5 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors" title="Atualizar Externos">
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="w-px h-8 bg-gray-200 hidden lg:block"></div>

            {/* Internal Filter */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-2 py-1 text-gray-500 text-sm">
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">Filtrar Internos:</span>
                </div>
                <select 
                    value={filterType}
                    onChange={(e) => { setFilterType(e.target.value as any); setFilterId(''); }}
                    className="bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer outline-none px-2 py-1.5"
                >
                    <option value="all">Todos</option>
                    <option value="chapter">Capítulo</option>
                    <option value="project">Projeto</option>
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
        </div>
      </div>

      {/* REACT BIG CALENDAR COMPONENT */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
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

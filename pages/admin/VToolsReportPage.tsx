
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Filter, Calendar as CalendarIcon, Briefcase, FolderKanban, MapPin, Clock, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { VToolsReportModal } from '../../components/VToolsReportModal';

export const VToolsReportPage = () => {
    const navigate = useNavigate();
    const { events, chapters, projects } = useData();

    const [selectedChapterId, setSelectedChapterId] = useState<string>('');
    const [selectedProjectId, setSelectedProjectId] = useState<string>(''); // '' = all, 'none' = no project, '123' = specific
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [eventToReport, setEventToReport] = useState<any>(null);

    // Initialize with first chapter
    useEffect(() => {
        if (chapters.length > 0 && !selectedChapterId) {
            setSelectedChapterId(String(chapters[0].id));
        }
    }, [chapters, selectedChapterId]);

    // Filter Logic
    const filteredEvents = useMemo(() => {
        const now = new Date();

        return events.filter(e => {
            // 1. Must be PAST event
            const isPast = new Date(e.endDate) < now;

            // 2. Must NOT be reported yet
            const isUnreported = !e.vtoolsReported;

            // 3. Must match Chapter
            const matchesChapter = e.chapterId === Number(selectedChapterId);

            // 4. Must match Project
            let matchesProject = true;
            if (selectedProjectId === 'none') {
                matchesProject = !e.projectId;
            } else if (selectedProjectId) {
                matchesProject = e.projectId === Number(selectedProjectId);
            }

            return isPast && isUnreported && matchesChapter && matchesProject;
        }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()); // Sort desc (recent first)
    }, [events, selectedChapterId, selectedProjectId]);

    const handleOpenReport = (event: any) => {
        setEventToReport(event);
        setIsReportModalOpen(true);
    };

    const projectOptions = useMemo(() => {
        if (!selectedChapterId) return [];
        const chapId = Number(selectedChapterId);
        return projects.filter((p: any) => {
            const pChapters = Array.isArray(p.capituloId) ? p.capituloId : [p.capituloId];
            return pChapters.includes(chapId);
        });
    }, [projects, selectedChapterId]);

    return (
        <div className="space-y-6 pb-20">

            <VToolsReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                eventToReport={eventToReport}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            Report Vtools
                            <FileText className="w-5 h-5 text-emerald-600" />
                        </h1>
                        <p className="text-gray-500 text-sm">Eventos passados pendentes de envio para o sistema global.</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium min-w-fit">
                    <Filter className="w-4 h-4" /> Filtros:
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {/* Chapter Select */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FolderKanban className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                            value={selectedChapterId}
                            onChange={(e) => setSelectedChapterId(e.target.value)}
                            className="block w-full pl-10 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-xl border bg-white shadow-sm appearance-none cursor-pointer"
                        >
                            {chapters.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.sigla} - {c.nome}</option>
                            ))}
                        </select>
                    </div>

                    {/* Project Select */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Briefcase className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="block w-full pl-10 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-xl border bg-white shadow-sm appearance-none cursor-pointer"
                        >
                            <option value="">Todos os Projetos</option>
                            <option value="none">Sem Projeto Vinculado</option>
                            {projectOptions.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.nome}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Events List (Agenda Style) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-gray-500" />
                        Eventos Pendentes
                    </h3>
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-full border border-emerald-200">
                        {filteredEvents.length} Encontrados
                    </span>
                </div>

                {filteredEvents.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {filteredEvents.map((event: any) => {
                            const date = new Date(event.startDate);
                            const day = date.getDate();
                            const month = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
                            const year = date.getFullYear();

                            // Helper formatting
                            const startTime = new Date(event.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                            const endTime = new Date(event.endDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                            return (
                                <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center">
                                    {/* Date Box */}
                                    <div className="flex-shrink-0 flex flex-col items-center justify-center bg-gray-100 border border-gray-200 rounded-xl w-16 h-16 shadow-sm">
                                        <span className="text-xs font-bold text-gray-500 uppercase">{month}</span>
                                        <span className="text-2xl font-bold text-gray-800 leading-none">{day}</span>
                                        <span className="text-[10px] text-gray-400">{year}</span>
                                    </div>

                                    {/* Event Details */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-lg font-bold text-gray-900 mb-1">{event.title}</h4>

                                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 mb-2">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                {startTime} - {endTime}
                                            </div>
                                            {event.location && (
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-4 h-4 text-gray-400" />
                                                    {event.location}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                {event.category}
                                            </span>
                                            {event.project && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                                    <Briefcase className="w-3 h-3" />
                                                    {event.project.nome}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="flex-shrink-0 w-full md:w-auto">
                                        <button
                                            onClick={() => handleOpenReport(event)}
                                            className="w-full md:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            ENVIAR REPORT
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
                        <AlertCircle className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="font-medium">Nenhum evento pendente encontrado.</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Verifique os filtros ou se todos os eventos passados já foram reportados.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

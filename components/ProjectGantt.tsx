import React, { useState, useMemo } from 'react';
import { Maximize2, Minimize2, Calendar, Flag, Plus, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useData } from '../context/DataContext';

interface Checkpoint {
  title: string;
  date: string;
}

interface ProjectGanttProps {
  projectId: number;
  tasks: any[];
  checkpoints?: Checkpoint[];
}

export const ProjectGantt = ({ projectId, tasks, checkpoints = [] }: ProjectGanttProps) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isAddCheckpointOpen, setIsAddCheckpointOpen] = useState(false);
  const [newCheckpoint, setNewCheckpoint] = useState({ title: '', date: '' });
  const [isSavingCheckpoint, setIsSavingCheckpoint] = useState(false);

  const navigate = useNavigate();
  const { fetchData, users } = useData();

  // Helper para normalizar datas (apenas YYYY-MM-DD)
  const normalizeDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    
    // Fix: Parse manually YYYY-MM-DD to ensure local timezone is used.
    // This prevents new Date('YYYY-MM-DD') from being interpreted as UTC midnight (which shows as previous day in Western timezones)
    const part = dateStr.split('T')[0];
    if (part.includes('-')) {
      const [year, month, day] = part.split('-').map(Number);
      if (year && month && day) {
        return new Date(year, month - 1, day);
      }
    }

    const date = new Date(dateStr);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  // 1. Calcular range de datas
  const { startDate, endDate, totalDays, dates } = useMemo(() => {
    let min = new Date();
    let max = new Date();
    const allDates: Date[] = [];

    tasks.forEach(t => {
      if (t.dataInicio) allDates.push(normalizeDate(t.dataInicio));
      else allDates.push(normalizeDate(t.created_at));
      if (t.prazo) allDates.push(normalizeDate(t.prazo));
    });

    checkpoints.forEach(cp => {
      if (cp.date) allDates.push(normalizeDate(cp.date));
    });

    if (allDates.length > 0) {
      min = new Date(Math.min(...allDates.map(d => d.getTime())));
      max = new Date(Math.max(...allDates.map(d => d.getTime())));
    } else {
      max.setDate(min.getDate() + 7);
    }

    min.setDate(min.getDate() - 3);
    max.setDate(max.getDate() + 5);

    const datesArray = [];
    let curr = new Date(min);
    while (curr <= max) {
      datesArray.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }

    return { startDate: min, endDate: max, totalDays: datesArray.length, dates: datesArray };
  }, [tasks, checkpoints]);

  // Handler de adicionar Checkpoint
  const handleAddCheckpoint = async () => {
    if (!newCheckpoint.title || !newCheckpoint.date || !projectId) return;
    setIsSavingCheckpoint(true);

    const updatedCheckpoints = [...checkpoints, newCheckpoint];

    try {
      const { error } = await supabase
        .from('projects')
        .update({ checkpoints: updatedCheckpoints })
        .eq('id', projectId);

      if (error) throw error;

      await fetchData(true);
      setIsAddCheckpointOpen(false);
      setNewCheckpoint({ title: '', date: '' });
    } catch (e) {
      console.error("Erro ao salvar checkpoint", e);
      alert("Erro ao salvar checkpoint");
    } finally {
      setIsSavingCheckpoint(false);
    }
  };

  // Constantes de Layout
  const COLUMN_WIDTH = 50;
  const ROW_HEIGHT = 80;
  const HEADER_HEIGHT = 60;
  const SIDEBAR_WIDTH = 280;

  // Altura Dinâmica do Container
  const containerHeight = useMemo(() => {
    if (isFullScreen) return '100%';
    // Toolbar (72px) + Header (60px) + Rows + Buffer
    const contentHeight = 72 + HEADER_HEIGHT + (tasks.length * ROW_HEIGHT) + 20;
    // Min 350px para não ficar muito pequeno quando vazio
    // Max 800px para não ocupar a tela toda se tiver muitas tarefas (scroll interno ativa)
    return Math.min(Math.max(contentHeight, 350), 800);
  }, [isFullScreen, tasks.length]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-400';
      case 'doing': return 'bg-blue-500';
      case 'review': return 'bg-yellow-500';
      case 'done': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'urgente': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'alta': return 'text-red-600 bg-red-50 border-red-200';
      case 'média': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const GanttContent = () => (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden relative">
      {/* Modal de Adicionar Checkpoint (Interno) */}
      {isAddCheckpointOpen && (
        <div className="absolute inset-0 z-50 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Flag className="w-5 h-5 text-orange-500" />
                Novo Checkpoint
              </h3>
              <button onClick={() => setIsAddCheckpointOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Título do Marco</label>
                <input
                  autoFocus
                  type="text"
                  value={newCheckpoint.title}
                  onChange={(e) => setNewCheckpoint({ ...newCheckpoint, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500"
                  placeholder="Ex: Entrega Parcial"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Data</label>
                <input
                  type="date"
                  value={newCheckpoint.date}
                  onChange={(e) => setNewCheckpoint({ ...newCheckpoint, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500"
                />
              </div>
              <button
                onClick={handleAddCheckpoint}
                disabled={!newCheckpoint.title || !newCheckpoint.date || isSavingCheckpoint}
                className="w-full mt-2 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSavingCheckpoint && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar Checkpoint
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto relative custom-scrollbar">
        <div className="flex" style={{ minWidth: '100%' }}>

          {/* Coluna Esquerda: Lista de Tarefas */}
          <div
            className="sticky left-0 z-20 bg-white border-r border-gray-200 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.1)] flex-shrink-0"
            style={{ width: SIDEBAR_WIDTH, marginTop: HEADER_HEIGHT }}
          >
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/tasks/${task.id}`)}
                className="border-b border-gray-100 px-4 py-2 flex flex-col justify-center items-start cursor-pointer hover:bg-gray-50 transition-colors group relative"
                style={{ height: ROW_HEIGHT }}
              >
                <span className="text-sm font-bold text-gray-900 truncate w-full shrink-0 block mb-2 group-hover:text-blue-600 transition-colors" title={task.titulo}>
                  {task.titulo}
                </span>

                <div className="flex items-center gap-2 w-full">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wide ${getPriorityColor(task.prioridade)}`}>
                    {task.prioridade}
                  </span>
                  
                  {task.tags && task.tags.length > 0 && (
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded truncate border border-gray-200 max-w-[120px]">
                      {task.tags[0]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Área do Gráfico */}
          <div className="flex-1 relative">
            <div
              className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 flex"
              style={{ height: HEADER_HEIGHT, width: totalDays * COLUMN_WIDTH }}
            >
              {dates.map((date, i) => {
                const isNewMonth = i === 0 || date.getDate() === 1;
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={i}
                    className={`flex-shrink-0 border-r border-gray-200 flex flex-col items-center justify-end pb-2 relative ${isToday ? 'bg-blue-50/50' : ''}`}
                    style={{ width: COLUMN_WIDTH }}
                  >
                    {isNewMonth && (
                      <div className="absolute top-1 left-1 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">
                        {date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </div>
                    )}
                    <span className="text-[10px] text-gray-400 font-medium">
                      {date.toLocaleDateString('pt-BR', { weekday: 'short' }).charAt(0)}
                    </span>
                    <span className={`text-sm font-bold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                      {date.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="relative" style={{ width: totalDays * COLUMN_WIDTH, height: Math.max(tasks.length * ROW_HEIGHT, 200) }}>
              {/* Linhas de fundo */}
              <div className="absolute inset-0 flex pointer-events-none">
                {dates.map((_, i) => (
                  <div key={i} className="border-r border-gray-100 h-full" style={{ width: COLUMN_WIDTH }} />
                ))}
              </div>
              {tasks.map((_, i) => (
                <div key={i} className="absolute w-full border-b border-gray-100" style={{ top: (i + 1) * ROW_HEIGHT, height: 1 }} />
              ))}

              {/* Barras */}
              {tasks.map((task, i) => {
                const tStart = task.dataInicio ? normalizeDate(task.dataInicio) : normalizeDate(task.created_at);
                let tEnd = task.prazo ? normalizeDate(task.prazo) : new Date(tStart.getTime() + (7 * 24 * 60 * 60 * 1000));
                if (tEnd < tStart) tEnd = tStart;

                // Use Math.round to handle potential DST offsets when calculating days
                const diffStart = Math.round((tStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                const duration = Math.round((tEnd.getTime() - tStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                const left = diffStart * COLUMN_WIDTH;
                const width = duration * COLUMN_WIDTH;

                // Resolve assignees
                const taskAssignees = users.filter(u => task.responsavelIds?.includes(u.id));

                return (
                  <div
                    key={task.id}
                    onClick={(e) => { e.stopPropagation(); navigate(`/tasks/${task.id}`); }}
                    className="absolute group z-10"
                    style={{
                      top: i * ROW_HEIGHT + 24,
                      left: left + 4,
                      width: Math.max(width - 8, 10),
                      height: 32
                    }}
                  >
                    <div
                      className={`h-full rounded-md shadow-sm ${getStatusColor(task.status)} bg-opacity-90 hover:bg-opacity-100 transition-all cursor-pointer relative flex items-center justify-center`}
                    ></div>
                    
                    {/* Tooltip Customizado */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl min-w-max border border-gray-700">
                      <div className="font-bold text-sm mb-1">{task.titulo}</div>
                      <div className="text-xs text-gray-300 mb-1 flex flex-wrap gap-1 max-w-[200px]">
                        {taskAssignees.length > 0 ? (
                           taskAssignees.map(u => (
                             <span key={u.id} className="bg-gray-800 px-1 rounded">{u.nome.split(' ')[0]}</span>
                           ))
                        ) : 'Sem responsável'}
                      </div>
                      <div className="text-[10px] text-gray-400 border-t border-gray-700 pt-1 mt-1">
                        {tStart.toLocaleDateString()} - {tEnd.toLocaleDateString()}
                      </div>
                      {/* Seta do tooltip */}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 border-b border-r border-gray-700"></div>
                    </div>

                    {width < 50 && (
                      <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 whitespace-nowrap pointer-events-none">
                        {duration}d
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Checkpoints */}
              <div className="absolute inset-0 pointer-events-none z-30">
                {checkpoints.map((cp, idx) => {
                  const cpDate = normalizeDate(cp.date);
                  if (cpDate < startDate || cpDate > endDate) return null;

                  const diffDays = Math.round((cpDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                  const leftPos = (diffDays * COLUMN_WIDTH) + (COLUMN_WIDTH / 2);

                  return (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 flex flex-col items-center group pointer-events-auto"
                      style={{ left: leftPos }}
                    >
                      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-orange-500 hover:border-t-orange-600 cursor-help transition-colors filter drop-shadow-sm transform -translate-y-0.5"></div>
                      <div className="w-px h-full bg-orange-500/30 border-l border-dashed border-orange-400/50"></div>
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                        <div className="font-bold mb-0.5">{cp.title}</div>
                        <div className="text-[10px] text-gray-300">{cpDate.toLocaleDateString('pt-BR')}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (tasks.length === 0) return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-gray-500">
      <Calendar className="w-10 h-10 mb-3 opacity-20" />
      <p>Ainda não há tarefas para exibir no cronograma.</p>
    </div>
  );

  return (
    <>
      <div 
        className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all ${isFullScreen ? 'fixed inset-0 z-50 m-0 rounded-none' : 'w-full'}`}
        style={{ height: typeof containerHeight === 'number' ? `${containerHeight}px` : containerHeight }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900">Cronograma</h2>
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full ml-2">
              {tasks.length} Tarefas
            </span>
            {checkpoints.length > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full ml-1 border border-orange-100">
                <Flag className="w-3 h-3" />
                {checkpoints.length} Marcos
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddCheckpointOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors mr-2 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Checkpoint
            </button>

            {/* HEADER STATUS LEGEND - UPDATED */}
            <div className="flex items-center gap-2 text-xs text-gray-500 mr-2 hidden md:flex">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-400"></div> A Fazer</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Fazendo</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Revisão</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Feito</span>
            </div>

            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
              title={isFullScreen ? "Minimizar" : "Tela Cheia"}
            >
              {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <GanttContent />
      </div>

      {isFullScreen && <style>{`body { overflow: hidden; }`}</style>}
    </>
  );
};
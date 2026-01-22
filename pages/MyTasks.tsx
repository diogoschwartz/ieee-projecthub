
import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Circle, 
  ClipboardList, 
  Briefcase, 
  Paperclip, 
  MessageSquare, 
  Filter, 
  ChevronDown, 
  Loader2, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { currentUserMock, PriorityBadge } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const MyTasks = () => {
  const navigate = useNavigate();
  const { tasks, fetchData } = useData();
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Status Dropdown State
  const [openStatusMenuId, setOpenStatusMenuId] = useState<number | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setOpenStatusMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter only tasks assigned to current user AND NOT ARCHIVED
  const myTasks = tasks.filter((t: any) => t.responsavelId === currentUserMock.id && t.status !== 'archived');
  
  // Calculate statistics
  const stats = {
    total: myTasks.length,
    todo: myTasks.filter((t: any) => t.status === 'todo').length,
    doing: myTasks.filter((t: any) => t.status === 'doing').length,
    review: myTasks.filter((t: any) => t.status === 'review').length,
    done: myTasks.filter((t: any) => t.status === 'done').length,
  };

  // Apply visual filter
  const filteredTasks = filterStatus === 'all' 
    ? myTasks 
    : myTasks.filter((t: any) => t.status === filterStatus);

  // --- Helper Functions ---

  const handleStatusUpdate = async (taskId: number, newStatus: string) => {
    setOpenStatusMenuId(null);
    setIsUpdatingStatus(taskId);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      await fetchData(true); // Refresh data quietly
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Não foi possível atualizar o status.");
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const statusOptions = [
    { value: 'todo', label: 'A Fazer', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200' },
    { value: 'doing', label: 'Fazendo', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200' },
    { value: 'review', label: 'Revisão', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200' },
    { value: 'done', label: 'Concluído', color: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' }
  ];

  const getStatusStyle = (status: string) => {
    const found = statusOptions.find(o => o.value === status);
    return found ? found.color : statusOptions[0].color;
  };

  const getStatusLabel = (status: string) => {
    const found = statusOptions.find(o => o.value === status);
    return found ? found.label : status;
  };

  // --- Grouping Logic ---

  const getDeadlineGroup = (task: any) => {
    if (task.status === 'done') return 'concluidas';
    if (!task.prazo) return 'sem_prazo';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(task.prazo);
    deadline.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'atrasadas';
    if (diffDays <= 3) return 'urgentes';
    if (diffDays <= 7) return 'semana';
    if (diffDays < 15) return 'em_breve';
    return 'longo_prazo';
  };

  const groups = {
    atrasadas: { label: 'Atrasadas', color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle, tasks: [] as any[] },
    urgentes: { label: 'Urgentes (3 dias)', color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertCircle, tasks: [] as any[] },
    semana: { label: 'Para a Próxima Semana', color: 'text-blue-600', bg: 'bg-blue-50', icon: Calendar, tasks: [] as any[] },
    em_breve: { label: 'Em Breve (15 dias)', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Calendar, tasks: [] as any[] },
    longo_prazo: { label: 'Longo Prazo (+15 dias)', color: 'text-gray-600', bg: 'bg-gray-50', icon: Calendar, tasks: [] as any[] },
    sem_prazo: { label: 'Sem Prazo Definido', color: 'text-gray-500', bg: 'bg-gray-50', icon: Clock, tasks: [] as any[] },
    concluidas: { label: 'Concluídas Recentemente', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2, tasks: [] as any[] }
  };

  // Populate Groups
  filteredTasks.forEach(t => {
    const groupKey = getDeadlineGroup(t);
    // @ts-ignore
    if (groups[groupKey]) {
        // @ts-ignore
        groups[groupKey].tasks.push(t);
    }
  });

  const renderTaskGroup = (groupKey: string) => {
    // @ts-ignore
    const group = groups[groupKey];
    if (group.tasks.length === 0) return null;

    return (
      <div key={groupKey} className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className={`flex items-center gap-2 mb-3 px-1 ${group.color}`}>
          <group.icon className="w-5 h-5" />
          <h3 className="font-bold text-sm uppercase tracking-wider">{group.label} ({group.tasks.length})</h3>
        </div>

        <div className="space-y-3">
          {group.tasks.map((tarefa: any) => (
            <div 
              key={tarefa.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all group flex flex-col md:flex-row md:items-center gap-4 relative"
            >
              {/* Priority Stripe */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                 tarefa.prioridade === 'urgente' ? 'bg-purple-500' :
                 tarefa.prioridade === 'alta' ? 'bg-red-500' :
                 tarefa.prioridade === 'média' ? 'bg-orange-400' : 'bg-blue-400'
              }`}></div>

              {/* Main Content */}
              <div 
                className="flex-1 min-w-0 cursor-pointer pl-2"
                onClick={() => navigate(`/tasks/${tarefa.id}`)}
              >
                <div className="flex items-center gap-2 mb-1">
                   <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                     {tarefa.titulo}
                   </h3>
                   <PriorityBadge prioridade={tarefa.prioridade} />
                </div>
                
                <div className="flex items-center gap-3 text-xs text-gray-500">
                   <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100 font-medium">
                      <Briefcase className="w-3 h-3" />
                      {tarefa.projeto}
                   </span>
                   
                   {tarefa.tags && tarefa.tags.length > 0 && (
                      <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-gray-50 text-gray-400">
                         {tarefa.tags[0]}
                         {tarefa.tags.length > 1 && ` +${tarefa.tags.length - 1}`}
                      </span>
                   )}

                   <div className="flex items-center gap-2 ml-auto md:ml-0">
                      {tarefa.anexos > 0 && (
                        <span className="flex items-center gap-1">
                          <Paperclip className="w-3 h-3" /> {tarefa.anexos}
                        </span>
                      )}
                      {/* Comments count removed */}
                   </div>
                </div>
              </div>

              {/* Actions & Status - Right Side */}
              <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pl-2 md:pl-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-50">
                 {/* Deadline Display */}
                 <div className="flex items-center gap-2 text-sm">
                    {tarefa.prazo ? (
                       <span className={`flex items-center gap-1.5 font-medium ${
                          groupKey === 'atrasadas' ? 'text-red-600' : 
                          groupKey === 'urgentes' ? 'text-orange-600' : 'text-gray-500'
                       }`}>
                          <Calendar className="w-4 h-4" />
                          {new Date(tarefa.prazo).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                       </span>
                    ) : (
                       <span className="text-gray-400 text-xs italic">Sem prazo</span>
                    )}
                 </div>

                 {/* STATUS BUTTON */}
                 <div className="relative" ref={openStatusMenuId === tarefa.id ? statusMenuRef : null}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenStatusMenuId(openStatusMenuId === tarefa.id ? null : tarefa.id);
                      }}
                      disabled={isUpdatingStatus === tarefa.id}
                      className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border font-bold text-xs transition-all shadow-sm min-w-[120px] ${getStatusStyle(tarefa.status)} ${isUpdatingStatus === tarefa.id ? 'opacity-70 cursor-wait' : 'hover:shadow-md hover:brightness-95'}`}
                    >
                      {isUpdatingStatus === tarefa.id ? (
                        <div className="flex items-center justify-center w-full">
                            <Loader2 className="w-3 h-3 animate-spin" />
                        </div>
                      ) : (
                        <>
                          <span className="truncate">{getStatusLabel(tarefa.status)}</span>
                          <ChevronDown className="w-3 h-3 opacity-70" />
                        </>
                      )}
                    </button>

                    {/* Dropdown Menu */}
                    {openStatusMenuId === tarefa.id && (
                      <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        {statusOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(tarefa.id, option.value);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 flex items-center justify-between ${
                              tarefa.status === option.value ? 'bg-blue-50/50 text-blue-700 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {option.label}
                            {tarefa.status === option.value && <Check className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    )}
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Minhas Tarefas</h1>
          <p className="text-gray-500 mt-1">Gerencie suas entregas e acompanhe prazos.</p>
        </div>
        
        <div className="flex items-center gap-2 text-sm bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-gray-600">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="font-bold text-gray-900">{stats.done}/{stats.total}</span> Concluídas
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filterStatus === 'all' 
              ? 'bg-gray-900 text-white shadow-sm' 
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Todas
        </button>
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilterStatus(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              filterStatus === opt.value 
                ? 'bg-gray-900 text-white shadow-sm' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {opt.label}
            <span className={`px-1.5 py-0.5 rounded text-[10px] bg-white/20 text-current`}>
              {/* @ts-ignore */}
              {stats[opt.value]}
            </span>
          </button>
        ))}
      </div>

      {/* Groups Render */}
      <div className="space-y-2">
        {renderTaskGroup('atrasadas')}
        {renderTaskGroup('urgentes')}
        {renderTaskGroup('semana')}
        {renderTaskGroup('em_breve')}
        {renderTaskGroup('longo_prazo')}
        {renderTaskGroup('sem_prazo')}
        {renderTaskGroup('concluidas')}
      </div>

      {filteredTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
           <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
             <Filter className="w-6 h-6 text-gray-400" />
           </div>
           <p className="font-medium">Nenhuma tarefa encontrada neste filtro.</p>
        </div>
      )}
    </div>
  );
};

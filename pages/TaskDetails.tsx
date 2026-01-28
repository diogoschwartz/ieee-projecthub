
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Briefcase, User, Tag, ExternalLink,
  Edit2, Globe, Save, Plus, Trash2, Loader2, Code,
  Maximize2, Minimize2, Link as LinkIcon, Eye, EyeOff, Paperclip
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useData } from '../context/DataContext';
import { PriorityBadge, StatusBadge, UserAvatar } from '../lib/utils';
import { NewTaskModal } from '../components/NewTaskModal';
import { supabase } from '../lib/supabase';
import { usePermissions } from '../hooks/usePermissions';
import { useGlobalAlert } from '../components/GlobalAlert';

// --- Types (Single Source of Truth Structure) ---
type ResourceType = 'url' | 'html';
type DisplayMode = 'iframe-100' | 'iframe-50' | 'link-only';

interface ResourceItem {
  type: ResourceType;
  value: string;
  displayMode: DisplayMode;
}

// --- Helper: Parse Logic ---
const parseTaskResources = (task: any): ResourceItem[] => {
  if (!task) return [];

  const rawContent = task.content_url ?? task.url;

  if (!rawContent) return [];

  try {
    let content;

    if (typeof rawContent === 'string') {
      try {
        content = JSON.parse(rawContent);
      } catch {
        content = [rawContent];
      }
    } else {
      content = rawContent;
    }

    if (Array.isArray(content)) {
      return content.map((item: any) => {
        if (typeof item === 'string') {
          return {
            type: 'url',
            value: item,
            displayMode: 'iframe-100'
          };
        }
        return {
          type: item.type || 'url',
          value: item.value || '',
          displayMode: item.displayMode || 'iframe-100'
        };
      });
    }

    return [];
  } catch (e) {
    console.error("Erro ao ler recursos do banco:", e);
    return [];
  }
};

export const TaskDetails = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { tasks, fetchData, users, projects } = useData();
  const { withTaskEditPermission } = usePermissions();
  const { showAlert } = useGlobalAlert();

  // UI States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isSavingDesc, setIsSavingDesc] = useState(false);
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [showDescPreview, setShowDescPreview] = useState(false);

  // Data States
  const [description, setDescription] = useState('');
  const [resources, setResources] = useState<ResourceItem[]>([]);

  // Form States
  const [newResValue, setNewResValue] = useState('');
  const [newResDisplay, setNewResDisplay] = useState<DisplayMode>('iframe-100');

  const task = tasks.find((t: any) =>
    t.public_id === taskId // Strict Public ID Check
  );

  const project = projects.find((p: any) => p.id === task?.projetoId || p.id === task?.project_id);

  // --- Effect: Load from Source of Truth ---
  useEffect(() => {
    if (task) {
      setDescription(task.descricao || '');
      setResources(parseTaskResources(task));
    }
  }, [task]);

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-gray-500">
        <p className="text-lg">Tarefa não encontrada.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">Voltar</button>
      </div>
    );
  }

  // --- Handlers ---

  const handleSaveDescription = async () => {
    if (!task || !project) return;

    withTaskEditPermission(task, project, async () => {
      setIsSavingDesc(true);
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ description: description })
          .eq('id', task.id);

        if (error) throw error;

        await fetchData(true);
        setIsEditingDesc(false);
        setShowDescPreview(false);
      } catch (error) {
        console.error("Error saving description:", error);
        showAlert("Erro ao Salvar", "Não foi possível salvar a descrição.", "error");
      } finally {
        setIsSavingDesc(false);
      }
    });
  };

  const handleAddResource = async () => {
    if (!newResValue.trim() || !task || !project) return;

    withTaskEditPermission(task, project, async () => {
      setIsAddingResource(true);

      const newResource: ResourceItem = {
        type: 'url',
        value: newResValue.trim(),
        displayMode: newResDisplay
      };

      const updatedResources = [...resources, newResource];
      setResources(updatedResources);
      setNewResValue('');

      try {
        await saveResources(updatedResources);
      } finally {
        setIsAddingResource(false);
      }
    });
  };

  const saveResources = async (resourcesToSave: ResourceItem[]) => {
    try {
      const valueToSave = resourcesToSave.length > 0 ? JSON.stringify(resourcesToSave) : null;

      // Atualiza content_url E attachments_count ao mesmo tempo
      const { error } = await supabase
        .from('tasks')
        .update({
          content_url: valueToSave,
          attachments_count: resourcesToSave.length
        })
        .eq('id', task.id);

      if (error) throw error;

      await fetchData(true);
    } catch (err: any) {
      console.error('Erro ao salvar recursos no banco:', err);
      showAlert("MSG_ERROR", `Erro ao salvar recursos: ${err.message || 'Erro desconhecido'}`, "error");
      await fetchData(true);
    }
  };

  const handleDeleteResource = async (indexToRemove: number) => {
    if (!task || !project) return;
    withTaskEditPermission(task, project, async () => {
      const updatedResources = resources.filter((_, index) => index !== indexToRemove);
      await saveResources(updatedResources);
    });
  };

  // --- Renders ---

  const renderResourceCard = (res: ResourceItem, index: number) => {
    const colSpanClass = 'lg:col-span-2';

    return (
      <div key={index} className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group flex flex-col ${colSpanClass} transition-all duration-300`}>
        <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 truncate max-w-[70%]">
            <Globe className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="truncate">{res.value || 'Embed'}</span>
          </div>
          <div className="flex items-center gap-1">
            {res.type === 'url' && (
              <a
                href={res.value}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Abrir em nova aba"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              type="button"
              onClick={() => handleDeleteResource(index)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Remover recurso"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {res.displayMode === 'link-only' ? (
          <div className="p-6 flex flex-col items-center justify-center bg-gray-50/50 flex-1 min-h-[100px]">
            {res.type === 'url' ? (
              <a href={res.value} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline font-medium break-all text-center">
                <LinkIcon className="w-4 h-4 flex-shrink-0" />
                {res.value}
              </a>
            ) : (
              <div className="text-gray-500 text-sm flex items-center gap-2">
                <Code className="w-4 h-4" />
                Conteúdo HTML Oculto (Apenas Link)
              </div>
            )}
          </div>
        ) : (
          <div className={`w-full bg-gray-100 relative ${res.displayMode === 'iframe-100' ? 'h-[700px]' : 'h-[400px]'}`}>
            {res.type === 'url' ? (
              <iframe
                src={res.value}
                className="w-full h-full border-none"
                title={`Preview recurso ${index + 1}`}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                loading="lazy"
              />
            ) : (
              <iframe
                srcDoc={res.value}
                className="w-full h-full border-none bg-white"
                title={`Embed ${index + 1}`}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                loading="lazy"
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <NewTaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        taskToEdit={task}
      />

      {/* Header Navigation */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Voltar</span>
      </button>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <StatusBadge status={task.status} />
                <PriorityBadge prioridade={task.prioridade} />
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                {task.titulo}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                  <Briefcase className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-gray-700">{task.projeto}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                  <User className="w-4 h-4 text-blue-500" />
                  <div className="flex items-center gap-2">
                    {(task.responsavelIds && users) ? (
                      users
                        .filter((u: any) => task.responsavelIds.includes(u.id))
                        .map((u: any) => (
                          <span key={u.id} className="inline-flex items-center gap-2 px-2 py-1 bg-white rounded-md border border-gray-100 text-sm text-gray-700">
                            <UserAvatar user={u} size="xs" showRing={false} />
                            <span className="truncate max-w-[120px]">{u.nome}</span>
                          </span>
                        ))
                    ) : (
                      <span className="font-medium text-gray-700">{task.responsavel}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span className="font-medium text-gray-700">
                    {task.dataInicio ? new Date(task.dataInicio).toLocaleDateString('pt-BR') : '...'} - {task.prazo ? new Date(task.prazo).toLocaleDateString('pt-BR') : 'Sem prazo'}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                  <Paperclip className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-gray-700">
                    {resources.length} Anexos
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (task && project) withTaskEditPermission(task, project, () => setIsEditModalOpen(true));
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Editar Detalhes
            </button>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                Descrição
              </h3>
              {!isEditingDesc && (
                <button
                  onClick={() => {
                    if (task && project) withTaskEditPermission(task, project, () => setIsEditingDesc(true));
                  }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Editar descrição"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {isEditingDesc ? (
              <div className="animate-in fade-in duration-200 bg-white border border-blue-200 rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Editor Markdown</span>
                  <button
                    type="button"
                    onClick={() => setShowDescPreview(!showDescPreview)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
                  >
                    {showDescPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showDescPreview ? 'Voltar a Editar' : 'Visualizar Preview'}
                  </button>
                </div>

                {showDescPreview ? (
                  <div className="w-full p-4 min-h-[200px] prose prose-blue prose-sm max-w-none text-gray-600 overflow-y-auto">
                    <ReactMarkdown>{description}</ReactMarkdown>
                    {!description && <span className="text-gray-400 italic">Nenhuma descrição para visualizar.</span>}
                  </div>
                ) : (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-4 bg-transparent outline-none text-gray-700 leading-relaxed resize-y min-h-[200px]"
                    placeholder="Descreva os detalhes desta tarefa (Markdown suportado)..."
                    autoFocus
                  />
                )}

                <div className="flex items-center gap-2 p-3 bg-gray-50 border-t border-gray-100 justify-end">
                  <button
                    onClick={() => {
                      setIsEditingDesc(false);
                      setShowDescPreview(false);
                      setDescription(task.descricao || '');
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                    disabled={isSavingDesc}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveDescription}
                    disabled={isSavingDesc}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
                  >
                    {isSavingDesc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Descrição
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="prose prose-blue max-w-none text-gray-600 bg-gray-50/50 p-6 rounded-xl border border-transparent hover:border-gray-200 transition-colors cursor-text min-h-[100px]"
                onClick={() => setIsEditingDesc(true)}
              >
                {description ? (
                  <ReactMarkdown>{description}</ReactMarkdown>
                ) : (
                  <span className="text-gray-400 italic">Sem descrição fornecida. Clique para adicionar.</span>
                )}
              </div>
            )}
          </div>

          {task.tags && task.tags.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag: string) => (
                  <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resources Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 px-1">
          <Globe className="w-5 h-5 text-gray-500" />
          Recursos e Links
        </h3>

        {/* Add New Resource Form */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" />
            Adicionar Novo Recurso
          </h4>

          <div className="flex flex-col gap-4">
            {/* Form Controls */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Type: somente URL (HTML embed removido) */}
              <div className="bg-gray-50 p-1 rounded-lg flex inline-flex self-start">
                <button
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 bg-white text-blue-600 shadow-sm`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  URL Link
                </button>
              </div>

              {/* Display Selection */}
              <div className="bg-gray-50 p-1 rounded-lg flex inline-flex self-start overflow-x-auto">
                <button
                  onClick={() => setNewResDisplay('iframe-100')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${newResDisplay === 'iframe-100' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  Largura 100%
                </button>
                <button
                  onClick={() => setNewResDisplay('iframe-50')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${newResDisplay === 'iframe-50' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  Largura 50%
                </button>
                <button
                  onClick={() => setNewResDisplay('link-only')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${newResDisplay === 'link-only' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  Apenas Link
                </button>
              </div>
            </div>

            {/* Input & Submit */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="url"
                  value={newResValue}
                  onChange={(e) => setNewResValue(e.target.value)}
                  placeholder="Cole a URL do recurso aqui (https://...)"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddResource(); }}
                />
              </div>
              <button
                onClick={handleAddResource}
                disabled={!newResValue.trim() || isAddingResource}
                className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl font-medium transition-colors shadow-lg shadow-gray-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap h-fit"
              >
                {isAddingResource ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Adicionar
              </button>
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {resources.map((res, index) => renderResourceCard(res, index))}
        </div>

        {resources.length === 0 && (
          <div className="w-full bg-white rounded-xl border border-dashed border-gray-300 p-8 flex flex-col items-center justify-center text-gray-500">
            <Globe className="w-10 h-10 mb-3 opacity-20" />
            <p>Nenhum recurso vinculado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

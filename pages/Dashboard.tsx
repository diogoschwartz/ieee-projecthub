
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ClipboardList, Users, FolderKanban } from 'lucide-react';
import { useData } from '../context/DataContext';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { projects, tasks, users, chapters } = useData();

  // Filtrar projetos ativos
  const activeProjects = projects.filter((p: any) => p.status !== 'Arquivado');

  const stats = {
    projetos: activeProjects.length,
    tarefas: tasks.length,
    membros: users.length,
    capitulos: chapters.length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Estatísticas</h1>
          <p className="text-gray-500 mt-1">Visão geral quantitativa do IEEE Student Branch Brasil</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Projetos Ativos</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.projetos}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total de Tarefas</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.tarefas}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Membros</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.membros}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Capítulos</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.capitulos}</h3>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Nossos Capítulos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chapters.map((cap: any) => {
            const Icon = cap.icon;
            // Contagem precisa por capítulo (ignorando arquivados)
            const capProjectsCount = activeProjects.filter((p: any) => 
               Array.isArray(p.capituloId) ? p.capituloId.includes(cap.id) : p.capituloId === cap.id
            ).length;

            return (
              <div 
                key={cap.id} 
                className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                onClick={() => navigate(`/chapters/${cap.id}`)}
              >
                <div className="h-32 bg-gray-100 relative overflow-hidden">
                  <img src={cap.coverImage} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="cover" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                  <div className={`absolute -bottom-6 left-6 w-16 h-16 rounded-xl bg-gradient-to-br ${cap.cor} p-1 shadow-lg ring-4 ring-white`}>
                    <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
                      <Icon className="w-8 h-8 text-gray-800" />
                    </div>
                  </div>
                </div>
                <div className="pt-8 p-6">
                  <h3 className="text-lg font-bold text-gray-900">{cap.nome}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{cap.descricao}</p>
                  
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{cap.membros}</span> Membros
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Briefcase className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">{capProjectsCount}</span> Projetos
                    </div>
                  </div>
                  
                  <button className="w-full mt-4 py-2 bg-gray-50 text-blue-600 font-medium rounded-lg text-sm hover:bg-blue-50 transition-colors">
                    Ver Detalhes
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

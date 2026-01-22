
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, Globe, ShieldCheck, ChevronRight, FileText } from 'lucide-react';

export const AdminPage = () => {
  const navigate = useNavigate();

  const modules = [
    {
      id: 'manager',
      title: 'Gestor de Projeto',
      description: 'Gerencie cronogramas, aloque recursos e monitore o progresso das entregas.',
      icon: Briefcase,
      color: 'bg-blue-600',
      lightColor: 'bg-blue-50 text-blue-600',
      path: '/admin/project-manager'
    },
    {
      id: 'chair',
      title: 'Chair do Capítulo',
      description: 'Administre os membros do seu capítulo, defina metas e organize eventos técnicos.',
      icon: Users,
      color: 'bg-purple-600',
      lightColor: 'bg-purple-50 text-purple-600',
      path: '/admin/chapter-chair'
    },
    {
      id: 'president',
      title: 'Presidente IEEE',
      description: 'Visão estratégica global, relatórios anuais e coordenação entre capítulos.',
      icon: Globe,
      color: 'bg-yellow-500',
      lightColor: 'bg-yellow-50 text-yellow-600',
      path: '/admin/president'
    },
    {
      id: 'vtools',
      title: 'Report Vtools',
      description: 'Gere relatórios automatizados de eventos e atividades para exportação ao vTools.',
      icon: FileText,
      color: 'bg-emerald-600',
      lightColor: 'bg-emerald-50 text-emerald-600',
      path: '/admin/vtools-report'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-gray-700" />
          Funções Administrativas
        </h1>
        <p className="text-gray-500 mt-2 max-w-2xl">
          Selecione o módulo correspondente à sua função para acessar ferramentas de gestão avançada.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <div 
              key={module.id}
              onClick={() => navigate(module.path)}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${module.lightColor}`}>
                <Icon className="w-7 h-7" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {module.title}
              </h3>
              
              <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">
                {module.description}
              </p>
              
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 group-hover:gap-3 transition-all mt-auto pt-4 border-t border-gray-50">
                Acessar Módulo
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

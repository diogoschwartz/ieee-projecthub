
import React, { useState } from 'react';
import {
  Search,
  Filter,
  MapPin,
  GraduationCap,
  Calendar,
  Mail,
  Award,
  BadgeCheck,
  User,
  Briefcase,
  Users,
  BookOpen
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';

import { fuzzyMatch } from '../lib/searchUtils';

export const Team = () => {
  const navigate = useNavigate();
  const { users, chapters } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('all');
  const [skillQuery, setSkillQuery] = useState('');

  // Filtering Logic
  const filteredUsers = users.filter((user: any) => {
    // 1. Filter by Name or Matricula
    // Usando fuzzyMatch para lidar com typos e acentos
    const matchesSearch =
      fuzzyMatch(user.nome, searchQuery) ||
      user.matricula.includes(searchQuery);

    // 2. Filter by Chapter
    const matchesChapter =
      selectedChapter === 'all' ||
      (user.chapterIds && user.chapterIds.includes(Number(selectedChapter)));

    // 3. Filter by Skill
    const matchesSkill =
      skillQuery === '' ||
      user.habilidades.some((skill: string) =>
        skill.toLowerCase().includes(skillQuery.toLowerCase())
      );

    return matchesSearch && matchesChapter && matchesSkill;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Banco de Talentos</h1>
          <p className="text-gray-500 mt-1">Conheça a equipe e encontre as habilidades certas.</p>
        </div>

        <div className="flex items-center gap-2 text-sm bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-gray-600">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-gray-900">{users.length}</span> Membros Totais
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Buscar Membro</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Nome ou Matrícula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="w-full lg:w-64">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Filtrar por Capítulo</label>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none cursor-pointer"
            >
              <option value="all">Todos os Capítulos</option>
              {chapters.map((c: any) => (
                <option key={c.id} value={c.id}>{c.sigla} - {c.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 relative">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Filtrar por Habilidade</label>
          <div className="relative">
            <Award className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Ex: React, Design..."
              value={skillQuery}
              onChange={(e) => setSkillQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Team Grid */}
      {filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <User className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-lg font-medium">Nenhum membro encontrado</p>
          <p className="text-sm">Tente ajustar seus filtros de busca.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map((user: any) => {
            const coverStyle = user.coverConfig?.startsWith('http')
              ? { backgroundImage: `url(${user.coverConfig})`, backgroundSize: 'cover' }
              : null;
            const coverClass = user.coverConfig?.startsWith('http')
              ? ''
              : `bg-gradient-to-r ${user.coverConfig || 'from-blue-500 to-indigo-600'}`;

            return (
              <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                <div className={`h-24 relative ${coverClass}`} style={coverStyle}>
                  {user.coverConfig?.startsWith('http') && <div className="absolute inset-0 bg-black/10"></div>}
                  <div className="absolute top-2 right-2 flex flex-wrap gap-1 justify-end max-w-[150px]">
                    {user.chapterIds && user.chapterIds.map((cid: number) => {
                      const chap = chapters.find((c: any) => c.id === cid);
                      return chap ? (
                        <span key={cid} className="px-1.5 py-0.5 bg-white/20 backdrop-blur-md text-white text-[9px] font-bold rounded uppercase tracking-wide border border-white/10">
                          {chap.sigla}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <div className="relative flex justify-between items-end -mt-10 mb-3">
                    <img
                      src={user.foto}
                      alt={user.nome}
                      className="w-20 h-20 rounded-xl border-4 border-white shadow-md bg-gray-200 object-cover"
                    />
                    <div className="text-right mb-1">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Matrícula</span>
                      <span className="text-sm font-mono text-gray-600 flex items-center justify-end gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {user.matricula}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{user.nome}</h3>
                    <div className="flex items-center gap-1.5 text-blue-600 text-sm font-medium mt-0.5">
                      <BadgeCheck className="w-4 h-4" />
                      {user.role}
                    </div>

                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{user.email}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{user.course || 'Curso N/D'}</span>
                    </div>

                    <div className="pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-1 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <Briefcase className="w-3 h-3" />
                        Habilidades
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {user.habilidades.map((skill: string) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium border border-gray-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/team/${user.id}`)}
                    className="w-full mt-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Ver Perfil Completo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

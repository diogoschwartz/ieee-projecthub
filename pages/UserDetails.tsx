
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Calendar,
  GraduationCap,
  Briefcase,
  BadgeCheck,
  Award,
  Linkedin,
  Github,
  Instagram,
  Hash
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useData } from '../context/DataContext';

export const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { users, chapters } = useData();

  const user = users.find((u: any) => u.id === Number(id));

  if (!user) {
    return <div className="p-8 text-center text-gray-500">Usuário não encontrado.</div>;
  }

  // Get user chapters
  const userChapters = user.chapterIds && user.chapterIds.length > 0
    ? chapters.filter((c: any) => user.chapterIds.includes(c.id))
    : [];

  // Helper para renderizar a capa
  const renderCover = () => {
    if (user.coverConfig?.startsWith('http')) {
      return <img src={user.coverConfig} className="w-full h-full object-cover" alt="Cover" />;
    }
    return <div className={`w-full h-full bg-gradient-to-br ${user.coverConfig || 'from-blue-600 to-indigo-700'}`}></div>;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <button
        onClick={() => navigate('/team')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Voltar para a Equipe</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SIDEBAR: Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-32 relative">
              {renderCover()}
              <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
                {userChapters.map((chap: any) => {
                  const role = user.chapterRoles?.[chap.id];
                  return (
                    <div key={chap.id} className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-sm flex items-center gap-2">
                      <span className="text-gray-900 text-xs font-bold tracking-wide">{chap.sigla}</span>
                      {role && <span className="text-[10px] text-gray-600 border-l border-gray-300 pl-2">{role}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="px-6 pb-6 relative">
              <div className="w-32 h-32 rounded-2xl bg-white p-1.5 shadow-lg absolute -top-16 left-1/2 -translate-x-1/2">
                <img
                  src={user.foto}
                  alt={user.nome}
                  className="w-full h-full object-cover rounded-xl bg-gray-100"
                />
              </div>

              <div className="pt-20 text-center">
                <h1 className="text-2xl font-bold text-gray-900">{user.nome}</h1>
                <p className="text-blue-600 font-medium flex items-center justify-center gap-1.5 mt-1">
                  <BadgeCheck className="w-4 h-4" />
                  {user.role}
                </p>

                <div className="flex justify-center gap-2 mt-4">
                  {user.social?.linkedin && (
                    <a href={user.social.linkedin} target="_blank" rel="noreferrer" className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {user.social?.github && (
                    <a href={user.social.github} target="_blank" rel="noreferrer" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                      <Github className="w-5 h-5" />
                    </a>
                  )}
                  {user.social?.instagram && (
                    <a href={user.social.instagram} target="_blank" rel="noreferrer" className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors">
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  <a href={`mailto:${user.email}`} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-gray-400" />
              Informações
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate" title={user.email}>{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>Matrícula: {user.matricula}</span>
              </div>
              {/* NOVO: Curso */}
              <div className="flex items-center gap-3 text-gray-600">
                <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{user.course || 'Curso não informado'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>Nasc: {new Date(user.dataNascimento).toLocaleDateString('pt-BR')}</span>
              </div>
              {/* NOVO: Data Entrada IEEE */}
              {user.ieee_membership_date && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>Membro IEEE desde: {user.ieee_membership_date}</span>
                </div>
              )}
              {user.nroMembresia && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>Membresia: {user.nroMembresia}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 mt-6 pt-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-gray-400" />
                Habilidades
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.habilidades.map((skill: string) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium border border-gray-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT: Markdown Bio */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10 min-h-[500px]">
            <div className="prose prose-blue prose-sm md:prose-base max-w-none text-gray-600">
              <ReactMarkdown>{user.bio}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

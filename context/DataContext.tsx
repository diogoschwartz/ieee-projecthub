
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { iconMap } from '../lib/utils';
import { FolderKanban } from 'lucide-react';

interface DataContextType {
  tasks: any[];
  projects: any[];
  users: any[];
  chapters: any[];
  events: any[]; 
  classifieds: any[]; 
  chapterGoals: any[];
  tools: any[];
  loading: boolean;
  fetchData: (skipLoading?: boolean) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [events, setEvents] = useState([]);
  const [classifieds, setClassifieds] = useState([]); 
  const [chapterGoals, setChapterGoals] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async (skipLoading = false) => {
    try {
      if (!skipLoading) setLoading(true);
      const [capsRes, profsRes, projsRes, tasksRes, eventsRes, classifiedsRes, goalsRes, toolsRes] = await Promise.all([
        supabase.from('chapters').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('events').select('*').order('start_date', { ascending: true }),
        supabase.from('classifieds').select('*').order('created_at', { ascending: false }),
        supabase.from('chapter_goals').select('*'),
        supabase.from('tools').select('*')
      ]);

      if (capsRes.error) console.error("Chapters error:", capsRes.error);
      if (eventsRes.error) console.error("Events error:", eventsRes.error);
      if (classifiedsRes.error) console.error("Classifieds error:", classifiedsRes.error);
      if (goalsRes.error) console.error("Goals error:", goalsRes.error);
      if (toolsRes.error) console.error("Tools error:", toolsRes.error);

      // Process Chapters
      const loadedChapters = (capsRes.data || []).map(c => ({
        id: c.id,
        nome: c.name,
        sigla: c.acronym,
        descricao: c.description,
        cor: c.color_theme,
        icon: iconMap[c.icon_name] || FolderKanban,
        coverImage: c.cover_image_url,
        calendarUrl: c.calendar_url, 
        email: c.email, 
        keywords: c.keywords || [], 
        links: c.content_url ? (typeof c.content_url === 'string' ? JSON.parse(c.content_url) : c.content_url) : [], // Added links mapping
        membros: c.members_count,
        projetos: c.projects_count
      }));

      // Process Users
      const loadedUsers = (profsRes.data || []).map((u) => {
        // Normalização para array de IDs, suportando tanto coluna nova (chapter_ids) quanto legada (chapter_id)
        const chapterIds = u.chapter_ids || (u.chapter_id ? [u.chapter_id] : []);

        return {
          id: u.id,
          nome: u.full_name,
          email: u.email,
          role: u.role, // "Título Principal"
          chapterRoles: u.chapter_roles || {}, // Mapa { chapter_id: "Cargo" }
          avatar: u.avatar_initials,
          chapterIds: chapterIds, // Array de IDs
          capituloId: chapterIds.length > 0 ? chapterIds[0] : null, // Fallback para compatibilidade legacy
          matricula: u.matricula || 'N/D',
          dataNascimento: u.birth_date || new Date().toISOString(),
          habilidades: u.skills || [],
          foto: u.photo_url || `https://i.pravatar.cc/300?u=${u.id}`,
          bio: u.bio || '# Perfil\nEste usuário ainda não adicionou uma biografia.',
          nroMembresia: u.membership_number || '',
          coverConfig: u.cover_config || 'from-blue-600 to-indigo-700',
          social: u.social_links || { linkedin: '', github: '', instagram: '' }
        };
      });

      // Process Projects
      const realLoadedProjects = (projsRes.data || []).map(p => {
        const projectChapters = (p.chapter_ids || [])
          .map((id: number) => loadedChapters.find((c: any) => c.id === id))
          .filter(Boolean);

        // Hydrate Owners
        const ownerIds = p.owner_ids || [];
        const owners = ownerIds.map((id: number) => loadedUsers.find((u: any) => u.id === id)).filter(Boolean);
        const ownerNames = owners.map((u: any) => u.nome).join(' & ');

        // Hydrate Team
        const teamIds = p.team_ids || [];
        const team = teamIds.map((id: number) => loadedUsers.find((u: any) => u.id === id)).filter(Boolean);

        return {
          id: p.id,
          nome: p.name,
          descricao: p.description,
          status: p.status,
          progresso: p.progress,
          dataInicio: p.start_date,
          dataFim: p.end_date,
          parceria: p.is_partnership,
          responsavel: ownerNames || p.owner_name || 'N/D', // Fallback to old text field or N/D
          ownerIds: ownerIds, // Raw IDs
          owners: owners, // Hydrated Objects
          teamIds: teamIds, // Raw IDs
          team: team, // Hydrated Objects
          tags: p.tags || [],
          capituloId: p.chapter_ids,
          capitulos: projectChapters,
          capitulo: projectChapters.map((c: any) => c.sigla).join(', '),
          checkpoints: p.checkpoints || [],
          notes: p.notes || '',
          links: p.content_url ? (typeof p.content_url === 'string' ? JSON.parse(p.content_url) : p.content_url) : [],
          cor: p.color_theme,
          coverImage: p.cover_image
        };
      });

      // Process Tasks
      const loadedTasks = (tasksRes.data || []).map(t => {
         const proj = realLoadedProjects.find((p: any) => p.id === t.project_id);
         const user = loadedUsers.find((u: any) => u.id === (t.assignee_ids?.[0]));
         
         return {
           id: t.id,
           titulo: t.title,
           descricao: t.description,
           status: t.status,
           prioridade: t.priority,
           dataInicio: t.start_date,
           prazo: t.deadline,
           tags: t.tags || [],
           anexos: t.attachments_count,
           url: t.content_url,
           projetoId: t.project_id,
           projeto: proj ? proj.nome : 'Desconhecido',
           responsavelId: t.assignee_ids?.[0],
           responsavelIds: t.assignee_ids || [],
           responsavel: user ? user.nome.split(' ')[0] : 'N/A',
           responsavelFull: user ? user : null,
           capitulo: proj ? proj.capitulo : 'N/A'
         };
      });

      // Process Events
      const loadedEvents = (eventsRes.data || []).map(e => ({
        id: e.id,
        title: e.title,
        startDate: e.start_date,
        endDate: e.end_date,
        location: e.location,
        description: e.description,
        category: e.category, 
        subCategory: e.sub_category,
        eventType: e.event_type || 'InPerson', // Mapped from DB
        hostOus: e.host_ous || [], // Mapped from DB
        isPublic: e.is_public, 
        vtoolsReported: e.vtools_reported, 
        meetingMinutesUrl: e.meeting_minutes_url, 
        attendeesIEEE: e.attendees_ieee, 
        attendeesGuests: e.attendees_guests, 
        attendeeList: e.attendee_list || [], // Mapped Array
        chapterId: e.chapter_id,
        projectId: e.project_id,
        chapter: loadedChapters.find((c: any) => c.id === e.chapter_id),
        project: realLoadedProjects.find((p: any) => p.id === e.project_id)
      }));

      // Process Classifieds
      const loadedClassifieds = (classifiedsRes.data || []).map(c => {
        const relatedTask = loadedTasks.find((t: any) => t.id === c.task_id);
        const involvedChapters = (c.chapter_ids || [])
           .map((id: number) => loadedChapters.find((cap: any) => cap.id === id))
           .filter(Boolean);

        return {
          id: c.id,
          type: c.type, 
          title: c.title,
          description: c.description,
          imageUrl: c.image_url,
          taskId: c.task_id,
          task: relatedTask,
          responsible: c.responsible_name,
          chapterIds: c.chapter_ids || [],
          chapters: involvedChapters,
          createdAt: c.created_at
        };
      });

      setChapters(loadedChapters);
      setUsers(loadedUsers);
      setProjects(realLoadedProjects);
      setTasks(loadedTasks);
      setEvents(loadedEvents);
      setClassifieds(loadedClassifieds);
      setChapterGoals(goalsRes.data || []); 
      setTools(toolsRes.data || []);

    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    } finally {
      if (!skipLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DataContext.Provider value={{ tasks, projects, users, chapters, events, classifieds, chapterGoals, tools, loading, fetchData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

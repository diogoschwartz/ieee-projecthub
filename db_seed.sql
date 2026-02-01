-- db_seed.sql
-- Script para popular o banco de dados com dados de teste.
-- Execute este script no Editor SQL do Supabase.

BEGIN;

-- 1. Limpar dados existentes (COMENTADO PARA EVITAR PERDA DE DADOS - DESCOMENTE SE DESEJAR LIMPAR)
-- TRUNCATE TABLE public.profile_chapters CASCADE;
-- TRUNCATE TABLE public.project_members CASCADE;
-- TRUNCATE TABLE public.project_chapters CASCADE;
-- TRUNCATE TABLE public.task_assignees CASCADE;
-- TRUNCATE TABLE public.tasks CASCADE;
-- TRUNCATE TABLE public.projects CASCADE;
-- TRUNCATE TABLE public.chapters CASCADE;
-- TRUNCATE TABLE public.profiles CASCADE;
-- Nota: Permissions não limpamos pois já são seedadas no schema base.

-- 2. Inserir Capítulos
INSERT INTO public.chapters (name, acronym, description, color_theme, icon_name, cover_image_url, calendar_url, email, keywords, members_count, projects_count) VALUES
('Ramo Estudantil IEEE UnB', 'Ramo', 'O Ramo Estudantil IEEE UnB é a unidade organizacional base.', 'from-blue-700 to-blue-900', 'Globe', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200', 'https://calendar.google.com/calendar/ical/pt.brazilian%23holiday%40group.v.calendar.google.com/public/basic.ics', 'ramo@ieee.unb.br', ARRAY['#leadership', '#engineering', '#unb', '#student-branch'], 50, 5),
('Aerospace & Electronic Systems Society', 'AESS', 'Sistemas complexos para o espaço.', 'from-sky-500 to-slate-700', 'Rocket', 'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=1200', null, 'aess@ieee.unb.br', ARRAY['#aerospace', '#systems', '#space', '#electronics'], 5, 1),
('Circuits and Systems Society', 'CAS', 'Circuitos e sistemas.', 'from-emerald-500 to-teal-700', 'Cpu', 'https://images.unsplash.com/photo-1555589228-135c25ae8cf5?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2lyY3VpdHJ5fGVufDB8fDB8fHww', null, 'cas@ieee.unb.br', ARRAY['#circuits', '#pcb', '#hardware', '#electronics'], 8, 2),
('Communications Society', 'ComSoc', 'Troca de informações.', 'from-cyan-500 to-blue-600', 'Wifi', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=1200', null, 'comsoc@ieee.unb.br', ARRAY['#telecom', '#5g', '#networks', '#internet'], 10, 2),
('Computational Intelligence Society', 'CIS', 'Redes neurais e fuzzy.', 'from-indigo-500 to-purple-700', 'Brain', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1200', null, 'cis@ieee.unb.br', ARRAY['#ai', '#neural-networks', '#fuzzy', '#data-science'], 6, 1),
('Computer Society', 'CS', 'A Computer Society (CS) é a principal fonte para computação.', 'from-blue-500 to-indigo-600', 'Monitor', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1200', null, 'cs@ieee.unb.br', ARRAY['#computing', '#software', '#ai', '#development'], 18, 4),
('Control Systems Society', 'CSS', 'Sistemas de controle.', 'from-orange-500 to-red-600', 'Settings', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200', null, 'css@ieee.unb.br', ARRAY['#control', '#automation', '#pid', '#systems'], 4, 1),
('Education Society', 'EdSoc', 'Tecnologia educacional.', 'from-amber-400 to-orange-500', 'BookOpen', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1200', null, 'edsoc@ieee.unb.br', ARRAY['#education', '#stem', '#teaching', '#learning'], 5, 1),
('Engineering in Medicine & Biology Society', 'EMBS', 'Engenharia biomédica.', 'from-rose-500 to-pink-700', 'Dna', 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0', null, 'embs@ieee.unb.br', ARRAY['#biomedical', '#health', '#medicine', '#biology'], 9, 2),
('Microwave Theory and Technology Society', 'MTTS', 'Micro-ondas.', 'from-orange-400 to-amber-600', 'Radio', 'https://media.istockphoto.com/id/177861043/photo/scientific-hands-experimenting-with-monitors-and-electrodes.jpg?s=612x612&w=0&k=20&c=E9oGNHAmxxl19JEBBG-2CotYbGma7sre23zLLU4Ux9U=', null, 'mtts@ieee.unb.br', ARRAY['#microwaves', '#rf', '#antennas', '#wireless'], 4, 0),
('Power & Energy Society', 'PES', 'A Power & Energy Society (PES) é líder mundial em energia.', 'from-green-500 to-emerald-700', 'Zap', 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=1200', null, 'pes@ieee.unb.br', ARRAY['#energy', '#power', '#smartgrid', '#renewables'], 12, 2),
('Robotics & Automation Society', 'RAS', 'O Capítulo da Sociedade de Robótica e Automação (RAS).', 'from-red-500 to-orange-600', 'Bot', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1200', null, 'ras@ieee.unb.br', ARRAY['#robotics', '#automation', '#drones', '#ros', '#control'], 15, 3),
('Signal Processing Society', 'SPS', 'Processamento de sinais.', 'from-teal-400 to-emerald-600', 'Activity', 'https://engineering.oregonstate.edu/sites/engineering.oregonstate.edu/files/styles/fluid_webp/public/2023-12/oscilloscope-waves.jpg.webp?itok=s-cxDvyI', null, 'sps@ieee.unb.br', ARRAY['#dsp', '#signals', '#audio', '#image-processing'], 7, 1),
('Society on Social Implications of Technology', 'SSIT', 'Impacto social.', 'from-green-600 to-blue-700', 'Globe', 'https://www.bertelsmann-stiftung.de/fileadmin/files/_processed_/6/e/csm_2056673211AdobeStock_203052126_KONZERN_ST-ZZ_5159bf2d1d.jpg', null, 'ssit@ieee.unb.br', ARRAY['#social-impact', '#ethics', '#sustainability', '#humanitarian'], 6, 1),
('Vehicular Technology Society', 'VTS', 'Mobilidade.', 'from-red-600 to-slate-800', 'Car', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1200', null, 'vts@ieee.unb.br', ARRAY['#vehicles', '#transportation', '#ev', '#mobility'], 5, 1),
('Women in Engineering', 'WIE', 'Mulheres na engenharia.', 'from-purple-600 to-fuchsia-800', 'Users', 'https://blog.sesisenai.org.br/wp-content/uploads/sites/23/2021/11/mulheres-engenharia-2.jpg', null, 'wie@ieee.unb.br', ARRAY['#women-in-tech', '#diversity', '#inclusion', '#leadership'], 20, 4);




-- 3. Inserir Perfis (Usuários)
INSERT INTO public.profiles (full_name, email, role, matricula, avatar_initials, bio) VALUES
('Admin Geral', 'admin@teste.com', 'Presidente do Ramo', '2020001', 'AG', 'Presidente gestion 2024. Focado em expansão.'),
('Líder RAS', 'ras@teste.com', 'Presidente RAS', '2021002', 'LR', 'Apaixonado por robótica e automação.'),
('Gerente de Projetos', 'pm@teste.com', 'Diretor de Projetos', '2022003', 'GP', 'Organizado e focado em entregas.'),
('Membro Ativo', 'membro@teste.com', 'Voluntário', '2023004', 'MA', 'Estudante de engenharia elétrica.');

-- Recuperar IDs para relacionamentos
DO $$
DECLARE
  v_chapter_ieee bigint;
  v_chapter_ras bigint;
  v_chapter_cs bigint;
  
  v_profile_admin bigint;
  v_profile_ras bigint;
  v_profile_pm bigint;
  v_profile_member bigint;
  
  v_project_semana bigint;
  v_project_workshop bigint;
  
  v_task_plan bigint;
BEGIN
  -- Get Chapter IDs
  SELECT id INTO v_chapter_ieee FROM public.chapters WHERE acronym = 'Ramo';
  SELECT id INTO v_chapter_ras FROM public.chapters WHERE acronym = 'RAS';
  SELECT id INTO v_chapter_cs FROM public.chapters WHERE acronym = 'CS';

  -- Get Profile IDs
  SELECT id INTO v_profile_admin FROM public.profiles WHERE email = 'admin@teste.com';
  SELECT id INTO v_profile_ras FROM public.profiles WHERE email = 'ras@teste.com';
  SELECT id INTO v_profile_pm FROM public.profiles WHERE email = 'pm@teste.com';
  SELECT id INTO v_profile_member FROM public.profiles WHERE email = 'membro@teste.com';

  -- 4. Vincular Perfis a Capítulos (profile_chapters)
  
  -- Admin é Global Admin (Slug 'admin' no Chapter 1/Ramo)
  INSERT INTO public.profile_chapters (profile_id, chapter_id, role, permission_slug) VALUES
  (v_profile_admin, v_chapter_ieee, 'Presidente', 'admin'), -- GLOBAL ADMIN
  (v_profile_admin, v_chapter_ras, 'Membro Honorário', 'member');

  -- Líder RAS é Chair do RAS
  INSERT INTO public.profile_chapters (profile_id, chapter_id, role, permission_slug) VALUES
  (v_profile_ras, v_chapter_ras, 'Presidente', 'chair'),
  (v_profile_ras, v_chapter_ieee, 'Diretor Técnico', 'manager');

  -- PM é Manager no CS e IEEE
  INSERT INTO public.profile_chapters (profile_id, chapter_id, role, permission_slug) VALUES
  (v_profile_pm, v_chapter_cs, 'Diretor de Projetos', 'manager'),
  (v_profile_pm, v_chapter_ieee, 'Assessor', 'member');

  -- Membro é membro em tudo
  INSERT INTO public.profile_chapters (profile_id, chapter_id, role, permission_slug) VALUES
  (v_profile_member, v_chapter_ieee, 'Trainee', 'member'),
  (v_profile_member, v_chapter_cs, 'Membro', 'member');


  -- 5. Criar Projetos
  
  -- Projeto 1: Semana da Engenharia (IEEE)
  INSERT INTO public.projects (public_id, name, description, status, start_date, end_date, progress, color_theme, is_partnership)
  VALUES ('sem2501', 'Semana da Engenharia 2025', 'Maior evento do ano com palestras e workshops.', 'Planejamento', CURRENT_DATE + 10, CURRENT_DATE + 40, 15, 'from-blue-500 to-cyan-500', false)
  RETURNING id INTO v_project_semana;

  -- Relacionar Projeto 1
  INSERT INTO public.project_chapters (project_id, chapter_id) VALUES (v_project_semana, v_chapter_ieee);
  INSERT INTO public.project_members (project_id, profile_id, is_owner) VALUES 
  (v_project_semana, v_profile_admin, true), -- Owner
  (v_project_semana, v_profile_pm, false),
  (v_project_semana, v_profile_member, false);


  -- Projeto 2: Workshop de Arduino (RAS)
  INSERT INTO public.projects (public_id, name, description, status, start_date, end_date, progress, color_theme, is_partnership)
  VALUES ('workard', 'Workshop de Arduino', 'Curso básico para calouros.', 'Em Andamento', CURRENT_DATE - 5, CURRENT_DATE + 5, 60, 'from-purple-500 to-pink-500', false)
  RETURNING id INTO v_project_workshop;

  -- Relacionar Projeto 2
  INSERT INTO public.project_chapters (project_id, chapter_id) VALUES (v_project_workshop, v_chapter_ras);
  INSERT INTO public.project_members (project_id, profile_id, is_owner) VALUES
  (v_project_workshop, v_profile_ras, true),
  (v_project_workshop, v_profile_member, false);

  
  -- 6. Criar Tarefas
  
  -- Tarefa P1
  INSERT INTO public.tasks (public_id, title, description, status, priority, project_id, deadline, start_date)
  VALUES ('xyBgj', 'Contatar Palestrantes', 'Enviar e-mail convite para lista A.', 'doing', 'alta', v_project_semana, CURRENT_DATE + 5, CURRENT_DATE)
  RETURNING id INTO v_task_plan;

  INSERT INTO public.task_assignees (task_id, profile_id) VALUES (v_task_plan, v_profile_pm), (v_task_plan, v_profile_member);

  -- Tarefa P2
  INSERT INTO public.tasks (public_id, title, description, status, priority, project_id, deadline, start_date)
  VALUES ('Za92k', 'Comprar Kits Arduino', 'Verificar orçamento e realizar compra.', 'done', 'urgente', v_project_workshop, CURRENT_DATE - 2, CURRENT_DATE - 10);
  
  -- Responsáveis P2
  
  INSERT INTO public.tasks (public_id, title, description, status, priority, project_id, deadline)
  VALUES ('Lm01p', 'Preparar Slides', 'Aula 1 e 2.', 'todo', 'media', v_project_workshop, CURRENT_DATE + 1)
  RETURNING id INTO v_task_plan; -- reutilizando a variavel

  INSERT INTO public.task_assignees (task_id, profile_id) VALUES (v_task_plan, v_profile_ras);

END $$;

COMMIT;

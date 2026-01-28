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
INSERT INTO public.chapters (name, acronym, description, color_theme, icon_name, email) VALUES
('Ramo Estudantil IEEE', 'IEEE', 'Capítulo Principal', 'from-blue-600 to-blue-800', 'Globe', 'ramo@ieee.org'),
('Robotics & Automation Society', 'RAS', 'Sociedade de Robótica', 'from-purple-600 to-purple-800', 'Bot', 'ras@ieee.org'),
('Computer Society', 'CS', 'Sociedade de Computação', 'from-orange-500 to-orange-700', 'Cpu', 'cs@ieee.org'),
('Power & Energy Society', 'PES', 'Sociedade de Potência', 'from-green-600 to-green-800', 'Zap', 'pes@ieee.org');

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
  SELECT id INTO v_chapter_ieee FROM public.chapters WHERE acronym = 'IEEE';
  SELECT id INTO v_chapter_ras FROM public.chapters WHERE acronym = 'RAS';
  SELECT id INTO v_chapter_cs FROM public.chapters WHERE acronym = 'CS';

  -- Get Profile IDs
  SELECT id INTO v_profile_admin FROM public.profiles WHERE email = 'admin@teste.com';
  SELECT id INTO v_profile_ras FROM public.profiles WHERE email = 'ras@teste.com';
  SELECT id INTO v_profile_pm FROM public.profiles WHERE email = 'pm@teste.com';
  SELECT id INTO v_profile_member FROM public.profiles WHERE email = 'membro@teste.com';

  -- 4. Vincular Perfis a Capítulos (profile_chapters)
  -- Admin é Chair do IEEE e Membro do RAS
  INSERT INTO public.profile_chapters (profile_id, chapter_id, role, permission_slug) VALUES
  (v_profile_admin, v_chapter_ieee, 'Presidente', 'chair'),
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

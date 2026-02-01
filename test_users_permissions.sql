
-- UTILITIES: SCRIPT PARA CONFIGURAR PERMISSÕES DE USUÁRIOS DE TESTE (ROBUSTO)
-- 
-- 1. Crie os usuários no Authentication com as senhas.
-- 2. Rode este script. Ele vai garantir que os Profiles existam e atribuir as permissões.

DO $$
DECLARE
    v_admin_id uuid;
    v_manager_id uuid;
    v_chair_id uuid;
    v_member_id uuid;
    v_chapter_id bigint;
    v_profile_id bigint;
BEGIN
    -- Pega o ID do primeiro capítulo
    SELECT id INTO v_chapter_id FROM public.chapters LIMIT 1;
    IF v_chapter_id IS NULL THEN RAISE EXCEPTION 'Crie ao menos um capítulo na tabela chapters.'; END IF;

    RAISE NOTICE 'Configurando permissões para o Capítulo ID: %', v_chapter_id;

    ---------------------------------------------------------------------------
    -- HELPER: Função para garantir perfil
    -- (Como estamos num bloco DO, fazemos inline)
    ---------------------------------------------------------------------------

    -- 1. ADMIN
    SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@test.com';
    IF v_admin_id IS NOT NULL THEN
        -- Check/Create Profile
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE auth_id = v_admin_id) THEN
            INSERT INTO public.profiles (auth_id, email, full_name, role)
            VALUES (v_admin_id, 'admin@test.com', 'Admin User', 'member')
            RETURNING id INTO v_profile_id;
        ELSE
            UPDATE public.profiles SET role = 'member' WHERE auth_id = v_admin_id RETURNING id INTO v_profile_id;
        END IF;

        -- Permissões de Admin (Chapter 1, Slug 'admin')
        DELETE FROM public.profile_chapters WHERE profile_id = v_profile_id;
        INSERT INTO public.profile_chapters (profile_id, chapter_id, permission_slug, role)
        VALUES (v_profile_id, 1, 'admin', 'Administrador Global');
        
        RAISE NOTICE '>>> Admin OK';
    END IF;

    -- 2. MANAGER
    SELECT id INTO v_manager_id FROM auth.users WHERE email = 'manager@test.com';
    IF v_manager_id IS NOT NULL THEN
        -- Check/Create Profile
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE auth_id = v_manager_id) THEN
            INSERT INTO public.profiles (auth_id, email, full_name, role)
            VALUES (v_manager_id, 'manager@test.com', 'Manager User', 'member')
            RETURNING id INTO v_profile_id;
        ELSE
            UPDATE public.profiles SET role = 'member' WHERE auth_id = v_manager_id RETURNING id INTO v_profile_id;
        END IF;

        -- Permissões
        DELETE FROM public.profile_chapters WHERE profile_id = v_profile_id;
        INSERT INTO public.profile_chapters (profile_id, chapter_id, permission_slug, role)
        VALUES (v_profile_id, v_chapter_id, 'manager', 'Gerente Teste');
        
        RAISE NOTICE '>>> Manager OK';
    END IF;

    -- 3. CHAIR
    SELECT id INTO v_chair_id FROM auth.users WHERE email = 'chair@test.com';
    IF v_chair_id IS NOT NULL THEN
        -- Check/Create Profile
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE auth_id = v_chair_id) THEN
            INSERT INTO public.profiles (auth_id, email, full_name, role)
            VALUES (v_chair_id, 'chair@test.com', 'Chair User', 'member')
            RETURNING id INTO v_profile_id;
        ELSE
            UPDATE public.profiles SET role = 'member' WHERE auth_id = v_chair_id RETURNING id INTO v_profile_id;
        END IF;

        -- Permissões
        DELETE FROM public.profile_chapters WHERE profile_id = v_profile_id;
        INSERT INTO public.profile_chapters (profile_id, chapter_id, permission_slug, role)
        VALUES (v_profile_id, v_chapter_id, 'chair', 'Presidente Teste');
        
        RAISE NOTICE '>>> Chair OK';
    END IF;

    -- 4. MEMBER
    SELECT id INTO v_member_id FROM auth.users WHERE email = 'member@test.com';
    IF v_member_id IS NOT NULL THEN
        -- Check/Create Profile
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE auth_id = v_member_id) THEN
            INSERT INTO public.profiles (auth_id, email, full_name, role)
            VALUES (v_member_id, 'member@test.com', 'Member User', 'member')
            RETURNING id INTO v_profile_id;
        ELSE
            UPDATE public.profiles SET role = 'member' WHERE auth_id = v_member_id RETURNING id INTO v_profile_id;
        END IF;

        -- Permissões
        DELETE FROM public.profile_chapters WHERE profile_id = v_profile_id;
        INSERT INTO public.profile_chapters (profile_id, chapter_id, permission_slug, role)
        VALUES (v_profile_id, v_chapter_id, 'member', 'Membro Teste');
        
        RAISE NOTICE '>>> Member OK';
    END IF;

END $$;

-- Migration: Remove unused boolean columns from permissions table

ALTER TABLE public.permissions DROP COLUMN IF EXISTS can_manage_users;
ALTER TABLE public.permissions DROP COLUMN IF EXISTS can_manage_financials;
ALTER TABLE public.permissions DROP COLUMN IF EXISTS can_manage_projects;
ALTER TABLE public.permissions DROP COLUMN IF EXISTS can_manage_tasks;
ALTER TABLE public.permissions DROP COLUMN IF EXISTS can_view_sensitive_data;
ALTER TABLE public.permissions DROP COLUMN IF EXISTS can_approve_requests;

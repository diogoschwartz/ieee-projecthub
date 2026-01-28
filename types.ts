
export interface LayoutProps {
  children: any; // Simplified to avoid React dependency issues in types file
}

export enum ThemeMode {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
}

// --- Database Entities ---

export interface Permission {
  id: number;
  slug: string; // 'admin', 'chair', 'manager', 'member', 'external'
  can_manage_users: boolean;
  can_manage_financials: boolean;
  can_manage_projects: boolean;
  can_manage_tasks: boolean;
  can_view_sensitive_data: boolean;
  can_approve_requests: boolean;
}

export interface Chapter {
  id: number;
  name: string;
  acronym: string;
  description?: string;
  color_theme?: string;
  icon_name?: string;
  cover_image_url?: string;
  calendar_url?: string;
  email?: string;
  keywords?: string[];
  content_url?: string | any;
  members_count: number;
  projects_count: number;
  // Legacy Compatibility
  nome?: string;
  sigla?: string;
}

export interface Profile {
  id: number; // BigInt is returned as number/string in JS usually, but lets use number for ID
  full_name: string;
  email: string;
  role?: string;
  avatar_initials?: string;
  matricula?: string;
  birth_date?: string;
  skills?: string[];
  photo_url?: string;
  bio?: string;
  membership_number?: string;
  cover_config?: string;
  social_links?: any;
  // Hydrated
  chapters?: Chapter[];
  profileChapters?: ProfileChapter[]; // Join table details
}

export interface ProfileChapter {
  id: number;
  profile_id: number;
  chapter_id: number;
  role: string;
  permission_slug: string;
  // Hydrated
  permission?: Permission;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  progress: number;
  start_date?: string;
  end_date?: string;
  is_partnership: boolean;
  tags?: string[];
  checkpoints?: any;
  notes?: string;
  content_url?: any;
  color_theme?: string;
  cover_image?: string;
  // Hydrated
  owners: Profile[];
  team: Profile[];
  chapters: Chapter[];
  // Raw Relationships (Optional, for easy access)
  projectMembers?: ProjectMember[];
  projectChapters?: ProjectChapter[];
}

export interface ProjectMember {
  project_id: number;
  profile_id: number;
  is_owner: boolean;
}

export interface ProjectChapter {
  project_id: number;
  chapter_id: number;
}

export interface Task {
  id: number;
  public_id?: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'review' | 'done' | 'archived';
  priority?: string;
  start_date?: string;
  deadline?: string;
  tags?: string[];
  attachments_count: number;
  content_url?: string;
  project_id: number;
  // Hydrated
  project?: Project;
  assignees: Profile[];
}

export interface TaskAssignee {
  task_id: number;
  profile_id: number;
}

export interface Event {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  location?: string;
  description?: string;
  category?: string;
  sub_category?: string;
  event_type?: string;
  host_ous?: string[];
  is_public: boolean;
  vtools_reported: boolean;
  meeting_minutes_url?: string;
  attendees_ieee: number;
  attendees_guests: number;
  attendee_list?: any;
  chapter_id?: number;
  project_id?: number;
  // Hydrated
  chapter?: Chapter;
  project?: Project;
}
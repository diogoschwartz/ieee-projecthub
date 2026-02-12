
import React, { useState } from 'react';
import { customAlphabet } from 'nanoid';
import {
  // Existing
  Bot, Zap, Globe, FolderKanban, Circle, Clock, AlertCircle, CheckCircle2, Archive,
  Cpu, Code, Wifi, BookOpen, Rocket, Target, Users, Award, Briefcase, Lightbulb, Music,
  // General UI
  Home, Settings, Search, Menu, Bell, User, LogOut, HelpCircle, Info, AlertTriangle,
  CheckCircle, XCircle, Plus, Minus, X, Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ExternalLink, Filter, MoreHorizontal, MoreVertical,
  // Actions & Editors
  Edit, Edit2, Edit3, Trash, Trash2, Save, Copy, Share, Share2, Upload, Download, RefreshCw,
  Printer, Paperclip, Link, Eye, EyeOff, Lock, Unlock, Shield, Flag, Bookmark, Tag,
  // Communication & Media
  Mail, MessageSquare, Phone, MapPin, Camera, Video, Mic, Image, Play, Pause, Radio,
  // Devices & Tech
  Database, Server, Smartphone, Monitor, Terminal, Laptop, HardDrive, Car, Brain,
  // Office & Data
  File, FileText, Folder, Calendar, PieChart, BarChart, Activity, DollarSign, CreditCard,
  ShoppingBag, ShoppingCart, Box, Truck,
  // Misc
  Star, Heart, ThumbsUp, Smile, Sun, Moon, Cloud, Umbrella, Gift, Coffee, Dna
} from 'lucide-react';

// Mock User Removed - Use AuthContext
// export const currentUserMock = { ... };

// --- NanoID Generator ---
// Alfanumérico seguro para URLs (5 chars)
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 5);

// --- Slug Helpers ---

export function generatePublicId(): string {
  return nanoid();
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-') // Substitui não alfanuméricos por -
    .replace(/^-+|-+$/g, ''); // Remove traços do início/fim
}

export function getProjectUrl(project: { public_id?: string; name: string; id: number | string }): string {
  if (!project.public_id) {
    return `/projects/${project.id}`; // Backwards compatibility
  }
  const slug = generateSlug(project.name);
  return `/projects/${slug}-${project.public_id}`;
}

export function extractPublicIdFromSlug(slugParam: string): string {
  const parts = slugParam.split('-');
  return parts.pop() || '';
}

export function getTaskUrl(task: { public_id?: string; title: string; id: number | string }): string {
  if (!task.public_id) {
    return `/tasks/${task.id}`;
  }
  // The user requested: http://localhost:3000/#/tasks/xyBgj
  // So we just use the public_id, no slug needed for tasks as per request
  return `/tasks/${task.public_id}`;
}

// --- Date Helpers ---

/**
 * Retorna a data atual no formato YYYY-MM-DD considerando o fuso horário LOCAL do usuário.
 * Evita o bug onde new Date().toISOString() retorna a data de amanhã se for tarde da noite (UTC).
 */
export function getLocalDateISOString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formata uma string de data (YYYY-MM-DD ou ISO) para visualização amigável (DD/MM/YYYY).
 * Força a interpretação como meio-dia para evitar shifts de fuso horário (ex: 13/03 virar 12/03).
 */
export function formatDateDisplay(dateString: string | null | undefined): string {
  if (!dateString) return '';

  // Se vier como timestamp completo ISO, cortamos para YYYY-MM-DD
  const cleanDate = dateString.split('T')[0];

  // Criamos a data forçando meio-dia local/UTC neutro para display
  // T12:00:00 garante que shifts de -3h ou +3h não mudem o dia
  const dateObj = new Date(cleanDate + 'T12:00:00');

  return dateObj.toLocaleDateString('pt-BR');
}

// Icon Mapper - Expandido com os ícones mais comuns do Lucide
export const iconMap: Record<string, any> = {
  // --- Original Set ---
  'Bot': Bot,
  'Zap': Zap,
  'Globe': Globe,
  'FolderKanban': FolderKanban,
  'Cpu': Cpu,
  'Code': Code,
  'Wifi': Wifi,
  'BookOpen': BookOpen,
  'Rocket': Rocket,
  'Target': Target,
  'Users': Users,
  'Award': Award,
  'Briefcase': Briefcase,
  'Lightbulb': Lightbulb,
  'Music': Music,
  'Dna': Dna,

  // --- New Chapter Icons ---
  'Radio': Radio,
  'Car': Car,
  'Brain': Brain,

  // --- General UI ---
  'Home': Home,
  'Settings': Settings,
  'Search': Search,
  'Menu': Menu,
  'Bell': Bell,
  'User': User,
  'LogOut': LogOut,
  'HelpCircle': HelpCircle,
  'Info': Info,
  'AlertCircle': AlertCircle,
  'AlertTriangle': AlertTriangle,
  'CheckCircle': CheckCircle,
  'CheckCircle2': CheckCircle2,
  'XCircle': XCircle,
  'Plus': Plus,
  'Minus': Minus,
  'X': X,
  'Check': Check,
  'ChevronDown': ChevronDown,
  'ChevronUp': ChevronUp,
  'ChevronLeft': ChevronLeft,
  'ChevronRight': ChevronRight,
  'ArrowLeft': ArrowLeft,
  'ArrowRight': ArrowRight,
  'ArrowUp': ArrowUp,
  'ArrowDown': ArrowDown,
  'ExternalLink': ExternalLink,
  'Filter': Filter,
  'MoreHorizontal': MoreHorizontal,
  'MoreVertical': MoreVertical,

  // --- Actions & Editors ---
  'Edit': Edit,
  'Edit2': Edit2,
  'Edit3': Edit3,
  'Trash': Trash,
  'Trash2': Trash2,
  'Save': Save,
  'Copy': Copy,
  'Share': Share,
  'Share2': Share2,
  'Upload': Upload,
  'Download': Download,
  'RefreshCw': RefreshCw,
  'Printer': Printer,
  'Paperclip': Paperclip,
  'Link': Link,
  'Eye': Eye,
  'EyeOff': EyeOff,
  'Lock': Lock,
  'Unlock': Unlock,
  'Shield': Shield,
  'Flag': Flag,
  'Bookmark': Bookmark,
  'Tag': Tag,

  // --- Communication & Media ---
  'Mail': Mail,
  'MessageSquare': MessageSquare,
  'Phone': Phone,
  'MapPin': MapPin,
  'Camera': Camera,
  'Video': Video,
  'Mic': Mic,
  'Image': Image,
  'Play': Play,
  'Pause': Pause,

  // --- Devices & Tech ---
  'Database': Database,
  'Server': Server,
  'Smartphone': Smartphone,
  'Monitor': Monitor,
  'Terminal': Terminal,
  'Laptop': Laptop,
  'HardDrive': HardDrive,

  // --- Office & Data ---
  'File': File,
  'FileText': FileText,
  'Folder': Folder,
  'Calendar': Calendar,
  'Clock': Clock,
  'PieChart': PieChart,
  'BarChart': BarChart,
  'Activity': Activity,
  'DollarSign': DollarSign,
  'CreditCard': CreditCard,
  'ShoppingBag': ShoppingBag,
  'ShoppingCart': ShoppingCart,
  'Box': Box,
  'Truck': Truck,
  'Archive': Archive,
  'Circle': Circle,

  // --- Misc ---
  'Star': Star,
  'Heart': Heart,
  'ThumbsUp': ThumbsUp,
  'Smile': Smile,
  'Sun': Sun,
  'Moon': Moon,
  'Cloud': Cloud,
  'Umbrella': Umbrella,
  'Gift': Gift,
  'Coffee': Coffee
};

// Components
export const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    todo: "bg-gray-100 text-gray-700 border-gray-300",
    doing: "bg-blue-100 text-blue-700 border-blue-300",
    review: "bg-yellow-100 text-yellow-700 border-yellow-300",
    done: "bg-green-100 text-green-700 border-green-300",
    archived: "bg-slate-100 text-slate-500 border-slate-300"
  };

  const labels: any = {
    todo: "A Fazer",
    doing: "Em Andamento",
    review: "Em Revisão",
    done: "Concluído",
    archived: "Arquivado"
  };

  const icons: any = {
    todo: <Circle className="w-3 h-3" />,
    doing: <Clock className="w-3 h-3" />,
    review: <AlertCircle className="w-3 h-3" />,
    done: <CheckCircle2 className="w-3 h-3" />,
    archived: <Archive className="w-3 h-3" />
  };

  const safeStatus = styles[status] ? status : 'todo';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[safeStatus]}`}>
      {icons[safeStatus]}
      <span className="hidden sm:inline">{labels[safeStatus]}</span>
    </span>
  );
};

export const PriorityBadge = ({ prioridade }: { prioridade: string }) => {
  const styles: any = {
    baixa: "bg-slate-100 text-slate-600",
    média: "bg-orange-100 text-orange-600",
    alta: "bg-red-100 text-red-600",
    urgente: "bg-purple-100 text-purple-600 animate-pulse"
  };

  const safePriority = styles[prioridade] ? prioridade : 'média';

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[safePriority]}`}>
      {safePriority.toUpperCase()}
    </span>
  );
};

interface UserAvatarProps {
  user: any;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  showRing?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = "sm", className = "", showRing = true }) => {
  const [error, setError] = useState(false);

  // Se o usuário não existir (ex: id inválido), renderiza placeholder neutro
  if (!user) {
    return <div className={`rounded-full bg-gray-200 flex items-center justify-center text-gray-400 ${size === 'lg' ? 'w-10 h-10' : size === 'md' ? 'w-8 h-8' : size === 'sm' ? 'w-6 h-6' : 'w-5 h-5'} ${className}`}>?</div>
  }

  const sizeClasses = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm"
  };

  const ringClass = showRing ? "ring-2 ring-white" : "";

  if (!user.foto || error) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-sm ${ringClass} ${className}`} title={user.nome}>
        {user.avatar || user.nome?.[0]?.toUpperCase() || '?'}
      </div>
    );
  }

  return (
    <img
      src={user.foto}
      alt={user.nome}
      title={user.nome}
      onError={() => setError(true)}
      className={`${sizeClasses[size]} rounded-full object-cover bg-gray-200 ${ringClass} ${className}`}
    />
  );
};

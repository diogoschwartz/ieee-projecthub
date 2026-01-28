
import React from 'react';
import { X, Calendar, MapPin, Clock, Edit, AlignLeft, Info, ExternalLink } from 'lucide-react';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  onEdit?: (event: any) => void;
}

export const EventDetailsModal = ({ isOpen, onClose, event, onEdit }: EventDetailsModalProps) => {
  if (!isOpen || !event) return null;

  const isExternal = event.isExternal;
  
  // Format dates nicely
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const start = new Date(event.start);
  const end = new Date(event.end);
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const durationText = durationMinutes >= 60 
    ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60 > 0 ? durationMinutes % 60 + 'm' : ''}`
    : `${durationMinutes} min`;

  // Get color from chapter or default
  const chapter = event.resource?.chapter;
  let bgGradient = 'bg-gradient-to-r from-blue-600 to-blue-800';
  
  if (chapter?.cor) {
      bgGradient = `bg-gradient-to-r ${chapter.cor}`;
  } else if (isExternal) {
      bgGradient = 'bg-gradient-to-r from-green-600 to-green-700'; // Default for GCal
  }

  const rawEvent = event.resource;

  // Helper to check if location is a link
  const isLocationUrl = (loc: string) => {
    return loc && (loc.startsWith('http://') || loc.startsWith('https://'));
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        
        {/* Header with Visuals */}
        <div className={`relative h-32 ${bgGradient} p-6 text-white flex flex-col justify-between`}>
           <button 
             onClick={onClose} 
             className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white"
           >
             <X className="w-5 h-5" />
           </button>
           
           <div className="mt-auto">
              <div className="flex flex-wrap items-center gap-2 mb-1 opacity-90">
                 {chapter && (
                    <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded backdrop-blur-md">
                       {chapter.sigla || chapter.nome}
                    </span>
                 )}
                 {rawEvent.category && (
                    <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded backdrop-blur-md">
                       {rawEvent.category.split('(')[0].trim()}
                    </span>
                 )}
              </div>
              <h2 className="text-2xl font-bold leading-tight line-clamp-2">{event.title}</h2>
           </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
           
           {/* Date & Time */}
           <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-blue-600 shrink-0">
                 <Calendar className="w-5 h-5" />
              </div>
              <div>
                 <p className="font-semibold text-gray-900">{formatDate(start)}</p>
                 <p className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(start)} - {formatTime(end)} ({durationText})
                 </p>
              </div>
           </div>

           {/* Location */}
           {rawEvent.location && (
             <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-red-500 shrink-0">
                   <MapPin className="w-5 h-5" />
                </div>
                <div>
                   <p className="font-semibold text-gray-900">Localização</p>
                   {isLocationUrl(rawEvent.location) ? (
                     <a 
                       href={rawEvent.location} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-sm text-blue-600 hover:text-blue-800 hover:underline mt-0.5 flex items-center gap-1 break-all"
                     >
                       {rawEvent.location}
                       <ExternalLink className="w-3 h-3 inline" />
                     </a>
                   ) : (
                     <p className="text-sm text-gray-500 mt-0.5">{rawEvent.location}</p>
                   )}
                </div>
             </div>
           )}

           {/* Description */}
           <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                 <AlignLeft className="w-5 h-5" />
              </div>
              <div className="flex-1">
                 <p className="font-semibold text-gray-900 mb-1">Descrição</p>
                 <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                    {rawEvent.description || <span className="italic text-gray-400">Sem descrição detalhada.</span>}
                 </div>
              </div>
           </div>

           {/* Footer Actions */}
           <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm"
              >
                Fechar
              </button>
              
              {!isExternal && onEdit && (
                 <button 
                   onClick={() => {
                      onEdit(rawEvent);
                      onClose();
                   }}
                   className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors text-sm flex items-center gap-2 shadow-sm"
                 >
                   <Edit className="w-4 h-4" />
                   Editar Evento
                 </button>
              )}
           </div>

        </div>
      </div>
    </div>
  );
};

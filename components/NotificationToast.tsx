import React from 'react';
import { X, Bell, User, Users, Crown } from 'lucide-react';
import { useNotificationToast } from '../hooks/useNotifications';

export const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useNotificationToast();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm animate-slide-in"
        >
          <div className="flex items-start space-x-3">
            {/* Ícone baseado no tópico */}
            <div className="flex-shrink-0">
              {notification.topic?.includes('general') ? (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
              ) : notification.topic?.includes('user-') ? (
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-green-600" />
                </div>
              ) : notification.topic?.includes('role-') ? (
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Crown className="w-4 h-4 text-purple-600" />
                </div>
              ) : (
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Bell className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {notification.notification?.title || 'IEEE ProjectHub'}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {notification.notification?.message || notification.notification?.body}
              </p>
              
              {/* Timestamp */}
              <p className="text-xs text-gray-400 mt-2">
                {notification.timestamp?.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>

            {/* Botão fechar */}
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Barra de progresso */}
          <div className="mt-3 bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-600 h-1 rounded-full animate-progress"
              style={{
                animation: 'progress 5s linear forwards'
              }}
            />
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        .animate-progress {
          width: 100%;
        }
      `}</style>
    </div>
  );
};

// Componente simples de indicador de status de notificações
export const NotificationStatus: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <Bell className="w-5 h-5 text-gray-600" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
      </div>
      <span className="text-xs text-gray-500">Notificações Ativas</span>
    </div>
  );
};
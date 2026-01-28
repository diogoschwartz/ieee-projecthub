import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Send, Users, User, Crown, Settings, Wifi, WifiOff } from 'lucide-react';
import { notificationService } from '../services/notificationService';

interface NotificationControlsProps {
  currentUser?: any;
}

export const NotificationControls: React.FC<NotificationControlsProps> = ({ currentUser }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [testMessage, setTestMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (currentUser) {
      notificationService.setCurrentUser(currentUser);
      updateStatus();
    }

    // Escuta eventos de notificação (apenas para logging ou custom actions locais)
    const handleNotification = (event: any) => {
      console.log('Notificação recebida no componente:', event.detail);
    };

    window.addEventListener('ntfy-notification', handleNotification);

    return () => {
      window.removeEventListener('ntfy-notification', handleNotification);
    };
  }, [currentUser]);

  const updateStatus = async () => {
    const permission = Notification.permission === 'granted';
    const enabled = notificationService.isNotificationsEnabled();
    const info = notificationService.getSubscriptionInfo();

    setHasPermission(permission);
    setIsEnabled(enabled);
    setSubscriptionInfo(info);
    setIsConnected(enabled && permission);
  };

  const requestPermission = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      setHasPermission(true);
      if (isEnabled) {
        notificationService.startListening();
      }
    }
    updateStatus();
  };

  const toggleNotifications = async () => {
    if (!isEnabled && !hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    const newState = !isEnabled;
    notificationService.toggleNotifications(newState);
    setIsEnabled(newState);
    setIsConnected(newState && hasPermission);
  };

  const sendTestNotification = async (type: 'general' | 'user' | 'role') => {
    if (!testMessage.trim()) return;

    setIsSending(true);
    let success = false;

    try {
      switch (type) {
        case 'general':
          success = await notificationService.sendGeneralNotification(
            testMessage,
            '🧪 Teste - Notificação Geral',
            { priority: 3 }
          );
          break;
        case 'user':
          success = await notificationService.sendUserNotification(
            currentUser?.id,
            testMessage,
            '👤 Teste - Notificação Pessoal'
          );
          break;
        case 'role':
          success = await notificationService.sendRoleNotification(
            currentUser?.role || 'member',
            testMessage,
            '👥 Teste - Notificação por Cargo',
            { priority: 4 }
          );
          break;
      }

      if (success) {
        setTestMessage('');
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-500 text-center">
          Faça login para configurar notificações
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status das Notificações */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações Push
          </h3>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <Wifi className="w-4 h-4" />
                Conectado
              </span>
            ) : (
              <span className="flex items-center gap-1 text-gray-400 text-sm">
                <WifiOff className="w-4 h-4" />
                Desconectado
              </span>
            )}
          </div>
        </div>

        {/* Toggle Principal */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
          <div>
            <p className="font-medium">Receber Notificações</p>
            <p className="text-sm text-gray-600">
              Ative para receber atualizações em tempo real
            </p>
          </div>
          <button
            onClick={toggleNotifications}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
          </button>
        </div>

        {/* Permissões */}
        {!hasPermission && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <BellOff className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Permissão Necessária
              </span>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              Permita notificações para receber atualizações em tempo real
            </p>
            <button
              onClick={requestPermission}
              className="bg-yellow-600 text-white px-3 py-1.5 rounded text-sm hover:bg-yellow-700 transition-colors"
            >
              Permitir Notificações
            </button>
          </div>
        )}

        {/* Informações da Subscription */}
        {subscriptionInfo && isEnabled && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Status da Inscrição:
            </h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-blue-700 font-mono text-xs">ID: {subscriptionInfo.id || 'Carregando...'}</span>
              </div>
            </div>
            {/* Note: OneSignal tags are not easily available in frontend synchronously without extra logic, hiding specific topics list for now */}
          </div>
        )}
      </div>

      {/* Teste de Notificações */}
      {isEnabled && hasPermission && (
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Teste de Notificações
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem de Teste
              </label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Digite uma mensagem para testar..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSending}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => sendTestNotification('general')}
                disabled={!testMessage.trim() || isSending}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Users className="w-4 h-4" />
                {isSending ? 'Enviando...' : 'Geral'}
              </button>

              <button
                onClick={() => sendTestNotification('user')}
                disabled={!testMessage.trim() || isSending}
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <User className="w-4 h-4" />
                {isSending ? 'Enviando...' : 'Pessoal'}
              </button>

              <button
                onClick={() => sendTestNotification('role')}
                disabled={!testMessage.trim() || isSending}
                className="flex items-center justify-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Crown className="w-4 h-4" />
                {isSending ? 'Enviando...' : 'Por Cargo'}
              </button>
            </div>

            <div className="text-xs text-gray-500 mt-2">
              <p><strong>Geral:</strong> Todos os usuários recebem</p>
              <p><strong>Pessoal:</strong> Apenas você recebe</p>
              <p><strong>Por Cargo:</strong> Usuários do seu cargo ({currentUser?.role}) recebem</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
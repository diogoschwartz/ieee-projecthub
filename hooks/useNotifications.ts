import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';

export interface UseNotificationsReturn {
  isEnabled: boolean;
  isConnected: boolean;
  hasPermission: boolean;
  subscriptionInfo: any;
  lastNotification: any;
  toggleNotifications: () => void;
  requestPermission: () => Promise<boolean>;
  sendNotification: (type: 'general' | 'user' | 'role', message: string, title?: string, options?: any) => Promise<boolean>;
}

export const useNotifications = (currentUser?: any): UseNotificationsReturn => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [lastNotification, setLastNotification] = useState<any>(null);

  // Atualiza status das notificações
  const updateStatus = useCallback(() => {
    const permission = Notification.permission === 'granted'; // or notificationService.getPermissionState()
    const enabled = notificationService.isNotificationsEnabled();
    const info = notificationService.getSubscriptionInfo();

    setHasPermission(permission);
    setIsEnabled(enabled);
    setIsConnected(enabled && permission);
    setSubscriptionInfo(info);
  }, []);

  // Configura usuário e escuta notificações
  useEffect(() => {
    if (currentUser) {
      notificationService.setCurrentUser(currentUser);
      // Note: setCurrentUser in new service is empty/noop as App.tsx handles login logic, 
      // but keeping it for compatibility if needed or removed.
      updateStatus();
    }

    // Escuta notificações recebidas (via Custom Event dispatched by service)
    const handleNotification = (event: CustomEvent) => {
      setLastNotification({
        ...event.detail,
        timestamp: new Date()
      });
    };

    window.addEventListener('ntfy-notification', handleNotification as EventListener);

    // Atualiza status periodicamente
    const interval = setInterval(updateStatus, 5000);

    return () => {
      window.removeEventListener('ntfy-notification', handleNotification as EventListener);
      clearInterval(interval);
    };
  }, [currentUser, updateStatus]);

  // Solicita permissão
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await notificationService.requestPermission();
    updateStatus();
    return !!granted; // ensure boolean
  }, [updateStatus]);

  // Toggle notificações
  const toggleNotifications = useCallback(async () => {
    // If not enabled/permission, request it
    if (!hasPermission || Notification.permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return;
    }

    const newState = !isEnabled;
    notificationService.toggleNotifications(newState);

    // Allow some time for async OneSignal update or just update status
    setTimeout(updateStatus, 1000);
  }, [isEnabled, hasPermission, requestPermission, updateStatus]);

  // Enviar notificação (Mock/Backend required)
  const sendNotification = useCallback(async (
    type: 'general' | 'user' | 'role',
    message: string,
    title?: string,
    options?: any
  ): Promise<boolean> => {
    if (!currentUser) return false;

    switch (type) {
      case 'general':
        return await notificationService.sendGeneralNotification(message, title, options);
      case 'user':
        return await notificationService.sendUserNotification(currentUser.id, message, title, options);
      case 'role':
        return await notificationService.sendRoleNotification(currentUser.role, message, title, options);
      default:
        return false;
    }
  }, [currentUser]);

  return {
    isEnabled,
    isConnected,
    hasPermission,
    subscriptionInfo,
    lastNotification,
    toggleNotifications,
    requestPermission,
    sendNotification
  };
};

// Hook para toast/snackbar de notificações
export const useNotificationToast = () => {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      const notification = {
        id: Date.now(),
        ...event.detail,
        timestamp: new Date()
      };

      setNotifications(prev => [...prev, notification]);

      // Remove automaticamente após 5 segundos
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    };

    window.addEventListener('ntfy-notification', handleNotification as EventListener);

    return () => {
      window.removeEventListener('ntfy-notification', handleNotification as EventListener);
    };
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    removeNotification,
    clearAll
  };
};
import OneSignal from 'react-onesignal';

export interface NotificationConfig {
  appId: string;
}

export class OneSignalNotificationService {
  private static instance: OneSignalNotificationService;
  private initialized = false;

  private constructor() { }

  public static getInstance(): OneSignalNotificationService {
    if (!OneSignalNotificationService.instance) {
      OneSignalNotificationService.instance = new OneSignalNotificationService();
    }
    return OneSignalNotificationService.instance;
  }

  async init(appId: string) {
    if (this.initialized) return;

    try {
      await OneSignal.init({
        appId,
        allowLocalhostAsSecureOrigin: true, // Allow localhost for testing
        serviceWorker: {
          path: '/sw.js', // This path is relative to the root of the site
        }
      });
      this.initialized = true;
      console.log('OneSignal initialized');

      // Forward OneSignal notifications to our custom event system for Toasts
      OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
        console.log('OneSignal Foreground Notification:', event);
        const notification = event.notification;

        // Dispatch custom event for UI components
        window.dispatchEvent(new CustomEvent('ntfy-notification', {
          detail: {
            id: notification.notificationId,
            title: notification.title,
            message: notification.body,
            topic: 'general', // Default topic or extract from data
            notification: { // Structure expected by toast
              title: notification.title,
              message: notification.body,
              body: notification.body
            }
          }
        }));
      });

    } catch (error) {
      console.error('Error initializing OneSignal:', error);
    }
  }

  async setExternalUserId(userId: string) {
    if (!this.initialized) return;
    try {
      await OneSignal.login(userId);
      console.log('OneSignal User Logged In:', userId);
    } catch (error) {
      console.warn('Error setting external user id:', error);
    }
  }

  async logout() {
    if (!this.initialized) return;
    try {
      await OneSignal.logout();
    } catch (e) {
      console.error(e);
    }
  }

  async addTag(key: string, value: string) {
    if (!this.initialized) return;
    await OneSignal.User.addTag(key, value);
  }

  async removeTag(key: string) {
    if (!this.initialized) return;
    await OneSignal.User.removeTag(key);
  }

  // Permission & Subscription Management
  async requestPermission() {
    if (!this.initialized) return false;
    try {
      await OneSignal.Notifications.requestPermission();
      return OneSignal.Notifications.permission === 'granted';
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async getPermissionState() {
    if (!this.initialized) return 'default';
    return OneSignal.Notifications.permission;
  }

  // Subscription Wrappers
  async optIn() {
    if (!this.initialized) return;
    await OneSignal.User.PushSubscription.optIn();
  }

  async optOut() {
    if (!this.initialized) return;
    await OneSignal.User.PushSubscription.optOut();
  }

  get isOptedIn(): boolean {
    if (!this.initialized) return false;
    return !!OneSignal.User.PushSubscription.optedIn;
  }

  get subscriptionId(): string | null | undefined {
    if (!this.initialized) return null;
    return OneSignal.User.PushSubscription.id;
  }

  // Legacy/Compatibility methods for UI
  isNotificationsEnabled(): boolean {
    return this.isOptedIn && OneSignal.Notifications.permission === 'granted';
  }

  getSubscriptionInfo(): any {
    return {
      id: this.subscriptionId,
      enabled: this.isOptedIn,
      topics: [], // Topics managed by OneSignal Tags generally
    };
  }

  // Mock methods for compatibility - sending from frontend is restricted
  async sendGeneralNotification(message: string, title?: string, options?: any) {
    console.warn('Frontend sending of notifications is not supported with OneSignal (requires Backend API).');
    return true; // Fake success for UI
  }

  async sendUserNotification(userId: string, message: string, title?: string, options?: any) {
    console.warn('Frontend sending of notifications is not supported with OneSignal (requires Backend API).');
    return true;
  }

  async sendRoleNotification(role: string, message: string, title?: string, options?: any) {
    console.warn('Frontend sending of notifications is not supported with OneSignal (requires Backend API).');
    return true;
  }

  // Compatibility methods
  startListening() {
    // No-op for OneSignal as it uses event listeners attached in init
    console.log('OneSignal listening started (passive)');
  }

  setCurrentUser(user: any) {
    // Logic handled in App.tsx via setExternalUserId, this is just for interface compat
  }

  clearSubscriptions() {
    // Logic handled in logout
  }

  toggleNotifications(enabled: boolean) {
    if (enabled) {
      this.optIn();
    } else {
      this.optOut();
    }
  }
}

export const notificationService = OneSignalNotificationService.getInstance();
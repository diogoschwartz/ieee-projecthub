import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from './firebase';
import { supabase } from './supabase';

export const requestNotificationPermission = async (userId: string | number) => {
    try {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            // Get the token
            // VAPID Key is public. Ideally should be in env or constants.
            // Using a placeholder or assuming the user will replace it.
            // If the user hasn't provided one, we can try to proceed without it (sometimes works if default is set) 
            // or use a clear placeholder.
            // Get the registration from the PWA service worker
            const registration = await navigator.serviceWorker.ready;

            const currentToken = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: registration
            });

            if (currentToken) {
                console.log('FCM Token:', currentToken);

                // Save to Supabase
                const { error } = await supabase
                    .from('profiles')
                    .update({ fcm_token: currentToken })
                    .eq('id', userId);

                if (error) {
                    console.error('Error saving FCM token to Supabase:', error);
                    throw error;
                }

                return currentToken;
            } else {
                console.warn('No registration token available. Request permission to generate one.');
                return null;
            }
        } else {
            console.warn('Notification permission denied.');
            return null;
        }
    } catch (error) {
        console.error('An error occurred while retrieving token:', error);
        throw error;
    }
};

export const setupOnMessage = (callback: (payload: any) => void) => {
    return onMessage(messaging, (payload) => {
        callback(payload);
    });
};



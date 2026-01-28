import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';
import { firebaseConfig } from './firebase_constants';

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
export default app;

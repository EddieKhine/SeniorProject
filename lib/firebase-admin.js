import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import serviceAccount from './serviceAccountKey.json'; // <-- Update this path

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'foodloft-450813.firebasestorage.app',
    projectId: 'foodloft-450813'
  });
}

export const storage = getStorage(); 
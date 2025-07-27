import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import serviceAccount from './serviceAccountKey.json';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin with better error handling
try {
  if (!getApps().length) {
    console.log('Initializing Firebase Admin...');
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: 'foodloft-450813.firebasestorage.app',
      projectId: 'foodloft-450813'
    });
    console.log('Firebase Admin initialized successfully');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  throw error;
}

export const storage = getStorage(); 
export const adminAuth = getAuth();

// Middleware to verify Firebase Auth token
export const verifyFirebaseAuth = async (req) => {
  try {
    console.log('Verifying Firebase Auth token...');
    const authHeader = req.headers.get("authorization") || req.headers.authorization;
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'No authorization header' };
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return { success: false, error: 'No token provided' };
    }

    console.log('Token extracted, verifying...');
    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(token);
    console.log('Token verified successfully for UID:', decodedToken.uid);
    
    return { 
      success: true, 
      firebaseUid: decodedToken.uid, 
      email: decodedToken.email,
      decodedToken 
    };
  } catch (error) {
    console.error('Firebase auth verification failed:', error);
    return { success: false, error: 'Authentication failed' };
  }
};

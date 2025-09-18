import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';

// Get Firebase Admin credentials from environment variables or JSON file
function getFirebaseAdminCredentials() {
  // Try environment variables first (for production/Vercel)
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    console.log('🔧 Using Firebase Admin credentials from environment variables');
    return {
      type: "service_account",
      project_id: process.env.FIREBASE_ADMIN_PROJECT_ID || "foodloft-450813",
      private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL
    };
  }
  
  // Fallback to JSON file for local development
  console.log('🔧 Attempting to load Firebase Admin credentials from serviceAccountKey.json');
  
  // For Vercel deployment, require environment variables
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    console.error('❌ Vercel environment detected but Firebase Admin environment variables not found');
    throw new Error('Firebase Admin environment variables are required for Vercel deployment. Please set FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_ADMIN_CLIENT_EMAIL, etc.');
  }
  
  try {
    const serviceAccount = require('./serviceAccountKey.json');
    console.log('✅ Successfully loaded Firebase Admin credentials from serviceAccountKey.json');
    return serviceAccount;
  } catch (error) {
    console.error('❌ Could not load Firebase Admin credentials from serviceAccountKey.json:', error.message);
    console.error('Environment variables available:', {
      FIREBASE_ADMIN_PRIVATE_KEY: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      FIREBASE_ADMIN_CLIENT_EMAIL: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      FIREBASE_ADMIN_PROJECT_ID: !!process.env.FIREBASE_ADMIN_PROJECT_ID
    });
    
    // For build-time, return null to skip Firebase initialization
    console.log('🔧 Build time detected, skipping Firebase Admin initialization...');
    return null;
  }
}

// Initialize Firebase Admin with better error handling
let firebaseInitialized = false;
try {
  if (!getApps().length) {
    console.log('Initializing Firebase Admin...');
    const credentials = getFirebaseAdminCredentials();
    
    // Skip initialization if no credentials (build time)
    if (credentials) {
      initializeApp({
        credential: cert(credentials),
        storageBucket: 'foodloft-450813.firebasestorage.app',
        projectId: 'foodloft-450813'
      });
      console.log('Firebase Admin initialized successfully');
      firebaseInitialized = true;
    } else {
      console.log('🔧 Skipping Firebase Admin initialization (build time)');
    }
  } else {
    firebaseInitialized = true;
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  if (process.env.NODE_ENV !== 'production' || process.env.VERCEL || process.env.VERCEL_ENV) {
    throw error;
  }
  console.log('🔧 Continuing without Firebase Admin (build time)');
}

// Export storage and auth only if Firebase is initialized
export const storage = firebaseInitialized ? getStorage() : null; 
export const adminAuth = firebaseInitialized ? getAuth() : null;

// Middleware to verify Firebase Auth token
export const verifyFirebaseAuth = async (req) => {
  try {
    // Check if Firebase Admin is initialized
    if (!adminAuth) {
      console.error('Firebase Admin not initialized');
      return { success: false, error: 'Firebase Admin not available' };
    }
    
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

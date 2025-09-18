import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';

// Get Firebase Admin credentials from environment variables or JSON file
function getFirebaseAdminCredentials() {
  console.log('🔧 getFirebaseAdminCredentials called');
  
  // Try environment variables first (for production/Vercel)
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    console.log('✅ Using Firebase Admin credentials from environment variables');
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
  
  // Try to load the service account file from the project root
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Use process.cwd() to get the project root directory
    const projectRoot = process.cwd();
    const filePath = path.join(projectRoot, 'lib', 'serviceAccountKey.json');
    
    console.log('🔍 Attempting to load Firebase credentials from:', filePath);
    console.log('🔍 File exists:', fs.existsSync(filePath));
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const serviceAccount = JSON.parse(fileContent);
    
    console.log('✅ Successfully loaded Firebase Admin credentials from serviceAccountKey.json');
    return serviceAccount;
  } catch (error) {
    // If we get here, file loading failed
    console.log('❌ Failed to load serviceAccountKey.json:', error.message);
    console.error('❌ Could not load Firebase Admin credentials from serviceAccountKey.json');
    console.error('Environment variables available:', {
      FIREBASE_ADMIN_PRIVATE_KEY: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      FIREBASE_ADMIN_CLIENT_EMAIL: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      FIREBASE_ADMIN_PROJECT_ID: !!process.env.FIREBASE_ADMIN_PROJECT_ID
    });
    
    // Check if this is a build process by looking for specific build environment indicators
    const isBuildProcess = process.env.NEXT_PHASE === 'phase-production-build' || 
                          process.argv.includes('build') ||
                          process.env.npm_lifecycle_event === 'build';
    
    if (isBuildProcess) {
      console.log('🔧 Build process detected, skipping Firebase Admin initialization...');
      return null;
    }
    
    // For runtime, this is a real error
    throw new Error('Firebase Admin credentials not found. Please set environment variables or add serviceAccountKey.json for local development');
  }
}

// Initialize Firebase Admin with better error handling
let firebaseInitialized = false;
let initializationError = null;

function initializeFirebaseAdmin() {
  if (firebaseInitialized) {
    return firebaseInitialized;
  }
  
  try {
    if (!getApps().length) {
      console.log('🔧 Initializing Firebase Admin...');
      const credentials = getFirebaseAdminCredentials();
      
      // Skip initialization if no credentials (build time)
      if (credentials) {
        initializeApp({
          credential: cert(credentials),
          storageBucket: 'foodloft-450813.firebasestorage.app',
          projectId: 'foodloft-450813'
        });
        console.log('✅ Firebase Admin initialized successfully');
        firebaseInitialized = true;
      } else {
        console.log('🔧 Skipping Firebase Admin initialization (no credentials)');
        return false;
      }
    } else {
      console.log('✅ Firebase Admin already initialized');
      firebaseInitialized = true;
    }
    return firebaseInitialized;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error);
    initializationError = error;
    
    // Only throw in production environments
    if (process.env.VERCEL || process.env.VERCEL_ENV) {
      throw error;
    }
    console.log('🔧 Continuing without Firebase Admin (development mode)');
    return false;
  }
}

// Try to initialize immediately
initializeFirebaseAdmin();

// Export storage and auth with lazy initialization
export const storage = (() => {
  try {
    return initializeFirebaseAdmin() ? getStorage() : null;
  } catch (error) {
    console.error('Failed to get storage:', error);
    return null;
  }
})();

export const adminAuth = (() => {
  try {
    return initializeFirebaseAdmin() ? getAuth() : null;
  } catch (error) {
    console.error('Failed to get auth:', error);
    return null;
  }
})();

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

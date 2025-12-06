/**
 * Firebase Admin SDK Configuration
 * 
 * This module initializes Firebase Admin SDK for server-side authentication.
 * It verifies JWT tokens sent from the frontend to authenticate users.
 * 
 * Required environment variables:
 * - FIREBASE_PROJECT_ID: Your Firebase project ID
 * - FIREBASE_PRIVATE_KEY: Service account private key (with escaped newlines)
 * - FIREBASE_CLIENT_EMAIL: Service account client email
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    // Check if we have the required environment variables
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error('Missing Firebase configuration. Please set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in your .env file.');
    }

    // Initialize Firebase Admin with service account credentials
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Replace escaped newlines
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });

    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error.message);
    // Don't exit the process - allow the app to start but authentication will fail
  }
}

module.exports = admin;


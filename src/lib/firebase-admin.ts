import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

if (!getApps().length) {
  initializeApp({
    projectId: (firebaseConfig as any).projectId || 'mock-project-id',
  });
}

export const adminAuth = getAuth();

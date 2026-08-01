import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserSessionPersistence } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Ensure a valid-looking apiKey and authDomain exist in the config to prevent Firebase SDK from throwing on initialization
const config = {
  apiKey: "mock-api-key-1234567890abcdefghijklmnopqrst",
  authDomain: `${firebaseConfig.projectId || "mock-project-id"}.firebaseapp.com`,
  ...firebaseConfig
};

const app = initializeApp(config);
export const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence).catch(() => {});
export const googleAuthProvider = new GoogleAuthProvider();

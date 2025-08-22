import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD4orKO0KCyFWAkYMnZ1FjdCCnXcGbUb6Q",
  authDomain: "aptitude-platform.firebaseapp.com",
  databaseURL: "https://aptitude-platform-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aptitude-platform",
  storageBucket: "aptitude-platform.firebasestorage.app",
  messagingSenderId: "734316195731",
  appId: "1:734316195731:web:0c4d579ba057cb5df68266",
  measurementId: "G-XSTZW7KJ6R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;

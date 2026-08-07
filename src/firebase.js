import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDtFXPYiMR8yMc4LEm96PZNgiIJd2SuEuE",
  authDomain: "family-photo-hub-1c0b9.firebaseapp.com",
  projectId: "family-photo-hub-1c0b9",
  storageBucket: "family-photo-hub-1c0b9.firebasestorage.app",
  messagingSenderId: "1011541979016",
  appId: "1:1011541979016:web:c1ff012d7ccf89e6ba943d",
  measurementId: "G-0L1XLN882C"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
export const db = getFirestore(app);
export const storage = getStorage(app);


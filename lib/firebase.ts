import { initializeFirestore, getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCxaMKdokoSQ9Ztraigdwgsfc8YWlYHdqQ",
  authDomain: "cegunitedllc.firebaseapp.com",
  projectId: "cegunitedllc",
  storageBucket: "cegunitedllc.firebasestorage.app",
  messagingSenderId: "898492424787",
  appId: "1:898492424787:web:305c0ba09c8de0694bdca6",
  measurementId: "G-X6TW83PVFY",
};

const app = initializeApp(firebaseConfig);

export const authFirebase = getAuth(app);
export const db = initializeFirestore(
  app,
  { ignoreUndefinedProperties: true },
  `${process.env.FIREBASE_DB_NAME}`
);
export const storage = getStorage(app, `${process.env.FIREBASE_STORAGE_NAME}`);

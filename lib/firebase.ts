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

const firebaseConfigProd = {
  apiKey: "AIzaSyBCaC_CvDUy75nBT4oRlYQksNe3SDHOcbw",
  authDomain: "ceg-united-llc-prod.firebaseapp.com",
  projectId: "ceg-united-llc-prod",
  storageBucket: "ceg-united-llc-prod.firebasestorage.app",
  messagingSenderId: "516470017287",
  appId: "1:516470017287:web:832520958098e585f949a2",
  measurementId: "G-NY8EHMK975",
};

const getConfig = () => {
  return process.env.NEXT_PUBLIC_ENVIRONMENT === "production"
    ? firebaseConfigProd
    : firebaseConfig;
};

// console.log("Firebase config:", process.env.NEXT_PUBLIC_ENVIRONMENT);
// console.log("Firebase config:", getConfig().projectId);
export const app = initializeApp(getConfig());

export const authFirebase = getAuth(app);
export const storage = getStorage(
  app,
  process.env.NEXT_PUBLIC_ENVIRONMENT === "production"
    ? "gs://ceg-united-llc-prod.firebasestorage.app"
    : "gs://cegunitedllc.firebasestorage.app",
);


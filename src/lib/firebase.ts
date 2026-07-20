import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDNDkh-GJNfWVKCOio5YcnSD9GDrJSRSh8",
  authDomain: "nutri-joaq.firebaseapp.com",
  projectId: "nutri-joaq",
  storageBucket: "nutri-joaq.firebasestorage.app",
  messagingSenderId: "573044310873",
  appId: "1:573044310873:web:e8fca265d074a0a7538248"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

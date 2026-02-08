import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCtZnySiIuZUgrjP7xv9yp_IMfiwu69iNs",
  authDomain: "crm-corretor-firebase.firebaseapp.com",
  projectId: "crm-corretor-firebase",
  storageBucket: "crm-corretor-firebase.firebasestorage.app",
  messagingSenderId: "405918974331",
  appId: "1:405918974331:web:8e0d372b57b4170506bdde"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
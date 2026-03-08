import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCzQPH7c-Rg_yva4WufNXnKh_YgH5H0iHs",
  authDomain: "family-money-a4d5a.firebaseapp.com",
  projectId: "family-money-a4d5a",
  storageBucket: "family-money-a4d5a.firebasestorage.app",
  messagingSenderId: "41585632225",
  appId: "1:41585632225:web:77ad566be5ba30b3f7a8a0",
  measurementId: "G-MC0MD47NQ5"
};

const app = initializeApp(firebaseConfig);

const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

const auth = getAuth(app);

console.log('✅ Firebase initialized with modern offline support');

export { app, db, auth };
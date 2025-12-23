import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCXRkqNtpiXMm1f9amor6ZAm6TPDR2O1W4",
  authDomain: "green-gaurd.firebaseapp.com",
  projectId: "green-gaurd",
  storageBucket: "green-gaurd.firebasestorage.app",
  messagingSenderId: "683252924819",
  appId: "1:683252924819:web:e14102bfaa5f6b6c892866",
  measurementId: "G-MJRWPZ11S1"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);

export const db = getFirestore(app);
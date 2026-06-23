// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "mern-blog-3ecae.firebaseapp.com",
  projectId: "mern-blog-3ecae",
  storageBucket: "mern-blog-3ecae.appspot.com",
  messagingSenderId: "700395448711",
  appId: "1:700395448711:web:6c7033456ed1aff2af8b22"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
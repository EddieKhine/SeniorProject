// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCawMYzcVRSl1Yc4yk4aRKaOFQsgxwhDZw",
  authDomain: "foodloft-450813.firebaseapp.com",
  projectId: "foodloft-450813",
  storageBucket: "foodloft-450813.firebasestorage.app",
  messagingSenderId: "8952613263",
  appId: "1:8952613263:web:380275571aacce9d6ea3fa",
  measurementId: "G-SPHTWXKXTK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 💡 架构师注：这里的配置必须从你的 Firebase Console -> Project Settings 里复制真实数据
const firebaseConfig = {
  apiKey: "AIzaSyAulmCLERkMxm3jpohfdL0BZTEjLZ8svvA",
  authDomain: "gen-lang-client-0473804256.firebaseapp.com",
  projectId: "gen-lang-client-0473804256",
  storageBucket: "gen-lang-client-0473804256.firebasestorage.app",
  messagingSenderId: "1018738988620",
  appId: "1:1018738988620:web:66088c9d3893ea174906e9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
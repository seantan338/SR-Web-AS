import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 从环境变量读取，或者直接贴你刚才从控制台复制的真实配置
const firebaseConfig = {
  apiKey: "AIzaSy_YOUR_REAL_API_KEY_HERE",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// 🛡️ 架构师核心修复：防止重复初始化 (Prevent duplicate app error)
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // 如果已经有了，就直接获取当前实例
}

export const auth = getAuth(app);
export const db = getFirestore(app);
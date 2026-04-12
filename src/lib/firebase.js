import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  getDoc,
  getDocs,
  onSnapshot, 
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp
} from "firebase/firestore";

// 1. 读取环境变量配置
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 2. 防重复初始化单例模式
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// 3. 核心实例导出
export const auth = getAuth(app);
export const db = getFirestore(app);

// 4. 🚀 核心修复：把所有组件需要的原生 Firestore 方法全部重新导出去
export {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
};

// 5. 兼容你旧代码中的特殊类型和错误处理函数
export const OperationType = {
  ADDED: 'added',
  MODIFIED: 'modified',
  REMOVED: 'removed'
};

export const handleFirestoreError = (error: any) => {
  console.error("Firestore Error:", error);
};
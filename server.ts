import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. 初始化 Firebase Admin (利用已有的 Google Service Account)
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON as string);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin. Check GOOGLE_SERVICE_ACCOUNT_JSON format.', error);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // 2. 生产级高安全同步接口
  app.post('/api/sync-sheet', async (req, res) => {
    try {
      // [安全防线 1]：必须携带 Token，防止 API 被恶意刷单
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
      }

      const idToken = authHeader.split('Bearer ')[1];
      
      // [安全防线 2]：验证 Token 真实性 (确认是系统内的合法登录用户)
      await admin.auth().verifyIdToken(idToken);

      const { data, sheetName } = req.body;
      const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

      // [架构隔离]：求职端与招聘端数据物理分表
      let spreadsheetId = '';
      if (sheetName === 'JobApplications') {
        spreadsheetId = process.env.GOOGLE_SHEETS_ID_JOBS as string;
      } else if (sheetName === 'CandidateSubmissions') {
        spreadsheetId = process.env.GOOGLE_SHEETS_ID_RECRUITER as string;
      } else {
        return res.status(400).json({ error: 'Invalid sheetName' });
      }

      if (!spreadsheetId || !serviceAccountJson) {
        return res.status(500).json({ error: 'Server environment variables not fully configured' });
      }

      if (!data) {
        return res.status(400).json({ error: 'Missing data in request body' });
      }

      // [Google Auth]：唤醒 Google Sheets 客户端
      const credentials = JSON.parse(serviceAccountJson);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      const sheets = google.sheets({ version: 'v4', auth });

      // [核心写入]：执行数据追加
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [data],
        },
      });

      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Production Sync Error:', error);
      res.status(500).json({ error: 'Failed to sync to Google Sheets', details: error.message });
    }
  });

  // Vite middleware for development & Production fallback
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Production Server running on port ${PORT}`);
  });
}

startServer();
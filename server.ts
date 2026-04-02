import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Google Sheets Sync Endpoint (Append)
  app.post('/api/sync-sheet', async (req, res) => {
    const { data, sheetName } = req.body;
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    if (!spreadsheetId) {
      console.error('Missing GOOGLE_SHEETS_ID');
      return res.status(500).json({ error: 'Google Sheets ID not configured' });
    }

    if (!data || !sheetName) {
      return res.status(400).json({ error: 'Missing data or sheetName in request body' });
    }

    try {
      const authOptions: any = {
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      };

      if (serviceAccountJson) {
        try {
          // Basic check to see if it's even a JSON-like string
          if (!serviceAccountJson.trim().startsWith('{')) {
            throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON must be the FULL JSON content from your service account key file, not just the email address.');
          }
          authOptions.credentials = JSON.parse(serviceAccountJson);
        } catch (parseError: any) {
          console.error('GOOGLE_SERVICE_ACCOUNT_JSON Error:', parseError.message);
          return res.status(500).json({ 
            error: 'Invalid Google Service Account configuration',
            details: parseError.message
          });
        }
      }

      const auth = new GoogleAuth(authOptions);
      const sheets = google.sheets({ version: 'v4', auth });
      
      // Append data to the sheet
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [data],
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Google Sheets Sync Error:', error);
      res.status(500).json({ error: 'Failed to sync with Google Sheets' });
    }
  });

  // Fetch Jobs from Google Sheets
  app.get('/api/jobs', async (req, res) => {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    if (!spreadsheetId) {
      return res.status(500).json({ error: 'Google Sheets ID not configured' });
    }

    try {
      const authOptions: any = {
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      };

      if (serviceAccountJson) {
        try {
          if (!serviceAccountJson.trim().startsWith('{')) {
            throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON must be the FULL JSON content from your service account key file.');
          }
          authOptions.credentials = JSON.parse(serviceAccountJson);
        } catch (parseError: any) {
          console.error('GOOGLE_SERVICE_ACCOUNT_JSON Error in /api/jobs:', parseError.message);
          return res.status(500).json({ error: 'Invalid Google Service Account JSON configuration', details: parseError.message });
        }
      }

      const auth = new GoogleAuth(authOptions);
      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Jobs!A2:Z', // Assuming 'Jobs' sheet and headers in row 1
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return res.json([]);
      }

      // Map rows to Job objects
      const jobs = rows.map((row, index) => ({
        id: `gsheet-${index}`,
        title: row[0] || '',
        company: row[1] || '',
        location: row[2] || '',
        type: row[3] || '',
        salary: row[4] || '',
        description: row[5] || '',
        createdAt: row[6] || new Date().toISOString(),
        partnerInCharge: row[7] || '',
        commissionRange: row[8] || '',
        clientRequirements: row[9] || '',
        contactDetails: row[10] || '',
      }));

      res.json(jobs);
    } catch (error) {
      console.error('Fetch Jobs Error:', error);
      res.status(500).json({ error: 'Failed to fetch jobs from Google Sheets' });
    }
  });

  // Post Job Order to Google Sheets
  app.post('/api/post-job', async (req, res) => {
    const jobData = req.body;
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    if (!spreadsheetId) {
      return res.status(500).json({ error: 'Google Sheets ID not configured' });
    }

    try {
      const authOptions: any = {
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      };

      if (serviceAccountJson) {
        try {
          if (!serviceAccountJson.trim().startsWith('{')) {
            throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON must be the FULL JSON content from your service account key file.');
          }
          authOptions.credentials = JSON.parse(serviceAccountJson);
        } catch (parseError: any) {
          console.error('GOOGLE_SERVICE_ACCOUNT_JSON Error in /api/post-job:', parseError.message);
          return res.status(500).json({ error: 'Invalid Google Service Account JSON configuration', details: parseError.message });
        }
      }

      const auth = new GoogleAuth(authOptions);
      const sheets = google.sheets({ version: 'v4', auth });
      
      const row = [
        jobData.title,
        jobData.company,
        jobData.location,
        jobData.type,
        jobData.salary,
        jobData.description,
        new Date().toISOString(),
        jobData.partnerInCharge,
        jobData.commissionRange,
        jobData.clientRequirements,
        jobData.contactDetails,
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Jobs!A:Z',
        valueInputOption: 'RAW',
        requestBody: {
          values: [row],
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Post Job Error:', error);
      res.status(500).json({ error: 'Failed to post job to Google Sheets' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

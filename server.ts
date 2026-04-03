import express from 'express';
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
    if (!serviceAccountJson) {
      return res.status(500).json({ error: 'Google Service Account JSON not configured' });
    }

    if (!data || !sheetName) {
      return res.status(400).json({ error: 'Missing data or sheetName in request body' });
    }

    try {
      const authOptions: any = {
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      };

      try {
        let jsonString = serviceAccountJson.trim();
        if (!jsonString.startsWith('{')) {
          // Try decoding as base64
          try {
            jsonString = Buffer.from(jsonString, 'base64').toString('utf-8');
          } catch (e) {
            // Ignore base64 decode error
          }
        }
        if (!jsonString.startsWith('{')) {
          throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON must be the FULL JSON content from your service account key file, not just the email address.');
        }
        authOptions.credentials = JSON.parse(jsonString);
      } catch (parseError: any) {
        console.error('GOOGLE_SERVICE_ACCOUNT_JSON Error:', parseError.message);
        return res.status(500).json({ 
          error: 'Invalid Google Service Account configuration',
          details: parseError.message
        });
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
    if (!serviceAccountJson) {
      return res.status(500).json({ error: 'Google Service Account JSON not configured' });
    }

    try {
      const authOptions: any = {
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      };

      try {
        let jsonString = serviceAccountJson.trim();
        if (!jsonString.startsWith('{')) {
          try {
            jsonString = Buffer.from(jsonString, 'base64').toString('utf-8');
          } catch (e) {}
        }
        if (!jsonString.startsWith('{')) {
          throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON must be the FULL JSON content from your service account key file.');
        }
        authOptions.credentials = JSON.parse(jsonString);
      } catch (parseError: any) {
        console.error('GOOGLE_SERVICE_ACCOUNT_JSON Error in /api/jobs:', parseError.message);
        return res.status(500).json({ error: 'Invalid Google Service Account JSON configuration', details: parseError.message });
      }

      const auth = new GoogleAuth(authOptions);
      const sheets = google.sheets({ version: 'v4', auth });
      
      let sheetName = 'Jobs';
      try {
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
        if (spreadsheet.data.sheets && spreadsheet.data.sheets.length > 0) {
          // Check if 'Jobs' exists, otherwise use the first sheet
          const hasJobsSheet = spreadsheet.data.sheets.some(s => s.properties?.title === 'Jobs');
          if (!hasJobsSheet) {
            sheetName = spreadsheet.data.sheets[0].properties?.title || 'Sheet1';
          }
        }
      } catch (e) {
        console.warn('Could not fetch spreadsheet info, defaulting to Jobs sheet', e);
      }

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A2:Z`,
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
        type: row[3] || '', // Col D
        salary: row[3] || '', // Col D
        workingDay: row[4] || '', // Col E
        workingHours: row[5] || '', // Col F
        description: row[6] || '', // Col G
        clientRequirements: row[6] || '', // Col G
        createdAt: row[7] || new Date().toISOString(), // Col H
        commissionRange: row[8] || '', // Col I
        partnerInCharge: row[9] || '', // Col J
        contactDetails: row[10] || '', // Col K
      }));

      res.json(jobs);
    } catch (error: any) {
      console.error('Fetch Jobs Error:', error);
      res.status(500).json({ error: 'Failed to fetch jobs from Google Sheets', details: error.message });
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
    if (!serviceAccountJson) {
      return res.status(500).json({ error: 'Google Service Account JSON not configured' });
    }

    try {
      const authOptions: any = {
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      };

      try {
        let jsonString = serviceAccountJson.trim();
        if (!jsonString.startsWith('{')) {
          try {
            jsonString = Buffer.from(jsonString, 'base64').toString('utf-8');
          } catch (e) {}
        }
        if (!jsonString.startsWith('{')) {
          throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON must be the FULL JSON content from your service account key file.');
        }
        authOptions.credentials = JSON.parse(jsonString);
      } catch (parseError: any) {
        console.error('GOOGLE_SERVICE_ACCOUNT_JSON Error in /api/post-job:', parseError.message);
        return res.status(500).json({ error: 'Invalid Google Service Account JSON configuration', details: parseError.message });
      }

      const auth = new GoogleAuth(authOptions);
      const sheets = google.sheets({ version: 'v4', auth });
      
      let sheetName = 'Jobs';
      try {
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
        if (spreadsheet.data.sheets && spreadsheet.data.sheets.length > 0) {
          // Check if 'Jobs' exists, otherwise use the first sheet
          const hasJobsSheet = spreadsheet.data.sheets.some(s => s.properties?.title === 'Jobs');
          if (!hasJobsSheet) {
            sheetName = spreadsheet.data.sheets[0].properties?.title || 'Sheet1';
          }
        }
      } catch (e) {
        console.warn('Could not fetch spreadsheet info, defaulting to Jobs sheet', e);
      }

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
        range: `${sheetName}!A:Z`,
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

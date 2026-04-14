import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Settings, Users, Database, Activity,
  Lock, Eye, Loader2, CheckCircle, Search, Inbox, Mail, Building2,
  MessageSquare, Calendar, ExternalLink, Upload, FileText, X, AlertCircle
} from 'lucide-react';
import { db, collection, onSnapshot, query, orderBy, updateDoc, doc, writeBatch, OperationType, handleFirestoreError } from '@/src/lib/firebase';
import { UserRole, Job } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

interface Inquiry {
  id: string;
  fullName: string;
  email: string;
  company: string;
  industry: string;
  message: string;
  createdAt: string;
}

// CSV column → Firestore field mapping
const CSV_COLUMN_MAP: Record<string, string> = {
  'Job Title': 'title',
  'Company Background': 'company',
  'Location': 'location',
  'Salary Range': 'salaryRange',
  'Working Day': 'workingDays',
  'Working Hours': 'workingHours',
  'Requirement/Skill Set': 'requirements',
  'Benefit / Allowance': 'benefits',
  'Commission Range': 'commissionRange',
};

// Robust CSV line parser (handles quoted fields with commas inside)
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { field += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      fields.push(field.trim());
      field = '';
    } else {
      field += ch;
    }
  }
  fields.push(field.trim());
  return fields;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h.trim()] = values[i] ?? ''; });
    return row;
  });
}

type ImportStatus = 'idle' | 'previewing' | 'importing' | 'done';

export default function AdminControlCenter() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [activeView, setActiveView] = useState<'overview' | 'users' | 'jobs' | 'inquiries' | 'import'>('overview');

  const [postingJob, setPostingJob] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '', company: '', location: '', type: 'Full-time', salary: '',
    description: '', partnerInCharge: '', commissionRange: '', clientRequirements: '', contactDetails: '',
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(true);

  // CSV import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importRows, setImportRows] = useState<Record<string, string>[]>([]);
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; skipped: number; errors: number } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const response = await fetch('/api/jobs');
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        if (response.ok) {
          const jobsData = await response.json() as Job[];
          setJobs(jobsData);
          setJobsError(null);
        } else {
          const errorData = await response.json().catch(() => null);
          const errorMessage = errorData?.details ? `${errorData.error}: ${errorData.details}` : (errorData?.error || 'Failed to fetch jobs');
          throw new Error(errorMessage);
        }
      } else {
        throw new Error('Received non-JSON response from server. The server might be down or misconfigured.');
      }
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      setJobsError(err.message);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (activeView === 'jobs') fetchJobs();
  }, [activeView]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ ...d.data() })) as UserProfile[]);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInquiries(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Inquiry[]);
      setLoadingInquiries(false);
    }, (error) => {
      console.error('Firestore Admin Fetch Error (Inquiries):', error);
      setLoadingInquiries(false);
    });
    return () => unsubscribe();
  }, []);

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      alert(`User role updated to ${newRole}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostingJob(true);
    try {
      const response = await fetch('/api/post-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob),
      });
      if (response.ok) {
        alert('Job Order posted successfully to Google Sheets!');
        setNewJob({ title: '', company: '', location: '', type: 'Full-time', salary: '', description: '', partnerInCharge: '', commissionRange: '', clientRequirements: '', contactDetails: '' });
        fetchJobs();
      } else {
        throw new Error('Failed to post job');
      }
    } catch (error) {
      console.error('Error posting job:', error);
      alert('Failed to post job order. Please check Google Sheets configuration.');
    } finally {
      setPostingJob(false);
    }
  };

  // ── CSV import handlers ─────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportError(null);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const rows = parseCSV(text);
        if (rows.length === 0) {
          setImportError('No valid rows found. Make sure the CSV has a header row and data rows.');
          setImportStatus('idle');
          return;
        }
        setImportRows(rows);
        setImportStatus('previewing');
      } catch {
        setImportError('Failed to parse CSV file. Please check the format and try again.');
        setImportStatus('idle');
      }
    };
    reader.readAsText(file);
  };

  const resetImport = () => {
    setImportFile(null);
    setImportRows([]);
    setImportStatus('idle');
    setImportProgress(0);
    setImportResult(null);
    setImportError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportJobs = async () => {
    const now = new Date().toISOString();
    const validJobs = importRows
      .map(row => {
        const job: Record<string, string> = {};
        Object.entries(CSV_COLUMN_MAP).forEach(([csvCol, field]) => {
          const val = (row[csvCol] ?? '').trim();
          if (val) job[field] = val;
        });
        return job;
      })
      .filter(job => !!job.title); // skip rows with no Job Title

    const skippedCount = importRows.length - validJobs.length;

    if (validJobs.length === 0) {
      setImportError('No rows with a non-empty "Job Title" column were found.');
      return;
    }

    setImportStatus('importing');
    setImportProgress(0);

    const BATCH_SIZE = 500;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < validJobs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = validJobs.slice(i, i + BATCH_SIZE);
      chunk.forEach(jobData => {
        const docRef = doc(collection(db, 'jobs'));
        batch.set(docRef, { ...jobData, status: 'active', createdAt: now, updatedAt: now });
      });
      try {
        await batch.commit();
        successCount += chunk.length;
      } catch (err) {
        console.error('Batch write error:', err);
        errorCount += chunk.length;
      }
      setImportProgress(Math.round(((i + chunk.length) / validJobs.length) * 100));
    }

    setImportResult({ success: successCount, skipped: skippedCount, errors: errorCount });
    setImportStatus('done');
  };

  // ───────────────────────────────────────────────────────────────────────────

  const filteredUsers = users.filter(u =>
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const validPreviewJobs = importRows.filter(r => (r['Job Title'] ?? '').trim() !== '');
  const skippedPreviewCount = importRows.length - validPreviewJobs.length;

  return (
    <div className="pt-16 min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center space-x-4">
            <div className="bg-orange-500 p-3 rounded-2xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Control Center</h1>
              <p className="text-slate-400">System-wide management and security overview.</p>
            </div>
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button onClick={() => setActiveView('overview')} className={cn("px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap", activeView === 'overview' ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}>Overview</button>
            <button onClick={() => setActiveView('users')} className={cn("px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap", activeView === 'users' ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}>User Management</button>
            <button onClick={() => setActiveView('jobs')} className={cn("px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap", activeView === 'jobs' ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}>Job Orders</button>
            <button onClick={() => setActiveView('inquiries')} className={cn("px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap relative", activeView === 'inquiries' ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}>
              Client Inquiries
              {inquiries.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </button>
            <button onClick={() => setActiveView('import')} className={cn("px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap", activeView === 'import' ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}>
              Import Jobs
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Overview ─────────────────────────────────────────────────────── */}
          {activeView === 'overview' ? (
            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { label: 'Total Users', value: users.length.toString(), icon: Users, trend: '+5.2%' },
                  { label: 'Active Sessions', value: '842', icon: Activity, trend: '+1.4%' },
                  { label: 'Pending Inquiries', value: inquiries.length.toString(), icon: Inbox, trend: 'Action Needed' },
                  { label: 'Security Alerts', value: '0', icon: Lock, trend: 'None' },
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-800 p-6 rounded-3xl border border-slate-700 hover:border-orange-500/50 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-slate-700 p-3 rounded-xl group-hover:bg-orange-500/20 group-hover:text-orange-500 transition-all">
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <span className={cn("text-xs font-bold", stat.trend === 'Action Needed' ? 'text-orange-400' : 'text-green-500')}>{stat.trend}</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-slate-400">{stat.label}</div>
                  </div>
                ))}
                <div className="sm:col-span-2 bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden">
                  <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                    <h3 className="font-bold flex items-center"><Activity className="w-5 h-5 mr-2 text-orange-500" />System Activity Logs</h3>
                    <button className="text-xs text-orange-500 hover:underline">View All</button>
                  </div>
                  <div className="p-6 space-y-4">
                    {[
                      { time: '10:42:01', event: 'New Employer Registration', user: 'DesignCo Inc.', status: 'Success' },
                      { time: '10:38:15', event: 'Database Backup Completed', user: 'System', status: 'Success' },
                      { time: '10:35:42', event: 'Failed Login Attempt', user: 'Unknown IP', status: 'Warning' },
                    ].map((log, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-slate-700 last:border-0">
                        <div className="flex items-center space-x-4">
                          <span className="text-slate-500 font-mono">{log.time}</span>
                          <span className="font-medium">{log.event}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-slate-400">{log.user}</span>
                          <span className={log.status === 'Success' ? 'text-green-500' : 'text-orange-500'}>{log.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
                  <h3 className="font-bold mb-6 flex items-center"><Settings className="w-5 h-5 mr-2 text-slate-400" />Quick Actions</h3>
                  <div className="space-y-3">
                    <button onClick={() => setActiveView('jobs')} className="w-full bg-orange-500 hover:bg-orange-600 py-3 rounded-xl text-sm font-bold transition-all flex items-center px-4">
                      <Database className="w-4 h-4 mr-3" />+ Post Job Order
                    </button>
                    <button onClick={() => setActiveView('import')} className="w-full bg-slate-700 hover:bg-slate-600 py-3 rounded-xl text-sm font-medium transition-all flex items-center px-4">
                      <Upload className="w-4 h-4 mr-3" />Import Jobs from CSV
                    </button>
                    <button onClick={() => setActiveView('users')} className="w-full bg-slate-700 hover:bg-slate-600 py-3 rounded-xl text-sm font-medium transition-all flex items-center px-4">
                      <Users className="w-4 h-4 mr-3" />Manage User Roles
                    </button>
                    <button onClick={() => setActiveView('inquiries')} className="w-full bg-slate-700 hover:bg-slate-600 py-3 rounded-xl text-sm font-medium transition-all flex items-center px-4">
                      <Inbox className="w-4 h-4 mr-3" />View Client Inquiries
                    </button>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-3xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <Eye className="w-6 h-6 text-white" />
                    <h3 className="font-bold">Live Traffic</h3>
                  </div>
                  <div className="h-32 flex items-end space-x-1">
                    {[40, 70, 45, 90, 65, 80, 50, 85, 60, 95, 75, 85].map((h, i) => (
                      <div key={i} className="flex-1 bg-white/20 rounded-t-sm" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-orange-100">Traffic is up 12% compared to last hour.</p>
                </div>
              </div>
            </motion.div>

          /* ── User Management ────────────────────────────────────────────────── */
          ) : activeView === 'users' ? (
            <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden">
              <div className="p-8 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">User Management</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 outline-none focus:border-orange-500 transition-all w-full md:w-80" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-900/50 text-slate-500 text-xs uppercase tracking-widest">
                      <th className="px-8 py-4 font-semibold">User</th>
                      <th className="px-8 py-4 font-semibold">Email</th>
                      <th className="px-8 py-4 font-semibold">Current Role</th>
                      <th className="px-8 py-4 font-semibold">Change Role</th>
                      <th className="px-8 py-4 font-semibold">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {loading ? (
                      <tr><td colSpan={5} className="px-8 py-12 text-center"><Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" /></td></tr>
                    ) : filteredUsers.map((u) => (
                      <tr key={u.uid} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-8 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-orange-500">{u.displayName.charAt(0).toUpperCase()}</div>
                            <span className="font-medium">{u.displayName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-slate-400">{u.email}</td>
                        <td className="px-8 py-4">
                          <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", u.role === 'admin' ? "bg-red-500/20 text-red-400" : u.role === 'partner' ? "bg-purple-500/20 text-purple-400" : u.role === 'recruiter' ? "bg-blue-500/20 text-blue-400" : "bg-slate-500/20 text-slate-400")}>{u.role}</span>
                        </td>
                        <td className="px-8 py-4">
                          <select value={u.role} onChange={(e) => updateUserRole(u.uid, e.target.value as UserRole)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-sm outline-none focus:border-orange-500">
                            <option value="candidate">Candidate</option>
                            <option value="recruiter">Recruiter</option>
                            <option value="partner">Partner</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-8 py-4 text-slate-500 text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

          /* ── Client Inquiries ───────────────────────────────────────────────── */
          ) : activeView === 'inquiries' ? (
            <motion.div key="inquiries" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden">
              <div className="p-8 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-3">Client Inquiries<span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">{inquiries.length} New</span></h2>
                  <p className="text-slate-400 mt-1">Real-time leads from the Contact form.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-900/50 text-slate-500 text-xs uppercase tracking-widest">
                      <th className="px-8 py-4 font-semibold">Contact / Company</th>
                      <th className="px-8 py-4 font-semibold">Industry</th>
                      <th className="px-8 py-4 font-semibold">Message</th>
                      <th className="px-8 py-4 font-semibold">Received</th>
                      <th className="px-8 py-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {loadingInquiries ? (
                      <tr><td colSpan={5} className="px-8 py-12 text-center"><Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" /></td></tr>
                    ) : inquiries.length > 0 ? inquiries.map((inquiry) => (
                      <tr key={inquiry.id} className="hover:bg-slate-700/30 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-orange-500">{inquiry.fullName?.charAt(0) || '?'}</div>
                            <div>
                              <p className="font-bold text-white">{inquiry.fullName}</p>
                              <p className="text-xs text-slate-400 flex items-center"><Mail className="w-3 h-3 mr-1" />{inquiry.email}</p>
                              <p className="text-xs text-orange-400 font-medium flex items-center mt-0.5"><Building2 className="w-3 h-3 mr-1" />{inquiry.company}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5"><span className="px-2 py-1 bg-slate-700 text-slate-300 text-[10px] font-bold rounded-md uppercase border border-slate-600">{inquiry.industry || 'N/A'}</span></td>
                        <td className="px-8 py-5">
                          <div className="flex items-start space-x-2 max-w-xs">
                            <MessageSquare className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
                            <p className="text-sm text-slate-300 line-clamp-2 italic">"{inquiry.message}"</p>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-slate-400 text-sm">
                          <span className="flex items-center"><Calendar className="w-4 h-4 mr-2" />{inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleDateString() : 'Just now'}</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 hover:text-orange-500 transition-all" title="View Full Details"><ExternalLink className="w-5 h-5" /></button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="px-8 py-16 text-center">
                        <Inbox className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-400">No inquiries yet</h3>
                        <p className="text-sm text-slate-500 mt-1">Incoming contact form submissions will appear here.</p>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>

          /* ── Import Jobs ─────────────────────────────────────────────────────── */
          ) : activeView === 'import' ? (
            <motion.div key="import" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">

              {/* Header */}
              <div className="bg-slate-800 rounded-3xl border border-slate-700 p-8">
                <div className="flex items-center space-x-4">
                  <div className="bg-orange-500 p-3 rounded-xl"><Upload className="w-6 h-6 text-white" /></div>
                  <div>
                    <h2 className="text-2xl font-bold">Import Jobs from CSV</h2>
                    <p className="text-slate-400">Export your job orders from Google Sheets as CSV, then upload here.</p>
                  </div>
                </div>
              </div>

              {/* Upload / Preview / Progress / Result card */}
              <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden">

                {/* ── Idle: file upload zone ── */}
                {importStatus === 'idle' && (
                  <div className="p-8">
                    {importError && (
                      <div className="flex items-center space-x-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 mb-6">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <p className="text-sm text-red-300">{importError}</p>
                      </div>
                    )}
                    <label className="group flex flex-col items-center justify-center border-2 border-dashed border-slate-600 hover:border-orange-500 rounded-2xl p-16 cursor-pointer transition-all">
                      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                      <div className="bg-slate-700 group-hover:bg-orange-500/20 p-5 rounded-2xl mb-4 transition-all">
                        <Upload className="w-10 h-10 text-slate-400 group-hover:text-orange-400 transition-colors" />
                      </div>
                      <p className="text-xl font-bold text-slate-200 group-hover:text-white transition-colors">Click to upload a CSV file</p>
                      <p className="text-sm text-slate-500 mt-2">Exported from Google Sheets or Excel · .csv only</p>
                    </label>
                  </div>
                )}

                {/* ── Previewing: show parsed summary + first rows ── */}
                {importStatus === 'previewing' && (
                  <div className="p-8">
                    {/* File info bar */}
                    <div className="flex items-center justify-between mb-6 bg-slate-700/50 rounded-2xl px-5 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-slate-700 p-2 rounded-lg"><FileText className="w-5 h-5 text-orange-400" /></div>
                        <div>
                          <p className="font-bold text-white">{importFile?.name}</p>
                          <p className="text-sm text-slate-400">{importRows.length} total rows found</p>
                        </div>
                      </div>
                      <button onClick={resetImport} className="p-2 hover:bg-slate-600 rounded-lg transition-colors text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>

                    {/* Valid / skipped summary */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-bold text-green-400">{validPreviewJobs.length}</p>
                        <p className="text-sm text-slate-400 mt-1">Valid rows (will import)</p>
                      </div>
                      <div className="bg-slate-700/50 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-bold text-slate-400">{skippedPreviewCount}</p>
                        <p className="text-sm text-slate-400 mt-1">Skipped (empty Job Title)</p>
                      </div>
                    </div>

                    {/* Preview table — first 5 valid rows */}
                    {validPreviewJobs.length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Preview (first {Math.min(5, validPreviewJobs.length)} rows)</p>
                        <div className="overflow-x-auto rounded-xl border border-slate-700">
                          <table className="w-full text-sm text-left">
                            <thead>
                              <tr className="bg-slate-900/60 text-slate-500 text-xs uppercase tracking-widest">
                                <th className="px-4 py-3 font-semibold">Job Title</th>
                                <th className="px-4 py-3 font-semibold">Company</th>
                                <th className="px-4 py-3 font-semibold">Location</th>
                                <th className="px-4 py-3 font-semibold">Salary Range</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                              {validPreviewJobs.slice(0, 5).map((row, i) => (
                                <tr key={i} className="hover:bg-slate-700/30">
                                  <td className="px-4 py-3 font-medium text-white">{row['Job Title'] || '—'}</td>
                                  <td className="px-4 py-3 text-slate-400">{row['Company Background'] || '—'}</td>
                                  <td className="px-4 py-3 text-slate-400">{row['Location'] || '—'}</td>
                                  <td className="px-4 py-3 text-slate-400">{row['Salary Range'] || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {validPreviewJobs.length > 5 && (
                          <p className="text-xs text-slate-500 mt-2 text-center">…and {validPreviewJobs.length - 5} more rows</p>
                        )}
                      </div>
                    )}

                    <button
                      onClick={handleImportJobs}
                      disabled={validPreviewJobs.length === 0}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center space-x-2"
                    >
                      <Database className="w-5 h-5" />
                      <span>Import {validPreviewJobs.length} Jobs to Firestore</span>
                    </button>
                  </div>
                )}

                {/* ── Importing: progress bar ── */}
                {importStatus === 'importing' && (
                  <div className="p-12 text-center">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-6" />
                    <p className="text-xl font-bold mb-2">Importing jobs…</p>
                    <p className="text-slate-400 text-sm mb-8">Writing in batches of 500. Please don't close this page.</p>
                    <div className="bg-slate-700 rounded-full h-3 overflow-hidden max-w-md mx-auto">
                      <div
                        className="bg-orange-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                    <p className="text-slate-400 text-sm mt-3">{importProgress}% complete</p>
                  </div>
                )}

                {/* ── Done: result summary ── */}
                {importStatus === 'done' && importResult && (
                  <div className="p-8">
                    <div className="flex items-center space-x-3 mb-8">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                      <h3 className="text-2xl font-bold">Import Complete</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
                        <p className="text-4xl font-bold text-green-400">{importResult.success}</p>
                        <p className="text-sm text-slate-400 mt-2">Imported</p>
                      </div>
                      <div className="bg-slate-700/50 rounded-2xl p-6 text-center">
                        <p className="text-4xl font-bold text-slate-300">{importResult.skipped}</p>
                        <p className="text-sm text-slate-400 mt-2">Skipped</p>
                      </div>
                      <div className={cn("rounded-2xl p-6 text-center", importResult.errors > 0 ? "bg-red-500/10 border border-red-500/30" : "bg-slate-700/50")}>
                        <p className={cn("text-4xl font-bold", importResult.errors > 0 ? "text-red-400" : "text-slate-300")}>{importResult.errors}</p>
                        <p className="text-sm text-slate-400 mt-2">Errors</p>
                      </div>
                    </div>
                    {importResult.errors > 0 && (
                      <div className="flex items-start space-x-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 text-sm text-red-300">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{importResult.errors} row(s) failed to write. Check your Firestore permissions and try again.</span>
                      </div>
                    )}
                    <button onClick={resetImport} className="w-full bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-medium transition-all">
                      Import Another File
                    </button>
                  </div>
                )}
              </div>

              {/* Column mapping reference */}
              <div className="bg-slate-800 rounded-3xl border border-slate-700 p-8">
                <h3 className="font-bold text-slate-300 mb-4">Expected CSV Column Names</h3>
                <p className="text-sm text-slate-500 mb-5">Your CSV header row must contain these exact column names (extra columns are ignored):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(CSV_COLUMN_MAP).map(([csvCol, field]) => (
                    <div key={csvCol} className="bg-slate-700/60 rounded-xl px-4 py-3 flex items-center justify-between text-sm border border-slate-600">
                      <span className="font-mono text-slate-200">{csvCol}</span>
                      <span className="text-orange-400 text-xs ml-2 shrink-0">→ {field}</span>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>

          /* ── Job Orders ──────────────────────────────────────────────────────── */
          ) : (
            <motion.div key="jobs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden p-8">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="bg-orange-500 p-3 rounded-xl"><Database className="w-6 h-6 text-white" /></div>
                    <div>
                      <h2 className="text-2xl font-bold">Post New Job Order</h2>
                      <p className="text-slate-400">This will be synced directly to the master Google Sheet.</p>
                    </div>
                  </div>
                  <form onSubmit={handlePostJob} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Job Title</label>
                        <input required type="text" value={newJob.title} onChange={(e) => setNewJob({...newJob, title: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all" placeholder="e.g. Senior Creative Director"/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Company Name (Internal Only)</label>
                        <input required type="text" value={newJob.company} onChange={(e) => setNewJob({...newJob, company: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all" placeholder="e.g. Acme Corp"/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Location</label>
                        <input required type="text" value={newJob.location} onChange={(e) => setNewJob({...newJob, location: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all" placeholder="e.g. Singapore"/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Job Type</label>
                        <select value={newJob.type} onChange={(e) => setNewJob({...newJob, type: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all">
                          <option>Full-time</option><option>Contract</option><option>Freelance</option><option>Part-time</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Salary Range</label>
                        <input type="text" value={newJob.salary} onChange={(e) => setNewJob({...newJob, salary: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all" placeholder="e.g. $8,000 - $12,000"/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Partner In Charge</label>
                        <input type="text" value={newJob.partnerInCharge} onChange={(e) => setNewJob({...newJob, partnerInCharge: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all" placeholder="e.g. John Doe"/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Commission Range</label>
                        <input type="text" value={newJob.commissionRange} onChange={(e) => setNewJob({...newJob, commissionRange: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all" placeholder="e.g. 15% - 20%"/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Contact Details (Sensitive)</label>
                        <input type="text" value={newJob.contactDetails} onChange={(e) => setNewJob({...newJob, contactDetails: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all" placeholder="e.g. hiring@acme.com"/>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-400">Public Job Description (TAFEP Compliant)</label>
                      <textarea required rows={4} value={newJob.description} onChange={(e) => setNewJob({...newJob, description: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all resize-none" placeholder="Describe the role responsibilities and requirements..."/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-400">Internal Client Requirements (Sensitive)</label>
                      <textarea rows={3} value={newJob.clientRequirements} onChange={(e) => setNewJob({...newJob, clientRequirements: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all resize-none" placeholder="Specific client needs, culture fit, etc..."/>
                    </div>
                    <div className="pt-4">
                      <button type="submit" disabled={postingJob} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center disabled:opacity-50">
                        {postingJob ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Database className="w-5 h-5 mr-2" />}
                        Post Job Order to Google Sheets
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden">
                <div className="p-8 border-b border-slate-700 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Current Job Orders</h2>
                    <p className="text-slate-400">Fetched directly from the master Google Sheet.</p>
                  </div>
                  <button onClick={fetchJobs} disabled={loadingJobs} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-400 transition-all">
                    {loadingJobs ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-900/50 text-slate-500 text-xs uppercase tracking-widest">
                        <th className="px-8 py-4 font-semibold">Job Title</th>
                        <th className="px-8 py-4 font-semibold">Company</th>
                        <th className="px-8 py-4 font-semibold">Partner</th>
                        <th className="px-8 py-4 font-semibold">Commission</th>
                        <th className="px-8 py-4 font-semibold">Created At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {loadingJobs ? (
                        <tr><td colSpan={5} className="px-8 py-12 text-center"><Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" /></td></tr>
                      ) : jobs.length > 0 ? jobs.map((job) => (
                        <tr key={job.id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="px-8 py-4 font-medium">{job.title}</td>
                          <td className="px-8 py-4 text-slate-400">{job.company}</td>
                          <td className="px-8 py-4 text-slate-400">{job.partnerInCharge || 'N/A'}</td>
                          <td className="px-8 py-4 text-orange-500 font-bold">{job.commissionRange || 'N/A'}</td>
                          <td className="px-8 py-4 text-slate-500 text-sm">{new Date(job.createdAt).toLocaleDateString()}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-500">No job orders found in Google Sheets.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Settings, Users, Database, AlertTriangle, Activity, Lock, Eye, Loader2, CheckCircle, Search } from 'lucide-react';
import { db, collection, onSnapshot, query, orderBy, updateDoc, doc, OperationType, handleFirestoreError } from '@/src/firebase';
import { UserRole, Job } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export default function AdminControlCenter() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'overview' | 'users' | 'jobs'>('overview');
  const [postingJob, setPostingJob] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: '',
    type: 'Full-time',
    salary: '',
    description: '',
    partnerInCharge: '',
    commissionRange: '',
    clientRequirements: '',
    contactDetails: '',
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const response = await fetch('/api/jobs');
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
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
    if (activeView === 'jobs') {
      fetchJobs();
    }
  }, [activeView]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        ...doc.data()
      })) as UserProfile[];
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
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
        setNewJob({
          title: '',
          company: '',
          location: '',
          type: 'Full-time',
          salary: '',
          description: '',
          partnerInCharge: '',
          commissionRange: '',
          clientRequirements: '',
          contactDetails: '',
        });
        fetchJobs(); // Refresh the list
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

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
            <button 
              onClick={() => setActiveView('overview')}
              className={cn(
                "px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap",
                activeView === 'overview' ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              )}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveView('users')}
              className={cn(
                "px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap",
                activeView === 'users' ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              )}
            >
              User Management
            </button>
            <button 
              onClick={() => setActiveView('jobs')}
              className={cn(
                "px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap",
                activeView === 'jobs' ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              )}
            >
              Job Orders
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeView === 'overview' ? (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {/* System Health */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { label: 'Total Users', value: users.length.toString(), icon: Users, trend: '+5.2%' },
                  { label: 'Active Sessions', value: '842', icon: Activity, trend: '+1.4%' },
                  { label: 'DB Load', value: '24%', icon: Database, trend: 'Stable' },
                  { label: 'Security Alerts', value: '0', icon: Lock, trend: 'None' },
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-800 p-6 rounded-3xl border border-slate-700 hover:border-orange-500/50 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-slate-700 p-3 rounded-xl group-hover:bg-orange-500/20 group-hover:text-orange-500 transition-all">
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-green-500">{stat.trend}</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-slate-400">{stat.label}</div>
                  </div>
                ))}

                {/* Recent Logs */}
                <div className="sm:col-span-2 bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden">
                  <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                    <h3 className="font-bold flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-orange-500" />
                      System Activity Logs
                    </h3>
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

              {/* Sidebar Actions */}
              <div className="space-y-6">
                <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
                  <h3 className="font-bold mb-6 flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-slate-400" />
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => setActiveView('jobs')}
                      className="w-full bg-orange-500 hover:bg-orange-600 py-3 rounded-xl text-sm font-bold transition-all flex items-center px-4"
                    >
                      <Database className="w-4 h-4 mr-3" />
                      + Post Job Order
                    </button>
                    <button 
                      onClick={() => setActiveView('users')}
                      className="w-full bg-slate-700 hover:bg-slate-600 py-3 rounded-xl text-sm font-medium transition-all flex items-center px-4"
                    >
                      <Users className="w-4 h-4 mr-3" />
                      Manage User Roles
                    </button>
                    <button className="w-full bg-slate-700 hover:bg-slate-600 py-3 rounded-xl text-sm font-medium transition-all flex items-center px-4">
                      <Lock className="w-4 h-4 mr-3" />
                      Security Audit
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
                  <p className="mt-4 text-sm text-orange-100">
                    Traffic is up 12% compared to last hour.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : activeView === 'users' ? (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden"
            >
              <div className="p-8 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">User Management</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 outline-none focus:border-orange-500 transition-all w-full md:w-80"
                  />
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
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center">
                          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : filteredUsers.map((u) => (
                      <tr key={u.uid} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-8 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-orange-500">
                              {u.displayName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{u.displayName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-slate-400">{u.email}</td>
                        <td className="px-8 py-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            u.role === 'admin' ? "bg-red-500/20 text-red-400" :
                            u.role === 'partner' ? "bg-purple-500/20 text-purple-400" :
                            u.role === 'recruiter' ? "bg-blue-500/20 text-blue-400" : "bg-slate-500/20 text-slate-400"
                          )}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          <select 
                            value={u.role}
                            onChange={(e) => updateUserRole(u.uid, e.target.value as UserRole)}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-sm outline-none focus:border-orange-500"
                          >
                            <option value="candidate">Candidate</option>
                            <option value="recruiter">Recruiter</option>
                            <option value="partner">Partner</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-8 py-4 text-slate-500 text-sm">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="jobs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Post Job Form */}
              <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden p-8">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="bg-orange-500 p-3 rounded-xl">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Post New Job Order</h2>
                      <p className="text-slate-400">This will be synced directly to the master Google Sheet.</p>
                    </div>
                  </div>

                  <form onSubmit={handlePostJob} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Job Title</label>
                        <input 
                          required
                          type="text" 
                          value={newJob.title}
                          onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all"
                          placeholder="e.g. Senior Creative Director"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Company Name (Internal Only)</label>
                        <input 
                          required
                          type="text" 
                          value={newJob.company}
                          onChange={(e) => setNewJob({...newJob, company: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all"
                          placeholder="e.g. Acme Corp"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Location</label>
                        <input 
                          required
                          type="text" 
                          value={newJob.location}
                          onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all"
                          placeholder="e.g. Singapore"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Job Type</label>
                        <select 
                          value={newJob.type}
                          onChange={(e) => setNewJob({...newJob, type: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all"
                        >
                          <option>Full-time</option>
                          <option>Contract</option>
                          <option>Freelance</option>
                          <option>Part-time</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Salary Range</label>
                        <input 
                          type="text" 
                          value={newJob.salary}
                          onChange={(e) => setNewJob({...newJob, salary: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all"
                          placeholder="e.g. $8,000 - $12,000"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Partner In Charge</label>
                        <input 
                          type="text" 
                          value={newJob.partnerInCharge}
                          onChange={(e) => setNewJob({...newJob, partnerInCharge: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all"
                          placeholder="e.g. John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Commission Range</label>
                        <input 
                          type="text" 
                          value={newJob.commissionRange}
                          onChange={(e) => setNewJob({...newJob, commissionRange: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all"
                          placeholder="e.g. 15% - 20%"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Contact Details (Sensitive)</label>
                        <input 
                          type="text" 
                          value={newJob.contactDetails}
                          onChange={(e) => setNewJob({...newJob, contactDetails: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all"
                          placeholder="e.g. hiring@acme.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-400">Public Job Description (TAFEP Compliant)</label>
                      <textarea 
                        required
                        rows={4}
                        value={newJob.description}
                        onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all resize-none"
                        placeholder="Describe the role responsibilities and requirements..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-400">Internal Client Requirements (Sensitive)</label>
                      <textarea 
                        rows={3}
                        value={newJob.clientRequirements}
                        onChange={(e) => setNewJob({...newJob, clientRequirements: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all resize-none"
                        placeholder="Specific client needs, culture fit, etc..."
                      />
                    </div>

                    <div className="pt-4">
                      <button 
                        type="submit"
                        disabled={postingJob}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center disabled:opacity-50"
                      >
                        {postingJob ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Database className="w-5 h-5 mr-2" />}
                        Post Job Order to Google Sheets
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Job List from Google Sheets */}
              <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden">
                <div className="p-8 border-b border-slate-700 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Current Job Orders</h2>
                    <p className="text-slate-400">Fetched directly from the master Google Sheet.</p>
                  </div>
                  <button 
                    onClick={fetchJobs}
                    disabled={loadingJobs}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-400 transition-all"
                  >
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
                        <tr>
                          <td colSpan={5} className="px-8 py-12 text-center">
                            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
                          </td>
                        </tr>
                      ) : jobs.length > 0 ? (
                        jobs.map((job) => (
                          <tr key={job.id} className="hover:bg-slate-700/30 transition-colors">
                            <td className="px-8 py-4 font-medium">{job.title}</td>
                            <td className="px-8 py-4 text-slate-400">{job.company}</td>
                            <td className="px-8 py-4 text-slate-400">{job.partnerInCharge || 'N/A'}</td>
                            <td className="px-8 py-4 text-orange-500 font-bold">{job.commissionRange || 'N/A'}</td>
                            <td className="px-8 py-4 text-slate-500 text-sm">
                              {new Date(job.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-8 py-12 text-center text-slate-500">
                            No job orders found in Google Sheets.
                          </td>
                        </tr>
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

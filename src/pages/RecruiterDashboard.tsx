import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Clock, User, Info, ChevronRight,
  Plus, Loader2, Building2, DollarSign, Lock, Database, Users
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { db, collection, addDoc, OperationType, handleFirestoreError } from '@/src/lib/firebase';
import { useFirebase } from '@/src/lib/FirebaseContext';
import { Job } from '@/src/types';
import StaffToolsLauncher from '../components/StaffToolsLauncher';
import CandidateSearch from '../components/recruiter/CandidateSearch';

export default function RecruiterDashboard() {
  const [activeTab, setActiveTab] = useState<'secret-jobs' | 'find-candidates' | 'submit-candidate'>('find-candidates');
  const [secretJobs, setSecretJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useFirebase();

  const [secretSearchQuery, setSecretSearchQuery] = useState('');
  const [commissionFilter, setCommissionFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');

  const [candidateSubmission, setCandidateSubmission] = useState({
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    targetJobId: '',
    resumeUrl: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs');
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          if (response.ok) {
            const jobsData = await response.json() as Job[];
            setSecretJobs(jobsData);
            setError(null);
          } else {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || 'Failed to fetch jobs');
          }
        } else {
          throw new Error('Received non-JSON response from server.');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [user]);

  const handleSubmitCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const submissionData = {
        ...candidateSubmission,
        submittedBy: user.uid,
        submittedAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'candidate-submissions'), submissionData);
      try {
        await fetch('/api/sync-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sheetName: 'CandidateSubmissions',
            data: [
              submissionData.submittedAt,
              submissionData.candidateName,
              submissionData.candidateEmail,
              submissionData.candidatePhone,
              submissionData.targetJobId,
              submissionData.notes,
              user.email
            ]
          }),
        });
      } catch (sheetError) {
        console.error('Failed to sync to Google Sheets:', sheetError);
      }
      setCandidateSubmission({ candidateName: '', candidateEmail: '', candidatePhone: '', targetJobId: '', resumeUrl: '', notes: '' });
      alert('Candidate submitted successfully!');
      setActiveTab('secret-jobs');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'candidate-submissions');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSecretJobs = secretJobs.filter(job => {
    const matchesSearch =
      job.title.toLowerCase().includes(secretSearchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(secretSearchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(secretSearchQuery.toLowerCase());
    const matchesCommission = !commissionFilter || (job.commissionRange || '').toLowerCase().includes(commissionFilter.toLowerCase());
    const matchesPartner = !partnerFilter || (job.partnerInCharge || '').toLowerCase().includes(partnerFilter.toLowerCase());
    return matchesSearch && matchesCommission && matchesPartner;
  });

  return (
    <div className="pt-16 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Recruiter Portal</h1>
            <p className="text-slate-500">Access the secret job board and submit potential candidates.</p>
          </div>
          <div className="flex bg-slate-200 p-1 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('find-candidates')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center",
                activeTab === 'find-candidates' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Users className="w-4 h-4 mr-1.5" />
              Find Candidates
            </button>
            <button
              onClick={() => setActiveTab('secret-jobs')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center",
                activeTab === 'secret-jobs' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Lock className="w-4 h-4 mr-1.5" />
              Secret Job Board
            </button>
            <button
              onClick={() => setActiveTab('submit-candidate')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center whitespace-nowrap",
                activeTab === 'submit-candidate' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Plus className="w-4 h-4 mr-1" />
              Submit Candidate
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === 'find-candidates' && (
                <motion.div
                  key="find-candidates"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <CandidateSearch />
                </motion.div>
              )}

              {activeTab === 'submit-candidate' && (
                <motion.div
                  key="submit-candidate"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm"
                >
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Submit Potential Candidate</h2>
                  <form onSubmit={handleSubmitCandidate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Candidate Name</label>
                        <input required type="text" value={candidateSubmission.candidateName}
                          onChange={(e) => setCandidateSubmission({...candidateSubmission, candidateName: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Full Name" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Candidate Email</label>
                        <input required type="email" value={candidateSubmission.candidateEmail}
                          onChange={(e) => setCandidateSubmission({...candidateSubmission, candidateEmail: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="email@example.com" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Phone Number</label>
                        <input required type="text" value={candidateSubmission.candidatePhone}
                          onChange={(e) => setCandidateSubmission({...candidateSubmission, candidatePhone: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="+60 12-345 6789" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Target Job (Optional)</label>
                        <select value={candidateSubmission.targetJobId}
                          onChange={(e) => setCandidateSubmission({...candidateSubmission, targetJobId: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                          <option value="">General Submission</option>
                          {secretJobs.map(job => (
                            <option key={job.id} value={job.id}>{job.title} ({job.company})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Resume/CV URL</label>
                      <input type="text" value={candidateSubmission.resumeUrl}
                        onChange={(e) => setCandidateSubmission({...candidateSubmission, resumeUrl: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Link to Google Drive / Dropbox / PDF" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Screening Notes</label>
                      <textarea rows={4} value={candidateSubmission.notes}
                        onChange={(e) => setCandidateSubmission({...candidateSubmission, notes: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                        placeholder="Salary expectations, notice period, key strengths..." />
                    </div>
                    <button type="submit" disabled={submitting}
                      className="w-full py-4 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center bg-orange-500 text-white hover:bg-orange-600">
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Candidate to Database'}
                    </button>
                  </form>
                </motion.div>
              )}

              {activeTab === 'secret-jobs' && (
                <motion.div
                  key="secret-jobs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Search & Filter */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-grow relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="text" placeholder="Search jobs..."
                          value={secretSearchQuery} onChange={(e) => setSecretSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" />
                      </div>
                      <div className="flex gap-4">
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input type="text" placeholder="Commission..." value={commissionFilter}
                            onChange={(e) => setCommissionFilter(e.target.value)}
                            className="pl-9 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500 w-40" />
                        </div>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input type="text" placeholder="Partner..." value={partnerFilter}
                            onChange={(e) => setPartnerFilter(e.target.value)}
                            className="pl-9 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500 w-40" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Job List */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-slate-900 flex items-center">
                        <Lock className="w-5 h-5 mr-2 text-orange-500" />
                        Internal Job Orders
                      </h2>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {filteredSecretJobs.length} Results
                      </span>
                    </div>
                    {loading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                      </div>
                    ) : error ? (
                      <div className="flex flex-col items-center justify-center py-12 bg-red-50 rounded-xl border border-red-100 text-center px-4">
                        <Info className="w-10 h-10 text-red-500 mb-3" />
                        <p className="text-red-700 text-sm max-w-md">{error}</p>
                      </div>
                    ) : filteredSecretJobs.length > 0 ? (
                      <div className="space-y-4">
                        {filteredSecretJobs.map((job) => (
                          <div key={job.id} className="p-6 rounded-2xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/10 transition-all">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-lg">{job.title}</h3>
                                <p className="text-sm text-slate-500 flex items-center">
                                  <Building2 className="w-4 h-4 mr-1.5" />
                                  {job.company} • {job.location}
                                </p>
                              </div>
                              <div className="flex flex-col items-end space-y-3">
                                <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                  {job.commissionRange || 'N/A'} Commission
                                </span>
                                <button
                                  onClick={() => { setCandidateSubmission(prev => ({ ...prev, targetJobId: job.id })); setActiveTab('submit-candidate'); }}
                                  className="px-3 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-all flex items-center">
                                  <Plus className="w-3 h-3 mr-1" />
                                  Submit Candidate
                                </button>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-start space-x-2">
                                <DollarSign className="w-4 h-4 text-slate-300 mt-0.5" />
                                <div>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Salary</p>
                                  <p className="text-xs text-slate-600 font-medium">{job.salary || 'Negotiable'}</p>
                                </div>
                              </div>
                              <div className="flex items-start space-x-2">
                                <Clock className="w-4 h-4 text-slate-300 mt-0.5" />
                                <div>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Working Hours</p>
                                  <p className="text-xs text-slate-600 font-medium">{job.workingDay || 'Standard'} {job.workingHours ? `• ${job.workingHours}` : ''}</p>
                                </div>
                              </div>
                              <div className="flex items-start space-x-2 md:col-span-2">
                                <Info className="w-4 h-4 text-slate-300 mt-0.5" />
                                <div>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Requirements</p>
                                  <p className="text-xs text-slate-600 whitespace-pre-wrap">{job.clientRequirements || job.description || 'No requirements provided'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400">No matching job orders found.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* ── Staff Tools Launcher ── */}
            <StaffToolsLauncher />

            {/* Recruiter Overview */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Recruiter Overview</h3>
              <div className="space-y-4">
                <div className="bg-slate-900 p-4 rounded-xl">
                  <div className="text-xs text-slate-400 font-bold uppercase mb-1">Secret Job Board</div>
                  <div className="text-2xl font-bold text-white">{secretJobs.length}</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <div className="text-xs text-orange-600 font-bold uppercase mb-1">Candidate Submissions</div>
                  <div className="text-2xl font-bold text-slate-900">Live Sync Active</div>
                </div>
              </div>
            </div>

            {/* Google Sheets Sync */}
            <div className="bg-slate-900 p-6 rounded-2xl text-white">
              <h3 className="font-bold mb-2 flex items-center">
                <Database className="w-4 h-4 mr-2 text-orange-500" />
                Google Sheets Sync
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                All submissions are automatically synced to your master Google Sheet.
              </p>
              <div className="flex items-center space-x-2 text-xs text-green-500 font-bold">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Syncing Enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

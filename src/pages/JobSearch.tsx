import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, MapPin, Briefcase, Clock, Bookmark, X, 
  ChevronRight, Share2, MoreHorizontal, Sparkles,
  Building2, DollarSign, Calendar, AlertCircle, Info,
  CheckCircle2, HelpCircle, Loader2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Job } from '@/src/types';
import { db, collection, onSnapshot, query, orderBy, addDoc, OperationType, handleFirestoreError } from '@/src/firebase';
import { useFirebase } from '@/src/lib/FirebaseContext';

export default function JobSearch() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [isDetailOpen, setIsDetailOpen] = useState(true);
  const [applying, setApplying] = useState(false);
  const { user, userProfile, signIn } = useFirebase();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs');
        if (response.ok) {
          const jobsData = await response.json() as Job[];
          setJobs(jobsData);
          if (jobsData.length > 0 && !selectedJob) {
            setSelectedJob(jobsData[0]);
          }
        } else {
          throw new Error('Failed to fetch jobs');
        }
      } catch (error) {
        console.error('Fetch Jobs Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleApply = async () => {
    if (!user) {
      signIn();
      return;
    }
    if (!selectedJob) return;

    setApplying(true);
    try {
      const applicationData = {
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        candidateUid: user.uid,
        candidateEmail: user.email,
        candidateName: userProfile?.displayName || user.displayName || 'Anonymous',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'applications'), applicationData);

      // Sync to Google Sheets
      try {
        await fetch('/api/sync-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sheetName: 'JobApplications',
            data: [
              applicationData.createdAt,
              applicationData.jobTitle,
              applicationData.candidateName,
              applicationData.candidateEmail,
              applicationData.status,
              applicationData.jobId
            ]
          }),
        });
      } catch (sheetError) {
        console.error('Failed to sync to Google Sheets:', sheetError);
      }

      alert('Application submitted successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'applications');
    } finally {
      setApplying(false);
    }
  };

  // Close detail on mobile
  const closeDetail = () => setIsDetailOpen(false);
  const openDetail = (job: Job) => {
    setSelectedJob(job);
    setIsDetailOpen(true);
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pt-16 min-h-screen bg-slate-50 flex flex-col">
      {/* Search Header - Theme Consistent */}
      <section className="bg-slate-900 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-5 space-y-2">
              <label className="text-white text-sm font-bold">What</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Describe what you're looking for (role, industry, skills...)"
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="md:col-span-5 space-y-2">
              <label className="text-white text-sm font-bold">Where</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Enter suburb, city, or region"
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <button className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center">
                <Search className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content - Split View */}
      <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading jobs...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full relative">
            
            {/* Left Column - Job List */}
            <div className={cn(
              "lg:col-span-5 space-y-4 overflow-y-auto max-h-[calc(100vh-250px)] pr-2 scrollbar-thin scrollbar-thumb-slate-200",
              selectedJob && isDetailOpen ? "hidden lg:block" : "block"
            )}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">
                  {searchQuery ? `Search results for "${searchQuery}"` : 'Recommended Jobs'}
                </h2>
              </div>
              
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <motion.div
                    key={job.id}
                    layoutId={job.id}
                    onClick={() => openDetail(job)}
                    className={cn(
                      "p-5 rounded-xl border-2 transition-all cursor-pointer bg-white relative group",
                      selectedJob?.id === job.id ? "border-orange-500 shadow-md" : "border-transparent hover:border-slate-200 shadow-sm"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-orange-500 transition-colors">{job.title}</h3>
                        <p className="text-slate-600 font-medium text-sm mb-2 italic">Confidential Client</p>
                        
                        <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs text-slate-500 mb-4">
                          <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {job.location}</span>
                          <span className="flex items-center"><Briefcase className="w-3 h-3 mr-1" /> {job.type}</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center overflow-hidden">
                        <Building2 className="w-6 h-6 text-slate-400" />
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs text-slate-400">
                        {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}
                      </span>
                      <div className="flex space-x-2">
                        <button className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400" onClick={(e) => e.stopPropagation()}><Bookmark className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                  <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-400">No jobs found</h3>
                  <p className="text-sm text-slate-400 mt-2">Try adjusting your search filters.</p>
                </div>
              )}
            </div>

            {/* Right Column - Job Details */}
            <div className={cn(
              "lg:col-span-7 sticky top-24 h-fit",
              selectedJob && isDetailOpen ? "block" : "hidden lg:block"
            )}>
              <AnimatePresence mode="wait">
                {selectedJob ? (
                  <motion.div
                    key={selectedJob.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-y-auto max-h-[calc(100vh-120px)] relative scrollbar-thin scrollbar-thumb-slate-200"
                  >
                    {/* Close button for mobile */}
                    <button 
                      onClick={closeDetail}
                      className="lg:hidden absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-600 z-10"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                          <Building2 className="w-8 h-8 text-slate-400" />
                        </div>
                        <div className="flex space-x-2">
                          <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><Share2 className="w-5 h-5" /></button>
                          <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><MoreHorizontal className="w-5 h-5" /></button>
                        </div>
                      </div>

                      <div className="mb-8">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2 leading-tight">{selectedJob.title}</h2>
                        <div className="flex items-center space-x-2 text-slate-600 mb-6">
                          <span className="font-semibold italic">Confidential Client</span>
                        </div>

                        <div className="space-y-4 text-sm text-slate-600">
                          <div className="flex items-center"><MapPin className="w-4 h-4 mr-3 text-slate-400" /> {selectedJob.location}</div>
                          <div className="flex items-center"><Briefcase className="w-4 h-4 mr-3 text-slate-400" /> {selectedJob.type}</div>
                          {selectedJob.salary && (
                            <div className="flex items-center text-blue-600 font-medium">
                              <DollarSign className="w-4 h-4 mr-3 text-slate-400" /> 
                              {selectedJob.salary}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-4 mb-10">
                        <button 
                          onClick={handleApply}
                          disabled={applying}
                          className="flex-grow bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {applying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Quick apply'}
                        </button>
                        <button className="px-8 py-4 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]">
                          Save
                        </button>
                      </div>

                      <div className="space-y-10 border-t border-slate-100 pt-8">
                        <div>
                          <h4 className="font-bold text-slate-900 text-lg mb-4">Description:</h4>
                          <div className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                            {selectedJob.description}
                          </div>
                        </div>

                        {/* TAFEP Compliance Note */}
                        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                          <div className="flex items-start space-x-4">
                            <Sparkles className="w-6 h-6 text-orange-500 flex-shrink-0" />
                            <div>
                              <h5 className="font-bold text-orange-900 mb-1">TAFEP Compliant</h5>
                              <p className="text-sm text-orange-800">
                                This job advertisement complies with the Tripartite Guidelines on Fair Employment Practices (TAFEP). We are committed to fair and merit-based recruitment.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Safety Warning */}
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                          <div className="flex items-start space-x-4">
                            <AlertCircle className="w-6 h-6 text-blue-500 flex-shrink-0" />
                            <div>
                              <h5 className="font-bold text-blue-900 mb-1">Be careful</h5>
                              <p className="text-sm text-blue-800 mb-3">Don’t provide your bank or credit card details when applying for jobs.</p>
                              <button className="text-blue-600 text-sm font-bold hover:underline">Learn how to protect yourself</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex items-center justify-center bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                    <div className="max-w-xs">
                      <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-slate-400">Select a job to view details</h3>
                      <p className="text-sm text-slate-400 mt-2">Click on any job card on the left to see full responsibilities and apply.</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

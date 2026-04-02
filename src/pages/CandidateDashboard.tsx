import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Clock, CheckCircle, XCircle, Briefcase, 
  MapPin, DollarSign, Calendar, ExternalLink, Loader2,
  User, Settings, GraduationCap, Plus, Trash2, Save,
  ChevronRight, Camera, Mail, Phone, Globe
} from 'lucide-react';
import { useFirebase } from '@/src/lib/FirebaseContext';
import { db, collection, onSnapshot, query, where, orderBy, OperationType, handleFirestoreError, doc, updateDoc, setDoc } from '@/src/firebase';
import { Job, Application } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { Link } from 'react-router-dom';

interface ApplicationWithJob extends Application {
  jobDetails?: Job;
}

type DashboardTab = 'applications' | 'profile' | 'work' | 'settings';

export default function CandidateDashboard() {
  const { userProfile } = useFirebase();
  const [activeTab, setActiveTab] = useState<DashboardTab>('applications');
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    displayName: '',
    bio: '',
    phone: '',
    location: '',
    website: ''
  });

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        displayName: userProfile.displayName || '',
        bio: userProfile.bio || '',
        phone: userProfile.phone || '',
        location: userProfile.location || '',
        website: userProfile.website || ''
      });
    }
  }, [userProfile]);

  useEffect(() => {
    if (!userProfile?.uid) return;

    const q = query(
      collection(db, 'applications'),
      where('candidateUid', '==', userProfile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const appsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ApplicationWithJob[];

      setApplications(appsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'applications');
    });

    return () => unsubscribe();
  }, [userProfile?.uid]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), profileData);
      alert('Profile updated successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userProfile.uid}`);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hired': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'interviewing': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'reviewed': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'hired': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'interviewing': return <Clock className="w-4 h-4" />;
      case 'reviewed': return <FileText className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const SidebarItem = ({ id, label, icon: Icon }: { id: DashboardTab, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all",
        activeTab === id 
          ? "bg-orange-500 text-white shadow-lg shadow-orange-200" 
          : "text-slate-600 hover:bg-slate-100"
      )}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
      {activeTab === id && <motion.div layoutId="activeTab" className="ml-auto"><ChevronRight className="w-4 h-4" /></motion.div>}
    </button>
  );

  return (
    <div className="pt-16 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-6 text-center">
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-2xl font-bold border-4 border-white shadow-sm">
                  {userProfile?.displayName?.charAt(0).toUpperCase()}
                </div>
                <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md border border-slate-100 text-slate-400 hover:text-orange-500 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-slate-900 truncate">{userProfile?.displayName}</h3>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">{userProfile?.role}</p>
            </div>

            <SidebarItem id="applications" label="Applications" icon={FileText} />
            <SidebarItem id="profile" label="Profile Details" icon={User} />
            <SidebarItem id="work" label="Work & Skills" icon={Briefcase} />
            <SidebarItem id="settings" label="Settings" icon={Settings} />
            
            <div className="pt-8">
              <div className="bg-slate-900 p-6 rounded-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/20 rounded-full blur-2xl -mr-12 -mt-12" />
                <h4 className="text-sm font-bold mb-2 relative z-10">Pro Tip</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed relative z-10">
                  Keep your work history updated to increase your visibility to recruiters by 40%.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-grow min-w-0">
            <AnimatePresence mode="wait">
              {activeTab === 'applications' && (
                <motion.div
                  key="applications"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                      <h2 className="text-xl font-bold text-slate-900">My Applications</h2>
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                        {applications.length} Total
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {loading ? (
                        <div className="p-12 text-center"><Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" /></div>
                      ) : applications.length === 0 ? (
                        <div className="p-12 text-center">
                          <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                          <h3 className="text-lg font-bold text-slate-900 mb-2">No applications yet</h3>
                          <Link to="/jobs" className="text-orange-500 font-bold hover:underline">Browse available jobs</Link>
                        </div>
                      ) : (
                        applications.map((app) => (
                          <div key={app.id} className="p-6 hover:bg-slate-50 transition-colors group">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div>
                                <h3 className="font-bold text-slate-900 text-lg mb-1">Application for Job #{app.jobId.slice(-6)}</h3>
                                <div className="flex items-center text-sm text-slate-500 space-x-4">
                                  <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5" /> {new Date(app.createdAt).toLocaleDateString()}</span>
                                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border flex items-center gap-1", getStatusColor(app.status))}>
                                    {getStatusIcon(app.status)} {app.status}
                                  </span>
                                </div>
                              </div>
                              <Link to="/jobs" className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"><ExternalLink className="w-5 h-5" /></Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8">Profile Details</h2>
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Display Name</label>
                          <input 
                            type="text" 
                            value={profileData.displayName}
                            onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Email Address</label>
                          <input type="email" value={userProfile?.email} disabled className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 outline-none cursor-not-allowed" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Short Bio</label>
                        <textarea 
                          rows={4} 
                          value={profileData.bio}
                          onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all resize-none" 
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Phone</label>
                          <input 
                            type="text" 
                            value={profileData.phone}
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Location</label>
                          <input 
                            type="text" 
                            value={profileData.location}
                            onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Website/Portfolio</label>
                          <input 
                            type="text" 
                            value={profileData.website}
                            onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" 
                          />
                        </div>
                      </div>
                      <div className="pt-4">
                        <button 
                          type="submit" 
                          disabled={saving}
                          className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}

              {activeTab === 'work' && (
                <motion.div
                  key="work"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold text-slate-900">Work Experience</h2>
                      <button className="flex items-center text-orange-500 font-bold hover:underline">
                        <Plus className="w-5 h-5 mr-1" /> Add Experience
                      </button>
                    </div>
                    <div className="space-y-8">
                      <div className="flex gap-6">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-6 h-6 text-slate-400" />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-bold text-slate-900">Senior Creative Designer</h4>
                          <p className="text-slate-600 text-sm">Sunrise Creative Agency • 2021 - Present</p>
                          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                            Leading the design team in creating innovative visual solutions for global brands.
                          </p>
                        </div>
                        <button className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold text-slate-900">Education</h2>
                      <button className="flex items-center text-orange-500 font-bold hover:underline">
                        <Plus className="w-5 h-5 mr-1" /> Add Education
                      </button>
                    </div>
                    <div className="space-y-8">
                      <div className="flex gap-6">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-6 h-6 text-slate-400" />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-bold text-slate-900">Bachelor of Fine Arts</h4>
                          <p className="text-slate-600 text-sm">Design Institute of Singapore • 2017 - 2021</p>
                        </div>
                        <button className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8">Account Settings</h2>
                    <div className="space-y-8">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div>
                          <h4 className="font-bold text-slate-900">Email Notifications</h4>
                          <p className="text-sm text-slate-500">Receive updates about your applications</p>
                        </div>
                        <div className="w-12 h-6 bg-orange-500 rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div>
                          <h4 className="font-bold text-slate-900">Profile Visibility</h4>
                          <p className="text-sm text-slate-500">Allow recruiters to find your profile</p>
                        </div>
                        <div className="w-12 h-6 bg-orange-500 rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                        </div>
                      </div>
                      <div className="pt-4">
                        <button className="text-red-500 font-bold hover:underline">Delete Account</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

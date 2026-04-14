import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText, Clock, CheckCircle, XCircle, Briefcase,
  MapPin, DollarSign, Calendar, ExternalLink, Loader2,
  User, Settings, GraduationCap, Plus, Trash2, Save,
  ChevronRight, Camera, Mail, Phone, Globe, X, Upload
} from 'lucide-react';
import { useFirebase } from '@/src/lib/FirebaseContext';
import { db, collection, onSnapshot, query, where, orderBy, OperationType, handleFirestoreError, doc, updateDoc } from '@/src/lib/firebase';
import { Job, Application, WorkExperienceEntry, EducationEntry } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { Link } from 'react-router-dom';
import {
  getWorkExperience,
  addWorkExperience,
  deleteWorkExperience,
  getEducation,
  addEducation,
  deleteEducation,
  updateSkills,
  uploadResume,
  getCandidateProfile,
  getProfileCompleteness,
} from '@/src/services/candidateProfileService';

interface ApplicationWithJob extends Application {
  jobDetails?: Job;
}

type DashboardTab = 'applications' | 'profile' | 'work' | 'settings';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

const emptyWorkForm = {
  company: '',
  title: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
};

const emptyEduForm = {
  institution: '',
  degree: '',
  field: '',
  startYear: '',
  endYear: '',
};

export default function CandidateDashboard() {
  const { userProfile } = useFirebase();
  const [activeTab, setActiveTab] = useState<DashboardTab>('applications');
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    displayName: '',
    bio: '',
    phone: '',
    location: '',
    website: '',
  });

  // Work & education state
  const [workExperience, setWorkExperience] = useState<WorkExperienceEntry[]>([]);
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(undefined);

  // Loading flags
  const [dataLoading, setDataLoading] = useState(false);
  const [workSaving, setWorkSaving] = useState(false);
  const [eduSaving, setEduSaving] = useState(false);
  const [skillsSaving, setSkillsSaving] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);

  // Form visibility
  const [showAddWorkForm, setShowAddWorkForm] = useState(false);
  const [showAddEduForm, setShowAddEduForm] = useState(false);
  const [workForm, setWorkForm] = useState(emptyWorkForm);
  const [eduForm, setEduForm] = useState(emptyEduForm);
  const [newSkillInput, setNewSkillInput] = useState('');

  // Toast
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Completeness
  const completeness = getProfileCompleteness({
    displayName: profileData.displayName,
    profilePhoto,
    bio: profileData.bio,
    workExperienceCount: workExperience.length,
    educationCount: education.length,
    skillsCount: skills.length,
    resumeUrl,
  });

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        displayName: userProfile.displayName || '',
        bio: userProfile.bio || '',
        phone: userProfile.phone || '',
        location: userProfile.location || '',
        website: userProfile.website || '',
      });
    }
  }, [userProfile]);

  // Load Firestore data
  useEffect(() => {
    if (!userProfile?.uid) return;
    const uid = userProfile.uid;
    setDataLoading(true);
    Promise.all([
      getCandidateProfile(uid),
      getWorkExperience(uid),
      getEducation(uid),
    ]).then(([profile, work, edu]) => {
      setWorkExperience(work);
      setEducation(edu);
      if (profile?.skills) setSkills(profile.skills);
      if (profile?.resumeUrl) setResumeUrl(profile.resumeUrl);
      if (profile?.profilePhoto) setProfilePhoto(profile.profilePhoto);
    }).catch((err) => {
      console.error('Failed to load profile data:', err);
    }).finally(() => {
      setDataLoading(false);
    });
  }, [userProfile?.uid]);

  // Applications listener
  useEffect(() => {
    if (!userProfile?.uid) return;
    const q = query(
      collection(db, 'applications'),
      where('candidateUid', '==', userProfile.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ApplicationWithJob[];
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
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userProfile.uid}`);
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddWorkExperience = async () => {
    if (!userProfile?.uid || !workForm.company || !workForm.title) return;
    setWorkSaving(true);
    try {
      const entry: Omit<WorkExperienceEntry, 'id'> = {
        company: workForm.company,
        title: workForm.title,
        startDate: workForm.startDate,
        current: workForm.current,
        description: workForm.description || undefined,
        ...(workForm.current ? {} : { endDate: workForm.endDate }),
      };
      const id = await addWorkExperience(userProfile.uid, entry);
      setWorkExperience(prev => [...prev, { id, ...entry }]);
      setWorkForm(emptyWorkForm);
      setShowAddWorkForm(false);
      showToast('Work experience added!', 'success');
    } catch {
      showToast('Failed to save work experience', 'error');
    } finally {
      setWorkSaving(false);
    }
  };

  const handleDeleteWorkExperience = async (id: string) => {
    if (!userProfile?.uid) return;
    try {
      await deleteWorkExperience(userProfile.uid, id);
      setWorkExperience(prev => prev.filter(e => e.id !== id));
      showToast('Work experience removed', 'success');
    } catch {
      showToast('Failed to delete entry', 'error');
    }
  };

  const handleAddEducation = async () => {
    if (!userProfile?.uid || !eduForm.institution || !eduForm.degree) return;
    setEduSaving(true);
    try {
      const entry: Omit<EducationEntry, 'id'> = {
        institution: eduForm.institution,
        degree: eduForm.degree,
        field: eduForm.field,
        startYear: Number(eduForm.startYear),
        ...(eduForm.endYear ? { endYear: Number(eduForm.endYear) } : {}),
      };
      const id = await addEducation(userProfile.uid, entry);
      setEducation(prev => [...prev, { id, ...entry }]);
      setEduForm(emptyEduForm);
      setShowAddEduForm(false);
      showToast('Education added!', 'success');
    } catch {
      showToast('Failed to save education', 'error');
    } finally {
      setEduSaving(false);
    }
  };

  const handleDeleteEducation = async (id: string) => {
    if (!userProfile?.uid) return;
    try {
      await deleteEducation(userProfile.uid, id);
      setEducation(prev => prev.filter(e => e.id !== id));
      showToast('Education removed', 'success');
    } catch {
      showToast('Failed to delete entry', 'error');
    }
  };

  const handleAddSkill = async () => {
    const skill = newSkillInput.trim();
    if (!skill || !userProfile?.uid || skills.includes(skill)) return;
    const updated = [...skills, skill];
    setSkillsSaving(true);
    try {
      await updateSkills(userProfile.uid, updated);
      setSkills(updated);
      setNewSkillInput('');
      showToast(`"${skill}" added to skills`, 'success');
    } catch {
      showToast('Failed to save skill', 'error');
    } finally {
      setSkillsSaving(false);
    }
  };

  const handleRemoveSkill = async (skill: string) => {
    if (!userProfile?.uid) return;
    const updated = skills.filter(s => s !== skill);
    try {
      await updateSkills(userProfile.uid, updated);
      setSkills(updated);
    } catch {
      showToast('Failed to remove skill', 'error');
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile?.uid) return;
    setResumeUploading(true);
    try {
      const url = await uploadResume(userProfile.uid, file);
      setResumeUrl(url);
      showToast('Resume uploaded successfully!', 'success');
    } catch {
      showToast('Resume upload failed. Storage may not be configured.', 'error');
    } finally {
      setResumeUploading(false);
      e.target.value = '';
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

  const SidebarItem = ({ id, label, icon: Icon }: { id: DashboardTab; label: string; icon: React.ElementType }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        'w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all',
        activeTab === id
          ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
          : 'text-slate-600 hover:bg-slate-100'
      )}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
      {activeTab === id && (
        <motion.div layoutId="activeTab" className="ml-auto">
          <ChevronRight className="w-4 h-4" />
        </motion.div>
      )}
    </button>
  );

  return (
    <div className="pt-16 min-h-screen bg-slate-50">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              'fixed top-20 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2',
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            )}
          >
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

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

            {/* Profile completeness */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-700">Profile Complete</span>
                <span className="text-xs font-bold text-orange-500">{completeness}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <motion.div
                  className="bg-orange-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${completeness}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
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

              {/* Applications Tab */}
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
                        <div className="p-12 text-center">
                          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
                        </div>
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
                                  <span className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1.5" /> {new Date(app.createdAt).toLocaleDateString()}
                                  </span>
                                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border flex items-center gap-1', getStatusColor(app.status))}>
                                    {getStatusIcon(app.status)} {app.status}
                                  </span>
                                </div>
                              </div>
                              <Link to="/jobs" className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all">
                                <ExternalLink className="w-5 h-5" />
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Profile Tab */}
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
                            onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Email Address</label>
                          <input
                            type="email"
                            value={userProfile?.email}
                            disabled
                            className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 outline-none cursor-not-allowed"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Short Bio</label>
                        <textarea
                          rows={4}
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
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
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Location</label>
                          <input
                            type="text"
                            value={profileData.location}
                            onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Website/Portfolio</label>
                          <input
                            type="text"
                            value={profileData.website}
                            onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
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

              {/* Work & Skills Tab */}
              {activeTab === 'work' && (
                <motion.div
                  key="work"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Work Experience */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold text-slate-900">Work Experience</h2>
                      <button
                        onClick={() => setShowAddWorkForm(!showAddWorkForm)}
                        className="flex items-center text-orange-500 font-bold hover:underline"
                      >
                        <Plus className="w-5 h-5 mr-1" /> Add Experience
                      </button>
                    </div>

                    {/* Add Work Form */}
                    <AnimatePresence>
                      {showAddWorkForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden"
                        >
                          <h3 className="font-bold text-slate-800 mb-4">New Work Experience</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="text-xs font-bold text-slate-600 mb-1 block">Job Title *</label>
                              <input
                                type="text"
                                value={workForm.title}
                                onChange={(e) => setWorkForm({ ...workForm, title: e.target.value })}
                                placeholder="e.g. Senior Designer"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-600 mb-1 block">Company *</label>
                              <input
                                type="text"
                                value={workForm.company}
                                onChange={(e) => setWorkForm({ ...workForm, company: e.target.value })}
                                placeholder="e.g. Acme Corp"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-600 mb-1 block">Start Date</label>
                              <input
                                type="month"
                                value={workForm.startDate}
                                onChange={(e) => setWorkForm({ ...workForm, startDate: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-600 mb-1 block">End Date</label>
                              <input
                                type="month"
                                value={workForm.endDate}
                                disabled={workForm.current}
                                onChange={(e) => setWorkForm({ ...workForm, endDate: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm disabled:opacity-40"
                              />
                            </div>
                          </div>
                          <label className="flex items-center gap-2 mb-4 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={workForm.current}
                              onChange={(e) => setWorkForm({ ...workForm, current: e.target.checked, endDate: '' })}
                              className="rounded accent-orange-500"
                            />
                            <span className="text-sm text-slate-700 font-medium">Currently working here</span>
                          </label>
                          <div className="mb-4">
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Description</label>
                            <textarea
                              rows={3}
                              value={workForm.description}
                              onChange={(e) => setWorkForm({ ...workForm, description: e.target.value })}
                              placeholder="Describe your role and achievements..."
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm resize-none"
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={handleAddWorkExperience}
                              disabled={workSaving || !workForm.company || !workForm.title}
                              className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-all flex items-center disabled:opacity-50 text-sm"
                            >
                              {workSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                              Save
                            </button>
                            <button
                              onClick={() => { setShowAddWorkForm(false); setWorkForm(emptyWorkForm); }}
                              className="px-5 py-2.5 rounded-xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Work entries list */}
                    <div className="space-y-8">
                      {dataLoading ? (
                        <div className="text-center py-8"><Loader2 className="w-6 h-6 text-orange-400 animate-spin mx-auto" /></div>
                      ) : workExperience.length === 0 && !showAddWorkForm ? (
                        <div className="text-center py-8 text-slate-400">
                          <Briefcase className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                          <p className="text-sm">No work experience added yet</p>
                        </div>
                      ) : (
                        workExperience.map((entry) => (
                          <div key={entry.id} className="flex gap-6">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Briefcase className="w-6 h-6 text-slate-400" />
                            </div>
                            <div className="flex-grow">
                              <h4 className="font-bold text-slate-900">{entry.title}</h4>
                              <p className="text-slate-600 text-sm">
                                {entry.company} • {entry.startDate} - {entry.current ? 'Present' : entry.endDate}
                              </p>
                              {entry.description && (
                                <p className="text-slate-500 text-sm mt-2 leading-relaxed">{entry.description}</p>
                              )}
                            </div>
                            <button
                              onClick={() => entry.id && handleDeleteWorkExperience(entry.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Education */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold text-slate-900">Education</h2>
                      <button
                        onClick={() => setShowAddEduForm(!showAddEduForm)}
                        className="flex items-center text-orange-500 font-bold hover:underline"
                      >
                        <Plus className="w-5 h-5 mr-1" /> Add Education
                      </button>
                    </div>

                    {/* Add Education Form */}
                    <AnimatePresence>
                      {showAddEduForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden"
                        >
                          <h3 className="font-bold text-slate-800 mb-4">New Education</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="md:col-span-2">
                              <label className="text-xs font-bold text-slate-600 mb-1 block">Institution *</label>
                              <input
                                type="text"
                                value={eduForm.institution}
                                onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })}
                                placeholder="e.g. National University of Singapore"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-600 mb-1 block">Degree *</label>
                              <input
                                type="text"
                                value={eduForm.degree}
                                onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                                placeholder="e.g. Bachelor of Science"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-600 mb-1 block">Field of Study</label>
                              <input
                                type="text"
                                value={eduForm.field}
                                onChange={(e) => setEduForm({ ...eduForm, field: e.target.value })}
                                placeholder="e.g. Computer Science"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-600 mb-1 block">Start Year</label>
                              <input
                                type="number"
                                value={eduForm.startYear}
                                onChange={(e) => setEduForm({ ...eduForm, startYear: e.target.value })}
                                placeholder="2018"
                                min="1950"
                                max="2030"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-600 mb-1 block">End Year</label>
                              <input
                                type="number"
                                value={eduForm.endYear}
                                onChange={(e) => setEduForm({ ...eduForm, endYear: e.target.value })}
                                placeholder="2022"
                                min="1950"
                                max="2030"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={handleAddEducation}
                              disabled={eduSaving || !eduForm.institution || !eduForm.degree}
                              className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-all flex items-center disabled:opacity-50 text-sm"
                            >
                              {eduSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                              Save
                            </button>
                            <button
                              onClick={() => { setShowAddEduForm(false); setEduForm(emptyEduForm); }}
                              className="px-5 py-2.5 rounded-xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Education entries list */}
                    <div className="space-y-8">
                      {dataLoading ? (
                        <div className="text-center py-8"><Loader2 className="w-6 h-6 text-orange-400 animate-spin mx-auto" /></div>
                      ) : education.length === 0 && !showAddEduForm ? (
                        <div className="text-center py-8 text-slate-400">
                          <GraduationCap className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                          <p className="text-sm">No education added yet</p>
                        </div>
                      ) : (
                        education.map((entry) => (
                          <div key={entry.id} className="flex gap-6">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <GraduationCap className="w-6 h-6 text-slate-400" />
                            </div>
                            <div className="flex-grow">
                              <h4 className="font-bold text-slate-900">{entry.degree}{entry.field ? ` in ${entry.field}` : ''}</h4>
                              <p className="text-slate-600 text-sm">
                                {entry.institution} • {entry.startYear}{entry.endYear ? ` - ${entry.endYear}` : ''}
                              </p>
                            </div>
                            <button
                              onClick={() => entry.id && handleDeleteEducation(entry.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Skills</h2>
                    <div className="flex flex-wrap gap-2 mb-6 min-h-[40px]">
                      {skills.length === 0 && (
                        <p className="text-sm text-slate-400">No skills added yet. Add at least 3 to boost your profile.</p>
                      )}
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-full text-sm font-medium"
                        >
                          {skill}
                          <button
                            onClick={() => handleRemoveSkill(skill)}
                            className="text-orange-400 hover:text-orange-600 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                        placeholder="e.g. React, Figma, Python..."
                        className="flex-grow px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-sm"
                      />
                      <button
                        onClick={handleAddSkill}
                        disabled={skillsSaving || !newSkillInput.trim()}
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center disabled:opacity-50 text-sm"
                      >
                        {skillsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Resume */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Resume</h2>
                    {resumeUrl && (
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-orange-500 font-bold hover:underline mb-6"
                      >
                        <FileText className="w-4 h-4" /> View Current Resume
                      </a>
                    )}
                    <label className={cn(
                      'flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all',
                      resumeUploading
                        ? 'border-orange-300 bg-orange-50'
                        : 'border-slate-200 hover:border-orange-300 hover:bg-orange-50'
                    )}>
                      {resumeUploading ? (
                        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-3" />
                      ) : (
                        <Upload className="w-8 h-8 text-slate-400 mb-3" />
                      )}
                      <span className="text-sm font-bold text-slate-700">
                        {resumeUploading ? 'Uploading…' : resumeUrl ? 'Replace Resume (PDF)' : 'Upload Resume (PDF)'}
                      </span>
                      <span className="text-xs text-slate-400 mt-1">PDF files only</span>
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        disabled={resumeUploading}
                        onChange={handleResumeUpload}
                      />
                    </label>
                  </div>
                </motion.div>
              )}

              {/* Settings Tab */}
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

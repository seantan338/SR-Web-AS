import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, MapPin, Send, Upload, CheckCircle2, Globe, Building2, UserCircle, Handshake, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { db, collection, addDoc, OperationType, handleFirestoreError } from '@/src/lib/firebase';

type UserRole = 'employer' | 'candidate' | 'partner' | '';

export default function Contact() {
  const [role, setRole] = useState<UserRole>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const submissionData = {
        ...formData,
        role,
        submittedAt: new Date().toISOString(),
      };

      // 1. Save to Firestore
      await addDoc(collection(db, 'inquiries'), submissionData);

      // 2. Sync to Google Sheets
      try {
        await fetch('/api/sync-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sheetName: 'Inquiries',
            data: [
              submissionData.submittedAt,
              submissionData.role,
              submissionData.fullName || '',
              submissionData.email || '',
              submissionData.companyName || '',
              submissionData.industry || '',
              submissionData.roleType || '',
              submissionData.urgency || '',
              submissionData.currentJobTitle || '',
              submissionData.specialization || '',
              submissionData.desiredSalary || '',
              submissionData.preferredLocation || '',
              submissionData.agencyName || '',
              submissionData.website || '',
              submissionData.partnershipType || '',
              submissionData.volumeCapacity || ''
            ]
          }),
        });
      } catch (sheetError) {
        console.error('Failed to sync to Google Sheets:', sheetError);
      }

      setIsSubmitted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'inquiries');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const getAutoResponse = () => {
    switch (role) {
      case 'employer':
        return "Thank you for reaching out! Our client lead will call you shortly to discuss your hiring needs.";
      case 'candidate':
        return "Your resume is now in our system! Our recruitment team will review your profile and contact you if there's a match.";
      case 'partner':
        return "Thank you for your partnership inquiry. Our alliance manager will review your agency details and get back to you soon.";
      default:
        return "Thank you for your message. We will get back to you shortly.";
    }
  };

  if (isSubmitted) {
    return (
      <div className="pt-32 pb-24 min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-12 rounded-3xl shadow-xl border border-slate-100 text-center"
        >
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Message Sent!</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            {getAutoResponse()}
          </p>
          <button 
            onClick={() => { setIsSubmitted(false); setRole(''); }}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all"
          >
            Send Another Message
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="bg-slate-900 py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl lg:text-6xl font-bold text-white mb-6"
            >
              Let's build the <span className="text-orange-500">future</span> together
            </motion.h1>
            <p className="text-xl text-slate-300">
              Whether you're hiring, seeking a role, or looking to partner, we're here to help you navigate the MY-SG corridor.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Contact Info */}
            <div className="lg:col-span-5">
              <h2 className="text-3xl font-bold text-slate-900 mb-8">Contact Information</h2>
              
              <div className="space-y-10">
                {/* Email */}
                <div className="flex items-start space-x-5">
                  <div className="bg-orange-500 p-4 rounded-2xl text-white shadow-lg shadow-orange-200">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg mb-1">Email us</h4>
                    <a href="mailto:sales@sunriserecruit.com" className="text-slate-600 hover:text-orange-500 transition-colors">
                      sales@sunriserecruit.com
                    </a>
                  </div>
                </div>

                {/* Singapore Office */}
                <div className="flex items-start space-x-5">
                  <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-200">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg mb-1">Singapore Office (HQ)</h4>
                    <p className="text-slate-600 mb-2">
                      2, Venture Drive, #24-37, Vision Exchange,<br />
                      Singapore 608526
                    </p>
                    <a href="tel:+6589303903" className="flex items-center text-blue-600 font-semibold hover:underline">
                      <Phone className="w-4 h-4 mr-2" />
                      +65 8930 3903
                    </a>
                  </div>
                </div>

                {/* Malaysia Office */}
                <div className="flex items-start space-x-5">
                  <div className="bg-green-600 p-4 rounded-2xl text-white shadow-lg shadow-green-200">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg mb-1">Malaysia Office</h4>
                    <p className="text-slate-600 mb-2">
                      7B, Jalan Eko Botani 3/5, Taman Eko Botani<br />
                      79100 Iskandar Puteri, Johor, Malaysia
                    </p>
                    <a href="tel:+60167457735" className="flex items-center text-green-600 font-semibold hover:underline">
                      <Phone className="w-4 h-4 mr-2" />
                      +6016 745 7735
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-4">Operating Hours</h4>
                <div className="space-y-2 text-slate-600">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span className="font-medium text-slate-900">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday - Sunday</span>
                    <span className="text-slate-400">Closed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100"
              >
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Role Selector */}
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-900 uppercase tracking-wider">I am a...</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { id: 'employer', label: 'Employer', icon: Building2 },
                        { id: 'candidate', label: 'Candidate', icon: UserCircle },
                        { id: 'partner', label: 'Partner', icon: Handshake },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setRole(item.id as UserRole)}
                          className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all",
                            role === item.id 
                              ? "border-orange-500 bg-orange-50 text-orange-600 shadow-inner" 
                              : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                          )}
                        >
                          <item.icon className="w-6 h-6 mb-2" />
                          <span className="font-bold text-sm">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {role && (
                      <motion.div
                        key={role}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                        {/* Common Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Full Name</label>
                            <input 
                              required 
                              type="text" 
                              name="fullName"
                              value={formData.fullName || ''}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none" 
                              placeholder="John Doe" 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Email Address</label>
                            <input 
                              required 
                              type="email" 
                              name="email"
                              value={formData.email || ''}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none" 
                              placeholder="john@example.com" 
                            />
                          </div>
                        </div>

                        {/* Employer Specific Fields */}
                        {role === 'employer' && (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Company Name</label>
                                <input 
                                  required 
                                  type="text" 
                                  name="companyName"
                                  value={formData.companyName || ''}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none" 
                                  placeholder="Acme Corp" 
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Industry</label>
                                <input 
                                  required 
                                  type="text" 
                                  name="industry"
                                  value={formData.industry || ''}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none" 
                                  placeholder="Technology" 
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Type of Role(s) Needed</label>
                                <select 
                                  required 
                                  name="roleType"
                                  value={formData.roleType || ''}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none bg-white"
                                >
                                  <option value="">Select type...</option>
                                  <option value="permanent">Permanent</option>
                                  <option value="contract">Contract</option>
                                  <option value="temporary">Temporary</option>
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Urgency</label>
                                <select 
                                  required 
                                  name="urgency"
                                  value={formData.urgency || ''}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none bg-white"
                                >
                                  <option value="">Select urgency...</option>
                                  <option value="immediate">Immediate</option>
                                  <option value="1-3-months">1-3 Months</option>
                                  <option value="3-6-months">3-6 Months</option>
                                </select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700">Job Description Link (Google Drive / Dropbox)</label>
                              <input 
                                type="text" 
                                name="jdLink"
                                value={formData.jdLink || ''}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none" 
                                placeholder="https://..." 
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700">Specific Requirements</label>
                              <textarea 
                                rows={3} 
                                name="requirements"
                                value={formData.requirements || ''}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none resize-none" 
                                placeholder="Niche skills, certifications, etc." 
                              />
                            </div>
                          </>
                        )}

                        {/* Candidate Specific Fields */}
                        {role === 'candidate' && (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Current Job Title</label>
                                <input 
                                  required 
                                  type="text" 
                                  name="currentJobTitle"
                                  value={formData.currentJobTitle || ''}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none" 
                                  placeholder="Senior Developer" 
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Specialization</label>
                                <select 
                                  required 
                                  name="specialization"
                                  value={formData.specialization || ''}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none bg-white"
                                >
                                  <option value="">Select area...</option>
                                  <option value="it">IT & Software</option>
                                  <option value="healthcare">Healthcare</option>
                                  <option value="marketing">Marketing & Sales</option>
                                  <option value="finance">Finance & Accounting</option>
                                  <option value="engineering">Engineering</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Desired Salary/Rate</label>
                                <input 
                                  required 
                                  type="text" 
                                  name="desiredSalary"
                                  value={formData.desiredSalary || ''}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none" 
                                  placeholder="e.g. $5000/mo" 
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Preferred Location</label>
                                <select 
                                  required 
                                  name="preferredLocation"
                                  value={formData.preferredLocation || ''}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none bg-white"
                                >
                                  <option value="onsite">On-site</option>
                                  <option value="remote">Remote</option>
                                  <option value="hybrid">Hybrid</option>
                                </select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700">Resume/CV Link (Google Drive / Dropbox)</label>
                              <input 
                                required 
                                type="text" 
                                name="resumeLink"
                                value={formData.resumeLink || ''}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none" 
                                placeholder="https://..." 
                              />
                            </div>
                          </>
                        )}

                        {/* Partner Specific Fields */}
                        {role === 'partner' && (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Agency Name</label>
                                <input 
                                  required 
                                  type="text" 
                                  name="agencyName"
                                  value={formData.agencyName || ''}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none" 
                                  placeholder="Global Talent Partners" 
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Website</label>
                                <input 
                                  required 
                                  type="url" 
                                  name="website"
                                  value={formData.website || ''}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none" 
                                  placeholder="https://example.com" 
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Partnership Type</label>
                                <select 
                                  required 
                                  name="partnershipType"
                                  value={formData.partnershipType || ''}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none bg-white"
                                >
                                  <option value="split-fee">Split-fee</option>
                                  <option value="rpo">RPO</option>
                                  <option value="lead-referral">Lead Referral</option>
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Volume Capacity</label>
                                <input 
                                  required 
                                  type="text" 
                                  name="volumeCapacity"
                                  value={formData.volumeCapacity || ''}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none" 
                                  placeholder="Candidates per month" 
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700">LinkedIn Profile (Primary Contact)</label>
                              <input 
                                required 
                                type="url" 
                                name="linkedin"
                                value={formData.linkedin || ''}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none" 
                                placeholder="https://linkedin.com/in/username" 
                              />
                            </div>
                          </>
                        )}

                        {/* GDPR Checkbox */}
                        <div className="flex items-start space-x-3 pt-4">
                          <input required type="checkbox" className="mt-1 w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500" />
                          <p className="text-sm text-slate-500 leading-relaxed">
                            I agree to the <span className="text-slate-900 font-bold underline cursor-pointer">Privacy Policy</span> and consent to Sunrise Recruit processing my personal data for recruitment purposes in accordance with GDPR/PDPA guidelines.
                          </p>
                        </div>

                        <button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center group disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              Send Inquiry
                              <Send className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!role && (
                    <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                      <p className="text-slate-400 font-medium italic">Please select your role above to continue...</p>
                    </div>
                  )}
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

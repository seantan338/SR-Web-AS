import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ScrollText, FileCheck, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useFirebase } from '../lib/FirebaseContext';

export default function LegalModal() {
  const { user, userProfile, acceptTerms, signOut } = useFirebase();
  const [activeTab, setActiveTab] = useState<'pdpa' | 'privacy' | 'terms'>('pdpa');
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  // Only show if user is logged in but hasn't accepted terms
  if (!user || (userProfile && userProfile.termsAccepted)) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    await acceptTerms();
    setIsAccepting(false);
  };

  const tabs = [
    { id: 'pdpa', label: 'PDPA', icon: Shield },
    { id: 'privacy', label: 'Privacy Policy', icon: ScrollText },
    { id: 'terms', label: 'Terms of Use', icon: FileCheck },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Legal Agreements</h2>
              <p className="text-slate-500 text-sm">Please review and acknowledge our policies to continue.</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
              <Shield className="text-orange-600 w-6 h-6" />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex p-1 bg-slate-200/50 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div 
          className="flex-grow overflow-y-auto p-8 prose prose-slate prose-sm max-w-none"
          onScroll={handleScroll}
        >
          {activeTab === 'pdpa' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Personal Data Protection Act (PDPA) Notice</h3>
              <p>
                Sunrise Recruit ("we", "us", or "our") is committed to protecting your personal data in accordance with the Personal Data Protection Act 2012 (PDPA) of Singapore.
              </p>
              <h4 className="font-bold text-slate-800">1. Collection of Personal Data</h4>
              <p>
                We collect personal data such as your name, email address, phone number, employment history, and educational background when you register an account or apply for jobs.
              </p>
              <h4 className="font-bold text-slate-800">2. Purpose of Collection</h4>
              <p>
                Your data is collected for the purposes of:
              </p>
              <ul>
                <li>Facilitating recruitment and job placement services.</li>
                <li>Verifying your identity and credentials.</li>
                <li>Communicating with you regarding job opportunities.</li>
                <li>Improving our services and platform experience.</li>
              </ul>
              <h4 className="font-bold text-slate-800">3. Disclosure to Third Parties</h4>
              <p>
                We may disclose your personal data to potential employers, business partners, and service providers who assist us in our operations, strictly for the purposes mentioned above.
              </p>
              <h4 className="font-bold text-slate-800">4. Your Rights</h4>
              <p>
                You have the right to access, correct, or withdraw consent for the use of your personal data at any time by contacting our Data Protection Officer.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Privacy Policy</h3>
              <p>
                This Privacy Policy describes how your personal information is collected, used, and shared when you visit or use the Sunrise Recruit platform.
              </p>
              <h4 className="font-bold text-slate-800">Information We Collect</h4>
              <p>
                When you use our platform, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device.
              </p>
              <h4 className="font-bold text-slate-800">How We Use Your Information</h4>
              <p>
                We use the information that we collect generally to fulfill any job applications placed through the Site, to communicate with you, and to screen for potential risk or fraud.
              </p>
              <h4 className="font-bold text-slate-800">Data Retention</h4>
              <p>
                When you register through the Site, we will maintain your Information for our records unless and until you ask us to delete this information.
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Terms of Use</h3>
              <p>
                By accessing or using Sunrise Recruit, you agree to be bound by these Terms of Use.
              </p>
              <h4 className="font-bold text-slate-800">1. User Accounts</h4>
              <p>
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
              </p>
              <h4 className="font-bold text-slate-800">2. Prohibited Activities</h4>
              <p>
                You may not use the platform for any illegal or unauthorized purpose. You must not, in the use of the Service, violate any laws in your jurisdiction.
              </p>
              <h4 className="font-bold text-slate-800">3. Intellectual Property</h4>
              <p>
                The platform and its original content, features, and functionality are and will remain the exclusive property of Sunrise Recruit and its licensors.
              </p>
              <h4 className="font-bold text-slate-800">4. Limitation of Liability</h4>
              <p>
                In no event shall Sunrise Recruit be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center text-slate-500 text-xs">
            {hasScrolledToBottom ? (
              <span className="flex items-center text-green-600 font-bold">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Ready to acknowledge
              </span>
            ) : (
              <span className="flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Please scroll to read all terms
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={() => signOut()}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all"
            >
              Decline & Sign Out
            </button>
            <button
              disabled={!hasScrolledToBottom || isAccepting}
              onClick={handleAccept}
              className="flex-1 sm:flex-none px-8 py-2.5 rounded-xl text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-200 flex items-center justify-center"
            >
              {isAccepting ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                'I Acknowledge & Accept'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

import React, { useState } from 'react';
import { useFirebase } from '../lib/FirebaseContext';
import { User, Lock, Link as LinkIcon, Shield } from 'lucide-react';

export default function ProfileSettings() {
  const { user, userProfile } = useFirebase();
  const [activeTab, setActiveTab] = useState('profile');

  if (!user) return <div className="p-10 text-center mt-20">Please Sign In to view Profile.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 mt-16">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center space-x-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-2xl">
            {userProfile?.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{userProfile?.displayName || 'User Profile'}</h1>
            <p className="text-slate-500">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-slate-200 text-slate-700 text-xs font-bold rounded uppercase">
              {userProfile?.role || 'candidate'}
            </span>
          </div>
        </div>

        <div className="flex border-b border-slate-200 overflow-x-auto">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'password', label: 'Password', icon: Lock },
            { id: 'accounts', label: 'Manage Accounts', icon: Shield },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'border-b-2 border-orange-500 text-orange-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Display Name</label>
                <input type="text" disabled value={userProfile?.displayName || ''} className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                <input type="email" disabled value={user.email || ''} className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50" />
              </div>
              <button className="bg-orange-500 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-orange-600">Save Changes</button>
            </div>
          )}
          {activeTab !== 'profile' && (
            <div className="py-12 text-center text-slate-500">
              <Shield className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p>Module integration pending next Firebase update.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
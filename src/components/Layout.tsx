import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Briefcase, Users, Shield, LayoutDashboard, Mail, Search, LogOut, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useFirebase } from '@/src/lib/FirebaseContext';

const navItems = [
  { name: 'Home', path: '/', icon: Sun, roles: ['candidate', 'recruiter', 'partner', 'admin'] },
  { name: 'About', path: '/about', icon: Users, roles: ['candidate', 'recruiter', 'partner', 'admin'] },
  { name: 'Job Search', path: '/jobs', icon: Search, roles: ['candidate', 'recruiter', 'partner', 'admin'] },
  { name: 'Candidate', path: '/candidate', icon: UserIcon, roles: ['candidate', 'recruiter', 'partner', 'admin'], requiresAuth: true },
  { name: 'Partner', path: '/partner', icon: Briefcase, roles: ['partner', 'admin'] },
  { name: 'Recruiter', path: '/recruiter', icon: LayoutDashboard, roles: ['recruiter', 'partner', 'admin'] },
  { name: 'Admin', path: '/admin', icon: Shield, roles: ['admin'] },
  { name: 'Contact', path: '/contact', icon: Mail, roles: ['candidate', 'recruiter', 'partner', 'admin'] },
];

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const { user, userProfile, signIn, signOut, loading } = useFirebase();

  const filteredNavItems = navItems.filter(item => {
    if (item.requiresAuth && !user) return false;
    if (!userProfile) return item.roles.includes('candidate') && !item.requiresAuth;
    return item.roles.includes(userProfile.role);
  });

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Sun className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Sunrise<span className="text-orange-500">Recruit</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-orange-500",
                  location.pathname === item.path ? "text-orange-500" : "text-slate-600"
                )}
              >
                {item.name}
              </Link>
            ))}
            
            {!loading && (
              user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                    {userProfile?.photoURL ? (
                      <img src={userProfile.photoURL} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon className="w-4 h-4 text-slate-500" />
                    )}
                    <span className="text-xs font-medium text-slate-700">{userProfile?.displayName || user.email}</span>
                    <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">{userProfile?.role}</span>
                  </div>
                  <button 
                    onClick={() => signOut()}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => signIn()}
                  className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-all active:scale-95"
                >
                  Sign In
                </button>
              )
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-600">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-orange-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium",
                    location.pathname === item.path ? "bg-orange-50 text-orange-600" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
              <div className="pt-4 px-3">
                {!loading && (
                  user ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 px-3 py-2 bg-slate-50 rounded-lg">
                        {userProfile?.photoURL ? (
                          <img src={userProfile.photoURL} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                        ) : (
                          <UserIcon className="w-6 h-6 text-slate-500" />
                        )}
                        <div>
                          <p className="text-sm font-bold text-slate-900">{userProfile?.displayName}</p>
                          <p className="text-xs text-slate-500">{userProfile?.role}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { signOut(); setIsOpen(false); }}
                        className="w-full flex items-center justify-center space-x-2 bg-slate-100 text-slate-600 py-3 rounded-xl font-medium"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { signIn(); setIsOpen(false); }}
                      className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium"
                    >
                      Sign In
                    </button>
                  )
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
                <Sun className="text-white w-4 h-4" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900">SunriseRecruit</span>
            </Link>
            <p className="text-slate-500 max-w-sm">
              Connecting the world's most innovative creative talent with forward-thinking agencies and brands.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link to="/jobs" className="hover:text-orange-500">Job Search</Link></li>
              <li><Link to="/partner" className="hover:text-orange-500">For Partners</Link></li>
              <li><Link to="/recruiter" className="hover:text-orange-500">Recruiter</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-orange-500">PDPA Notice</button></li>
              <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-orange-500">Privacy Policy</button></li>
              <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-orange-500">Terms of Use</button></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
          © 2018 Sunrise Recruit. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

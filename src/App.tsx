import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar, Footer } from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import PartnerPortal from './pages/PartnerPortal';
import CandidateDashboard from './pages/CandidateDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import AdminControlCenter from './pages/AdminControlCenter';
import JobSearch from './pages/JobSearch';
import InternalTools from './pages/InternalTools';
import { FirebaseProvider } from './lib/FirebaseContext';
import ProtectedRoute from './lib/ProtectedRoute';
import LegalModal from './components/LegalModal';
import ChatBot from './components/ChatBot';

export default function App() {
  return (
    <FirebaseProvider>
      <Router>
        <div 
          className="min-h-screen flex flex-col font-sans text-slate-900 antialiased relative bg-cover bg-center bg-fixed"
          style={{ backgroundImage: 'url(/bg-image.png)' }}
        >
          <div className="absolute inset-0 bg-slate-900/80 z-0 pointer-events-none" />
          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            <LegalModal />
            <ChatBot />
            <main className="flex-grow flex flex-col">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/jobs" element={<JobSearch />} />
              <Route path="/contact" element={<Contact />} />
              
              <Route 
                path="/candidate" 
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'recruiter', 'partner', 'admin']}>
                    <CandidateDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/partner" 
                element={
                  <ProtectedRoute allowedRoles={['partner', 'admin']}>
                    <PartnerPortal />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/recruiter" 
                element={
                  <ProtectedRoute allowedRoles={['recruiter', 'partner', 'admin']}>
                    <RecruiterDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminControlCenter />
                  </ProtectedRoute>
                } 
              />
              {/* ✅ 新增的微前端工具入口，受 Firebase 权限严格保护 */}
              <Route 
                path="/tools" 
                element={
                  <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                    <InternalTools />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          <Footer />
          </div>
        </div>
      </Router>
    </FirebaseProvider>
  );
}
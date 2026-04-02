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
import { FirebaseProvider } from './lib/FirebaseContext';
import ProtectedRoute from './lib/ProtectedRoute';
import LegalModal from './components/LegalModal';

export default function App() {
  return (
    <FirebaseProvider>
      <Router>
        <div className="min-h-screen flex flex-col font-sans text-slate-900 antialiased relative">
          <Navbar />
          <LegalModal />
          <main className="flex-grow">
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
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </FirebaseProvider>
  );
}

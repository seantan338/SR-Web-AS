import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 1. 引入全局状态与核心组件
import { FirebaseProvider, useFirebase } from './lib/FirebaseContext';
import { Navbar, Footer } from './components/Layout';
import LegalModal from './components/LegalModal';
import ChatBot from './components/ChatBot';

// 2. 引入所有页面级组件
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import JobSearch from './pages/JobSearch';
import PartnerPortal from './pages/PartnerPortal';
import CandidateDashboard from './pages/CandidateDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import AdminControlCenter from './pages/AdminControlCenter';
import InternalTools from './pages/InternalTools';
import ProfileSettings from './pages/ProfileSettings';

// ============================================================================
// 🛡️ 核心基建：全局路由安全守卫 (Route Guard)
// ============================================================================
const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode, 
  allowedRoles: string[] 
}) => {
  const { user, userProfile, loading } = useFirebase();

  // 拦截点 1：Firebase 状态加载中，显示全局 Loading 动画
  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-300 font-bold tracking-widest uppercase text-sm">Authenticating...</p>
      </div>
    );
  }

  // 拦截点 2：未登录游客试图访问私密页面，踢回首页 (触发 Navbar 的登录)
  if (!user || !userProfile) {
    return <Navigate to="/" replace />;
  }

  // 拦截点 3：已登录，但角色不在白名单内，强制踢回属于他自己的专属 Dashboard
  if (!allowedRoles.includes(userProfile.role)) {
    switch (userProfile.role) {
      case 'admin': return <Navigate to="/admin" replace />;
      case 'recruiter': return <Navigate to="/recruiter" replace />;
      case 'partner': return <Navigate to="/partner" replace />;
      default: return <Navigate to="/candidate" replace />;
    }
  }

  // 验证通过，放行渲染组件
  return <>{children}</>;
};

// ============================================================================
// 🌐 应用主干 (Root Component)
// ============================================================================
export default function App() {
  return (
    <FirebaseProvider>
      <Router>
        {/* 全局底层背景与 UI 框架 */}
        <div 
          className="min-h-screen flex flex-col font-sans text-slate-900 antialiased relative bg-cover bg-center bg-fixed"
          style={{ backgroundImage: 'url(/bg-image.png)' }}
        >
          {/* 背景遮罩 */}
          <div className="absolute inset-0 bg-slate-900/80 z-0 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col min-h-screen">
            {/* 全局悬浮组件 */}
            <Navbar />
            <LegalModal />
            <ChatBot />
            
            {/* 动态路由挂载区 */}
            <main className="flex-grow flex flex-col">
              <Routes>
                {/* 🟢 1. 公域路由 (游客均可访问) */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/jobs" element={<JobSearch />} />
                <Route path="/contact" element={<Contact />} />
                
                {/* 🟠 2. 私域路由：求职者层级 */}
                <Route 
                  path="/candidate" 
                  element={
                    <ProtectedRoute allowedRoles={['candidate', 'recruiter', 'partner', 'admin']}>
                      <CandidateDashboard />
                    </ProtectedRoute>
                  } 
                />

                {/* 🟣 3. 私域路由：外部合伙人层级 */}
                <Route 
                  path="/partner" 
                  element={
                    <ProtectedRoute allowedRoles={['partner', 'admin']}>
                      <PartnerPortal />
                    </ProtectedRoute>
                  } 
                />

                {/* 🔵 4. 私域路由：内部雇主层级 */}
                <Route 
                  path="/recruiter" 
                  element={
                    <ProtectedRoute allowedRoles={['recruiter', 'partner', 'admin']}>
                      <RecruiterDashboard />
                    </ProtectedRoute>
                  } 
                />

                {/* 🔴 5. 绝对机密：管理员后台 */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminControlCenter />
                    </ProtectedRoute>
                  } 
                />

                {/* ⚙️ 6. 内部员工工具箱 */}
                <Route 
                  path="/tools" 
                  element={
                    <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                      <InternalTools />
                    </ProtectedRoute>
                  } 
                />

                {/* 👤 7. 个人档案设置 (全员开放) */}
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute allowedRoles={['candidate', 'recruiter', 'partner', 'admin']}>
                      <ProfileSettings />
                    </ProtectedRoute>
                  } 
                />

                {/* ⚠️ 8. 404 兜底路由：任何瞎填的乱码网址，一律弹回首页 */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            
            <Footer />
          </div>
        </div>
      </Router>
    </FirebaseProvider>
  );
}
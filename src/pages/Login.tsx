import React, { useEffect } from 'react';
import { useFirebase } from '../lib/FirebaseContext';
import { useNavigate } from 'react-router-dom';
import { Building2, LogIn, Loader2 } from 'lucide-react';

export default function Login() {
  const { user, userProfile, signIn } = useFirebase();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  // 监听状态，登录成功后根据角色自动路由分流！
  useEffect(() => {
    if (user && userProfile) {
      switch (userProfile.role) {
        case 'admin':
          navigate('/admin-control-center');
          break;
        case 'recruiter':
          navigate('/recruiter-dashboard');
          break;
        case 'partner':
          navigate('/partner-portal');
          break;
        case 'candidate':
        default:
          navigate('/candidate-dashboard'); // 新求职者直接去完善 Profile
          break;
      }
    }
  }, [user, userProfile, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    await signIn();
    setIsLoggingIn(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Welcome to 4U Platform
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Connecting Business to Optimized Talents
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-4 shadow sm:rounded-3xl sm:px-10 border border-slate-700">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-slate-900 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-all"
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-2" />
            )}
            Sign in with Google
          </button>
          
          <div className="mt-6 text-center text-xs text-slate-500">
            By signing in, you agree to our Terms of Service and Privacy Policy.
            First-time users will be automatically registered as candidates.
          </div>
        </div>
      </div>
    </div>
  );
}
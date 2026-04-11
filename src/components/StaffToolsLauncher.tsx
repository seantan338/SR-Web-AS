import { useFirebase } from '../lib/FirebaseContext';

const TOOLS_URL = 'https://sunriserecruittools.zeabur.app';
const SSO_SECRET = 'SR_SSO_2025';

export default function StaffToolsLauncher() {
  const { user, userProfile } = useFirebase();

  function openTools() {
    if (!user) return;

    // Generate SSO token — valid for 10 minutes
    const payload = {
      uid: user.uid,
      email: user.email,
      role: userProfile?.role || 'recruiter',
      secret: SSO_SECRET,
      exp: Date.now() + 10 * 60 * 1000, // 10 min
    };

    const token = btoa(JSON.stringify(payload));
    const url = `${TOOLS_URL}/login.html?sso=${token}`;
    window.open(url, '_blank');
  }

  return (
    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl mb-2">🧰</div>
          <h3 className="text-lg font-bold mb-1">Staff Toolkit</h3>
          <p className="text-orange-100 text-sm leading-relaxed">
            JD Generator · CV Screener · Interview Questions · WhatsApp Templates · Quotations · SOP Library
          </p>
        </div>
      </div>
      <button
        onClick={openTools}
        className="mt-4 w-full bg-white text-orange-600 font-bold py-2.5 px-4 rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
      >
        <span>Open Staff Tools</span>
        <span>↗</span>
      </button>
      <p className="text-orange-200 text-xs mt-2 text-center">
        Opens in new tab · Auto sign-in with your account
      </p>
    </div>
  );
}

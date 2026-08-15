import React, { useState } from 'react';
import { UserProfile } from '../types';
import { TEAM_MEMBERS } from '../data/initialTasks';
import { 
  setQuickTeamProfile, 
  loginWithEmail, 
  signupWithEmail, 
  loginWithGoogle, 
  logoutUser 
} from '../lib/firebase';
import { X, UserCheck, LogIn, Mail, Lock, User, ShieldCheck, LogOut } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: UserProfile | null;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  onClose
}) => {
  const [mode, setMode] = useState<'quick' | 'login' | 'signup'>('quick');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('Project Engineer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectQuickProfile = async (member: typeof TEAM_MEMBERS[0]) => {
    setLoading(true);
    try {
      await setQuickTeamProfile(member.name, member.role);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update team profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        await signupWithEmail(email, password, displayName || 'Radi Member', role);
      } else {
        await loginWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await logoutUser();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              Team Access & Authentication
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Radi Energy Solutions Multi-User Workspace
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Profile Banner */}
        <div className="bg-slate-100 p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-bold text-sm flex items-center justify-center uppercase shadow-xs">
              {currentUser?.displayName ? currentUser.displayName.substring(0, 2) : 'RE'}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                {currentUser?.displayName || 'Guest Engineer'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {currentUser?.role || 'Team Member'} {currentUser?.email ? `(${currentUser.email})` : ''}
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            disabled={loading}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" /> Reset / Logout
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setMode('quick')}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-all ${
              mode === 'quick'
                ? 'border-blue-600 text-blue-600 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1-Click Team Member
          </button>
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-all ${
              mode === 'login'
                ? 'border-blue-600 text-blue-600 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Email Login
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-all ${
              mode === 'signup'
                ? 'border-blue-600 text-blue-600 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {mode === 'quick' ? (
            <div>
              <p className="text-xs text-slate-500 mb-3 font-medium">
                Select your official Kiira Motors team profile to sign off on tasks and track edits in real time:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TEAM_MEMBERS.map((member) => (
                  <button
                    key={member.name}
                    onClick={() => handleSelectQuickProfile(member)}
                    disabled={loading}
                    className="p-2.5 text-left rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all flex items-center gap-2.5 group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-900 group-hover:bg-blue-600 text-white text-xs font-bold flex items-center justify-center uppercase transition-colors shrink-0">
                      {member.name.substring(0, 2)}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700 truncate">
                        {member.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {member.role}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Shibah Mukama"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Project Role</label>
                    <input
                      type="text"
                      placeholder="e.g. Plant Lead Engineer"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="name@kiiramotors.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs mt-2"
              >
                {loading ? 'Authenticating...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white px-2 text-slate-400 font-bold">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-blue-600 font-black">G</span> Sign in with Google
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

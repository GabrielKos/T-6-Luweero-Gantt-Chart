import React, { useState } from 'react';
import { UserProfile } from '../types';
import { TEAM_MEMBERS } from '../data/initialTasks';
import { setQuickTeamProfile } from '../lib/firebase';
import { Lock, UserCheck, ShieldCheck, X, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: UserProfile | null;
  onClose: () => void;
  onAuthenticated?: (userProfile: UserProfile) => void;
}

const AUTHORIZED_KEY = 'RADI2030';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onAuthenticated
}) => {
  const [selectedMember, setSelectedMember] = useState<typeof TEAM_MEMBERS[0] | null>(() => {
    if (currentUser?.displayName) {
      const match = TEAM_MEMBERS.find(m => m.name.toLowerCase() === currentUser.displayName.toLowerCase());
      return match || TEAM_MEMBERS[0];
    }
    return TEAM_MEMBERS[0];
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedMember) {
      setError('Please select your team member name from the list.');
      return;
    }

    if (password.trim() !== AUTHORIZED_KEY) {
      setError('Invalid authorization password. Please enter the valid team security key.');
      return;
    }

    setLoading(true);
    try {
      await setQuickTeamProfile(selectedMember.name, selectedMember.role);
      
      const updatedProfile: UserProfile = {
        uid: currentUser?.uid || 'authenticated_member',
        email: selectedMember.email,
        displayName: selectedMember.name,
        role: selectedMember.role,
        isAnonymous: false
      };

      if (onAuthenticated) {
        onAuthenticated(updatedProfile);
      }
      setPassword('');
      setError('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate team profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2 text-white">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              Team Access & Authentication
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
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

        {/* Current Active Badge (if already authenticated) */}
        {currentUser?.displayName && currentUser.displayName !== 'Guest Engineer' && currentUser.displayName !== 'Team Member' && (
          <div className="bg-blue-50/80 px-5 py-2.5 border-b border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-700">
                Active: <strong className="text-blue-900 font-bold">{currentUser.displayName}</strong> ({currentUser.role})
              </span>
            </div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleAuthenticate} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Team Member
            </label>
            <div className="relative">
              <select
                value={selectedMember?.name || ''}
                onChange={(e) => {
                  const m = TEAM_MEMBERS.find(member => member.name === e.target.value);
                  setSelectedMember(m || null);
                  setError('');
                }}
                required
                className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
              >
                {TEAM_MEMBERS.map((member) => (
                  <option key={member.name} value={member.name}>
                    {member.name} — {member.role}
                  </option>
                ))}
              </select>
            </div>
            {selectedMember && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium px-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Assigned Role: <strong className="text-slate-700">{selectedMember.role}</strong></span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Authorization Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter password"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                'Verifying...'
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Authenticate & Authorize Edits
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

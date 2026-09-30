import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  ArrowRight, 
  Check, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Crown,
  ShieldCheck
} from 'lucide-react';
import { UserPersona } from '../types';
import { BOARD_AVATARS } from '../utils/boardAvatars';
import { getAllRegisteredAccounts, saveRegisteredAccount, saveStoredAuthUser } from '../utils/boardStorage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserPersona, isNewAccount?: boolean) => void;
  initialMode?: 'login' | 'signup';
  actionPrompt?: string; // Optional context, e.g. "Log in or create an account to create your board"
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  actionPrompt,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Sign up State
  const [signUpName, setSignUpName] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(BOARD_AVATARS[0]?.url || '');
  const [signUpError, setSignUpError] = useState('');

  const registeredUsers = getAllRegisteredAccounts();

  if (!isOpen) return null;

  // Handle Quick Login with a known user persona
  const handleQuickLogin = (user: UserPersona) => {
    saveStoredAuthUser(user);
    saveRegisteredAccount(user);
    onSuccess(user, false);
    onClose();
  };

  // Handle Manual Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim()) {
      setLoginError('Please enter your email or username');
      return;
    }

    // Match by email or username in registered accounts
    const emailOrUser = loginEmail.trim().toLowerCase();
    const matched = registeredUsers.find(
      (u) =>
        u.email?.toLowerCase() === emailOrUser ||
        u.username?.toLowerCase() === emailOrUser ||
        u.name.toLowerCase() === emailOrUser
    );

    if (matched) {
      saveStoredAuthUser(matched);
      saveRegisteredAccount(matched);
      onSuccess(matched, false);
      onClose();
    } else {
      // If no exact match found, create a signed-in persona with the provided email/name
      const derivedName = loginEmail.split('@')[0];
      const capitalized = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
      const newUser: UserPersona = {
        id: `user-${Date.now()}`,
        name: capitalized,
        displayName: capitalized,
        username: derivedName.toLowerCase(),
        email: loginEmail.includes('@') ? loginEmail : `${derivedName}@example.com`,
        avatar: BOARD_AVATARS[0]?.url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + derivedName,
        role: 'owner',
        memberSince: 'Today',
      };
      saveRegisteredAccount(newUser);
      onSuccess(newUser, false);
      onClose();
    }
  };

  // Handle Sign up submission
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError('');

    if (!signUpName.trim()) {
      setSignUpError('Please enter your full name');
      return;
    }

    const cleanUsername = (signUpUsername.trim() || signUpName.trim().toLowerCase().replace(/\s+/g, '')).replace(/^@/, '');
    const cleanEmail = signUpEmail.trim() || `${cleanUsername}@example.com`;

    const newUser: UserPersona = {
      id: `user-${Date.now()}`,
      name: signUpName.trim(),
      displayName: signUpName.trim(),
      username: cleanUsername,
      email: cleanEmail,
      avatar: selectedAvatar || BOARD_AVATARS[0]?.url,
      role: 'owner',
      bio: 'Plan Board creator & organizer.',
      location: 'Global',
      memberSince: 'Just now',
    };

    saveRegisteredAccount(newUser);
    onSuccess(newUser, true);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-[500px] max-h-[92vh] rounded-[32px] sm:rounded-[36px] shadow-2xl border border-[#ECEFF3] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-6 sm:p-7 pb-3 border-b border-[#ECEFF3]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#1A1B25] tracking-tight font-['Nunito']">
                {mode === 'login' ? 'Log In to Plan Board' : 'Create an Account'}
              </h2>
            </div>
            <p className="text-xs text-[#666D80] mt-1 font-['Nunito']">
              {actionPrompt || (mode === 'login' 
                ? 'Welcome back. Log in to create and host your boards.' 
                : 'Create an account to start, host, and manage your boards.')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#1A1B25] flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 sm:px-7 pt-4 pb-1">
          <div className="grid grid-cols-2 p-1 bg-[#F8F9FB] rounded-full">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLoginError('');
              }}
              className={`py-2 text-xs sm:text-sm font-bold rounded-full transition cursor-pointer font-['Nunito'] ${
                mode === 'login'
                  ? 'bg-white text-[#1A1B25] shadow-xs'
                  : 'text-[#666D80] hover:text-[#1A1B25]'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setSignUpError('');
              }}
              className={`py-2 text-xs sm:text-sm font-bold rounded-full transition cursor-pointer font-['Nunito'] ${
                mode === 'signup'
                  ? 'bg-white text-[#1A1B25] shadow-xs'
                  : 'text-[#666D80] hover:text-[#1A1B25]'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 pt-3 space-y-5">
          {mode === 'login' ? (
            <div className="space-y-4">
              {/* Quick Persona Logins */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#808897] uppercase tracking-wider font-['Nunito']">
                    Quick Select Account
                  </span>
                  <span className="text-[11px] text-[#808897] font-semibold font-['Nunito']">
                    1-Click Access
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {registeredUsers.slice(0, 4).map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleQuickLogin(user)}
                      className="p-2.5 rounded-2xl bg-[#F8F9FB] hover:bg-[#ECEFF3] text-left transition cursor-pointer flex items-center gap-2.5 group select-none"
                    >
                      <div className="relative shrink-0">
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-white"
                        />
                        {user.role === 'owner' && (
                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#1A1B25] text-amber-300 flex items-center justify-center">
                            <Crown size={8} className="fill-amber-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#1A1B25] truncate font-['Nunito'] group-hover:text-black">
                          {user.name}
                        </div>
                        <div className="text-[10px] text-[#808897] truncate capitalize font-['Nunito']">
                          {user.role || 'Member'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#ECEFF3] w-full" />
                <span className="bg-white px-3 text-[11px] font-bold text-[#808897] uppercase tracking-wider absolute font-['Nunito']">
                  Or Log In with Credentials
                </span>
              </div>

              {/* Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {loginError && (
                  <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 text-xs font-semibold">
                    {loginError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#808897] mb-1.5 font-['Nunito']">
                    Email or Username
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#808897] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. seyi or ayodeleoluwaseyi088@gmail.com"
                      className="w-full h-11 pl-10 pr-4 rounded-2xl bg-[#F8F9FB] text-xs sm:text-sm font-semibold text-[#1A1B25] border-none outline-none focus:bg-[#ECEFF3] transition font-['Nunito']"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#808897] mb-1.5 font-['Nunito']">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#808897] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full h-11 pl-10 pr-10 rounded-2xl bg-[#F8F9FB] text-xs sm:text-sm font-semibold text-[#1A1B25] border-none outline-none focus:bg-[#ECEFF3] transition font-['Nunito']"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#808897] hover:text-[#1A1B25] transition"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 sm:py-3.5 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-xs active:scale-[0.99] flex items-center justify-center gap-2 mt-2 font-['Nunito']"
                >
                  <span>Log In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            /* Sign Up Mode */
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              {signUpError && (
                <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 text-xs font-semibold">
                  {signUpError}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-[#808897] mb-1.5 font-['Nunito']">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#808897] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => {
                      setSignUpName(e.target.value);
                      if (!signUpUsername) {
                        setSignUpUsername(e.target.value.toLowerCase().replace(/\s+/g, ''));
                      }
                    }}
                    placeholder="e.g. Alex Morgan"
                    className="w-full h-11 pl-10 pr-4 rounded-2xl bg-[#F8F9FB] text-xs sm:text-sm font-semibold text-[#1A1B25] border-none outline-none focus:bg-[#ECEFF3] transition font-['Nunito']"
                    required
                  />
                </div>
              </div>

              {/* Username & Email in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#808897] mb-1.5 font-['Nunito']">
                    Username
                  </label>
                  <input
                    type="text"
                    value={signUpUsername}
                    onChange={(e) => setSignUpUsername(e.target.value)}
                    placeholder="alexmorgan"
                    className="w-full h-11 px-4 rounded-2xl bg-[#F8F9FB] text-xs sm:text-sm font-semibold text-[#1A1B25] border-none outline-none focus:bg-[#ECEFF3] transition font-['Nunito']"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#808897] mb-1.5 font-['Nunito']">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full h-11 px-4 rounded-2xl bg-[#F8F9FB] text-xs sm:text-sm font-semibold text-[#1A1B25] border-none outline-none focus:bg-[#ECEFF3] transition font-['Nunito']"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[#808897] mb-1.5 font-['Nunito']">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#808897] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showSignUpPassword ? 'text' : 'password'}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Choose a password"
                    className="w-full h-11 pl-10 pr-10 rounded-2xl bg-[#F8F9FB] text-xs sm:text-sm font-semibold text-[#1A1B25] border-none outline-none focus:bg-[#ECEFF3] transition font-['Nunito']"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#808897] hover:text-[#1A1B25] transition"
                  >
                    {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Pick Avatar */}
              <div>
                <div className="text-xs font-bold text-[#808897] mb-2 font-['Nunito']">
                  Select Profile Avatar
                </div>
                <div className="grid grid-cols-6 gap-2 p-2.5 bg-[#F8F9FB] rounded-2xl max-h-36 overflow-y-auto">
                  {BOARD_AVATARS.map((avatar) => {
                    const isSelected = selectedAvatar === avatar.url;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar.url)}
                        className={`relative p-1.5 rounded-xl transition cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? 'bg-white ring-2 ring-amber-400 scale-105 shadow-2xs'
                            : 'hover:bg-white/60'
                        }`}
                      >
                        <img 
                          src={avatar.url} 
                          alt={avatar.name} 
                          className="w-7 h-7 object-contain"
                        />
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-white flex items-center justify-center">
                            <Check className="w-2 h-2 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-xs active:scale-[0.99] flex items-center justify-center gap-2 mt-2 font-['Nunito']"
              >
                <span>Create Account & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Privacy Note */}
          <div className="pt-2 text-center">
            <p className="text-[11px] text-[#808897] font-['Nunito']">
              Guests who receive a board link can participate without creating an account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

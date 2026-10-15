import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { UserProfile } from '../types';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  onRegister: (params: { fullName: string; email: string; password: string; phone: string }) => Promise<{ success: boolean; message: string }>;
  onLogout: () => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onRegister,
  onLogout,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      const res = await onLogin(loginEmail, loginPassword);
      if (res.success) {
        setSuccessMessage('Login berhasil! Mengalihkan...');
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setErrorMessage(res.message || 'Login gagal.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (regPassword.length < 8) {
      setErrorMessage('Password minimal 8 karakter dengan kombinasi huruf dan angka.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await onRegister({
        fullName: regFullName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
      });
      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setErrorMessage(res.message || 'Registrasi gagal.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/30 text-violet-400 border border-violet-500/40">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {currentUser ? 'Akun Pelanggan' : tab === 'login' ? 'Masuk ke Kumagemu' : 'Daftar Akun Baru'}
              </h3>
              <p className="text-[11px] text-slate-400">Power Up. Play More.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentUser ? (
            /* Logged in state */
            <div className="space-y-4">
              <div className="rounded-xl border border-violet-500/30 bg-violet-950/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
                    {currentUser.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{currentUser.fullName}</h4>
                    <p className="text-xs text-slate-400">{currentUser.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-violet-900/60 text-violet-300 border border-violet-700/50">
                      {currentUser.role === 'admin' ? 'Administrator' : 'Pelanggan Terverifikasi'}
                    </span>
                  </div>
                </div>
                {currentUser.phone && (
                  <div className="mt-3 text-xs text-slate-300 flex items-center gap-2 border-t border-slate-800/80 pt-2">
                    <Phone className="h-3.5 w-3.5 text-violet-400" />
                    <span>WhatsApp: {currentUser.phone}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-800/60 bg-rose-950/30 text-rose-300 text-xs font-semibold hover:bg-rose-950/60 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          ) : (
            /* Auth Forms */
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    tab === 'login' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Masuk Akun
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    tab === 'register' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Daftar Baru
                </button>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {tab === 'login' ? (
                /* Login Form */
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Email</label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="nama@email.com"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Password</label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 mt-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-bold text-xs transition-all shadow-md shadow-violet-950/50 cursor-pointer"
                  >
                    {isLoading ? 'Memverifikasi...' : 'Masuk Sekarang'}
                  </button>
                </form>
              ) : (
                /* Register Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Contoh: Daffa Hanif"
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Email Aktif</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Nomor WhatsApp (Aktif)</label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="081234567890"
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Password (Minimal 8 karakter)</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimal 8 karakter (huruf & angka)"
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 mt-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-bold text-xs transition-all shadow-md shadow-violet-950/50 cursor-pointer"
                  >
                    {isLoading ? 'Mendaftarkan Akun...' : 'Daftar Akun'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

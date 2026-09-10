import React, { useState } from 'react';
import { Stethoscope, User, Lock, Mail, Building, Award, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login inputs
  const [username, setUsername] = useState('drgumbo');
  const [password, setPassword] = useState('password123');

  // Registration inputs
  const [regData, setRegData] = useState({
    username: '',
    email: '',
    password: '',
    doctor_name: 'Dr. ',
    hospital_name: 'Gumare Primary Hospital',
    designation: 'Medical Officer',
    signature_title: 'DR '
  });

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.auth.login(username, password);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.auth.register(regData);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Failed to register account');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setUsername('drgumbo');
    setPassword('password123');
    setError('');
    setLoading(true);

    try {
      const res = await api.auth.login('drgumbo', 'password123');
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100/20">
        
        {/* Banner */}
        <div className="bg-emerald-800 text-white p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-700/40 rounded-full blur-2xl -mr-10 -mt-10"></div>
          
          <div className="inline-flex p-3 bg-emerald-600 rounded-2xl shadow-inner mb-3">
            <Stethoscope className="w-8 h-8 text-emerald-100" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Gumare Clinical Suite</h2>
          <p className="text-xs text-emerald-200 mt-1 max-w-xs mx-auto">
            Inpatient Admission Notes, Referral Notes & Coupled Treatment Charts
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-3 text-center transition ${
              !isRegister
                ? 'text-emerald-800 border-b-2 border-emerald-600 bg-emerald-50/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Clinician Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-3 text-center transition ${
              isRegister
                ? 'text-emerald-800 border-b-2 border-emerald-600 bg-emerald-50/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            New Doctor Register
          </button>
        </div>

        {/* Forms Body */}
        <div className="p-6">
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isRegister ? (
            /* LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username or Clinical Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="drgumbo"
                    className="w-full text-sm pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-sm pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In to Treatment Charts
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* One click demo login */}
              <div className="pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  1-Click Demo Login (Dr. Gumbo / Gumare Hospital)
                </button>
              </div>
            </form>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Doctor Name</label>
                <input
                  type="text"
                  required
                  value={regData.doctor_name}
                  onChange={(e) => setRegData({ ...regData, doctor_name: e.target.value })}
                  placeholder="Dr. Gumbo"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={regData.username}
                    onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                    placeholder="drgumbo"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    placeholder="doctor@hospital.org"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital / Clinic</label>
                  <input
                    type="text"
                    value={regData.hospital_name}
                    onChange={(e) => setRegData({ ...regData, hospital_name: e.target.value })}
                    placeholder="Gumare Primary Hospital"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={regData.designation}
                    onChange={(e) => setRegData({ ...regData, designation: e.target.value })}
                    placeholder="Medical Officer"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registering Account...
                  </>
                ) : (
                  <>
                    Create Doctor Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-center text-[11px] text-slate-500">
          Inpatient Treatment Charts & Referral Forms • SQLite Embedded Database
        </div>

      </div>
    </div>
  );
}

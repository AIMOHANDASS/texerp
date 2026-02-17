
import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isLogin) {
      const user = await api.login(email, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid credentials. (Hint: Admin is admin@texflow.com / admin123)');
      }
    } else {
      const user = await api.signup({ name, email, phone, password });
      onLogin(user);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-lg glass-card rounded-[3.5rem] p-16 shadow-[0_32px_100px_rgba(0,0,0,0.4)] relative z-10 border border-white/10">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-white tracking-tighter mb-4">TexFlow</h1>
          <p className="text-slate-400 font-bold tracking-widest text-xs uppercase">Enterprise Textile Ecosystem</p>
        </div>

        <div className="flex bg-white/5 p-1.5 rounded-[1.75rem] mb-10 border border-white/5">
          <button 
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] transition-all ${isLogin ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
          >
            Login
          </button>
          <button 
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Full Identity</label>
              <input 
                type="text" 
                required 
                placeholder="Enter your name"
                className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-3xl text-white font-bold outline-none focus:border-indigo-500 transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Email Address</label>
            <input 
              type="email" 
              required 
              placeholder="name@company.com"
              className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-3xl text-white font-bold outline-none focus:border-indigo-500 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Phone Number</label>
              <input 
                type="tel" 
                placeholder="+91..."
                className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-3xl text-white font-bold outline-none focus:border-indigo-500 transition-all"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Security Key</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                required 
                placeholder="••••••••"
                className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-3xl text-white font-bold outline-none focus:border-indigo-500 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2"/></svg>
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-rose-500 text-xs font-bold text-center mt-4">{error}</p>}

          <button 
            type="submit" 
            className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-indigo-900/50 hover:bg-indigo-500 hover:-translate-y-1 transition-all active:scale-95"
          >
            {isLogin ? 'Enter System' : 'Create Account'}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
            Protected by TexFlow Biometrics
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

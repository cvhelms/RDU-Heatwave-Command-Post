
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Flame, LogIn } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(username, password);
    if (!success) {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center mb-12">
          <div className="bg-red-600 p-4 rounded-2xl mb-4 shadow-lg shadow-red-900/40">
            <Flame className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">RDU Heatwave</h1>
          <p className="text-red-400 font-bold uppercase text-xs tracking-[0.2em] mt-2">Command Center</p>
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl p-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-red-200"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-red-200"
                required
              />
            </div>
            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
            <button
              type="submit"
              className="w-full p-6 bg-slate-900 text-white rounded-[1.5rem] font-black italic uppercase tracking-tighter shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <LogIn className="w-5 h-5" />
              Secure Login
            </button>
          </form>
        </div>
        <p className="text-center text-slate-600 text-xs font-bold mt-8">
            Access restricted to authorized personnel.
        </p>
      </div>
    </div>
  );
};

export default Login;

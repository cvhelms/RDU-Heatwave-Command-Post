
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { User as UserType } from '../types';

const UserManagement: React.FC = () => {
  const { users, addUser, deleteUser, user: currentUser } = useAuth();
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'super-admin'>('admin');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) {
      alert('Username and password are required.');
      return;
    }
    const success = addUser({ username: newUsername, password: newPassword, role: newRole });
    if (success) {
      setNewUsername('');
      setNewPassword('');
      setNewRole('admin');
    }
  };

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <Plus className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-black italic uppercase text-slate-900">Add New User</h3>
        </div>
        <form onSubmit={handleAddUser} className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as 'admin' | 'super-admin')}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="admin">Admin</option>
              <option value="super-admin">Super Admin</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-red-600 text-white py-3 rounded-xl font-black italic uppercase"
          >
            Create User
          </button>
        </form>
      </section>

      <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-black italic uppercase text-slate-900">System Users</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="p-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black uppercase text-red-600">
                  {u.username.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-900 capitalize">{u.username}</p>
                  <p className="text-xs text-slate-500 capitalize">{u.role}</p>
                </div>
              </div>
              {currentUser?.id !== u.id && (
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete the user "${u.username}"?`)) {
                      deleteUser(u.id);
                    }
                  }}
                  className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default UserManagement;

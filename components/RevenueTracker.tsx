
import React, { useState } from 'react';
import { RevenueRecord, Referral, Member } from '../types';
import { DollarSign, Plus, Trophy, ArrowUpRight } from 'lucide-react';

interface RevenueTrackerProps {
  revenue: RevenueRecord[];
  setRevenue: React.Dispatch<React.SetStateAction<RevenueRecord[]>>;
  referrals: Referral[];
  members: Member[];
  viewOnly?: boolean;
}

const RevenueTracker: React.FC<RevenueTrackerProps> = ({ revenue, setRevenue, referrals, members, viewOnly }) => {
  const [showForm, setShowForm] = useState(false);
  const [newRev, setNewRev] = useState<Partial<RevenueRecord>>({
    date: new Date().toISOString().split('T')[0]
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const record: RevenueRecord = {
      id: Date.now().toString(),
      date: newRev.date || '',
      amount: Number(newRev.amount) || 0,
      referralId: newRev.referralId || 'N/A',
      memberId: newRev.memberId || ''
    };
    setRevenue([record, ...revenue]);
    setShowForm(false);
  };

  const totalClosed = revenue.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-red-600 to-orange-500 rounded-3xl p-8 text-white shadow-xl shadow-red-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-red-100 font-medium mb-1 uppercase text-xs tracking-widest">Team Performance Revenue</p>
              <h2 className="text-5xl font-black">${totalClosed.toLocaleString()}</h2>
            </div>
            <Trophy className="w-12 h-12 text-white/30" />
          </div>
          {!viewOnly && (
            <div className="mt-8 flex gap-4">
              <button 
                onClick={() => setShowForm(!showForm)}
                className="px-6 py-3 bg-white text-red-600 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Revenue Record
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-4">Top Producer</h4>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center font-bold">1</div>
              <div>
                <p className="font-bold text-slate-900 leading-none mb-1">{members[0]?.name || '---'}</p>
                <p className="text-xs text-slate-500">{members[0]?.companyName || '---'}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-end">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Produced</span>
            <span className="text-xl font-black text-slate-900 tracking-tighter leading-none">${revenue.filter(r => r.memberId === members[0]?.id).reduce((s, c) => s + c.amount, 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {showForm && !viewOnly && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-red-100 shadow-xl animate-in fade-in zoom-in duration-300">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-red-600" />
            New Revenue Record
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
              <input 
                type="number" 
                required 
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500"
                onChange={e => setNewRev({...newRev, amount: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Received By</label>
              <select 
                required 
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500"
                onChange={e => setNewRev({...newRev, memberId: e.target.value})}
              >
                <option value="">Select Member</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Related Referral</label>
              <select 
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500"
                onChange={e => setNewRev({...newRev, referralId: e.target.value})}
              >
                <option value="None">Direct / None</option>
                {referrals.map(r => <option key={r.id} value={r.id}>Ref #{r.id.substr(0,4)}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors">
                Save Record
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 font-black italic tracking-tighter uppercase text-slate-800">Historical Transactions</div>
        <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto custom-scrollbar">
          {revenue.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No revenue records found.</div>
          ) : (
            revenue.map(r => {
              const member = members.find(m => m.id === r.memberId);
              return (
                <div key={r.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 p-2 rounded-xl">
                      <ArrowUpRight className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 uppercase italic tracking-tighter">{member?.name || 'External Revenue'}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{r.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900 tracking-tighter leading-none mb-1">${r.amount.toLocaleString()}</p>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Log #{r.id.substr(0, 8)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueTracker;

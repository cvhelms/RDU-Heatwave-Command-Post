import React, { useState, useMemo } from 'react';
import { Referral, Member, ReferralType, RevenueRecord, ReferralStatus } from '../types';
import { 
  Plus, 
  Handshake, 
  ChevronRight, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  DollarSign, 
  Trophy, 
  ArrowUpRight,
  TrendingUp,
  LayoutList,
  X,
  Award
} from 'lucide-react';

interface ReferralLogProps {
  referrals: Referral[];
  setReferrals: React.Dispatch<React.SetStateAction<Referral[]>>;
  members: Member[];
  revenue: RevenueRecord[];
  setRevenue: React.Dispatch<React.SetStateAction<RevenueRecord[]>>;
  viewOnly?: boolean;
}

type ActivityFilter = '12m' | 'ytd' | 'last-quarter' | 'qtd' | 'last-month' | 'mtd' | 'last-week' | string;


const ReferralLog: React.FC<ReferralLogProps> = ({ referrals, setReferrals, members, revenue, setRevenue, viewOnly }) => {
  const [activeSubTab, setActiveSubTab] = useState<'log' | 'revenue'>('log');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('12m');
  
  const updateReferralStatus = (id: string, newStatus: ReferralStatus) => {
    setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };
  
  const referralYears = useMemo(() => {
    const years = new Set(referrals.map(r => new Date(r.date).getFullYear()));
    // FIX: Removed stale comment and simplified sort for numbers.
    // FIX: Explicitly cast sort parameters to Number to resolve arithmetic operation error.
    return Array.from(years).sort((a: number, b: number) => b - a);
  }, [referrals]);

  const filteredHistory = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date | null = new Date();

    const getFirstDayOfQuarter = (d: Date) => new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);

    if (!isNaN(parseInt(activityFilter))) { // Year filter
        startDate = new Date(parseInt(activityFilter), 0, 1);
        endDate = new Date(parseInt(activityFilter), 11, 31);
    } else {
        switch(activityFilter) {
            case 'last-week':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 6);
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
                break;
            case 'last-month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'mtd':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'qtd':
                startDate = getFirstDayOfQuarter(now);
                break;
            case 'last-quarter':
                const currentQuarter = Math.floor((now.getMonth() / 3));
                const lastQuarterYear = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
                const lastQuarterStartMonth = currentQuarter === 0 ? 9 : (currentQuarter - 1) * 3;
                startDate = new Date(lastQuarterYear, lastQuarterStartMonth, 1);
                endDate = new Date(lastQuarterYear, lastQuarterStartMonth + 3, 0);
                break;
            case 'ytd':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case '12m':
            default:
                startDate = new Date();
                startDate.setMonth(now.getMonth() - 12);
                break;
        }
    }

    startDate.setHours(0, 0, 0, 0);
    if(endDate) endDate.setHours(23, 59, 59, 999);
    else endDate = new Date();

    return referrals.filter(r => {
        const itemDate = new Date(r.date);
        return itemDate >= startDate && itemDate <= (endDate as Date);
    });
  }, [referrals, activityFilter]);


  const pendingReferrals = referrals.filter(r => r.status === 'New' || r.status === 'In Progress');

  const teamRevenueStats = useMemo(() => {
    const activeMembers = members.filter(m => m.status === 'Active');
    const stats = activeMembers.map(member => {
        const givenRev = revenue.filter(r => {
            const ref = referrals.find(ref => ref.id === r.referralId);
            return ref && ref.fromMemberId === member.id;
        }).reduce((sum, r) => sum + r.amount, 0);
        
        const earnedRev = revenue.filter(r => r.memberId === member.id).reduce((sum, r) => sum + r.amount, 0);

        return { member, givenRev, earnedRev, total: givenRev + earnedRev };
    });
    return stats.sort((a, b) => b.total - a.total);
  }, [members, revenue, referrals]);

  const totalTeamRevenue = useMemo(() => teamRevenueStats.reduce((sum, s) => sum + s.earnedRev, 0), [teamRevenueStats]);

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-200/50 p-1.5 rounded-[1.5rem] w-full max-w-md mx-auto sm:mx-0">
        <button 
          onClick={() => setActiveSubTab('log')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeSubTab === 'log' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <LayoutList className="w-4 h-4" /> Referral Tracking
        </button>
        <button 
          onClick={() => setActiveSubTab('revenue')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeSubTab === 'revenue' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <DollarSign className="w-4 h-4" /> Closed Revenue
        </button>
      </div>

      {activeSubTab === 'log' ? (
        <div className="space-y-10 animate-in fade-in duration-300">
          <section className="bg-white rounded-[2.5rem] shadow-xl border border-red-100 overflow-hidden">
            <div className="bg-slate-900 p-8 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-red-600 p-3 rounded-2xl">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tighter uppercase text-white leading-none">The Pending Board</h2>
                  <p className="text-red-400 font-bold uppercase text-[10px] tracking-widest mt-2">Active Leads Awaiting Outcome</p>
                </div>
              </div>
              <div className="bg-slate-800 px-4 py-2 rounded-xl text-white font-black text-sm uppercase italic">
                {pendingReferrals.length} OPEN REFERRALS
              </div>
            </div>
            
            <div className="p-8">
              {pendingReferrals.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                  All Referrals are closed out. Team Heatwave is efficient!
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingReferrals.map((r) => {
                    const from = members.find(m => m.id === r.fromMemberId);
                    const to = members.find(m => m.id === r.toMemberId);
                    return (
                      <div key={r.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:shadow-lg transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-lg font-black text-slate-900 uppercase italic tracking-tighter truncate">{r.prospectName}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{r.date}</p>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] font-bold">
                            <span className="text-slate-800 uppercase italic tracking-tighter">{from?.name}</span>
                            <ChevronRight className="w-4 h-4 text-red-600 mx-2" />
                            <span className="text-slate-800 uppercase italic tracking-tighter">{to?.name}</span>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                           {[ { id: 'In Progress', active: 'bg-blue-600 text-white' }, { id: 'Closed Business', active: 'bg-green-600 text-white' }, { id: 'Dead', active: 'bg-red-600 text-white' } ].map(opt => (
                             <button 
                               key={opt.id} 
                               onClick={() => updateReferralStatus(r.id, opt.id as ReferralStatus)}
                               className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all ${r.status === opt.id ? opt.active : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'}`}
                             >
                               {opt.id}
                             </button>
                           ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h2 className="text-xl font-black italic tracking-tighter uppercase text-slate-800 leading-none">Activity Log</h2>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Historical Referral Transactions</p>
              </div>
              <select value={activityFilter} onChange={e => setActivityFilter(e.target.value as ActivityFilter)} className="bg-white p-3 rounded-lg text-[10px] font-black uppercase border border-slate-200 focus:ring-red-500 focus:border-red-500">
                <optgroup label="Standard Periods">
                    <option value="12m">Rolling 12 Mos.</option>
                    <option value="ytd">Year to Date</option>
                    <option value="last-quarter">Last Quarter</option>
                    <option value="qtd">Quarter to Date</option>
                    <option value="last-month">Last Month</option>
                    <option value="mtd">Month to Date</option>
                    <option value="last-week">Last Week</option>
                </optgroup>
                {referralYears.length > 0 && <optgroup label="By Year">{referralYears.map(y => <option key={y} value={String(y)}>{y}</option>)}</optgroup>}
              </select>
            </div>
            <div className="divide-y divide-slate-50">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-20 bg-white">
                  <Handshake className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Log is currently empty</p>
                </div>
              ) : (
                filteredHistory.map((r) => {
                  const from = members.find(m => m.id === r.fromMemberId);
                  const to = members.find(m => m.id === r.toMemberId);
                  return (
                    <div key={r.id} className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between hover:bg-slate-50/50 transition-colors gap-4">
                      <div className="flex items-center gap-6 flex-1 overflow-hidden">
                        <div className="text-[10px] font-black text-slate-400 bg-slate-50 w-24 text-center py-2.5 rounded-xl border border-slate-100 shrink-0 uppercase italic">
                          {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="flex flex-col gap-1 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prospect:</span>
                            <span className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">{r.prospectName}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">{from?.name || 'Unknown'}</span>
                            <ChevronRight className="w-3 h-3 text-red-400" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">{to?.name || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg border ${ r.status === 'Closed Business' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100' }`}>
                          {r.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
           <div className="bg-gradient-to-br from-red-600 to-orange-500 rounded-3xl p-8 text-white shadow-xl shadow-red-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-red-100 font-medium mb-1 uppercase text-xs tracking-widest">Total Team Revenue (YTD)</p>
                  <h2 className="text-5xl font-black tracking-tighter italic">${totalTeamRevenue.toLocaleString()}</h2>
                </div>
                <Trophy className="w-12 h-12 text-white/30" />
              </div>
            </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center gap-3">
               <TrendingUp className="w-6 h-6 text-red-600" />
               <h3 className="font-black italic tracking-tighter uppercase text-slate-800 text-xl leading-none">Team Revenue Leaderboard</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Revenue Given</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Revenue Earned</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamRevenueStats.map((stat, index) => (
                    <tr key={stat.member.id} className={`${index < 3 ? 'bg-amber-50' : 'hover:bg-slate-50/50'}`}>
                      <td className="px-6 py-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${index < 3 ? 'bg-amber-400 text-white border-2 border-white' : 'bg-slate-100 text-slate-500'}`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <p className="font-black text-slate-900 uppercase italic tracking-tighter">{stat.member.name}</p>
                         <p className="text-[10px] text-slate-500 font-bold">{stat.member.companyName}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-sm text-slate-600">${stat.givenRev.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-sm text-slate-600">${stat.earnedRev.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-black text-lg text-slate-900">${stat.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ReferralLog;
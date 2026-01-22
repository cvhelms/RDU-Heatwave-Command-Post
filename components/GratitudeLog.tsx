
import React, { useState, useMemo } from 'react';
import { GratitudeIncentive, Member } from '../types';
import { Gift } from 'lucide-react';

interface GratitudeLogProps {
  incentives: GratitudeIncentive[];
  members: Member[];
}

const GratitudeLog: React.FC<GratitudeLogProps> = ({ incentives, members }) => {
  const [filter, setFilter] = useState('ytd');

  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    const endDate = new Date();

    switch (filter) {
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate.setDate(0);
        break;
      case 'qtd':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case '12m':
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 12);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      case 'ytd':
      default:
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    return incentives.filter(i => {
      const itemDate = new Date(i.date);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [incentives, filter]);

  const memberStats = useMemo(() => {
    return members
      .filter(m => m.status === 'Active')
      .map(member => {
        const cgi = filteredData.filter(i => i.fromMemberId === member.id && i.type === 'Corporate').reduce((sum, i) => sum + i.amount, 0);
        const mgi = filteredData.filter(i => i.fromMemberId === member.id && i.type === 'Member').reduce((sum, i) => sum + i.amount, 0);
        return { member, cgi, mgi };
      })
      .sort((a, b) => (b.cgi + b.mgi) - (a.cgi + a.mgi));
  }, [members, filteredData]);
  
  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Gift className="w-6 h-6 text-red-600 shrink-0" />
          <h2 className="text-xl font-black italic tracking-tighter uppercase text-slate-800">Gratitude Report</h2>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-white p-3 rounded-lg text-[10px] font-black uppercase border border-slate-200 focus:ring-red-500 focus:border-red-500">
            <option value="ytd">Year to Date</option>
            <option value="12m">Rolling 12 Mos.</option>
            <option value="qtd">Quarter to Date</option>
            <option value="last-month">Last Month</option>
            <option value="all">All Time</option>
        </select>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left min-w-[640px]">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Member</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Corporate GI</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Member GI</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {memberStats.map(({ member, cgi, mgi }) => (
              <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-black text-slate-900 uppercase italic tracking-tighter">{member.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">{member.professionalClassification}</p>
                </td>
                <td className="px-6 py-4 text-right font-bold text-lg text-slate-600">{cgi}</td>
                <td className="px-6 py-4 text-right font-bold text-lg text-slate-600">{mgi}</td>
                <td className="px-6 py-4 text-right font-black text-xl text-slate-900">{cgi + mgi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GratitudeLog;

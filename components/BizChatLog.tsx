
import React, { useState, useMemo } from 'react';
import { BizChat, Member } from '../types';
import { MessageSquare } from 'lucide-react';

interface BizChatLogProps {
  bizChats: BizChat[];
  members: Member[];
}

const BizChatLog: React.FC<BizChatLogProps> = ({ bizChats, members }) => {
  const [filter, setFilter] = useState('ytd');

  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    const endDate = new Date(); // up to today

    switch (filter) {
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate.setDate(0); // end of last month
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
    
    return bizChats.filter(b => {
        const itemDate = new Date(b.date);
        return itemDate >= startDate && itemDate <= endDate;
    });
  }, [bizChats, filter]);

  const memberStats = useMemo(() => {
    return members
      .filter(m => m.status === 'Active')
      .map(member => {
        const count = filteredData.filter(b => b.member1Id === member.id || b.member2Id === member.id).length;
        return { member, count };
      })
      .sort((a, b) => b.count - a.count);
  }, [members, filteredData]);
  
  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <MessageSquare className="w-6 h-6 text-red-600 shrink-0" />
          <h2 className="text-xl font-black italic tracking-tighter uppercase text-slate-800">BizChat Report</h2>
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
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">BizChats Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {memberStats.map(({ member, count }) => (
              <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-black text-slate-900 uppercase italic tracking-tighter">{member.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">{member.professionalClassification}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-black text-2xl text-slate-800 tracking-tighter">{count}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BizChatLog;

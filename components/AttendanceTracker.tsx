
import React, { useState } from 'react';
import { Attendance, Member, AttendanceStatus } from '../types';
import { Calendar, ShieldAlert, LayoutGrid, List } from 'lucide-react';

interface AttendanceTrackerProps {
  attendance: Attendance[];
  members: Member[];
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ attendance, members }) => {
  const [viewMode, setViewMode] = useState<'list' | 'tile'>('list');

  const getRollingAbsences = (memberId: string) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

    const rolling = attendance.filter(a => a.memberId === memberId && a.date >= sixMonthsAgoStr);
    const absences = rolling.filter(a => a.status === AttendanceStatus.ABSENT).length;
    const subs = rolling.filter(a => a.status === AttendanceStatus.SUBSTITUTE).length;
    return { absences, subs };
  };

  const renderListView = () => (
    <div className="relative">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left min-w-[640px]">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Member</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-12">Performance Audit (6-Month Rolling)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.filter(m => m.status === 'Active').map(member => {
              const rolling = getRollingAbsences(member.id);
              return (
                <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-900 uppercase italic tracking-tighter">{member.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">{member.professionalClassification}</p>
                  </td>
                  <td className="px-6 py-4 text-right pr-12">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                         <span className={`text-xs font-black uppercase tracking-tighter ${rolling.absences >= 4 ? 'text-red-600' : 'text-slate-700'}`}>
                           {rolling.absences} / 4 Absences
                         </span>
                         {rolling.absences >= 3 && <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />}
                      </div>
                      <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        {rolling.subs} Subs Used
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none lg:hidden" />
    </div>
  );

  const renderTileView = () => (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {members.filter(m => m.status === 'Active').map(member => {
        const rolling = getRollingAbsences(member.id);
        const absenceColor = rolling.absences >= 4 ? 'bg-red-100 border-red-200' : rolling.absences === 3 ? 'bg-amber-50 border-amber-200' : 'bg-white';
        return (
          <div key={member.id} className={`p-6 rounded-[2rem] border shadow-sm ${absenceColor}`}>
            <p className="font-black text-slate-900 uppercase italic tracking-tighter text-lg">{member.name}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60 mb-4">{member.professionalClassification}</p>
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">Absences (6mo)</span>
                <span className={`font-black ${rolling.absences >= 4 ? 'text-red-600' : 'text-slate-800'}`}>{rolling.absences} / 4</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">Substitutes Used</span>
                <span className="font-black text-slate-800">{rolling.subs}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Calendar className="w-6 h-6 text-red-600 shrink-0" />
          <h2 className="text-xl font-black italic tracking-tighter uppercase text-slate-800">Team Attendance Report</h2>
        </div>
        <div className="flex bg-slate-200/50 p-1 rounded-xl">
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-red-600' : 'text-slate-400'}`}><List className="w-5 h-5" /></button>
          <button onClick={() => setViewMode('tile')} className={`p-2 rounded-lg transition-all ${viewMode === 'tile' ? 'bg-white shadow-sm text-red-600' : 'text-slate-400'}`}><LayoutGrid className="w-5 h-5" /></button>
        </div>
      </div>
      {viewMode === 'list' ? renderListView() : renderTileView()}
    </div>
  );
};

export default AttendanceTracker;

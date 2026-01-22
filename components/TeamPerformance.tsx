
import React, { useState, useMemo } from 'react';
import { 
  Referral, 
  Member, 
  RevenueRecord, 
  ReferralStatus, 
  Attendance, 
  AttendanceStatus, 
  BizChat, 
  GratitudeIncentive 
} from '../types';
import { 
  Handshake, 
  Calendar, 
  MessageSquare, 
  Gift, 
  ChevronRight, 
  DollarSign, 
  Trophy, 
  LayoutList, 
  Clock,
  TrendingUp,
  ShieldAlert,
  LayoutGrid,
  List,
  Kanban
} from 'lucide-react';

// --- PROPS INTERFACE --- //
interface TeamPerformanceProps {
  referrals: Referral[];
  setReferrals: React.Dispatch<React.SetStateAction<Referral[]>>;
  members: Member[];
  revenue: RevenueRecord[];
  setRevenue: React.Dispatch<React.SetStateAction<RevenueRecord[]>>;
  attendance: Attendance[];
  bizChats: BizChat[];
  incentives: GratitudeIncentive[];
}

// --- REFERRAL SECTION --- //
type ActivityFilter = '12m' | 'ytd' | 'last-quarter' | 'qtd' | 'last-month' | 'mtd' | 'last-week' | string;

const ReferralSection: React.FC<Omit<TeamPerformanceProps, 'attendance' | 'bizChats' | 'incentives'>> = ({ referrals, setReferrals, members, revenue }) => {
  const [activeSubTab, setActiveSubTab] = useState<'pipeline' | 'revenue' | 'log'>('pipeline');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('12m');
  
  const handleStatusUpdate = (id: string, newStatus: ReferralStatus) => {
    setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, statusUpdateDate: new Date().toISOString() } : r));
  };
  
  const referralYears = useMemo(() => {
    const years = new Set(referrals.map(r => new Date(r.date).getFullYear()));
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [referrals]);

  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date | null = new Date();
    const getFirstDayOfQuarter = (d: Date) => new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);

    if (!isNaN(parseInt(activityFilter))) {
        startDate = new Date(parseInt(activityFilter), 0, 1);
        endDate = new Date(parseInt(activityFilter), 11, 31);
    } else {
        switch(activityFilter) {
            case 'last-week': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 6); endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()); break;
            case 'last-month': startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); endDate = new Date(now.getFullYear(), now.getMonth(), 0); break;
            case 'mtd': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
            case 'qtd': startDate = getFirstDayOfQuarter(now); break;
            case 'last-quarter': const cQ = Math.floor((now.getMonth()/3)); startDate = new Date(cQ === 0 ? now.getFullYear()-1 : now.getFullYear(), cQ === 0 ? 9 : (cQ-1)*3, 1); endDate = new Date(cQ === 0 ? now.getFullYear()-1 : now.getFullYear(), cQ === 0 ? 12 : (cQ-1)*3+3, 0); break;
            case 'ytd': startDate = new Date(now.getFullYear(), 0, 1); break;
            case '12m': default: startDate = new Date(); startDate.setMonth(now.getMonth() - 12); break;
        }
    }
    startDate.setHours(0,0,0,0);
    if(endDate) endDate.setHours(23,59,59,999); else endDate = new Date();
    
    const filterByDate = (itemDate: string) => { const d = new Date(itemDate); return d >= startDate && d <= (endDate as Date); };
    return {
      referrals: referrals.filter(r => filterByDate(r.date)),
      revenue: revenue.filter(r => filterByDate(r.date))
    }
  }, [referrals, revenue, activityFilter]);

  const kanbanReferrals = useMemo(() => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const isRecent = (ref: Referral) => {
        if (!ref.statusUpdateDate) return true;
        return new Date(ref.statusUpdateDate) > ninetyDaysAgo;
    };

    return {
        'New': referrals.filter(r => r.status === 'New'),
        'In Progress': referrals.filter(r => r.status === 'In Progress'),
        'Closed Business': referrals.filter(r => r.status === 'Closed Business' && isRecent(r)),
        'Dead': referrals.filter(r => r.status === 'Dead' && isRecent(r)),
    };
  }, [referrals]);
  
  const teamRevenueStats = useMemo(() => {
    const activeMembers = members.filter(m => m.status === 'Active');
    const stats = activeMembers.map(member => {
        const givenRev = filteredData.revenue.filter(r => filteredData.referrals.find(ref => ref.id === r.referralId && ref.fromMemberId === member.id)).reduce((sum, r) => sum + r.amount, 0);
        const earnedRev = filteredData.revenue.filter(r => r.memberId === member.id).reduce((sum, r) => sum + r.amount, 0);
        return { member, givenRev, earnedRev };
    });
    return stats.sort((a, b) => b.givenRev - a.givenRev);
  }, [members, filteredData]);
  
  const revenueMetrics = useMemo(() => {
    const ytdRevenue = revenue.filter(r => new Date(r.date).getFullYear() === new Date().getFullYear()).reduce((s, r) => s + r.amount, 0);
    const twelveMonthAgo = new Date();
    twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12);
    const rolling12mRevenue = revenue.filter(r => new Date(r.date) >= twelveMonthAgo).reduce((s, r) => s + r.amount, 0);
    return { ytd: ytdRevenue, rolling12m: rolling12mRevenue };
  }, [revenue]);
  
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("referralId", id);
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, status: ReferralStatus) => {
    const id = e.dataTransfer.getData("referralId");
    handleStatusUpdate(id, status);
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] w-full max-w-xl">
        <button onClick={() => setActiveSubTab('pipeline')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeSubTab === 'pipeline' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}><Kanban className="w-4 h-4" />Referral Pipeline</button>
        <button onClick={() => setActiveSubTab('revenue')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeSubTab === 'revenue' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}><DollarSign className="w-4 h-4" />Revenue Leaderboard</button>
        <button onClick={() => setActiveSubTab('log')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeSubTab === 'log' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}><LayoutList className="w-4 h-4" />Activity Log</button>
      </div>
      
      {activeSubTab === 'pipeline' && (
        <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 min-h-[600px] animate-in fade-in duration-300">
          {(['New', 'In Progress', 'Closed Business', 'Dead'] as ReferralStatus[]).map(status => (
            <div key={status} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)} className="w-80 flex-shrink-0 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col">
              <div className={`p-5 border-b-4 ${status==='New'?'border-amber-400':status==='In Progress'?'border-blue-400':status==='Closed Business'?'border-green-400':'border-red-400'} rounded-t-[2rem]`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-black uppercase italic tracking-tighter text-slate-800">{status}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-black text-white ${status==='New'?'bg-amber-400':status==='In Progress'?'bg-blue-400':status==='Closed Business'?'bg-green-400':'bg-red-400'}`}>{kanbanReferrals[status].length}</span>
                </div>
                {(status === 'Closed Business' || status === 'Dead') && <p className="text-xs text-slate-400 font-bold mt-1">Rolling 90 Days</p>}
              </div>
              <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                {kanbanReferrals[status].map(ref => {
                  const from = members.find(m => m.id === ref.fromMemberId);
                  const to = members.find(m => m.id === ref.toMemberId);
                  return (
                    <div key={ref.id} draggable onDragStart={(e) => handleDragStart(e, ref.id)} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-md cursor-grab active:cursor-grabbing">
                      <p className="font-black uppercase italic text-sm text-slate-900 tracking-tighter mb-2">{ref.prospectName}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-bold"><span className="truncate">{from?.name}</span><ChevronRight className="w-3 h-3 text-red-400 shrink-0" /><span className="truncate">{to?.name}</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {activeSubTab === 'revenue' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-red-600 to-orange-500 rounded-3xl p-8 text-white shadow-xl shadow-red-200">
                <p className="text-red-100 font-medium mb-1 uppercase text-xs tracking-widest">Total YTD Revenue</p>
                <h2 className="text-4xl lg:text-5xl font-black tracking-tighter italic">${revenueMetrics.ytd.toLocaleString()}</h2>
            </div>
             <div className="bg-slate-800 rounded-3xl p-8 text-white shadow-xl shadow-slate-200">
                <p className="text-slate-400 font-medium mb-1 uppercase text-xs tracking-widest">Rolling 12-Month Revenue</p>
                <h2 className="text-4xl lg:text-5xl font-black tracking-tighter italic">${revenueMetrics.rolling12m.toLocaleString()}</h2>
            </div>
          </div>
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3"><TrendingUp className="w-6 h-6 text-red-600" /><h3 className="font-black italic tracking-tighter uppercase text-slate-800 text-lg md:text-xl leading-none">Revenue Leaderboard</h3></div>
              <select value={activityFilter} onChange={e=>setActivityFilter(e.target.value as ActivityFilter)} className="bg-white p-3 rounded-lg text-xs font-black uppercase border border-slate-200"><optgroup label="Standard Periods"><option value="12m">Rolling 12 Mos.</option><option value="ytd">Year to Date</option><option value="last-quarter">Last Quarter</option><option value="qtd">Quarter to Date</option><option value="last-month">Last Month</option><option value="mtd">Month to Date</option><option value="last-week">Last Week</option></optgroup>{referralYears.length>0&&<optgroup label="By Year">{referralYears.map(y=><option key={y} value={String(y)}>{y}</option>)}</optgroup>}</select>
            </div>
            <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 border-b border-slate-100"><tr><th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Rank</th><th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Member</th><th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Revenue Given</th><th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Revenue Earned</th></tr></thead><tbody className="divide-y divide-slate-100">{teamRevenueStats.map((stat,index)=>(<tr key={stat.member.id} className={`${index<3?'bg-amber-50':'hover:bg-slate-50/50'}`}><td className="px-6 py-4"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${index<3?'bg-amber-400 text-white border-2 border-white':'bg-slate-100 text-slate-500'}`}>{index+1}</div></td><td className="px-6 py-4"><p className="font-black text-slate-900 uppercase italic tracking-tighter">{stat.member.name}</p><p className="text-xs text-slate-500 font-bold">{stat.member.companyName}</p></td><td className="px-6 py-4 text-right font-black text-lg text-slate-900">${stat.givenRev.toLocaleString()}</td><td className="px-6 py-4 text-right font-bold text-lg text-slate-600">${stat.earnedRev.toLocaleString()}</td></tr>))}</tbody></table></div></div>
        </div>
      )}

      {activeSubTab === 'log' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h2 className="text-lg md:text-xl font-black italic tracking-tighter uppercase text-slate-800 leading-none">Activity Log</h2>
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-2">Historical Transactions</p>
              </div>
              <select value={activityFilter} onChange={e=>setActivityFilter(e.target.value as ActivityFilter)} className="bg-white p-3 rounded-lg text-xs font-black uppercase border border-slate-200"><optgroup label="Standard Periods"><option value="12m">Rolling 12 Mos.</option><option value="ytd">Year to Date</option><option value="last-quarter">Last Quarter</option><option value="qtd">Quarter to Date</option><option value="last-month">Last Month</option><option value="mtd">Month to Date</option><option value="last-week">Last Week</option></optgroup>{referralYears.length>0&&<optgroup label="By Year">{referralYears.map(y=><option key={y} value={String(y)}>{y}</option>)}</optgroup>}</select>
            </div>
            <div className="divide-y divide-slate-50">{filteredData.referrals.length===0?<div className="text-center py-20 bg-white"><Handshake className="w-16 h-16 text-slate-100 mx-auto mb-4" /><p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Log is empty</p></div>:filteredData.referrals.map((r)=>{const from=members.find(m=>m.id===r.fromMemberId);const to=members.find(m=>m.id===r.toMemberId);return(<div key={r.id} className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"><div className="flex items-center gap-6 flex-1 overflow-hidden"><div className="text-xs font-black text-slate-400 bg-slate-50 w-24 text-center py-2.5 rounded-xl border border-slate-100 shrink-0 uppercase italic">{new Date(r.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div><div className="flex flex-col gap-1 overflow-hidden"><div className="flex items-center gap-2"><span className="text-xs font-black text-slate-400 uppercase tracking-widest">Prospect:</span><span className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">{r.prospectName}</span></div><div className="flex items-center gap-3"><span className="text-xs font-bold text-slate-500 uppercase tracking-tight truncate">{from?.name||'Unknown'}</span><ChevronRight className="w-3 h-3 text-red-400" /><span className="text-xs font-bold text-slate-500 uppercase tracking-tight truncate">{to?.name||'Unknown'}</span></div></div></div><div className="flex items-center gap-3"><span className={`text-xs font-black px-3 py-1.5 rounded-lg border ${r.status==='Closed Business'?'bg-green-50 text-green-700 border-green-100':'bg-orange-50 text-orange-700 border-orange-100'}`}>{r.status.toUpperCase()}</span></div></div>)})}</div>
          </section>
        </div>
      )}
    </div>
  );
};

// --- ATTENDANCE SECTION --- //
const AttendanceSection: React.FC<Omit<TeamPerformanceProps, 'referrals' | 'setReferrals' | 'revenue' | 'setRevenue' | 'bizChats' | 'incentives'>> = ({ attendance, members }) => {
  const [viewMode, setViewMode] = useState<'list' | 'tile'>('list');
  const getRollingAbsences = (memberId: string) => {
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const rolling = attendance.filter(a => a.memberId === memberId && new Date(a.date) >= sixMonthsAgo);
    return { absences: rolling.filter(a => a.status === AttendanceStatus.ABSENT).length, subs: rolling.filter(a => a.status === AttendanceStatus.SUBSTITUTE).length };
  };
  const activeMembers = members.filter(m => m.status === 'Active');
  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center"><div className="flex items-center gap-3"><h2 className="text-lg md:text-xl font-black italic tracking-tighter uppercase text-slate-800">Attendance Audit</h2></div><div className="flex bg-slate-100 p-1 rounded-xl"><button onClick={()=>setViewMode('list')} className={`p-2 rounded-lg ${viewMode==='list'?'bg-white shadow text-red-600':'text-slate-400'}`}><List className="w-5 h-5"/></button><button onClick={()=>setViewMode('tile')} className={`p-2 rounded-lg ${viewMode==='tile'?'bg-white shadow text-red-600':'text-slate-400'}`}><LayoutGrid className="w-5 h-5"/></button></div></div>
      {viewMode === 'list' ? (
        <div className="overflow-x-auto"><table className="w-full text-left min-w-[640px]"><thead className="bg-slate-50 border-b border-slate-100"><tr><th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Member</th><th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right pr-12">6-Month Rolling</th></tr></thead><tbody className="divide-y divide-slate-100">{activeMembers.map(m=>{const r=getRollingAbsences(m.id);return(<tr key={m.id}><td className="px-6 py-4"><p className="font-black text-slate-900 uppercase italic">{m.name}</p><p className="text-xs text-slate-500 font-bold">{m.professionalClassification}</p></td><td className="px-6 py-4 text-right pr-12"><div className="flex flex-col items-end gap-1"><div className="flex items-center gap-2"><span className={`text-sm font-black uppercase ${r.absences>=4?'text-red-600':'text-slate-700'}`}>{r.absences}/4 Absences</span>{r.absences>=3&&<ShieldAlert className="w-4 h-4 text-red-600 animate-pulse"/>}</div><span className="text-xs font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">{r.subs} Subs Used</span></div></td></tr>)})}</tbody></table></div>
      ) : (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">{activeMembers.map(m=>{const r=getRollingAbsences(m.id);const c=r.absences>=4?'bg-red-100 border-red-200':r.absences===3?'bg-amber-50 border-amber-200':'bg-white';return(<div key={m.id} className={`p-6 rounded-[2rem] border shadow-sm ${c}`}><p className="font-black text-slate-900 uppercase italic text-lg">{m.name}</p><p className="text-xs text-slate-500 font-bold uppercase tracking-widest opacity-60 mb-4">{m.professionalClassification}</p><div className="space-y-2 pt-4 border-t border-slate-100"><div className="flex justify-between items-center text-sm"><span className="font-bold text-slate-500">Absences (6mo)</span><span className={`font-black ${r.absences>=4?'text-red-600':'text-slate-800'}`}>{r.absences}/4</span></div><div className="flex justify-between items-center text-sm"><span className="font-bold text-slate-500">Subs Used</span><span className="font-black text-slate-800">{r.subs}</span></div></div></div>)})}</div>
      )}
    </div>
  );
};

// --- BIZCHAT SECTION --- //
const BizChatSection: React.FC<Omit<TeamPerformanceProps, 'referrals'|'setReferrals'|'revenue'|'setRevenue'|'attendance'|'incentives'>> = ({ bizChats, members }) => {
  const [filter, setFilter] = useState('12m');
  const filteredData=useMemo(()=>{const n=new Date();let s:Date;const e=new Date();switch(filter){case'last-month':s=new Date(n.getFullYear(),n.getMonth()-1,1);e.setDate(0);break;case'qtd':s=new Date(n.getFullYear(),Math.floor(n.getMonth()/3)*3,1);break;case'12m':s=new Date();s.setMonth(n.getMonth()-12);break;case'all':s=new Date(0);break;case'ytd':default:s=new Date(n.getFullYear(),0,1)}return bizChats.filter(b=>{const d=new Date(b.date);return d>=s&&d<=e})},[bizChats,filter]);
  const memberStats=useMemo(()=>members.filter(m=>m.status==='Active').map(m=>{const c=filteredData.filter(b=>b.member1Id===m.id||b.member2Id===m.id).length;return{member:m,count:c}}).sort((a,b)=>b.count-a.count),[members,filteredData]);
  return(
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden"><div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4"><div className="flex items-center gap-3 w-full sm:w-auto"><h2 className="text-lg md:text-xl font-black italic tracking-tighter uppercase text-slate-800">BizChat Report</h2></div><select value={filter} onChange={e=>setFilter(e.target.value)} className="bg-white p-3 rounded-lg text-xs font-black uppercase border border-slate-200"><option value="ytd">Year to Date</option><option value="12m">Rolling 12 Mos.</option><option value="qtd">Quarter to Date</option><option value="last-month">Last Month</option><option value="all">All Time</option></select></div><div className="overflow-x-auto"><table className="w-full text-left min-w-[640px]"><thead className="bg-slate-50 border-b border-slate-100"><tr><th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Member</th><th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">BizChats Completed</th></tr></thead><tbody className="divide-y divide-slate-100">{memberStats.map(({member,count})=>(<tr key={member.id}><td className="px-6 py-4"><p className="font-black text-slate-900 uppercase italic">{member.name}</p><p className="text-xs text-slate-500 font-bold">{member.professionalClassification}</p></td><td className="px-6 py-4 text-right"><span className="font-black text-2xl text-slate-800 tracking-tighter">{count}</span></td></tr>))}</tbody></table></div></div>
  );
};

// --- GRATITUDE SECTION --- //
const GratitudeSection: React.FC<Omit<TeamPerformanceProps, 'referrals'|'setReferrals'|'revenue'|'setRevenue'|'attendance'|'bizChats'>> = ({ incentives, members }) => {
  const [filter,setFilter]=useState('12m');
  const filteredData=useMemo(()=>{const n=new Date();let s:Date;const e=new Date();switch(filter){case'last-month':s=new Date(n.getFullYear(),n.getMonth()-1,1);e.setDate(0);break;case'qtd':s=new Date(n.getFullYear(),Math.floor(n.getMonth()/3)*3,1);break;case'12m':s=new Date();s.setMonth(n.getMonth()-12);break;case'all':s=new Date(0);break;case'ytd':default:s=new Date(n.getFullYear(),0,1)}return incentives.filter(i=>{const d=new Date(i.date);return d>=s&&d<=e})},[incentives,filter]);
  const memberStats=useMemo(()=>members.filter(m=>m.status==='Active').map(m=>{
    const cgi=filteredData.filter(i=>i.fromMemberId===m.id&&i.type==='Corporate').reduce((s,i)=>s+i.amount,0);
    const mgiGiven=filteredData.filter(i=>i.fromMemberId===m.id&&i.type==='Member').reduce((s,i)=>s+i.amount,0);
    const mgiReceived=filteredData.filter(i=>i.toMemberId===m.id&&i.type==='Member').reduce((s,i)=>s+i.amount,0);
    return{member:m,cgi,mgiGiven,mgiReceived,totalGiven:cgi+mgiGiven,totalReceived:mgiReceived}
  }).sort((a,b)=>b.totalGiven - a.totalGiven),[members,filteredData]);
  return(
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden"><div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4"><div className="flex items-center gap-3 w-full sm:w-auto"><h2 className="text-lg md:text-xl font-black italic tracking-tighter uppercase text-slate-800">Gratitude Incentives</h2></div><select value={filter} onChange={e=>setFilter(e.target.value)} className="bg-white p-3 rounded-lg text-xs font-black uppercase border border-slate-200"><option value="ytd">Year to Date</option><option value="12m">Rolling 12 Mos.</option><option value="qtd">Quarter to Date</option><option value="last-month">Last Month</option><option value="all">All Time</option></select></div><div className="overflow-x-auto"><table className="w-full text-left min-w-[640px]"><thead className="bg-slate-50 border-b border-slate-100"><tr><th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Member</th><th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Corp. GI</th><th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Member GI (Given/Recv)</th><th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Total (Given/Recv)</th></tr></thead><tbody className="divide-y divide-slate-100">{memberStats.map(({member,cgi,mgiGiven,mgiReceived, totalGiven, totalReceived})=>(<tr key={member.id}><td className="px-6 py-4"><p className="font-black text-slate-900 uppercase italic">{member.name}</p><p className="text-xs text-slate-500 font-bold">{member.professionalClassification}</p></td><td className="px-6 py-4 text-right font-bold text-lg text-slate-600">{cgi}</td><td className="px-6 py-4 text-right font-bold text-lg text-slate-600">{mgiGiven} / {mgiReceived}</td><td className="px-6 py-4 text-right font-black text-xl text-slate-900">{totalGiven} / {totalReceived}</td></tr>))}</tbody></table></div></div>
  );
};


// --- MAIN COMPONENT --- //
const TeamPerformance: React.FC<TeamPerformanceProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'referrals' | 'attendance' | 'bizchats' | 'gratitude'>('referrals');

  const tabs = [
    { id: 'referrals', label: 'Referrals & Revenue', icon: Handshake },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'bizchats', label: 'BizChats', icon: MessageSquare },
    { id: 'gratitude', label: 'Gratitude Incentives', icon: Gift },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-black uppercase text-sm tracking-widest flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="animate-in fade-in duration-300">
        {activeTab === 'referrals' && <ReferralSection {...props} />}
        {activeTab === 'attendance' && <AttendanceSection {...props} />}
        {activeTab === 'bizchats' && <BizChatSection {...props} />}
        {activeTab === 'gratitude' && <GratitudeSection {...props} />}
      </div>
       <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default TeamPerformance;

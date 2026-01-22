
import React, { useState, useMemo } from 'react';
import { 
  Member, 
  Referral, 
  Visitor, 
  RevenueRecord, 
  Attendance, 
  AttendanceStatus, 
  Application, 
  BizChat, 
  GratitudeIncentive,
  MeetingDraft
} from '../types';
import { 
  Users, 
  Handshake, 
  DollarSign, 
  Bell, 
  Clock, 
  ShieldAlert, 
  X, 
  FileText, 
  UserPlus, 
  MessageSquare, 
  Award, 
  ChevronRight,
  UserCheck,
  Star,
  TrendingUp,
  CalendarCheck,
  UserMinus,
  Percent,
  Gift
} from 'lucide-react';

// --- PROPS & TYPE DEFINITIONS --- //
interface DashboardProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  referrals: Referral[];
  setReferrals: React.Dispatch<React.SetStateAction<Referral[]>>;
  visitors: Visitor[];
  revenue: RevenueRecord[];
  setRevenue: React.Dispatch<React.SetStateAction<RevenueRecord[]>>;
  attendance: Attendance[];
  applications: Application[];
  bizChats?: BizChat[];
  incentives?: GratitudeIncentive[];
  unfinalizedMeetingIds: string[];
  meetingHistory: MeetingDraft[];
  handleNavigateToDraft: (draftId: string) => void;
}

interface Alert {
  id: string;
  memberId?: string;
  applicationId?: string;
  referral?: Referral;
  draftId?: string;
  type: 'critical' | 'warning' | 'success';
  title: string;
  message: string;
  icon: any;
  category: 'expiration' | 'attendance' | 'application' | 'revenue' | 'meeting';
}

type PerformanceMetrics = {
  referrals: number;
  revenue: number;
  bizChats: number;
  guests: number;
  sponsorships: number;
  corporateGIs: number;
  memberGIs: number;
};

type AttendanceMetrics = {
  subs: number;
  absences: number;
  attendanceRate: number;
};


// --- HELPER COMPONENTS --- //
const MetricGroupCard: React.FC<{
  title: string;
  icon: React.ElementType;
  data: {
    ytd: string | number;
    rolling12m: string | number;
    rolling30d: string | number;
    lastWeek: string | number;
  };
  prefix?: string;
}> = ({ title, icon: Icon, data, prefix = '' }) => (
  <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-red-50 text-red-600 rounded-lg">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-black text-slate-800 italic uppercase tracking-tighter text-sm md:text-base">{title}</h3>
    </div>
    <div className="grid grid-cols-2 gap-4">
      {[
        { label: 'YTD', value: data.ytd },
        { label: 'Rolling 12-Mo', value: data.rolling12m },
        { label: 'Rolling 30-Day', value: data.rolling30d },
        { label: 'Last Week', value: data.lastWeek },
      ].map(item => (
        <div key={item.label} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.label}</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter mt-1">{prefix}{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</p>
        </div>
      ))}
    </div>
  </div>
);

const AttendanceStatCard: React.FC<{ title: string; stats: AttendanceMetrics }> = ({ title, stats }) => (
  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center">
    <h4 className="font-black text-slate-500 uppercase tracking-widest text-[10px] mb-3">{title}</h4>
    <p className={`text-3xl sm:text-4xl font-black tracking-tighter ${stats.attendanceRate < 85 ? 'text-red-600' : 'text-slate-900'}`}>{stats.attendanceRate}%</p>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Attendance Rate</p>
    <div className="flex mt-4 pt-4 border-t border-slate-200">
      <div className="w-1/2">
        <p className="font-black text-lg text-slate-800">{stats.absences}</p>
        <p className="text-[8px] font-bold text-slate-400 uppercase">Absences</p>
      </div>
      <div className="w-1/2">
        <p className="font-black text-lg text-slate-800">{stats.subs}</p>
        <p className="text-[8px] font-bold text-slate-400 uppercase">Subs Used</p>
      </div>
    </div>
  </div>
);


const Dashboard: React.FC<DashboardProps> = ({ 
  members, setMembers, referrals, visitors, revenue, setRevenue, attendance, applications,
  bizChats = [], incentives = [],
  unfinalizedMeetingIds, meetingHistory, handleNavigateToDraft
}) => {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [renewalModalMember, setRenewalModalMember] = useState<Member | null>(null);
  const [renewalModalStage, setRenewalModalStage] = useState<'confirm' | 'setDate'>('confirm');
  const [newRenewalDate, setNewRenewalDate] = useState('');
  
  const activeMembers = useMemo(() => members.filter(m => m.status === 'Active'), [members]);

  const dashboardStats = useMemo(() => {
    const now = new Date();

    const ytdStart = new Date(now.getFullYear(), 0, 1);
    const rolling12mStart = new Date(new Date().setMonth(now.getMonth() - 12));
    const rolling30dStart = new Date(new Date().setDate(now.getDate() - 30));
    const lastWeekStart = new Date(new Date().setDate(now.getDate() - now.getDay() - 6));
    lastWeekStart.setHours(0,0,0,0);
    const lastWeekEnd = new Date(new Date().setDate(now.getDate() - now.getDay()));
    lastWeekEnd.setHours(23,59,59,999);
    
    const rolling6mStart = new Date(new Date().setMonth(now.getMonth() - 6));
    const rolling90dStart = new Date(new Date().setDate(now.getDate() - 90));

    const getDataForPeriod = (startDate: Date, endDate: Date = now): PerformanceMetrics => {
        const periodFilter = (item: { date: string }) => {
            const itemDate = new Date(item.date);
            return itemDate >= startDate && itemDate <= endDate;
        };
        const periodIncentives = incentives.filter(periodFilter);

        return {
            referrals: referrals.filter(periodFilter).length,
            revenue: revenue.filter(periodFilter).reduce((sum, r) => sum + r.amount, 0),
            bizChats: bizChats.filter(periodFilter).length,
            guests: visitors.filter(periodFilter).length,
            sponsorships: members.filter(m => m.sponsoredByMemberId && periodFilter({date: m.memberSince})).length,
            corporateGIs: periodIncentives.filter(i => i.type === 'Corporate').reduce((sum, i) => sum + i.amount, 0),
            memberGIs: periodIncentives.filter(i => i.type === 'Member').reduce((sum, i) => sum + i.amount, 0),
        };
    };

    const getAttendanceForPeriod = (startDate: Date, endDate: Date = now): AttendanceMetrics => {
        const periodAttendance = attendance.filter(a => {
            const itemDate = new Date(a.date);
            return itemDate >= startDate && itemDate <= endDate;
        });

        const presents = periodAttendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
        const subs = periodAttendance.filter(a => a.status === AttendanceStatus.SUBSTITUTE).length;
        const absences = periodAttendance.filter(a => a.status === AttendanceStatus.ABSENT).length;
        const totalMeetingsPossible = presents + subs + absences;
        const totalAttendedOrSubbed = presents + subs;
        
        return {
            subs,
            absences,
            attendanceRate: totalMeetingsPossible > 0 ? Math.round((totalAttendedOrSubbed / totalMeetingsPossible) * 100) : 100
        };
    };

    return {
        ytd: getDataForPeriod(ytdStart),
        rolling12m: getDataForPeriod(rolling12mStart),
        rolling30d: getDataForPeriod(rolling30dStart),
        lastWeek: getDataForPeriod(lastWeekStart, lastWeekEnd),
        attendance: {
            rolling6m: getAttendanceForPeriod(rolling6mStart),
            rolling90d: getAttendanceForPeriod(rolling90dStart),
            rolling30d: getAttendanceForPeriod(rolling30dStart),
            lastWeek: getAttendanceForPeriod(lastWeekStart, lastWeekEnd)
        },
        teamStatus: {
            activeMembers: activeMembers.length,
            pendingApps: applications.filter(a => a.status !== 'Approved' && a.status !== 'Declined').length,
        }
    };
  }, [members, referrals, revenue, bizChats, visitors, attendance, applications, incentives, activeMembers]);

  const alerts = useMemo(() => {
    const list: Alert[] = [];
    const now = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(now.getDate() + 90);
    
    unfinalizedMeetingIds.forEach(draftId => {
      const draft = meetingHistory.find(d => d.id === draftId);
      if (draft) {
        list.push({
          id: `meeting-${draft.id}`,
          draftId: draft.id,
          type: 'warning',
          title: `Missing Entry: ${draft.date}`,
          message: `The meeting entry for ${draft.date} was not finalized. Click to complete.`,
          icon: ShieldAlert,
          category: 'meeting',
        });
      }
    });

    activeMembers.forEach(member => {
      const expirationDate = new Date(member.renewalDate);
      if (expirationDate <= ninetyDaysFromNow && !member.archivalDate) {
        list.push({ 
            id: `exp-${member.id}`,
            memberId: member.id,
            type: expirationDate <= now ? 'critical' : 'warning',
            title: `Renewal: ${member.name}`,
            message: `Membership ${expirationDate <= now ? 'expired' : 'expires'} on ${member.renewalDate}.`,
            icon: Clock,
            category: 'expiration' 
        });
      }
    });

    return list;
  }, [activeMembers, members, unfinalizedMeetingIds, meetingHistory]);

  const handleAlertClick = (alert: Alert) => {
    if (alert.category === 'meeting' && alert.draftId) {
      handleNavigateToDraft(alert.draftId);
    } else if (alert.category === 'expiration' && alert.memberId) {
        const member = members.find(m => m.id === alert.memberId);
        if (member) {
            setRenewalModalMember(member);
            setRenewalModalStage('confirm');
            const currentRenewal = new Date(member.renewalDate);
            currentRenewal.setFullYear(currentRenewal.getFullYear() + 1);
            setNewRenewalDate(currentRenewal.toISOString().split('T')[0]);
        }
    } else {
      setSelectedAlert(alert);
    }
  };

  const handleConfirmRenewal = () => {
    if (!renewalModalMember || !newRenewalDate) return;
    setMembers(prev => prev.map(m => 
        m.id === renewalModalMember.id ? { ...m, renewalDate: newRenewalDate, archivalDate: undefined } : m
    ));
    setRenewalModalMember(null);
  };

  const handleNonRenew = () => {
      if (!renewalModalMember) return;
      setMembers(prev => prev.map(m =>
          m.id === renewalModalMember.id ? { ...m, archivalDate: m.renewalDate } : m
      ));
      setRenewalModalMember(null);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h3 className="font-black text-slate-800 italic uppercase tracking-tighter text-lg md:text-xl mb-6">Performance Snapshot</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          <MetricGroupCard
            title="Closed Revenue"
            icon={DollarSign}
            prefix="$"
            data={{
                ytd: dashboardStats.ytd.revenue,
                rolling12m: dashboardStats.rolling12m.revenue,
                rolling30d: dashboardStats.rolling30d.revenue,
                lastWeek: dashboardStats.lastWeek.revenue,
            }}
          />
          <MetricGroupCard
            title="Referrals Passed"
            icon={Handshake}
            data={{
                ytd: dashboardStats.ytd.referrals,
                rolling12m: dashboardStats.rolling12m.referrals,
                rolling30d: dashboardStats.rolling30d.referrals,
                lastWeek: dashboardStats.lastWeek.referrals,
            }}
          />
          <MetricGroupCard
            title="BizChats"
            icon={MessageSquare}
            data={{
                ytd: dashboardStats.ytd.bizChats,
                rolling12m: dashboardStats.rolling12m.bizChats,
                rolling30d: dashboardStats.rolling30d.bizChats,
                lastWeek: dashboardStats.lastWeek.bizChats,
            }}
          />
          <MetricGroupCard
            title="Guests Attended"
            icon={UserPlus}
            data={{
                ytd: dashboardStats.ytd.guests,
                rolling12m: dashboardStats.rolling12m.guests,
                rolling30d: dashboardStats.rolling30d.guests,
                lastWeek: dashboardStats.lastWeek.guests,
            }}
          />
           <MetricGroupCard
            title="Corporate GIs"
            icon={Gift}
            data={{
                ytd: dashboardStats.ytd.corporateGIs,
                rolling12m: dashboardStats.rolling12m.corporateGIs,
                rolling30d: dashboardStats.rolling30d.corporateGIs,
                lastWeek: dashboardStats.lastWeek.corporateGIs,
            }}
          />
          <MetricGroupCard
            title="Member GIs"
            icon={Award}
            data={{
                ytd: dashboardStats.ytd.memberGIs,
                rolling12m: dashboardStats.rolling12m.memberGIs,
                rolling30d: dashboardStats.rolling30d.memberGIs,
                lastWeek: dashboardStats.lastWeek.memberGIs,
            }}
          />
          <MetricGroupCard
            title="Sponsorships"
            icon={UserCheck}
            data={{
                ytd: dashboardStats.ytd.sponsorships,
                rolling12m: dashboardStats.rolling12m.sponsorships,
                rolling30d: dashboardStats.rolling30d.sponsorships,
                lastWeek: dashboardStats.lastWeek.sponsorships,
            }}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 italic uppercase tracking-tighter text-lg md:text-xl mb-6">Attendance Audit</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <AttendanceStatCard title="Rolling 6 Months" stats={dashboardStats.attendance.rolling6m} />
            <AttendanceStatCard title="Rolling 90 Days" stats={dashboardStats.attendance.rolling90d} />
            <AttendanceStatCard title="Rolling 30 Days" stats={dashboardStats.attendance.rolling30d} />
            <AttendanceStatCard title="Last Week" stats={dashboardStats.attendance.lastWeek} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-center text-center">
            <Users className="w-8 h-8 text-red-600 mx-auto mb-3"/>
            <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">{dashboardStats.teamStatus.activeMembers}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Members</p>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-center text-center">
            <FileText className="w-8 h-8 text-red-600 mx-auto mb-3"/>
            <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">{dashboardStats.teamStatus.pendingApps}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Apps</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12">
          <div className="bg-slate-900 rounded-[3rem] p-6 md:p-10 shadow-2xl border border-slate-800 flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-6"><div className="flex items-center gap-3"><Bell className="w-6 h-6 text-red-600" /><h3 className="font-black text-white italic tracking-tighter uppercase text-lg md:text-xl">Team Alerts</h3></div>{alerts.length > 0 && <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full">{alerts.length}</span>}</div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {alerts.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-10"><Star className="w-12 h-12 text-slate-500 mb-4" /><p className="text-slate-400 text-xs font-black uppercase tracking-widest">System Stable</p></div> : alerts.map((alert) => (
                <div key={alert.id} onClick={() => handleAlertClick(alert)} className={`p-4 rounded-2xl border cursor-pointer group transition-all hover:scale-[1.02] ${ alert.type === 'critical' ? 'bg-red-600/10 border-red-600/20' : alert.type === 'success' ? 'bg-green-600/10 border-green-600/20' : 'bg-amber-600/10 border-amber-500/20' }`}>
                  <div className="flex gap-3 items-center">
                    <div className={`p-2 rounded-xl shrink-0 ${ alert.type === 'critical' ? 'bg-red-600' : alert.type === 'success' ? 'bg-green-600' : 'bg-amber-600' }`}><alert.icon className="w-4 h-4 text-white" /></div>
                    <div className="flex-1 min-w-0"><p className={`text-xs font-black uppercase truncate ${ alert.type === 'critical' ? 'text-red-300' : alert.type === 'success' ? 'text-green-300' : 'text-amber-300'}`}>{alert.title}</p><p className="text-xs opacity-60 line-clamp-1 text-slate-400">{alert.message}</p></div>
                    <ChevronRight className="w-4 h-4 self-center opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {renewalModalMember && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[120] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="bg-slate-900 p-10 text-white">
              <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter leading-none mb-2">Membership Renewal</h2>
              <p className="text-red-400 text-sm font-bold">Member: {renewalModalMember.name}</p>
            </div>
            {renewalModalStage === 'confirm' ? (
              <div className="p-10 space-y-6 bg-white text-center">
                <p className="text-slate-600 font-medium">Is this member renewing their membership for another term?</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={handleNonRenew} className="flex-1 py-5 bg-red-600 text-white rounded-2xl font-black italic text-base">Non-Renew</button>
                  <button onClick={() => setRenewalModalStage('setDate')} className="flex-1 py-5 bg-green-600 text-white rounded-2xl font-black italic text-base">Renew</button>
                </div>
                <button onClick={() => setRenewalModalMember(null)} className="w-full py-3 text-xs font-black uppercase text-slate-400">Cancel</button>
              </div>
            ) : (
              <div className="p-10 space-y-4 bg-white">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">New Term Expiration Date</label>
                  <input 
                    type="date" 
                    value={newRenewalDate} 
                    onChange={(e) => setNewRenewalDate(e.target.value)}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg font-bold"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button onClick={() => setRenewalModalStage('confirm')} className="order-2 sm:order-1 flex-1 py-4 text-xs font-black uppercase text-slate-400 rounded-2xl">Back</button>
                  <button onClick={handleConfirmRenewal} className="order-1 sm:order-2 flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black italic text-base">Confirm Renewal</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedAlert && ( <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[120] flex items-center justify-center p-6"> <div className="bg-white rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-300"> <div className={`p-10 text-white ${ selectedAlert.type === 'critical' ? 'bg-red-600' : selectedAlert.type === 'success' ? 'bg-green-600' : 'bg-amber-600' }`}> <div className="flex justify-between items-start mb-8"> <div className="p-4 bg-white/20 rounded-[1.5rem]"><selectedAlert.icon className="w-10 h-10" /></div> <button onClick={() => setSelectedAlert(null)} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-6 h-6" /></button> </div> <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase mb-4">{selectedAlert.title}</h2> <p className="text-xs font-black uppercase opacity-60 tracking-[0.2em]">{selectedAlert.category} Action</p> </div> <div className="p-10 space-y-8 bg-white"> <p className="text-slate-600 font-medium text-sm">{selectedAlert.message}</p> <button onClick={() => { setSelectedAlert(null); window.location.hash = selectedAlert.category === 'application' ? '#applications' : '#members'; }} className="w-full p-6 bg-slate-900 text-white rounded-[2rem] font-black italic uppercase" > Go to Hub </button> </div> </div> </div> )}

      <style>{`.custom-scrollbar::-webkit-scrollbar{width:4px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:10px}`}</style>
    </div>
  );
};

export default Dashboard;

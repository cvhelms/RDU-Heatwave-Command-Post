
import React, { useState, useMemo } from 'react';
import { Member, Referral, RevenueRecord, Attendance, AttendanceStatus, ArchivalRecord, BizChat } from '../types';
import { 
  Plus, Search, Edit2, Trash2, Mail, Phone, 
  MapPin, Calendar, Briefcase, User, X, Info, ChevronRight,
  ShieldAlert, DollarSign, Handshake, LayoutGrid, List, AlertCircle, UserMinus, RotateCcw, History, ArrowLeft,
  TrendingUp, ArrowDownLeft, ArrowUpRight, ChevronDown, ChevronUp, Award, MessageSquare, Users, BarChart2
} from 'lucide-react';

interface MemberListProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  referrals: Referral[];
  revenue: RevenueRecord[];
  attendance: Attendance[];
  bizChats: BizChat[];
}

type StatPeriod = 'last-week' | 'last-month' | 'mtd' | 'qtd' | 'last-quarter' | 'ytd' | '12m';
type AttendanceStatPeriod = 'mtd' | 'last-month' | 'qtd' | 'last-quarter' | '6m-rolling';

const MemberList: React.FC<MemberListProps> = ({ members, setMembers, referrals, revenue, attendance, bizChats }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'tile' | 'list'>('tile');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTerminationModalOpen, setIsTerminationModalOpen] = useState(false);
  const [isReinstateModalOpen, setIsReinstateModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Member>>({});
  const [showArchived, setShowArchived] = useState(false);

  const [termEffectiveDate, setTermEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [termCategory, setTermCategory] = useState("Member's Choice");
  const [termNotes, setTermNotes] = useState('');

  const [reinstateStartDate, setReinstateStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reinstateEndDate, setReinstateEndDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]);
  
  const [statTimePeriod, setStatTimePeriod] = useState<StatPeriod>('12m');
  const [attendanceTimePeriod, setAttendanceTimePeriod] = useState<AttendanceStatPeriod>('6m-rolling');

  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.professionalClassification.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = showArchived ? m.status === 'Inactive' : m.status === 'Active';
    return matchesSearch && matchesStatus;
  });
  
  const getStatsByPeriod = (memberId: string, period: StatPeriod | AttendanceStatPeriod | '6m-rolling-fixed', isAttendanceOnly: boolean = false) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date | null = new Date();

    const getFirstDayOfQuarter = (d: Date) => new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
    
    switch(period) {
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
        case '6m-rolling':
        case '6m-rolling-fixed':
            startDate = new Date();
            const monthsToSubtract = period === '12m' ? 12 : 6;
            startDate.setMonth(now.getMonth() - monthsToSubtract);
            break;
        default:
            startDate = new Date(0);
            break;
    }
    
    startDate.setHours(0, 0, 0, 0);
    if(endDate) endDate.setHours(23, 59, 59, 999);
    else endDate = new Date();

    const periodFilter = (itemDate: string) => {
        const d = new Date(itemDate);
        return d >= startDate && d <= (endDate as Date);
    };

    const relevantAttendance = attendance.filter(a => a.memberId === memberId && periodFilter(a.date));
    const absences = relevantAttendance.filter(a => a.status === AttendanceStatus.ABSENT).length;
    const substituteRecords = relevantAttendance.filter(a => a.status === AttendanceStatus.SUBSTITUTE && a.subName);
    const lates = relevantAttendance.filter(a => a.status === AttendanceStatus.LATE).length;
    const presents = relevantAttendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
    
    if (isAttendanceOnly) {
      return { absences, substituteRecords, lates, presents };
    }

    const relevantReferrals = referrals.filter(r => periodFilter(r.date));
    const relevantRevenue = revenue.filter(r => periodFilter(r.date));
    const relevantBizChats = bizChats.filter(b => periodFilter(b.date));

    const passed = relevantReferrals.filter(r => r.fromMemberId === memberId).length;
    const received = relevantReferrals.filter(r => r.toMemberId === memberId).length;
    const given = relevantRevenue.filter(r => relevantReferrals.find(ref => ref.id === r.referralId && ref.fromMemberId === memberId)).reduce((acc, curr) => acc + curr.amount, 0);
    const bizChatCount = relevantBizChats.filter(b => b.member1Id === memberId || b.member2Id === memberId).length;
    const sponsorships = members.filter(m => m.sponsoredByMemberId === memberId).length; // Always all-time

    return { passed, received, given, bizChatCount, sponsorships, absences, substituteRecords, lates, presents };
  };

  const detailedMemberStats = useMemo(() => {
    if (!selectedMember) return null;
    const mainStats = getStatsByPeriod(selectedMember.id, statTimePeriod);
    const fixedAttendanceStats = getStatsByPeriod(selectedMember.id, '6m-rolling-fixed', true);
    return { ...mainStats, fixedAbsences: fixedAttendanceStats.absences, fixedSubs: fixedAttendanceStats.substituteRecords.length };
  }, [selectedMember, statTimePeriod, members, referrals, revenue, bizChats, attendance]);

  const detailedAttendanceStats = useMemo(() => {
      if (!selectedMember) return null;
      return getStatsByPeriod(selectedMember.id, attendanceTimePeriod, true);
  }, [selectedMember, attendanceTimePeriod, attendance]);


  const openDetailModal = (member: Member) => {
    setSelectedMember(member);
    setIsDetailModalOpen(true);
    setStatTimePeriod('12m');
    setAttendanceTimePeriod('6m-rolling');
  };

  const openEditModal = (member: Member) => {
    setFormData({ ...member });
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this member record? Archive is recommended for historical data.')) {
      setMembers(members.filter(m => m.id !== id));
      if (selectedMember?.id === id) setSelectedMember(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    const formattedData = { ...formData, phone: formatPhoneNumber(formData.phone || ''), email: (formData.email || '').toLowerCase() };
    setMembers(members.map(m => m.id === selectedMember.id ? { ...m, ...formattedData } as Member : m));
    setSelectedMember(prev => prev ? { ...prev, ...formattedData } as Member : null);
    setIsEditModalOpen(false);
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const prevValue = formData.dob || '';
    let value = e.target.value.replace(/[^\d/]/g, '');
    if (value.length === 2 && prevValue.length === 1) {
        value += '/';
    }
    if (value.length > 5) value = value.substring(0, 5);
    setFormData({...formData, dob: value});
  };

  const handleTerminateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || termNotes.length < 100) return;
    const archivalRecord: ArchivalRecord = { date: termEffectiveDate, category: termCategory, reason: termNotes };
    setMembers(prev => prev.map(m => m.id === selectedMember.id ? { ...m, status: 'Inactive', archivalCategory: termCategory, archivalReason: termNotes, archivalDate: termEffectiveDate, archivalHistory: [archivalRecord, ...(m.archivalHistory || [])] } : m));
    setIsTerminationModalOpen(false);
    setIsDetailModalOpen(false);
    setSelectedMember(null);
    setTermNotes('');
    setTermCategory("Member's Choice");
  };

  const handleReinstateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setMembers(prev => prev.map(m => m.id === selectedMember.id ? { ...m, status: 'Active', memberSince: reinstateStartDate, renewalDate: reinstateEndDate, archivalCategory: undefined, archivalReason: undefined, archivalDate: undefined } : m));
    setIsReinstateModalOpen(false);
    setIsDetailModalOpen(false);
    setSelectedMember(null);
    setShowArchived(false);
  };

  const getExpirationStyle = (expirationStr: string) => {
    const expirationDate = new Date(expirationStr);
    const now = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(now.getDate() + 90);
    if (expirationDate <= now) return 'text-red-600 font-black';
    if (expirationDate <= ninetyDaysFromNow) return 'text-red-500 font-bold';
    return 'text-slate-700 font-bold';
  };
  
  const renderTileView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {filteredMembers.map((m) => (
          <div key={m.id} onClick={() => openDetailModal(m)} className="group p-6 bg-white rounded-[2rem] border border-slate-100 hover:shadow-xl hover:border-red-200 transition-all cursor-pointer flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-1">
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900 leading-tight group-hover:text-red-600 transition-colors uppercase italic tracking-tighter text-lg truncate">{m.name}</h3>
                </div>
                <div className="ml-2 shrink-0 text-right">
                  <p className={`text-xs ${getExpirationStyle(m.renewalDate)}`}>{m.renewalDate}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Term End</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-black uppercase tracking-[0.1em]">{m.professionalClassification}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-slate-500">
               <div className="flex items-center gap-2 text-xs"><Mail className="w-4 h-4 text-slate-300" /><span className="truncate">{m.email}</span></div>
               <div className="flex items-center gap-2 text-xs"><Phone className="w-4 h-4 text-slate-300" /><span className="truncate">{m.phone}</span></div>
            </div>
          </div>
        )
      )}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Member</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Email</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Phone</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Term Ending</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredMembers.map((m) => (
                <tr key={m.id} onClick={() => openDetailModal(m)} className="cursor-pointer hover:bg-red-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-900 uppercase italic tracking-tighter text-sm">{m.name}</p>
                    <p className="text-xs text-slate-500 font-bold">{m.professionalClassification}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{m.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{m.phone}</td>
                  <td className="px-6 py-4 text-right"><p className={`text-sm ${getExpirationStyle(m.renewalDate)}`}>{m.renewalDate}</p></td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between gap-4">
        <div className="flex-1 flex flex-col md:flex-row gap-2">
          <div className="relative flex-1 max-w-md w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" /><input type="text" placeholder="Search Team..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <div className="flex gap-2">
            <div className="flex bg-slate-200/50 p-1 rounded-xl"><button onClick={() => { setShowArchived(false); setSelectedMember(null); }} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${!showArchived ? 'bg-white shadow-sm text-red-600' : 'text-slate-500 hover:text-slate-700'}`}>Active</button><button onClick={() => { setShowArchived(true); setSelectedMember(null); }} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${showArchived ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Archive</button></div>
            <div className="flex bg-slate-200/50 p-1 rounded-xl"><button onClick={() => setViewMode('tile')} className={`p-2 rounded-lg transition-all ${viewMode === 'tile' ? 'bg-white shadow-sm text-red-600' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid className="w-5 h-5" /></button><button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-red-600' : 'text-slate-400 hover:text-slate-600'}`}><List className="w-5 h-5" /></button></div>
          </div>
        </div>
      </div>
      
      {filteredMembers.length === 0 ? <div className="bg-white rounded-[2.5rem] p-16 text-center border-2 border-dashed border-slate-200"><User className="w-16 h-16 text-slate-100 mx-auto mb-4" /><p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Team File Empty</p></div> : viewMode === 'tile' ? renderTileView() : renderListView()}

      {isReinstateModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[160] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
           <form onSubmit={handleReinstateMember} className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="bg-green-600 p-10 text-white">
                <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter leading-none mb-2">Reinstate Member</h2>
                <p className="text-green-200 text-sm font-bold">Member: {selectedMember.name}</p>
              </div>
              <div className="p-10 space-y-4 bg-white">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">New Term Start Date</label>
                    <input type="date" value={reinstateStartDate} onChange={e => setReinstateStartDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">New Term End Date</label>
                    <input type="date" value={reinstateEndDate} onChange={e => setReinstateEndDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                  </div>
                </div>
                <p className="text-xs text-slate-400 pt-2">Reinstating this member will reactivate their file, set a new term period, and clear previous archival records. This action is reversible.</p>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button type="button" onClick={() => setIsReinstateModalOpen(false)} className="order-2 sm:order-1 flex-1 py-4 text-xs font-black uppercase text-slate-400 hover:bg-slate-50 rounded-2xl">Cancel</button>
                  <button 
                    type="submit"
                    className="order-1 sm:order-2 flex-1 py-5 bg-green-600 text-white rounded-2xl font-black italic text-base"
                  >
                    Confirm & Reinstate
                  </button>
                </div>
              </div>
           </form>
        </div>
      )}

      {isTerminationModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[160] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
           <form onSubmit={handleTerminateMember} className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="bg-red-600 p-10 text-white">
                <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter leading-none mb-2">Archive Member File</h2>
                <p className="text-red-200 text-sm font-bold">Member: {selectedMember.name}</p>
              </div>
              <div className="p-10 space-y-4 bg-white">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Effective Date</label>
                    <input type="date" value={termEffectiveDate} onChange={e => setTermEffectiveDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
                    <select value={termCategory} onChange={e => setTermCategory(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                      <option>Member's Choice</option>
                      <option>Attendance Violation</option>
                      <option>Conduct Violation</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Reason for Archiving (Min. 100 Chars)</label>
                  <textarea 
                    value={termNotes}
                    onChange={(e) => setTermNotes(e.target.value)}
                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm resize-none mt-1.5 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Provide a detailed, objective reason for this decision..."
                  />
                  <p className={`text-right text-xs font-bold mt-1 ${termNotes.length < 100 ? 'text-red-500' : 'text-green-600'}`}>
                    {termNotes.length} / 100
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button type="button" onClick={() => setIsTerminationModalOpen(false)} className="order-2 sm:order-1 flex-1 py-4 text-xs font-black uppercase text-slate-400 hover:bg-slate-50 rounded-2xl">Cancel</button>
                  <button 
                    type="submit"
                    disabled={termNotes.length < 100}
                    className="order-1 sm:order-2 flex-1 py-5 bg-red-600 text-white rounded-2xl font-black italic text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm & Archive
                  </button>
                </div>
              </div>
           </form>
        </div>
      )}

      {isDetailModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-900 p-8 text-white relative shrink-0"><button onClick={() => setIsDetailModalOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-xl transition-colors"><X className="w-5 h-5" /></button><div><h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase leading-none">{selectedMember.name}</h2><p className="text-red-400 font-bold uppercase text-xs tracking-[0.2em] mt-2">{selectedMember.professionalClassification}</p></div></div>
            <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar bg-slate-50">
              <div className="flex flex-col sm:flex-row gap-3"><button onClick={() => openEditModal(selectedMember)} className="flex-1 bg-slate-900 text-white py-3 rounded-2xl font-black italic tracking-tighter flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors uppercase text-sm"><Edit2 className="w-4 h-4" /> Modify File</button>
                <div className="flex gap-2">
                  {selectedMember.status === 'Active' ? <button onClick={() => { setTermNotes(''); setTermCategory("Member's Choice"); setIsTerminationModalOpen(true); }} className="flex-1 p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"><UserMinus className="w-4 h-4" /><span className="font-black text-xs uppercase italic">Terminate</span></button> : <button onClick={() => setIsReinstateModalOpen(true)} className="flex-1 p-3 bg-green-50 text-green-700 rounded-2xl hover:bg-green-100 transition-colors flex items-center justify-center gap-2"><RotateCcw className="w-4 h-4" /><span className="font-black text-xs uppercase italic">Reinstate</span></button>}
                  <button onClick={() => handleDelete(selectedMember.id)} className="w-12 flex items-center justify-center p-3 bg-slate-100 text-slate-400 rounded-2xl hover:bg-red-100 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[ { icon: Mail, label: 'Email', value: selectedMember.email }, { icon: Phone, label: 'Phone', value: selectedMember.phone }, { icon: Calendar, label: 'Term Expiry', value: selectedMember.renewalDate, style: getExpirationStyle(selectedMember.renewalDate) }, { icon: User, label: 'Sponsor', value: members.find(m=>m.id === selectedMember.sponsoredByMemberId)?.name || 'N/A'}, { icon: Briefcase, label: 'Company', value: selectedMember.companyName, full: true }, { icon: MapPin, label: 'Address', value: selectedMember.address, full: true } ].map(item=>(
                    <div key={item.label} className={`bg-white p-4 rounded-2xl border border-slate-200 ${item.full ? 'md:col-span-2' : ''}`}><div className="flex items-center gap-3"><item.icon className="w-4 h-4 text-slate-400 shrink-0" /><div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.label}</p><p className={`text-sm font-bold text-slate-700 mt-1 truncate ${item.style || ''}`}>{item.value}</p></div></div></div>
                  ))}
              </div>
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center"><h4 className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Performance Metrics</h4><select value={statTimePeriod} onChange={e => setStatTimePeriod(e.target.value as StatPeriod)} className="bg-white p-2 rounded-lg text-xs font-black uppercase border border-slate-200">{([ {id: '12m', label: 'Rolling 12 Mos.'}, {id: 'ytd', label: 'YTD'}, {id: 'last-quarter', label: 'Last Qtr'}, {id: 'qtd', label: 'QTD'}, {id: 'last-month', label: 'Last Month'}, {id: 'mtd', label: 'MTD'}, {id: 'last-week', label: 'Last Week'} ]).map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></div>
                {detailedMemberStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[ {label: 'Refs Passed', value: detailedMemberStats.passed, icon: ArrowUpRight}, {label: 'Refs Recv', value: detailedMemberStats.received, icon: ArrowDownLeft}, {label: 'Revenue Given', value: `$${detailedMemberStats.given.toLocaleString()}`, icon: DollarSign}, {label: 'BizChats', value: detailedMemberStats.bizChatCount, icon: MessageSquare} ].map(s=>(
                      <div key={s.label} className="bg-white p-4 rounded-2xl border border-slate-200"><div className="flex items-center gap-3"><s.icon className="w-4 h-4 text-slate-400" /><div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">{s.label}</p><p className="text-lg sm:text-xl font-black text-slate-800 mt-1">{s.value}</p></div></div></div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center"><h4 className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Attendance Deep Dive</h4><select value={attendanceTimePeriod} onChange={e => setAttendanceTimePeriod(e.target.value as AttendanceStatPeriod)} className="bg-white p-2 rounded-lg text-xs font-black uppercase border border-slate-200">{([ {id: '6m-rolling', label: 'Rolling 6 Mos.'}, {id: 'last-quarter', label: 'Last Qtr'}, {id: 'qtd', label: 'QTD'}, {id: 'last-month', label: 'Last Month'}, {id: 'mtd', label: 'MTD'} ]).map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></div>
                {detailedAttendanceStats && (
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                     {[ {label: 'Present', value: detailedAttendanceStats.presents}, {label: 'Absent', value: detailedAttendanceStats.absences}, {label: 'Late', value: detailedAttendanceStats.lates}, {label: 'Substitutes', value: detailedAttendanceStats.substituteRecords.length} ].map(s => (
                       <div key={s.label} className="bg-white p-4 rounded-2xl border border-slate-200 text-center"><p className="text-xs font-black text-slate-400 uppercase tracking-widest">{s.label}</p><p className="text-2xl font-black text-slate-800 mt-2">{s.value}</p></div>
                     ))}
                   </div>
                )}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
                  <p className="text-sm font-bold text-slate-500">6-Month Rolling Absences (Official)</p>
                  <p className={`font-black text-lg ${detailedMemberStats && detailedMemberStats.fixedAbsences >= 4 ? 'text-red-600' : 'text-slate-800'}`}>{detailedMemberStats?.fixedAbsences || 0} / 4</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedMember && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[160] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-red-600 p-6 sm:p-8 text-white flex justify-between items-center shrink-0"><h2 className="text-2xl font-black italic tracking-tighter uppercase">Update File</h2><button onClick={() => setIsEditModalOpen(false)} className="bg-red-700 hover:bg-red-800 p-2 rounded-xl transition-all shadow-lg"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSubmit} className="flex-1 p-6 sm:p-8 space-y-4 overflow-y-auto"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Name</label><input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div><div><label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Birth Date (MM/DD)</label><input type="text" placeholder="MM/DD" maxLength={5} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.dob || ''} onChange={handleDobChange} /></div><div><label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Email</label><input type="email" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div><div><label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Phone</label><input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: formatPhoneNumber(e.target.value)})} placeholder="(XXX) XXX-XXXX" /></div><div className="md:col-span-2"><label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Address</label><input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.address || ''} onChange={(e) => setFormData({...formData, address: e.target.value})} /></div></div><div className="flex flex-col sm:flex-row gap-4 pt-4"><button type="button" onClick={() => setIsEditModalOpen(false)} className="order-2 sm:order-1 flex-1 p-4 border border-slate-200 rounded-2xl font-bold text-slate-500 text-sm hover:bg-slate-50">Cancel</button><button type="submit" className="order-1 sm:order-2 flex-1 p-4 bg-red-600 text-white rounded-2xl font-black italic tracking-tighter uppercase text-sm shadow-xl">Commit Changes</button></div></form>
          </div>
        </div>
      )}

      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 5px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }`}</style>
    </div>
  );
};

export default MemberList;

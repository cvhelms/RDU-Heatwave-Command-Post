
import React, { useState, useMemo } from 'react';
import { Visitor, Member } from '../types';
import { UserPlus, Star, CheckCircle2, Clock, User, Mail, Phone, Briefcase, Calendar, ChevronRight, X, Search, ArrowLeft, Edit2, Gift, LayoutGrid, List, CalendarDays } from 'lucide-react';

interface VisitorLogProps {
  visitors: Visitor[];
  setVisitors: React.Dispatch<React.SetStateAction<Visitor[]>>;
  members: Member[];
  viewOnly?: boolean;
}

type VisitorProfile = { 
  info: Visitor; 
  history: Visitor[];
};

type FilterType = 'all' | 'last-meeting' | 'mtd' | 'last-month' | 'qtd' | 'last-quarter' | 'ytd' | 'last-year' | 'specific-date';

const VisitorLog: React.FC<VisitorLogProps> = ({ visitors, setVisitors, members, viewOnly }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<VisitorProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Visitor>>({});

  const [viewMode, setViewMode] = useState<'tile' | 'list'>('tile');
  const [filter, setFilter] = useState<FilterType>('all');
  const [specificDate, setSpecificDate] = useState(new Date().toISOString().split('T')[0]);
  
  const filteredVisitors = useMemo(() => {
    let filtered = visitors.filter(v =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.professionalClassification.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filter === 'all') return filtered;

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    const getFirstDayOfQuarter = (d: Date) => new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);

    if (filter === 'last-meeting') {
        if (visitors.length === 0) return [];
        const lastMeetingDate = visitors.reduce((latest, v) => new Date(v.date) > new Date(latest) ? v.date : latest, visitors[0].date);
        return filtered.filter(v => v.date === lastMeetingDate);
    }

    if (filter === 'specific-date') {
        return filtered.filter(v => v.date === specificDate);
    }
    
    switch(filter) {
        case 'mtd':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        case 'last-month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
        case 'qtd':
            startDate = getFirstDayOfQuarter(now);
            endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0);
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
            endDate = new Date(now.getFullYear(), 11, 31);
            break;
        case 'last-year':
            startDate = new Date(now.getFullYear() - 1, 0, 1);
            endDate = new Date(now.getFullYear() - 1, 11, 31);
            break;
        default:
            return filtered;
    }
    
    startDate.setHours(0,0,0,0);
    endDate.setHours(23,59,59,999);

    return filtered.filter(v => {
        const itemDate = new Date(v.date);
        return itemDate >= startDate && itemDate <= endDate;
    });

  }, [visitors, filter, specificDate, searchTerm]);
  
  const visitorProfiles = useMemo(() => {
    const profiles: Record<string, VisitorProfile> = {};
    const sorted = [...filteredVisitors].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    sorted.forEach(v => {
      const key = (v.email?.toLowerCase() || v.name?.toLowerCase()) || `unidentified-${v.id}`;
      if (!profiles[key]) {
        // To get full history for the modal, search ALL visitors, not just filtered ones
        const fullHistory = visitors.filter(hist => (hist.email?.toLowerCase() || hist.name?.toLowerCase()) === key);
        profiles[key] = { info: v, history: fullHistory };
      }
    });

    return Object.values(profiles);
  }, [filteredVisitors, visitors]);
  
  const openDetailModal = (profile: VisitorProfile) => {
    setSelectedProfile(profile);
    setIsDetailModalOpen(true);
  };
  
  const openEditModal = (profile: VisitorProfile) => {
    setFormData({ ...profile.info });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;
  
    const originalKey = selectedProfile.info.email?.toLowerCase() || selectedProfile.info.name?.toLowerCase();
  
    setVisitors(prevVisitors =>
      prevVisitors.map(v => {
        const visitorKey = v.email?.toLowerCase() || v.name?.toLowerCase();
        if (visitorKey === originalKey) {
          return {
            ...v,
            name: formData.name || v.name,
            email: formData.email || v.email,
            phone: formData.phone || v.phone,
            companyName: formData.companyName || v.companyName,
            professionalClassification: formData.professionalClassification || v.professionalClassification,
            dob: formData.dob || v.dob,
          };
        }
        return v;
      })
    );
  
    const updatedProfileInfo = { ...selectedProfile.info, ...formData } as Visitor;
    setSelectedProfile({ ...selectedProfile, info: updatedProfileInfo });
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

  const renderTileView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {visitorProfiles.map(profile => {
        const v = profile.info;
        const profileKey = (v.email?.toLowerCase() || v.name?.toLowerCase()) || `unidentified-${v.id}`;
        return (
          <div 
            key={profileKey} 
            onClick={() => openDetailModal(profile)}
            className="p-6 bg-white rounded-[2rem] border border-slate-100 hover:shadow-xl hover:border-red-200 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center font-black italic border border-slate-100 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                {v.name[0]}
              </div>
              <div className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-black uppercase text-slate-500">
                {profile.history.length} {profile.history.length === 1 ? 'Visit' : 'Visits'}
              </div>
            </div>
            <div>
              <h4 className="font-black text-slate-900 uppercase italic tracking-tighter leading-none text-lg mb-1">{v.name}</h4>
              <p className="text-xs text-slate-400 font-black uppercase tracking-widest truncate">{v.professionalClassification}</p>
              <p className="text-sm text-slate-500 font-medium mt-1 truncate">{v.companyName}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-slate-300">
              <span className="text-xs font-black uppercase tracking-widest">Profile Hub</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        );
      })}
    </div>
  );
  
  const renderListView = () => (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Last Visit</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Guest Profile</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Phone</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {visitorProfiles.map(profile => {
              const v = profile.info;
              const profileKey = (v.email?.toLowerCase() || v.name?.toLowerCase()) || `unidentified-${v.id}`;
              return (
                <tr key={profileKey} onClick={() => openDetailModal(profile)} className="cursor-pointer hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-sm text-slate-500">{v.date}</td>
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-900 uppercase italic tracking-tighter">{v.name}</p>
                    <p className="text-xs text-slate-500 font-bold">{v.professionalClassification}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{v.phone}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{v.email}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between gap-4">
        <div className="flex-1 flex flex-col md:flex-row gap-2">
          <div className="relative flex-1 max-w-sm w-full"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" /><input type="text" placeholder="Search Guest Registry..." className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <div className="flex gap-2">
            <select value={filter} onChange={e => setFilter(e.target.value as FilterType)} className="p-4 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500">
              <option value="all">All Time</option>
              <option value="last-meeting">Last Meeting</option>
              <option value="mtd">Month to Date</option>
              <option value="last-month">Last Month</option>
              <option value="qtd">Quarter to Date</option>
              <option value="last-quarter">Last Quarter</option>
              <option value="ytd">This Year</option>
              <option value="last-year">Last Year</option>
              <option value="specific-date">Specific Date</option>
            </select>
            {filter === 'specific-date' && (
              <div className="relative">
                <input type="date" value={specificDate} onChange={e => setSpecificDate(e.target.value)} className="p-4 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500" />
                <CalendarDays className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            )}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setViewMode('tile')} className={`p-3 rounded-lg ${viewMode === 'tile' ? 'bg-white shadow text-red-600' : 'text-slate-400'}`}><LayoutGrid className="w-5 h-5"/></button>
              <button onClick={() => setViewMode('list')} className={`p-3 rounded-lg ${viewMode === 'list' ? 'bg-white shadow text-red-600' : 'text-slate-400'}`}><List className="w-5 h-5"/></button>
            </div>
          </div>
        </div>
        <div className="bg-slate-100 px-6 py-4 rounded-2xl flex items-center gap-3">
           <UserPlus className="w-4 h-4 text-slate-400" />
           <p className="text-xs font-black uppercase tracking-widest text-slate-500">Managing {visitors.length} Total Records</p>
        </div>
      </div>
      
      {filteredVisitors.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
          <UserPlus className="w-16 h-16 text-slate-100 mx-auto mb-4" />
          <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">No Records Found</p>
        </div>
      ) : (
        viewMode === 'tile' ? renderTileView() : renderListView()
      )}

      {isDetailModalOpen && selectedProfile && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-900 p-8 text-white relative shrink-0">
              <button onClick={() => setIsDetailModalOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase leading-none">{selectedProfile.info.name}</h2>
                <p className="text-red-400 font-bold uppercase text-xs tracking-[0.2em] mt-2">{selectedProfile.info.professionalClassification}</p>
              </div>
            </div>

            <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar bg-slate-50">
              {!viewOnly && (
                <button 
                  onClick={() => openEditModal(selectedProfile)}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black italic tracking-tighter flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors uppercase text-sm"
                >
                  <Edit2 className="w-4 h-4" /> Modify Profile
                </button>
              )}

              <section>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-100 pb-2 mb-4">Contact & Business Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: Mail, label: 'Email', value: selectedProfile.info.email },
                    { icon: Phone, label: 'Phone', value: selectedProfile.info.phone },
                    { icon: Briefcase, label: 'Company', value: selectedProfile.info.companyName, full: true },
                    { icon: Gift, label: 'Birth Date', value: selectedProfile.info.dob || 'Not Provided' },
                  ].map(item => (
                    <div key={item.label} className={`bg-white p-4 rounded-2xl border border-slate-200 ${item.full ? 'md:col-span-2' : ''}`}>
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                          <p className={`text-sm font-bold text-slate-700 mt-1 truncate`}>{item.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Attendance History</h4>
                  <span className="text-xs font-black text-red-600 uppercase">{selectedProfile.history.length} Sessions</span>
                </div>
                <div className="space-y-3">
                  {selectedProfile.history.map((visit, idx) => {
                    const inviter = members.find(m => m.id === visit.invitedByMemberId);
                    return (
                      <div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between group hover:border-red-200 transition-colors">
                         <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-red-50 transition-colors">
                              <Calendar className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">{visit.date}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Guest of {inviter?.name || 'the Team'}</p>
                            </div>
                         </div>
                         {visit.isFirstVisit && (
                           <span className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase italic">Initial Visit</span>
                         )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedProfile && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[160] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-red-600 p-6 sm:p-8 text-white flex justify-between items-center shrink-0">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">Update Visitor Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="bg-red-700 hover:bg-red-800 p-2 rounded-xl transition-all shadow-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="flex-1 p-6 sm:p-8 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Name</label><input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
                <div><label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Email</label><input type="email" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
                <div><label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Phone</label><input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Birth Date (MM/DD)</label>
                  <input type="text" placeholder="MM/DD" maxLength={5} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.dob || ''} onChange={handleDobChange} />
                </div>
                <div><label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Company Name</label><input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.companyName || ''} onChange={(e) => setFormData({...formData, companyName: e.target.value})} /></div>
                <div><label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Professional Classification</label><input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.professionalClassification || ''} onChange={(e) => setFormData({...formData, professionalClassification: e.target.value})} /></div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="order-2 sm:order-1 flex-1 p-4 border border-slate-200 rounded-2xl font-bold text-slate-500 text-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" className="order-1 sm:order-2 flex-1 p-4 bg-red-600 text-white rounded-2xl font-black italic tracking-tighter uppercase text-sm shadow-xl">Commit Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default VisitorLog;

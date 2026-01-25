
import React, { useState, useMemo, useEffect } from 'react';
import { Application, ApplicationStatus, Member, Visitor } from '../types';
import { 
  FileText, 
  Search, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  X,
  User,
  ArrowRight,
  Archive,
  LayoutGrid,
  List,
  Kanban,
  ArrowLeft,
  RotateCcw,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Gift,
  MapPin,
  Tag,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface ApplicationsHubProps {
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  members: Member[];
  visitors: Visitor[];
  setVisitors: React.Dispatch<React.SetStateAction<Visitor[]>>;
}

const ApplicationsHub: React.FC<ApplicationsHubProps> = ({ applications, setApplications, members, visitors, setVisitors }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeclined, setShowDeclined] = useState(false);
  const [viewMode, setViewMode] = useState<'tile' | 'list' | 'kanban'>('tile');

  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [appToDecline, setAppToDecline] = useState<Application | null>(null);
  const [declineNarrative, setDeclineNarrative] = useState('');
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [openDropdownAppId, setOpenDropdownAppId] = useState<string | null>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (openDropdownAppId && !target.closest(`#dropdown-trigger-${openDropdownAppId}`) && !target.closest(`#dropdown-menu-${openDropdownAppId}`)) {
            setOpenDropdownAppId(null);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownAppId]);

  const filteredApps = applications.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = showDeclined ? a.status === 'Declined' : a.status !== 'Declined';

    return matchesSearch && matchesStatus;
  });

  const openDetailModal = (app: Application) => {
    setSelectedApp(app);
    setIsDetailModalOpen(true);
  };

  const updateStatus = (id: string, newStatus: ApplicationStatus) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const handleDecline = (app: Application) => {
    setAppToDecline(app);
    setDeclineNarrative('');
    setIsDeclineModalOpen(true);
  };

  const confirmDecline = () => {
    if (!appToDecline || declineNarrative.length < 100) return;
    
    const declinedApp = { 
      ...appToDecline, 
      previousStatus: appToDecline.status, 
      status: 'Declined' as ApplicationStatus, 
      notes: declineNarrative, 
      declineDate: new Date().toISOString().split('T')[0] 
    };

    setApplications(prev => prev.map(a => a.id === appToDecline.id ? declinedApp : a));

    // Add to visitor database
    const newVisitor: Visitor = {
      id: `visitor-declined-${declinedApp.id}`,
      date: new Date().toISOString().split('T')[0],
      name: declinedApp.name,
      dob: declinedApp.dob,
      phone: declinedApp.phone,
      email: declinedApp.email,
      professionalClassification: declinedApp.professionalClassification,
      companyName: declinedApp.companyName,
      invitedByMemberId: declinedApp.sponsoredByMemberId || '',
      followUpStatus: 'Pending',
      isFirstVisit: !visitors.some(v => v.email?.toLowerCase() === declinedApp.email.toLowerCase()),
    };
    setVisitors(prev => [...prev.filter(v => v.email?.toLowerCase() !== newVisitor.email.toLowerCase()), newVisitor]);
    
    setIsDeclineModalOpen(false);
    setAppToDecline(null);
    setDeclineNarrative('');
  };
  
  const handleReinstate = (appToReinstate: Application) => {
    if (confirm("Are you sure you want to reinstate this application? It will be moved back to its previous stage.")) {
        setApplications(prev => prev.map(a =>
            a.id === appToReinstate.id
            ? { ...a, status: appToReinstate.previousStatus || 'Applied', notes: undefined, declineDate: undefined, previousStatus: undefined }
            : a
        ));
        // Mark visitor records as Applied again instead of removing them
        setVisitors(prev => prev.map(v =>
            v.email?.toLowerCase() === appToReinstate.email.toLowerCase()
            ? { ...v, followUpStatus: 'Applied' as const, convertedToApplicationId: appToReinstate.id }
            : v
        ));
        setShowDeclined(false);
    }
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    switch(status) {
      case 'Applied': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'GC BizChat Complete': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'Interview Complete': return <ShieldCheck className="w-5 h-5 text-purple-500" />;
      case 'Approved': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'Declined': return <X className="w-5 h-5 text-red-500" />;
    }
  };
  
  const kanbanColumns: { title: string; status: ApplicationStatus; color: string }[] = [
    { title: 'New', status: 'Applied', color: 'bg-amber-500' },
    { title: 'GC BizChat', status: 'GC BizChat Complete', color: 'bg-blue-500' },
    { title: 'GC Interview', status: 'Interview Complete', color: 'bg-purple-500' },
    { title: 'Approved', status: 'Approved', color: 'bg-green-500' }
  ];

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("applicationId", id);
    setDraggedAppId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: ApplicationStatus) => {
    const id = e.dataTransfer.getData("applicationId");
    updateStatus(id, status);
    setDraggedAppId(null);
  };

  const handleDragEnd = () => {
    setDraggedAppId(null);
  };
  
  const applicationStages: ApplicationStatus[] = ['Applied', 'GC BizChat Complete', 'Interview Complete', 'Approved'];

  const getNextStatus = (currentStatus: ApplicationStatus): ApplicationStatus | null => {
      const currentIndex = applicationStages.indexOf(currentStatus);
      if (currentIndex !== -1 && currentIndex < applicationStages.length - 1) {
          return applicationStages[currentIndex + 1];
      }
      return null;
  };

  const getPrevStatus = (currentStatus: ApplicationStatus): ApplicationStatus | null => {
      const currentIndex = applicationStages.indexOf(currentStatus);
      if (currentIndex > 0) {
          return applicationStages[currentIndex - 1];
      }
      return null;
  };

  const renderTileView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {filteredApps.map(app => {
        const sponsor = members.find(m => m.id === app.sponsoredByMemberId);
        return (
          <div key={app.id} onClick={() => openDetailModal(app)} className="p-6 bg-white rounded-[2rem] border border-slate-100 hover:shadow-xl hover:border-red-200 transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center font-black italic border border-slate-100 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                {app.name[0]}
              </div>
              <div className="relative">
                <button 
                    id={`dropdown-trigger-${app.id}`}
                    onClick={(e) => { e.stopPropagation(); setOpenDropdownAppId(openDropdownAppId === app.id ? null : app.id); }} 
                    className="flex items-center gap-2 text-xs font-bold text-slate-500 p-2 rounded-lg hover:bg-slate-100"
                >
                    {getStatusIcon(app.status)}
                    <span className="text-xs font-black uppercase tracking-widest">{app.status}</span>
                    <ChevronDown className="w-3 h-3"/>
                </button>
                {openDropdownAppId === app.id && (
                    <div id={`dropdown-menu-${app.id}`} className="absolute top-full right-0 mt-1 bg-white shadow-lg rounded-lg border z-10 w-48 py-1">
                        {applicationStages.map(stage => (
                            <button 
                                key={stage}
                                onClick={(e) => { e.stopPropagation(); updateStatus(app.id, stage); setOpenDropdownAppId(null); }}
                                className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 flex items-center gap-2"
                            >
                                {getStatusIcon(stage)} {stage}
                            </button>
                        ))}
                    </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-black text-slate-900 uppercase italic tracking-tighter leading-none text-lg mb-1 truncate">{app.name}</h4>
              <p className="text-xs text-slate-400 font-black uppercase tracking-widest truncate">{app.professionalClassification}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-slate-400 text-sm">
              <span className="font-bold">Sponsor: {sponsor?.name || 'N/A'}</span>
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
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Applicant</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Classification</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Applied On</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredApps.map(app => (
              <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4" onClick={() => openDetailModal(app)}><p className="font-black text-slate-900 uppercase italic tracking-tighter cursor-pointer">{app.name}</p><p className="text-xs text-slate-500 font-bold">{app.companyName}</p></td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{app.professionalClassification}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-500">{app.appliedDate}</td>
                <td className="px-6 py-4"><span className="text-sm font-bold flex items-center gap-2">{getStatusIcon(app.status)} {app.status}</span></td>
                <td className="px-6 py-4">
                  {showDeclined ? (
                    <button onClick={() => handleReinstate(app)} className="p-2 bg-green-50 text-green-700 rounded-lg text-xs font-bold flex items-center gap-1"><RotateCcw className="w-3 h-3"/> Reinstate</button>
                  ) : (
                    <div className="flex items-center gap-2">
                        <select value={app.status} onChange={e => updateStatus(app.id, e.target.value as ApplicationStatus)} className="p-2 text-xs font-black uppercase border rounded-lg bg-white">
                            <option>Applied</option><option>GC BizChat Complete</option><option>Interview Complete</option><option>Approved</option>
                        </select>
                        <button onClick={() => handleDecline(app)} className="p-2 bg-red-50 text-red-600 rounded-lg"><X className="w-4 h-4"/></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderKanbanView = () => (
    <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 min-h-[600px]">
      {kanbanColumns.map(col => (
        <div key={col.status} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.status)} className="w-80 flex-shrink-0 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col">
          <div className="p-5 border-b-4 border-slate-200 rounded-t-[2rem]">
            <div className="flex justify-between items-center">
              <h3 className="font-black uppercase italic tracking-tighter text-slate-800 text-base">{col.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-black text-white ${col.color}`}>{filteredApps.filter(a => a.status === col.status).length}</span>
            </div>
          </div>
          <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
            {filteredApps.filter(a => a.status === col.status).map(app => {
              const sponsor = members.find(m => m.id === app.sponsoredByMemberId);
              const prevStatus = getPrevStatus(app.status);
              const nextStatus = getNextStatus(app.status);
              return(
                <div 
                  key={app.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, app.id)}
                  onDragEnd={handleDragEnd}
                  className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-md cursor-grab active:cursor-grabbing transition-opacity ${draggedAppId === app.id ? 'opacity-50' : 'opacity-100'}`}
                >
                  <div onClick={() => openDetailModal(app)}>
                    <p className="font-black uppercase italic text-sm text-slate-900 tracking-tighter mb-2">{app.name}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest truncate">{app.professionalClassification}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-2 pt-2 border-t border-slate-100">Sponsor: {sponsor?.name || 'N/A'}</p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                      <button onClick={(e) => { e.stopPropagation(); prevStatus && updateStatus(app.id, prevStatus); }} disabled={!prevStatus} className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed"><ArrowLeft className="w-4 h-4 text-slate-400"/></button>
                      <button onClick={(e) => { e.stopPropagation(); nextStatus && updateStatus(app.id, nextStatus); }} disabled={!nextStatus} className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed"><ArrowRight className="w-4 h-4 text-slate-400"/></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between gap-4">
        <div className="flex-1 flex flex-col md:flex-row gap-2">
          <div className="relative flex-1 max-w-md w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" /><input type="text" placeholder="Search Applicants..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <div className="flex gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => { setShowDeclined(false); }} className={`px-6 py-2 rounded-lg text-xs font-black uppercase ${!showDeclined ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>Active</button>
              <button onClick={() => { setShowDeclined(true); }} className={`px-6 py-2 rounded-lg text-xs font-black uppercase ${showDeclined ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Archived</button>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setViewMode('tile')} className={`p-2 rounded-lg ${viewMode === 'tile' ? 'bg-white shadow text-red-600' : 'text-slate-400'}`}><LayoutGrid className="w-5 h-5" /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white shadow text-red-600' : 'text-slate-400'}`}><List className="w-5 h-5" /></button>
              <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg ${viewMode === 'kanban' ? 'bg-white shadow text-red-600' : 'text-slate-400'}`}><Kanban className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </div>
      
      {filteredApps.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
            <FileText className="w-16 h-16 text-slate-100 mx-auto mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">No Applications Found</p>
        </div>
      ) : (
        viewMode === 'tile' ? renderTileView() : viewMode === 'list' ? renderListView() : renderKanbanView()
      )}

      {isDeclineModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[160] flex items-center justify-center p-6">
           <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="bg-red-600 p-10 text-white"><h2 className="text-2xl sm:text-3xl font-black italic uppercase">Decline Application</h2><p className="text-red-200 font-bold">Applicant: {appToDecline?.name}</p></div>
              <div className="p-10 space-y-4 bg-white">
                <div><label className="block text-xs font-black text-slate-500 uppercase">Reason for Decline (Min. 100 Chars)</label>
                  <textarea value={declineNarrative} onChange={(e) => setDeclineNarrative(e.target.value)} className="w-full h-32 p-4 bg-slate-50 border rounded-2xl text-sm resize-none mt-1.5"/>
                  <p className={`text-right text-xs font-bold mt-1 ${declineNarrative.length < 100 ? 'text-red-500' : 'text-green-600'}`}>{declineNarrative.length} / 100</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button type="button" onClick={() => setIsDeclineModalOpen(false)} className="order-2 sm:order-1 flex-1 py-4 text-xs font-black uppercase text-slate-400 rounded-2xl">Cancel</button>
                  <button type="button" onClick={confirmDecline} disabled={declineNarrative.length < 100} className="order-1 sm:order-2 flex-1 py-5 bg-red-600 text-white rounded-2xl font-black italic disabled:opacity-50">Confirm & Archive</button>
                </div>
              </div>
           </div>
        </div>
      )}

      {isDetailModalOpen && selectedApp && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-900 p-8 text-white relative shrink-0">
              <button onClick={() => setIsDetailModalOpen(false)} className="absolute top-4 right-4 p-2 rounded-xl"><X className="w-5 h-5" /></button>
              <div><h2 className="text-2xl md:text-3xl font-black italic uppercase">{selectedApp.name}</h2><p className="text-red-400 font-bold uppercase text-xs tracking-[0.2em] mt-2">{selectedApp.professionalClassification}</p></div>
            </div>
            <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {[ { icon: Mail, label: 'Email', value: selectedApp.email }, { icon: Phone, label: 'Phone', value: selectedApp.phone }, { icon: Calendar, label: 'Applied On', value: selectedApp.appliedDate }, { icon: User, label: 'Sponsor', value: members.find(m=>m.id === selectedApp.sponsoredByMemberId)?.name || 'N/A'}, { icon: Gift, label: 'Birth Date', value: selectedApp.dob || 'N/A' }, { icon: Tag, label: 'Status', value: selectedApp.status }, { icon: Briefcase, label: 'Company', value: selectedApp.companyName, full: true }, { icon: MapPin, label: 'Address', value: selectedApp.address, full: true } ].map(item=>(
                    <div key={item.label} className={`bg-white p-4 rounded-2xl border ${item.full ? 'md:col-span-2' : ''}`}><div className="flex items-center gap-3"><item.icon className="w-4 h-4 text-slate-400" /><div><p className="text-xs font-black text-slate-400 uppercase">{item.label}</p><p className="text-sm font-bold text-slate-700 mt-1 truncate">{item.value}</p></div></div></div>
                  ))}
              </div>
              {selectedApp.notes && <div className="bg-red-50 p-4 rounded-2xl border border-red-100"><h4 className="text-xs font-black text-red-700 uppercase">Decline Notes</h4><p className="text-sm text-red-900 mt-2">{selectedApp.notes}</p></div>}
            </div>
          </div>
        </div>
      )}

      <style>{`.custom-scrollbar::-webkit-scrollbar { height: 8px; width: 5px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }`}</style>
    </div>
  );
};

export default ApplicationsHub;

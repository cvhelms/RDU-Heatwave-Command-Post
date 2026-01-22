
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Handshake, 
  UserPlus, 
  CalendarCheck, 
  Flame,
  Menu,
  X,
  ClipboardList,
  FileText,
  LogOut,
  Users as UsersIcon,
  Gift,
  MessageSquare,
  KeyRound
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import MemberList from './components/MemberList';
import VisitorLog from './components/VisitorLog';
import MeetingEntry from './components/MeetingEntry';
import ApplicationsHub from './components/ApplicationsHub';
import UserManagement from './components/UserManagement';
import Login from './components/Login';
import ChangePasswordModal from './components/ChangePasswordModal';
import { Member, Referral, Visitor, Attendance, RevenueRecord, BizChat, GratitudeIncentive, Application, MeetingDraft } from './types';
import { 
  MOCK_MEMBERS_EXTENDED, 
  MOCK_VISITORS_EXTENDED, 
  MOCK_APPLICATIONS_EXTENDED, 
  MOCK_REFERRALS_EXTENDED, 
  MOCK_REVENUE_EXTENDED, 
  MOCK_ATTENDANCE_EXTENDED,
  MOCK_BIZCHATS_EXTENDED,
  MOCK_INCENTIVES_EXTENDED
} from './constants';
import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meetings' | 'members' | 'visitors' | 'applications' | 'users'>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

  // Global State
  const [members, setMembers] = useState<Member[]>(() => JSON.parse(localStorage.getItem('rdu_members') || 'null') || MOCK_MEMBERS_EXTENDED);
  const [applications, setApplications] = useState<Application[]>(() => JSON.parse(localStorage.getItem('rdu_applications') || 'null') || MOCK_APPLICATIONS_EXTENDED);
  const [referrals, setReferrals] = useState<Referral[]>(() => JSON.parse(localStorage.getItem('rdu_referrals') || 'null') || MOCK_REFERRALS_EXTENDED);
  const [visitors, setVisitors] = useState<Visitor[]>(() => JSON.parse(localStorage.getItem('rdu_visitors') || 'null') || MOCK_VISITORS_EXTENDED);
  const [attendance, setAttendance] = useState<Attendance[]>(() => JSON.parse(localStorage.getItem('rdu_attendance') || 'null') || MOCK_ATTENDANCE_EXTENDED);
  const [revenue, setRevenue] = useState<RevenueRecord[]>(() => JSON.parse(localStorage.getItem('rdu_revenue') || 'null') || MOCK_REVENUE_EXTENDED);
  const [bizChats, setBizChats] = useState<BizChat[]>(() => JSON.parse(localStorage.getItem('rdu_bizChats') || 'null') || MOCK_BIZCHATS_EXTENDED);
  const [incentives, setIncentives] = useState<GratitudeIncentive[]>(() => JSON.parse(localStorage.getItem('rdu_incentives') || 'null') || MOCK_INCENTIVES_EXTENDED);
  const [meetingHistory, setMeetingHistory] = useState<MeetingDraft[]>(() => JSON.parse(localStorage.getItem('rdu_meeting_history') || '[]'));
  const [unfinalizedMeetingIds, setUnfinalizedMeetingIds] = useState<string[]>([]);
  const [draftToLoad, setDraftToLoad] = useState<string | null>(null);

  // Data Persistence
  useEffect(() => { localStorage.setItem('rdu_members', JSON.stringify(members)); }, [members]);
  useEffect(() => { localStorage.setItem('rdu_applications', JSON.stringify(applications)); }, [applications]);
  useEffect(() => { localStorage.setItem('rdu_referrals', JSON.stringify(referrals)); }, [referrals]);
  useEffect(() => { localStorage.setItem('rdu_visitors', JSON.stringify(visitors)); }, [visitors]);
  useEffect(() => { localStorage.setItem('rdu_attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('rdu_revenue', JSON.stringify(revenue)); }, [revenue]);
  useEffect(() => { localStorage.setItem('rdu_bizChats', JSON.stringify(bizChats)); }, [bizChats]);
  useEffect(() => { localStorage.setItem('rdu_incentives', JSON.stringify(incentives)); }, [incentives]);
  useEffect(() => { localStorage.setItem('rdu_meeting_history', JSON.stringify(meetingHistory)); }, [meetingHistory]);


  // Handle automatic archival for non-renewals & missing meeting alerts
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const membersToArchive = members.filter(m => 
      m.status === 'Active' && 
      m.archivalDate && 
      m.archivalDate <= today
    );

    if (membersToArchive.length > 0) {
      setMembers(prevMembers => 
        prevMembers.map(m => 
          membersToArchive.find(ma => ma.id === m.id) ? { ...m, status: 'Inactive' } : m
        )
      );
    }
    
    // --- DEMO SIMULATION for missing meeting entry ---
    const hasSimulatedDraft = localStorage.getItem('rdu_simulated_draft_created');
    if (!hasSimulatedDraft) {
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const staleDraftData = {
            currentDraftId: null,
            meetingDate: twoWeeksAgo.toISOString().split('T')[0],
            meetingTime: "16:00",
            sessionAttendance: {},
            sessionVisitors: [],
            sessionReferrals: [], sessionApplications: [], sessionInductions: [],
            sessionGratitude: {}, sessionBizChatCounts: {}, pendingReferralUpdates: {},
        };
        localStorage.setItem('rdu_active_meeting_draft', JSON.stringify(staleDraftData));
        localStorage.setItem('rdu_simulated_draft_created', 'true');
    }
    // --- END DEMO SIMULATION ---

    let historyNeedsUpdate = false;
    let newHistory = [...meetingHistory];

    // Check active draft in localStorage to see if it's past-due
    const activeDraftJSON = localStorage.getItem('rdu_active_meeting_draft');
    if (activeDraftJSON) {
      const activeDraft = JSON.parse(activeDraftJSON);
      if (activeDraft.meetingDate < today && !activeDraft.currentDraftId) {
        const newDraft: MeetingDraft = {
          id: `draft-${Date.now()}`,
          date: activeDraft.meetingDate,
          time: activeDraft.meetingTime,
          lastSaved: new Date().toISOString(),
          status: 'Draft',
          data: {
            attendance: activeDraft.sessionAttendance,
            visitors: activeDraft.sessionVisitors,
            referrals: activeDraft.sessionReferrals,
            applications: activeDraft.sessionApplications,
            gratitude: activeDraft.sessionGratitude,
            bizChatCounts: activeDraft.sessionBizChatCounts,
            inductedMemberIds: activeDraft.sessionInductions,
          }
        };
        newHistory.push(newDraft);
        historyNeedsUpdate = true;
        localStorage.removeItem('rdu_active_meeting_draft');
      }
    }
    
    if (historyNeedsUpdate) {
      setMeetingHistory(newHistory);
    }
    
    // Check all history items for unfinalized past meetings and create alerts
    const unfinalized = newHistory
      .filter(draft => draft.status === 'Draft' && draft.date < today)
      .map(draft => draft.id);

    setUnfinalizedMeetingIds(unfinalized);
  }, []); // Run once on app load

  const handleNavigateToDraft = (draftId: string) => {
    setActiveTab('meetings');
    setDraftToLoad(draftId);
    window.scrollTo(0, 0);
  };
  
  const handleClearUnfinalizedAlert = (draftId: string) => {
    setUnfinalizedMeetingIds(prev => prev.filter(id => id !== draftId));
  };


  // Close mobile menu on tab change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const navigation = [
    { id: 'dashboard', name: 'Team Dashboard', icon: LayoutDashboard },
    { id: 'meetings', name: 'Record Meeting', icon: ClipboardList },
    { id: 'visitors', name: 'Guest Database', icon: UserPlus },
    { id: 'applications', name: 'Applications', icon: FileText },
    { id: 'members', name: 'Team Members', icon: Users },
  ];
  
  if (user?.role === 'super-admin') {
    navigation.push({ id: 'users', name: 'User Management', icon: UsersIcon });
  }

  if (!user) {
    return <Login />;
  }

  const SidebarContent = () => (
    <>
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-red-600 p-2 rounded-lg">
            <Flame className="w-6 h-6 text-white" />
          </div>
          {(isSidebarOpen || isMobileMenuOpen) && <span className="font-bold text-lg tracking-tight text-white">RDU Heatwave</span>}
        </div>
        <button onClick={toggleSidebar} className="hidden lg:block p-1 hover:bg-slate-800 rounded text-slate-400">
          <Menu className="w-5 h-5" />
        </button>
        <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-1 hover:bg-slate-800 rounded text-slate-400">
          <X className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 mt-6 px-3 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-6 h-6 shrink-0" />
              {(isSidebarOpen || isMobileMenuOpen) && (
                <div className="flex flex-1 justify-between items-center">
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button onClick={() => setChangePasswordModalOpen(true)} className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white transition-colors">
            <KeyRound className="w-5 h-5 shrink-0" />
             {(isSidebarOpen || isMobileMenuOpen) && <span className="font-medium text-sm">Change Password</span>}
        </button>
         <button onClick={logout} className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-500 hover:bg-red-900/50 hover:text-red-300 transition-colors mb-2">
            <LogOut className="w-5 h-5 shrink-0" />
             {(isSidebarOpen || isMobileMenuOpen) && <span className="font-medium text-sm">Logout</span>}
        </button>
        <div className={`flex items-center gap-3 ${(!isSidebarOpen && !isMobileMenuOpen) && 'justify-center'}`}>
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0 uppercase">{user.username.charAt(0)}</div>
          {(isSidebarOpen || isMobileMenuOpen) && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate text-white capitalize">{user.username}</p>
              <p className="text-xs text-slate-500 truncate italic capitalize">{user.role}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row overflow-x-hidden">
      {isChangePasswordModalOpen && <ChangePasswordModal onClose={() => setChangePasswordModalOpen(false)} />}
      <header className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-[60]">
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-red-600" />
          <span className="font-bold tracking-tight">RDU Heatwave</span>
        </div>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 hover:bg-slate-800 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      <aside 
        className={`hidden lg:flex transition-all duration-300 bg-slate-900 flex-col fixed inset-y-0 z-50 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <SidebarContent />
      </aside>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-4/5 max-w-xs h-full bg-slate-900 flex flex-col animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className={`flex-1 transition-all duration-300 p-4 sm:p-6 lg:p-8 w-full ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <header className="mb-6 lg:mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">
              {navigation.find(n => n.id === activeTab)?.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium uppercase tracking-widest mt-2 opacity-70">
              Two Twelve Referral Network • RDU Heatwave
            </p>
          </div>
        </header>

        <div className="max-w-7xl mx-auto space-y-6">
          {activeTab === 'dashboard' && (
            <Dashboard 
              members={members} 
              setMembers={setMembers}
              referrals={referrals} 
              setReferrals={setReferrals}
              visitors={visitors} 
              revenue={revenue} 
              setRevenue={setRevenue}
              attendance={attendance}
              applications={applications}
              bizChats={bizChats}
              incentives={incentives}
              unfinalizedMeetingIds={unfinalizedMeetingIds}
              meetingHistory={meetingHistory}
              handleNavigateToDraft={handleNavigateToDraft}
            />
          )}
          {activeTab === 'meetings' && (
            <MeetingEntry
              members={members}
              setAttendance={setAttendance}
              setVisitors={setVisitors}
              setReferrals={setReferrals}
              setRevenue={setRevenue}
              referrals={referrals}
              revenue={revenue}
              bizChats={bizChats}
              setBizChats={setBizChats}
              incentives={incentives}
              setIncentives={setIncentives}
              visitors={visitors}
              applications={applications}
              setApplications={setApplications}
              setMembers={setMembers}
              meetingHistory={meetingHistory}
              setMeetingHistory={setMeetingHistory}
              draftToLoad={draftToLoad}
              setDraftToLoad={setDraftToLoad}
              handleClearUnfinalizedAlert={handleClearUnfinalizedAlert}
            />
          )}
          {activeTab === 'applications' && (
            <ApplicationsHub
              applications={applications}
              setApplications={setApplications}
              members={members}
              visitors={visitors}
              setVisitors={setVisitors}
            />
          )}
          {activeTab === 'members' && (
            <MemberList 
              members={members} 
              setMembers={setMembers} 
              referrals={referrals}
              revenue={revenue}
              attendance={attendance}
              bizChats={bizChats}
            />
          )}
          {activeTab === 'visitors' && (
            <VisitorLog 
              visitors={visitors} 
              setVisitors={setVisitors} 
              members={members} 
              viewOnly={false}
            />
          )}
          {activeTab === 'users' && user.role === 'super-admin' && (
            <UserManagement />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;

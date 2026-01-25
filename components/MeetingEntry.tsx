
import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Member, 
  Attendance, 
  AttendanceStatus, 
  Visitor, 
  Referral, 
  ReferralType, 
  RevenueRecord,
  ReferralStatus,
  BizChat,
  GratitudeIncentive,
  MeetingDraft,
  Application,
  MeetingStatus,
  ApplicationStatus
} from '../types';
import { 
  Check, 
  X, 
  UserMinus, 
  UserPlus, 
  Handshake, 
  Plus, 
  Minus,
  Trash2,
  ClipboardCheck,
  History,
  CheckCircle2,
  ArrowRightCircle,
  Users,
  MessageSquare,
  Gift,
  Save,
  FolderOpen,
  UserCheck,
  Edit3,
  Calendar,
  Flame,
  ChevronRight,
  Monitor,
  Tag,
  Sparkles,
  ArrowLeft,
  Clock,
  ShieldCheck,
  Lock,
  Delete,
  AlertTriangle,
  Zap,
  BarChart3,
  ListFilter,
  TrendingUp,
  FileText,
  Share2,
  FileDown,
  Info,
  Kanban,
  DollarSign
} from 'lucide-react';
import { getUpcomingBirthdays } from '../utils/dateHelpers';

interface MeetingEntryProps {
  members: Member[];
  setAttendance: React.Dispatch<React.SetStateAction<Attendance[]>>;
  setVisitors: React.Dispatch<React.SetStateAction<Visitor[]>>;
  setReferrals: React.Dispatch<React.SetStateAction<Referral[]>>;
  setRevenue: React.Dispatch<React.SetStateAction<RevenueRecord[]>>;
  referrals: Referral[];
  revenue: RevenueRecord[];
  bizChats: BizChat[];
  setBizChats: React.Dispatch<React.SetStateAction<BizChat[]>>;
  incentives: GratitudeIncentive[];
  setIncentives: React.Dispatch<React.SetStateAction<GratitudeIncentive[]>>;
  visitors: Visitor[];
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  meetingHistory: MeetingDraft[];
  setMeetingHistory: React.Dispatch<React.SetStateAction<MeetingDraft[]>>;
  draftToLoad: string | null;
  setDraftToLoad: (id: string | null) => void;
  handleClearUnfinalizedAlert: (draftId: string) => void;
}

const MeetingEntry: React.FC<MeetingEntryProps> = ({ 
  members, setAttendance, setVisitors, setReferrals, setRevenue, 
  referrals, revenue, bizChats, setBizChats, incentives, setIncentives, 
  visitors, applications, setApplications, setMembers,
  meetingHistory, setMeetingHistory, draftToLoad, setDraftToLoad, handleClearUnfinalizedAlert
}) => {
  const activeMembers = members.filter(m => m.status === 'Active');
  
  const getNextThursdayAtFour = () => {
    const now = new Date();
    const nextThursday = new Date();
    const dayOffset = (4 + 7 - now.getDay()) % 7;
    const offset = (dayOffset === 0 && now.getHours() >= 16) ? 7 : dayOffset;
    nextThursday.setDate(now.getDate() + offset);
    nextThursday.setHours(16, 0, 0, 0);
    return nextThursday;
  };
  
  const getInitialPendingUpdates = () => {
      const initialUpdates: Record<string, ReferralStatus> = {};
      referrals.forEach(r => {
          if (r.status === 'New' || r.status === 'In Progress') {
              initialUpdates[r.id] = 'In Progress';
          }
      });
      return initialUpdates;
  };

  // State Declarations
  const [currentView, setCurrentView] = useState<'form' | 'history'>('form');
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [meetingDate, setMeetingDate] = useState(getNextThursdayAtFour().toISOString().split('T')[0]);
  const [meetingTime, setMeetingTime] = useState("16:00");
  const [meetingStatus, setMeetingStatus] = useState<MeetingStatus>('Normal');
  const [justification, setJustification] = useState('');
  const [sessionAttendance, setSessionAttendance] = useState<Record<string, { status: AttendanceStatus; subName?: string }>>({});
  const [sessionVisitors, setSessionVisitors] = useState<Partial<Visitor>[]>([]);
  const [sessionReferrals, setSessionReferrals] = useState<Partial<Referral>[]>([]);
  const [sessionApplications, setSessionApplications] = useState<Partial<Application>[]>([]);
  const [sessionInductions, setSessionInductions] = useState<string[]>([]);
  const [sessionGratitude, setSessionGratitude] = useState<Record<string, { corporate: number; member: number }>>({});
  const [sessionBizChatCounts, setSessionBizChatCounts] = useState<Record<string, number>>({});
  const [pendingReferralUpdates, setPendingReferralUpdates] = useState<Record<string, ReferralStatus>>({});
  const [sessionRevenueData, setSessionRevenueData] = useState<Record<string, number>>({});
  const [sessionApplicationUpdates, setSessionApplicationUpdates] = useState<Record<string, ApplicationStatus>>({});
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [showPinPad, setShowPinPad] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showJustificationModal, setShowJustificationModal] = useState(false);
  const [tempJustification, setTempJustification] = useState('');
  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [guestEntry, setGuestEntry] = useState<Partial<Visitor>>({ isFirstVisit: true });
  const [isReturningGuest, setIsReturningGuest] = useState(false);
  const [autofillSuggestion, setAutofillSuggestion] = useState<{ appIndex: number; visitor: Visitor } | null>(null);

  // Memoized Values
  const approvedApplicants = useMemo(() => 
    applications.filter(a => a.status === 'Approved'), 
  [applications]);
  
  // FIX: Add explicit type `current: { corporate: number }` to fix property access on `unknown`.
  const totalCorporateGI = useMemo(() => 
    Object.values(sessionGratitude).reduce((sum, current: { corporate: number }) => sum + (current.corporate || 0), 0),
  [sessionGratitude]);
  
  // FIX: Add explicit type `current: { member: number }` to fix property access on `unknown`.
  const totalMemberGI = useMemo(() => 
    Object.values(sessionGratitude).reduce((sum, current: { member: number }) => sum + (current.member || 0), 0),
  [sessionGratitude]);

  // FIX: Add explicit type `current: number` to fix arithmetic operation on `unknown`.
  const totalTeamBizChats = useMemo(() => 
    Object.values(sessionBizChatCounts).reduce((sum, current: number) => sum + (current || 0), 0),
  [sessionBizChatCounts]);

  const EXIT_PIN = "010826";
  
  const isEditingHistory = useMemo(() => 
    currentDraftId && meetingHistory.some(h => h.id === currentDraftId),
    [currentDraftId, meetingHistory]
  );
  
  const uniqueVisitorProfiles = useMemo(() => {
    const profiles: Record<string, Visitor> = {};
    [...visitors]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach(v => {
        const key = v.email?.toLowerCase() || v.name?.toLowerCase();
        if (key && !profiles[key]) {
          profiles[key] = v;
        }
      });
    return Object.values(profiles);
  }, [visitors]);

  // Effects
  useEffect(() => {
    const savedDraftJSON = localStorage.getItem('rdu_active_meeting_draft');
    if (savedDraftJSON) {
        try {
            const savedDraft = JSON.parse(savedDraftJSON);
            if (Object.keys(savedDraft).length > 0) {
              setCurrentDraftId(savedDraft.currentDraftId || null);
              setMeetingDate(savedDraft.meetingDate || getNextThursdayAtFour().toISOString().split('T')[0]);
              setMeetingTime(savedDraft.meetingTime || "16:00");
              setMeetingStatus(savedDraft.meetingStatus || 'Normal');
              setJustification(savedDraft.justification || '');
              setSessionAttendance(savedDraft.sessionAttendance || {});
              setSessionVisitors(savedDraft.sessionVisitors || []);
              setSessionReferrals(savedDraft.sessionReferrals || []);
              setSessionApplications(savedDraft.sessionApplications || []);
              setSessionApplicationUpdates(savedDraft.sessionApplicationUpdates || {});
              setSessionInductions(savedDraft.sessionInductions || []);
              setSessionGratitude(savedDraft.sessionGratitude || {});
              setSessionBizChatCounts(savedDraft.sessionBizChatCounts || {});
              setPendingReferralUpdates(savedDraft.pendingReferralUpdates || {});
              setSessionRevenueData(savedDraft.sessionRevenueData || {});
            }
        } catch (error) {
            console.error("Failed to parse active meeting draft:", error);
            localStorage.removeItem('rdu_active_meeting_draft');
        }
    } else {
        setPendingReferralUpdates(getInitialPendingUpdates());
    }
  }, []);

  useEffect(() => {
    const activeDraft = {
      currentDraftId,
      meetingDate,
      meetingTime,
      meetingStatus,
      justification,
      sessionAttendance,
      sessionVisitors,
      sessionReferrals,
      sessionApplications,
      sessionApplicationUpdates,
      sessionInductions,
      sessionGratitude,
      sessionBizChatCounts,
      pendingReferralUpdates,
      sessionRevenueData,
    };
    localStorage.setItem('rdu_active_meeting_draft', JSON.stringify(activeDraft));
  }, [
    currentDraftId, meetingDate, meetingTime, meetingStatus, justification,
    sessionAttendance, sessionVisitors, sessionReferrals, sessionApplications,
    sessionApplicationUpdates, sessionInductions, sessionGratitude,
    sessionBizChatCounts, pendingReferralUpdates, sessionRevenueData,
  ]);
  
  useEffect(() => {
    if (draftToLoad) {
      const draftExists = meetingHistory.some(d => d.id === draftToLoad);
      if (draftExists) {
        loadHistoryForEdit(draftToLoad);
      } else {
        console.warn(`Attempted to load a draft with ID ${draftToLoad} that does not exist.`);
      }
      setDraftToLoad(null);
    }
  }, [draftToLoad, meetingHistory]);


  useEffect(() => {
    if (!guestEntry.email && !guestEntry.name) { setIsReturningGuest(false); return; }
    const emailMatch = guestEntry.email ? visitors.find(v => v.email?.toLowerCase() === guestEntry.email?.toLowerCase()) : null;
    const nameMatch = guestEntry.name ? visitors.find(v => v.name?.toLowerCase() === guestEntry.name?.toLowerCase()) : null;
    if (emailMatch || nameMatch) {
      setIsReturningGuest(true);
      const match = emailMatch || nameMatch;
      if (emailMatch && !guestEntry.name) setGuestEntry(prev => ({ ...prev, name: match?.name }));
      if (!guestEntry.companyName) setGuestEntry(prev => ({ ...prev, companyName: match?.companyName }));
      if (!guestEntry.professionalClassification) setGuestEntry(prev => ({ ...prev, professionalClassification: match?.professionalClassification }));
      if (!guestEntry.phone) setGuestEntry(prev => ({ ...prev, phone: match?.phone }));
    } else {
      setIsReturningGuest(false);
    }
  }, [guestEntry.email, guestEntry.name, visitors]);
  
  // Handler Functions
  const handleSaveDraft = () => {
    const draftData = {
      attendance: sessionAttendance,
      visitors: sessionVisitors,
      referrals: sessionReferrals,
      applications: sessionApplications,
      gratitude: sessionGratitude,
      bizChatCounts: sessionBizChatCounts,
      inductedMemberIds: sessionInductions,
      revenueData: sessionRevenueData,
    };
    const draftId = currentDraftId || `draft-${Date.now()}`;
    const newDraft: MeetingDraft = {
      id: draftId,
      date: meetingDate,
      time: meetingTime,
      lastSaved: new Date().toISOString(),
      status: 'Draft',
      meetingStatus,
      justification,
      data: draftData,
    };

    const existingIndex = meetingHistory.findIndex(h => h.id === draftId);
    if (existingIndex > -1) {
      const updatedHistory = [...meetingHistory];
      updatedHistory[existingIndex] = newDraft;
      setMeetingHistory(updatedHistory);
    } else {
      setMeetingHistory(prev => [newDraft, ...prev]);
    }
    setCurrentDraftId(draftId);
    alert('Draft saved successfully!');
  };

  const resetForm = () => {
    const nextThurs = getNextThursdayAtFour();
    setMeetingDate(nextThurs.toISOString().split('T')[0]);
    setMeetingTime("16:00");
    setMeetingStatus('Normal');
    setJustification('');
    setCurrentDraftId(null);
    setSessionAttendance({});
    setSessionVisitors([]);
    setSessionReferrals([]);
    setSessionApplications([]);
    setSessionInductions([]);
    setPendingReferralUpdates(getInitialPendingUpdates());
    setSessionRevenueData({});
    setSessionApplicationUpdates({});
    const gratitude: Record<string, { corporate: number; member: number }> = {};
    const bChats: Record<string, number> = {};
    activeMembers.forEach(m => {
      gratitude[m.id] = { corporate: 0, member: 0 };
      bChats[m.id] = 0;
    });
    setSessionGratitude(gratitude);
    setSessionBizChatCounts(bChats);
    localStorage.removeItem('rdu_active_meeting_draft');
  };

  const deleteHistory = (id: string) => {
    if (window.confirm(`Are you sure you want to delete this history record?`)) {
      setMeetingHistory(prev => prev.filter(h => h.id !== id));
    }
  };
  
  const loadHistoryForEdit = (id: string) => {
    const historyItem = meetingHistory.find(h => h.id === id);
    if (!historyItem) {
      alert("Error: Could not find the selected meeting record.");
      return;
    }
    setMeetingDate(historyItem.date);
    setMeetingTime(historyItem.time);
    setMeetingStatus(historyItem.meetingStatus || 'Normal');
    setJustification(historyItem.justification || '');
    setSessionAttendance(historyItem.data.attendance || {});
    setSessionVisitors(historyItem.data.visitors || []);
    setSessionReferrals(historyItem.data.referrals || []);
    setSessionApplications(historyItem.data.applications || []);
    setSessionInductions(historyItem.data.inductedMemberIds || []);
    setSessionGratitude(historyItem.data.gratitude || {});
    setSessionBizChatCounts(historyItem.data.bizChatCounts || {});
    setSessionRevenueData(historyItem.data.revenueData || {});
    setCurrentDraftId(historyItem.id);
    setCurrentView('form');
    setPendingReferralUpdates({});
    setSessionApplicationUpdates({});
  };

  const commitMeeting = async () => {
    const finalizedData = {
      attendance: sessionAttendance,
      visitors: sessionVisitors,
      referrals: sessionReferrals,
      applications: sessionApplications,
      gratitude: sessionGratitude,
      bizChatCounts: sessionBizChatCounts,
      inductedMemberIds: sessionInductions,
      revenueData: sessionRevenueData,
    };
    
    const finalizedDraft: MeetingDraft = {
      id: currentDraftId || `hist-${Date.now()}`,
      date: meetingDate,
      time: meetingTime,
      lastSaved: new Date().toISOString(),
      status: 'Finalized',
      meetingStatus,
      justification,
      data: finalizedData,
    };
    
    if (!isEditingHistory) {
      if (Object.keys(pendingReferralUpdates).length > 0) {
        setReferrals(prev => prev.map(r => 
          pendingReferralUpdates[r.id] ? { ...r, status: pendingReferralUpdates[r.id] } : r
        ));
      }

      const newRevenueRecords: RevenueRecord[] = [];
      Object.entries(sessionRevenueData).forEach(([referralId, amount]) => {
          const referral = referrals.find(r => r.id === referralId);
          if (referral && amount > 0 && pendingReferralUpdates[referralId] === 'Closed Business') {
              newRevenueRecords.push({
                  id: `rev-${Date.now()}-${referralId}`,
                  date: meetingDate,
                  referralId: referralId,
                  amount: amount,
                  memberId: referral.toMemberId, 
              });
          }
      });
      if (newRevenueRecords.length > 0) {
          setRevenue(prev => [...prev, ...newRevenueRecords]);
      }
      
      if (Object.keys(sessionApplicationUpdates).length > 0) {
        setApplications(prev => prev.map(a => 
            sessionApplicationUpdates[a.id] ? { ...a, status: sessionApplicationUpdates[a.id] } : a
        ));
      }
      
      if (meetingStatus === 'Normal') {
        const attendanceUpdates = activeMembers.map(m => ({
          id: `${meetingDate}-${m.id}-${Date.now()}`, date: meetingDate, memberId: m.id,
          status: sessionAttendance[m.id]?.status || AttendanceStatus.PRESENT, subName: sessionAttendance[m.id]?.subName
        }));
        setAttendance(prev => [...prev, ...attendanceUpdates]);
      }

      const validGuests: Visitor[] = sessionVisitors.filter(v => v.name).map(v => ({
        id: v.id || `visitor-${Date.now()}`, date: meetingDate, name: v.name || '', phone: v.phone || '', email: v.email || '',
        professionalClassification: v.professionalClassification || '', companyName: v.companyName || '', invitedByMemberId: v.invitedByMemberId || '',
        followUpStatus: v.followUpStatus as any || 'Pending', isFirstVisit: v.isFirstVisit, dob: v.dob
      }));
      setVisitors(prev => [...prev, ...validGuests]);

      sessionInductions.forEach(appId => {
        const app = applications.find(a => a.id === appId);
        if (app) {
          const memberId = `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newMember: Member = {
            id: memberId, name: app.name, dob: app.dob, address: app.address, companyName: app.companyName,
            professionalClassification: app.professionalClassification, email: app.email, phone: app.phone, memberSince: meetingDate,
            renewalDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], status: 'Active',
            sponsoredByMemberId: app.sponsoredByMemberId,
            // Lifecycle tracking - preserve history
            sourceApplicationId: app.id,
            sourceVisitorId: app.sourceVisitorId,
            originalInviterMemberId: app.originalInviterMemberId,
            firstVisitDate: app.firstVisitDate,
            appliedDate: app.appliedDate
          };
          setMembers(prev => [...prev, newMember]);
          // Mark application as inducted instead of deleting
          setApplications(prev => prev.map(a =>
            a.id === appId ? { ...a, inductedAsMemberId: memberId, inductionDate: meetingDate } : a
          ));
          // Mark visitor records as converted to member instead of deleting
          setVisitors(prev => prev.map(v =>
            v.email?.toLowerCase() === app.email.toLowerCase()
              ? { ...v, followUpStatus: 'Member' as const, convertedToMemberId: memberId }
              : v
          ));
        }
      });
      
      const newApplications: Application[] = sessionApplications.filter(a => a.name && a.email && a.companyName).map(a => {
        // Find the original visitor record to preserve history
        const originalVisitor = visitors.find(v => v.email?.toLowerCase() === a.email?.toLowerCase());
        const appId = `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return {
          id: appId, name: a.name || '', dob: a.dob || '', address: a.address || '', companyName: a.companyName || '',
          professionalClassification: a.professionalClassification || '', email: a.email || '', phone: a.phone || '', appliedDate: meetingDate,
          status: 'Applied' as ApplicationStatus, sponsoredByMemberId: a.sponsoredByMemberId,
          // Lifecycle tracking - preserve visitor history
          sourceVisitorId: originalVisitor?.id,
          originalInviterMemberId: originalVisitor?.invitedByMemberId,
          firstVisitDate: originalVisitor?.date
        };
      });
      if (newApplications.length > 0) {
        setApplications(prev => [...prev, ...newApplications]);
        // Mark visitors as Applied instead of deleting them
        const newAppEmails = newApplications.map(a => a.email.toLowerCase());
        setVisitors(prev => prev.map(v =>
          v.email && newAppEmails.includes(v.email.toLowerCase())
            ? { ...v, followUpStatus: 'Applied' as const, convertedToApplicationId: newApplications.find(app => app.email.toLowerCase() === v.email?.toLowerCase())?.id }
            : v
        ));
      }

      const validReferrals = sessionReferrals.filter(r => r.fromMemberId && r.toMemberId && r.prospectName).map(r => ({
        id: `ref-${Date.now()}`, date: meetingDate, fromMemberId: r.fromMemberId || '', toMemberId: r.toMemberId || '',
        prospectName: r.prospectName || '', type: r.type || ReferralType.INSIDE, status: 'In Progress' as ReferralStatus
      }));
      setReferrals(prev => [...prev, ...validReferrals]);

      // FIX: Add explicit type `[string, number]` to fix operation on `unknown`.
      const bizChatUpdates: BizChat[] = [];
      Object.entries(sessionBizChatCounts).forEach(([memberId, count]: [string, number]) => {
        for (let i = 0; i < count; i++) { bizChatUpdates.push({ id: `bc-${memberId}-${i}-${Date.now()}`, date: meetingDate, member1Id: memberId, member2Id: 'TEAM_MEMBER' }); }
      });
      setBizChats(prev => [...prev, ...bizChatUpdates]);

      // FIX: Add explicit type `[string, { corporate: number, member: number }]` to fix property access on `unknown`.
      const gratitudeUpdates: GratitudeIncentive[] = [];
      Object.entries(sessionGratitude).forEach(([memberId, counts]: [string, { corporate: number, member: number }]) => {
        if (counts.corporate > 0) { gratitudeUpdates.push({ id: `gi-corp-${memberId}-${Date.now()}`, date: meetingDate, fromMemberId: memberId, amount: counts.corporate, type: 'Corporate' }); }
        if (counts.member > 0) { gratitudeUpdates.push({ id: `gi-mem-${memberId}-${Date.now()}`, date: meetingDate, fromMemberId: memberId, amount: counts.member, type: 'Member' }); }
      });
      setIncentives(prev => [...prev, ...gratitudeUpdates]);
    }

    const existingIndex = meetingHistory.findIndex(h => h.id === finalizedDraft.id);
    if (existingIndex > -1) {
      const updatedHistory = [...meetingHistory];
      updatedHistory[existingIndex] = finalizedDraft;
      setMeetingHistory(updatedHistory);
    } else {
      setMeetingHistory(prev => [finalizedDraft, ...prev]);
    }
    
    if (finalizedDraft.status === 'Finalized') {
      await generateAndEmailPdf(finalizedDraft);
    }

    if (finalizedDraft.id) {
        handleClearUnfinalizedAlert(finalizedDraft.id);
    }

    setShowFinalizeModal(false);
    alert("FINALIZED: All records synchronized with the Team Command Center.");
    resetForm();
  };
  
  const handleGuestCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEntry.name || !guestEntry.email || !guestEntry.phone || !guestEntry.invitedByMemberId) {
        alert("Please fill out all required fields.");
        return;
    }
    const newGuest = { ...guestEntry, followUpStatus: 'Pending', id: `guest-${Date.now()}`, isFirstVisit: !isReturningGuest };
    localStorage.setItem('rdu_kiosk_new_guest', JSON.stringify(newGuest));
    setSessionVisitors(prev => [...prev, newGuest]);
    setCheckInSuccess(true);
    setTimeout(() => {
      setCheckInSuccess(false);
      setGuestEntry({ isFirstVisit: true });
      setIsReturningGuest(false);
    }, 7000);
  };
  
  const handleGuestDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const prevValue = guestEntry.dob || '';
    let value = e.target.value.replace(/[^\d/]/g, '');
    if (value.length === 2 && prevValue.length === 1) {
        value += '/';
    }
    if (value.length > 5) value = value.substring(0, 5);
    setGuestEntry({...guestEntry, dob: value});
  };

  const handlePinSubmit = () => {
    if (pinInput === EXIT_PIN) {
      setShowPinPad(false); setShowCheckInForm(false); setPinInput('');
    } else {
      setPinError(true); setPinInput(''); setTimeout(() => setPinError(false), 2000);
    }
  };

  const updateMetric = (memberId: string, type: 'corporate' | 'member' | 'bizchat', delta: number) => {
    if (type === 'bizchat') {
      setSessionBizChatCounts(prev => ({ ...prev, [memberId]: Math.max(0, (prev[memberId] || 0) + delta) }));
    } else {
      setSessionGratitude(prev => {
        const currentCounts = prev[memberId] || { corporate: 0, member: 0 };
        const newCounts = {
          ...currentCounts,
          [type]: Math.max(0, currentCounts[type] + delta),
        };
        return { ...prev, [memberId]: newCounts };
      });
    }
  };

  const updateSessionApplication = (index: number, field: keyof Application, value: any) => {
    const updatedApps = [...sessionApplications];
    updatedApps[index] = { ...updatedApps[index], [field]: value };
    setSessionApplications(updatedApps);
  };
  
  const handleAppNameChange = (value: string, index: number) => {
    updateSessionApplication(index, 'name', value);

    if (value.length > 2) {
      const match = uniqueVisitorProfiles.find(
        v => v.name.toLowerCase().startsWith(value.toLowerCase()) && v.name.toLowerCase() !== value.toLowerCase()
      );
      if (match) {
        setAutofillSuggestion({ appIndex: index, visitor: match });
      } else {
        setAutofillSuggestion(null);
      }
    } else {
      setAutofillSuggestion(null);
    }
  };

  const handleAppNameKeyDown = (e: React.KeyboardEvent, index: number) => {
    if ((e.key === 'Tab' || e.key === 'Enter') && autofillSuggestion && autofillSuggestion.appIndex === index) {
      e.preventDefault();
      const visitor = autofillSuggestion.visitor;
      const updatedApps = [...sessionApplications];
      const currentApp = updatedApps[index];
      updatedApps[index] = {
        ...currentApp,
        name: visitor.name,
        email: visitor.email,
        phone: visitor.phone,
        companyName: visitor.companyName,
        professionalClassification: visitor.professionalClassification,
        sponsoredByMemberId: visitor.invitedByMemberId || currentApp.sponsoredByMemberId,
      };
      setSessionApplications(updatedApps);
      setAutofillSuggestion(null);

      const form = e.currentTarget.closest('div.grid');
      if (form) {
        const inputs = Array.from(form.querySelectorAll('input, select'));
        const currentIndex = inputs.findIndex(el => (el as HTMLElement).id === `appName-${index}`);
        const nextInput = inputs[currentIndex + 1] as HTMLElement;
        if (nextInput) {
            nextInput.focus();
        }
      }
    }
  };

  const handleAppDobChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const prevValue = sessionApplications[index]?.dob || '';
    let value = e.target.value.replace(/[^\d/]/g, '');
    if (value.length === 2 && prevValue.length === 1) {
        value += '/';
    }
    if (value.length > 5) value = value.substring(0, 5);
    updateSessionApplication(index, 'dob', value);
  };

  const handleConvertToApplication = (visitorIndex: number) => {
    const visitorToConvert = sessionVisitors[visitorIndex];
    if (!visitorToConvert) return;
  
    const newApplication: Partial<Application> = {
      name: visitorToConvert.name,
      email: visitorToConvert.email,
      phone: visitorToConvert.phone,
      companyName: visitorToConvert.companyName,
      professionalClassification: visitorToConvert.professionalClassification,
      sponsoredByMemberId: visitorToConvert.invitedByMemberId,
      status: 'Applied',
      appliedDate: meetingDate,
    };
  
    setSessionApplications(prev => [...prev, newApplication]);
    setSessionVisitors(prev => prev.filter((_, idx) => idx !== visitorIndex));
  };

  const currentSyncCode = useMemo(() => {
    const stateToSync = {
        meetingDate, meetingTime, sessionAttendance, sessionVisitors,
        sessionReferrals, sessionApplications, sessionInductions,
        sessionGratitude, sessionBizChatCounts, pendingReferralUpdates, sessionRevenueData,
    };
    try {
        const jsonString = JSON.stringify(stateToSync);
        return btoa(jsonString);
    } catch (e) {
        console.error("Failed to generate sync code", e);
        return "Error generating code";
    }
  }, [
      meetingDate, meetingTime, sessionAttendance, sessionVisitors,
      sessionReferrals, sessionApplications, sessionInductions,
      sessionGratitude, sessionBizChatCounts, pendingReferralUpdates, sessionRevenueData
  ]);

  const loadFromSyncCode = () => {
      if (!syncCodeInput) {
          alert("Please paste a code to load.");
          return;
      }
      try {
          const jsonString = atob(syncCodeInput);
          const loadedState = JSON.parse(jsonString);

          setMeetingDate(loadedState.meetingDate || getNextThursdayAtFour().toISOString().split('T')[0]);
          setMeetingTime(loadedState.meetingTime || "16:00");
          setSessionAttendance(loadedState.sessionAttendance || {});
          setSessionVisitors(loadedState.sessionVisitors || []);
          setSessionReferrals(loadedState.sessionReferrals || []);
          setSessionApplications(loadedState.sessionApplications || []);
          setSessionInductions(loadedState.sessionInductions || []);
          setSessionGratitude(loadedState.sessionGratitude || {});
          setSessionBizChatCounts(loadedState.sessionBizChatCounts || {});
          setPendingReferralUpdates(loadedState.pendingReferralUpdates || {});
          setSessionRevenueData(loadedState.sessionRevenueData || {});
          
          setCurrentDraftId(null);

          alert("Session loaded successfully!");
          setShowSyncModal(false);
          setSyncCodeInput('');
      } catch (e) {
          console.error("Failed to load from sync code", e);
          alert("Invalid or corrupted sync code. Please check the code and try again.");
      }
  };

  const adminReportMetrics = useMemo(() => {
    const ytdStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const ytdFilter = (item: { date: string }) => item.date >= ytdStart;

    const priorMeetingDate = meetingHistory.length > 0 ? meetingHistory[0].date : null;
    const priorMeetingFilter = (item: { date: string }) => priorMeetingDate ? item.date === priorMeetingDate : false;

    return {
      referrals: { ytd: referrals.filter(ytdFilter).length, prior: referrals.filter(priorMeetingFilter).length },
      revenue: { ytd: revenue.filter(ytdFilter).reduce((s, r) => s + r.amount, 0), prior: revenue.filter(priorMeetingFilter).reduce((s, r) => s + r.amount, 0) },
      bizChats: { ytd: bizChats.filter(ytdFilter).length, prior: bizChats.filter(priorMeetingFilter).length },
      guests: { ytd: visitors.filter(ytdFilter).length, prior: visitors.filter(priorMeetingFilter).length },
      cgi: { ytd: incentives.filter(i => ytdFilter(i) && i.type === 'Corporate').reduce((s, i) => s + i.amount, 0), prior: incentives.filter(i => priorMeetingFilter(i) && i.type === 'Corporate').reduce((s, i) => s + i.amount, 0) },
      mgi: { ytd: incentives.filter(i => ytdFilter(i) && i.type === 'Member').reduce((s, i) => s + i.amount, 0), prior: incentives.filter(i => priorMeetingFilter(i) && i.type === 'Member').reduce((s, i) => s + i.amount, 0) },
    };
  }, [referrals, revenue, bizChats, visitors, incentives, meetingHistory]);
  
  const pendingReferralsForReport = useMemo(() => 
    referrals.filter(r => r.status === 'New' || r.status === 'In Progress'),
  [referrals]);

  const pendingAppsForReport = useMemo(() => 
    applications.filter(a => a.status !== 'Approved' && a.status !== 'Declined'), 
  [applications]);
  
  const upcomingBirthdays = useMemo(() => {
    return getUpcomingBirthdays(members, meetingDate);
  }, [members, meetingDate]);
  
  const handleMeetingStatusChange = (status: MeetingStatus) => {
    if (status === 'Normal') {
      setMeetingStatus('Normal');
      setJustification('');
    } else {
      setMeetingStatus(status);
      if (!justification) {
        setShowJustificationModal(true);
      }
    }
  };

  const handleJustificationSubmit = () => {
    if (tempJustification.length < 100) return;
    setJustification(tempJustification);
    setShowJustificationModal(false);
    setTempJustification('');
  };
  
  const simulateEmail = (pdf: jsPDF, meetingDate: string) => {
      const activeMemberEmails = members
          .filter(m => m.status === 'Active')
          .map(m => m.email);
      
      const emailList = activeMemberEmails.join(', ');
      
      console.log(`
          --- SIMULATING EMAIL ---
          To: ${emailList}
          Subject: Meeting Report for ${meetingDate}
          Body: Please find the attached PDF for the meeting on ${meetingDate}.
          Attachment: Meeting-Report-${meetingDate}.pdf
          ------------------------
      `);
      
      alert(`SIMULATION: Email with PDF report for ${meetingDate} sent to all active members.`);
  };

  const generateAndEmailPdf = async (meetingData: MeetingDraft) => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0px';
    document.body.appendChild(container);
    
    const pdfRoot = ReactDOM.createRoot(container);
    pdfRoot.render(<MeetingPDFLayout meeting={meetingData} members={members} applications={applications} />);
    
    await new Promise(resolve => setTimeout(resolve, 500));

    const elementToCapture = container.firstChild as HTMLElement;
    if (!elementToCapture) { document.body.removeChild(container); return; }

    const canvas = await html2canvas(elementToCapture, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);

    simulateEmail(pdf, meetingData.date);

    pdfRoot.unmount();
    document.body.removeChild(container);
  };
  
  const handleExportPdf = async (meetingId: string) => {
    const meetingData = meetingHistory.find(h => h.id === meetingId);
    if (!meetingData) return;

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0px';
    document.body.appendChild(container);
    
    const pdfRoot = ReactDOM.createRoot(container);
    pdfRoot.render(<MeetingPDFLayout meeting={meetingData} members={members} applications={applications} />);
    
    await new Promise(resolve => setTimeout(resolve, 500));

    const elementToCapture = container.firstChild as HTMLElement;
    if (!elementToCapture) { document.body.removeChild(container); return; }

    const canvas = await html2canvas(elementToCapture, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`Meeting-Report-${meetingData.date}.pdf`);

    pdfRoot.unmount();
    document.body.removeChild(container);
  };

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-500">
      
      {showFinalizeModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[150] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
           <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="bg-red-600 p-10 text-white"><h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-4">{isEditingHistory ? 'Update Record?' : 'Finalize Meeting?'}</h2></div>
              <div className="p-10 space-y-8 bg-white text-center">
                <p className="text-slate-600 font-medium">
                  {isEditingHistory 
                    ? "This will save your changes and re-send the meeting report PDF to all active members."
                    : "This will permanently commit today's data, update the team leaderboard, and email the report to all active members."}
                </p>
                <div className="flex flex-col gap-3">
                  <button onClick={commitMeeting} className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black italic text-xl">
                    {isEditingHistory ? 'Confirm Update' : 'Commit & Push Data'}
                  </button>
                  <button onClick={() => setShowFinalizeModal(false)} className="w-full py-4 text-[10px] font-black uppercase text-slate-400">Cancel</button>
                </div>
              </div>
           </div>
        </div>
      )}
      
      {showJustificationModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[160] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="bg-amber-500 p-10 text-white"><h2 className="text-2xl sm:text-3xl font-black italic uppercase">Justification Required</h2></div>
            <div className="p-10 space-y-4 bg-white">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase">Reason for '{meetingStatus}' status (Min. 100 Chars)</label>
                <textarea value={tempJustification} onChange={(e) => setTempJustification(e.target.value)} className="w-full h-32 p-4 bg-slate-50 border rounded-2xl text-sm mt-1.5"/>
                <p className={`text-right text-xs font-bold mt-1 ${tempJustification.length < 100 ? 'text-red-500' : 'text-green-600'}`}>{tempJustification.length} / 100</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button onClick={() => { setShowJustificationModal(false); setMeetingStatus('Normal'); }} className="order-2 sm:order-1 flex-1 py-4 text-xs font-black uppercase rounded-2xl">Cancel</button>
                <button onClick={handleJustificationSubmit} disabled={tempJustification.length < 100} className="order-1 sm:order-2 flex-1 py-5 bg-amber-500 text-white rounded-2xl font-black italic disabled:opacity-50">Submit Justification</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showSyncModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[150] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Sync & Share Session</h2>
                        <p className="text-red-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Real-time Handoff</p>
                    </div>
                    <button onClick={() => setShowSyncModal(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                    <div>
                        <label className="block text-sm font-black text-slate-800 uppercase tracking-wider mb-2">1. Share This Code</label>
                        <p className="text-xs text-slate-500 mb-3">Copy this code and send it to a team member. They can paste it to load your current session.</p>
                        <div className="flex gap-2">
                            <input
                                readOnly
                                value={currentSyncCode}
                                className="flex-1 p-4 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono select-all"
                            />
                            <button
                                onClick={() => navigator.clipboard.writeText(currentSyncCode).then(() => alert('Code copied to clipboard!'))}
                                className="px-6 bg-red-600 text-white rounded-xl font-black italic tracking-tighter uppercase text-sm hover:bg-red-700 transition-all"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                    <div className="border-t border-slate-100 my-8"></div>
                    <div>
                        <label className="block text-sm font-black text-slate-800 uppercase tracking-wider mb-2">2. Load From Code</label>
                        <p className="text-xs text-slate-500 mb-3">Paste a code from a team member here to load their session data.</p>
                        <textarea
                            value={syncCodeInput}
                            onChange={(e) => setSyncCodeInput(e.target.value)}
                            placeholder="Paste sync code here..."
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono h-32 resize-none"
                        ></textarea>
                        <button
                            onClick={loadFromSyncCode}
                            className="w-full mt-3 p-5 bg-slate-900 text-white rounded-xl font-black italic tracking-tighter uppercase text-base hover:bg-slate-800 transition-all disabled:opacity-50"
                            disabled={!syncCodeInput}
                        >
                            Load Session Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl">
        <div className="flex justify-between items-center gap-6 mb-8">
          <div className="flex items-center gap-5"><div className="bg-red-600 p-3.5 rounded-2xl"><ClipboardCheck className="w-7 h-7" /></div>
          <div>
            <h2 className="text-xl font-black italic uppercase">{isEditingHistory ? 'Edit History Record' : 'Record Meeting'}</h2>
            <p className="text-[9px] font-black uppercase text-red-400 tracking-[0.2em] mt-2">
              {isEditingHistory ? `Editing Entry: ${meetingDate}` : currentView === 'form' ? 'Active Form' : 'Registry Vault'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditingHistory && (
             <button onClick={resetForm} className="bg-slate-700 px-6 py-3.5 rounded-xl font-black italic uppercase text-xs flex items-center gap-2.5 text-white">
               <X className="w-4 h-4" /> New Form
             </button>
           )}
          <button onClick={handleSaveDraft} className="bg-slate-700 px-6 py-3.5 rounded-xl font-black italic uppercase text-xs flex items-center gap-2.5"><Save className="w-4 h-4" /> Save Draft</button>
          <button onClick={() => setShowSyncModal(true)} className="bg-slate-700 px-6 py-3.5 rounded-xl font-black italic uppercase text-xs flex items-center gap-2.5"><Share2 className="w-4 h-4" /> Sync Session</button>
          <button onClick={() => setShowFinalizeModal(true)} className="bg-red-600 px-6 py-3.5 rounded-xl font-black italic uppercase text-xs flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4" /> {isEditingHistory ? 'Update Record' : 'Finalize Meeting'}</button>
        </div>
        </div>
        <div className="flex bg-slate-800/50 p-1.5 rounded-2xl"><button onClick={() => setCurrentView('form')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 ${currentView === 'form' ? 'bg-red-600 shadow-lg' : 'text-slate-400'}`}><Edit3 className="w-4 h-4" /> Current Form</button><button onClick={() => setCurrentView('history')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 ${currentView === 'history' ? 'bg-red-600 shadow-lg' : 'text-slate-400'}`}><FolderOpen className="w-4 h-4" /> Meeting History</button></div>
      </div>

      {currentView === 'form' ? (
        <div className="space-y-8">
          <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200"><Calendar className="w-4 h-4 text-red-600" /><input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} className="bg-transparent text-xs font-black uppercase text-slate-900" /></div>
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200"><Clock className="w-4 h-4 text-red-600" /><input type="time" value={meetingTime} onChange={e => setMeetingTime(e.target.value)} className="bg-transparent text-xs font-black uppercase text-slate-900" /></div>
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              {(['Normal', 'Cancelled', 'Attendance Excused'] as MeetingStatus[]).map(status => (
                <button key={status} onClick={() => handleMeetingStatusChange(status)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${meetingStatus === status ? 'bg-red-600 text-white' : 'text-slate-400'}`}>{status}</button>
              ))}
            </div>
          </section>

          {meetingStatus !== 'Normal' && (
            <div className="bg-amber-50 border-2 border-dashed border-amber-200 rounded-[2rem] p-6">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                <div>
                  <h4 className="font-black text-amber-800 uppercase tracking-tighter">Meeting Status: {meetingStatus}</h4>
                  <p className="text-sm text-amber-700 mt-2">{justification || 'No justification provided.'}</p>
                </div>
              </div>
            </div>
          )}
          
          <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 relative">
            {meetingStatus !== 'Normal' && (
              <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-[2rem]">
                <p className="bg-white p-4 rounded-2xl border font-black text-slate-500 uppercase tracking-widest text-xs">Attendance is Excused</p>
              </div>
            )}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3"><Users className="w-5 h-5 text-red-600" /><h3 className="text-lg font-black italic uppercase text-slate-900">1. Member Attendance</h3></div>
            <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeMembers.map(m => 
                  <div key={m.id} className="p-4 border border-slate-100 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black uppercase italic text-slate-900 truncate">{m.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase truncate">{m.professionalClassification}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                      <div className="flex gap-1.5">
                        {[{ s: AttendanceStatus.PRESENT, i: Check }, { s: AttendanceStatus.ABSENT, i: X }, { s: AttendanceStatus.SUBSTITUTE, i: UserMinus }].map(opt => 
                          <button key={opt.s} onClick={() => setSessionAttendance(p => ({...p, [m.id]: { ...p[m.id], status: opt.s }}))} className={`w-10 h-10 flex items-center justify-center rounded-lg border-2 ${(sessionAttendance[m.id]?.status || AttendanceStatus.PRESENT) === opt.s ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-slate-100 text-slate-300'}`}><opt.i className="w-4 h-4" /></button>
                        )}
                      </div>
                      {(sessionAttendance[m.id]?.status) === AttendanceStatus.SUBSTITUTE && (
                        <input 
                          placeholder="SUBSTITUTE NAME" 
                          className="w-full sm:w-auto p-2.5 bg-slate-50 border rounded-lg text-[10px] font-black uppercase text-center" 
                          value={sessionAttendance[m.id]?.subName || ''} 
                          onChange={e => setSessionAttendance(p => ({...p, [m.id]: { ...p[m.id], subName: e.target.value.toUpperCase() }}))} 
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
          
          <section className="bg-white rounded-[2rem] shadow-sm border"><div className="p-6 border-b flex justify-between items-center"><div className="flex items-center gap-3"><UserPlus className="w-5 h-5 text-red-600" /><h3 className="text-lg font-black italic uppercase text-slate-900">2. Guest Database</h3></div><button onClick={() => setShowCheckInForm(true)} className="bg-red-600 px-6 py-2.5 rounded-xl text-white text-[10px] font-black uppercase flex items-center gap-2"><Monitor className="w-4 h-4" /> Launch Kiosk</button></div>
            <div className="p-8">
              {sessionVisitors.length === 0 ? <div className="h-24 flex items-center justify-center border-2 border-dashed rounded-[2rem]"><p className="text-[10px] text-slate-300 font-bold uppercase italic">Awaiting arrivals...</p></div> : 
              <div className="grid md:grid-cols-2 gap-4">
                {sessionVisitors.map((v, i) => {
                  const visitorKey = v.email?.toLowerCase() || v.name?.toLowerCase();
                  const pastVisitCount = visitorKey ? visitors.filter(histV => (histV.email?.toLowerCase() === visitorKey || histV.name?.toLowerCase() === visitorKey)).length : 0;
                  const visitNumber = pastVisitCount + 1;

                  const visitNumberToText = (num: number) => {
                      if (num <= 0) return "";
                      const s = ["th", "st", "nd", "rd"];
                      const val = num % 100;
                      const suffix = s[(val - 20) % 10] || s[val] || s[0];
                      return `${num}${suffix} Visit`;
                  };
                  const visitText = visitNumberToText(visitNumber);

                  return (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white text-red-600 rounded-full flex items-center justify-center font-black italic border">{v.name ? v.name[0] : '?'}</div>
                        <div>
                          <p className="text-xs font-black uppercase italic text-slate-900">{v.name}</p>
                          <p className="text-[8px] text-slate-400 font-bold mt-1 uppercase">{v.companyName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button title="Convert to Application" onClick={() => handleConvertToApplication(i)} className="text-slate-300 hover:text-blue-600 p-1.5"><FileText className="w-4 h-4" /></button>
                        {visitText && <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase ${visitNumber > 1 ? 'bg-slate-900 text-white' : 'bg-green-600 text-white'}`}>{visitText}</span>}
                        <button onClick={() => setSessionVisitors(p => p.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-600 p-1.5"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
              }
            </div>
          </section>
          
          <section className="bg-white rounded-[2rem] shadow-sm border"><div className="p-6 border-b flex items-center gap-3"><UserCheck className="w-5 h-5 text-green-600" /><h3 className="text-lg font-black italic uppercase text-slate-900">3. New Member Inductions</h3></div><div className="p-8">{approvedApplicants.length === 0 ? <div className="py-8 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed"><p className="text-[10px] text-slate-300 font-black uppercase">No pending inductions</p></div> : <div className="grid md:grid-cols-2 gap-4">{approvedApplicants.map(app => <div key={app.id} className={`p-5 rounded-[2rem] flex items-center justify-between border ${sessionInductions.includes(app.id) ? 'bg-green-50 border-green-600' : 'bg-white border-slate-100'}`}><div className="flex items-center gap-4"><div className={`p-2.5 rounded-xl ${sessionInductions.includes(app.id) ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600'}`}><CheckCircle2 className="w-5 h-5" /></div><div><p className="text-sm font-black text-slate-900 uppercase italic">{app.name}</p><p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">{app.professionalClassification}</p></div></div><input type="checkbox" className="w-6 h-6 rounded-lg text-green-600" checked={sessionInductions.includes(app.id)} onChange={(e) => { e.target.checked ? setSessionInductions([...sessionInductions, app.id]) : setSessionInductions(sessionInductions.filter(id => id !== app.id)); }} /></div>)}</div>}</div></section>

          <section className="bg-slate-900 text-white rounded-[2.5rem] shadow-xl"><div className="p-8 border-b border-white/10 flex items-center gap-4"><div className="p-3 bg-red-600 rounded-2xl"><TrendingUp className="w-6 h-6" /></div><div><h3 className="text-xl font-black italic uppercase">4. Team Administrator's Report</h3><p className="text-red-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Weekly Performance Analysis</p></div></div><div className="p-8"><table className="w-full text-left"><thead><tr className="border-b border-white/10"><th className="pb-4 text-slate-500 font-black text-[10px] uppercase tracking-widest">Metric</th><th className="pb-4 text-slate-500 font-black text-[10px] uppercase tracking-widest text-right">Prior Week</th><th className="pb-4 text-slate-500 font-black text-[10px] uppercase tracking-widest text-right">Year to Date</th></tr></thead><tbody>{[ { name: "Referrals Passed", val: adminReportMetrics.referrals, format: (v: number) => v }, { name: "Closed Revenue", val: adminReportMetrics.revenue, format: (v: number) => `$${v.toLocaleString()}` }, { name: "BizChats", val: adminReportMetrics.bizChats, format: (v: number) => v }, { name: "Guests", val: adminReportMetrics.guests, format: (v: number) => v }, { name: "CGIs Given", val: adminReportMetrics.cgi, format: (v: number) => v }, { name: "MGIs Given", val: adminReportMetrics.mgi, format: (v: number) => v } ].map(m => <tr key={m.name} className="border-b border-white/5"><td className="py-4 font-bold text-sm text-white">{m.name}</td><td className="py-4 font-black text-2xl text-slate-300 text-right tracking-tighter">{m.format(m.val.prior)}</td><td className="py-4 font-black text-2xl text-white text-right tracking-tighter">{m.format(m.val.ytd)}</td></tr>)}</tbody></table></div></section>
          
          <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
               <div className="flex items-center gap-3"><ListFilter className="w-5 h-5 text-red-600" /><h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">5. Referral Disposition</h3></div>
               <span className="text-[10px] font-black bg-red-100 text-red-600 px-3 py-1 rounded-full uppercase italic">{pendingReferralsForReport.length} OPEN</span>
            </div>
            <div className="p-8 max-h-[400px] overflow-y-auto custom-scrollbar">
              {pendingReferralsForReport.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs italic">No pending leads to reconcile</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-12 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    <div className="col-span-4">Lead / From → To</div>
                    <div className="col-span-8 text-right">Update Disposition</div>
                  </div>
                  {pendingReferralsForReport.map(r => {
                    const from = members.find(m => m.id === r.fromMemberId);
                    const to = members.find(m => m.id === r.toMemberId);
                    const currentStatus = pendingReferralUpdates[r.id] || r.status;
                    return (
                      <div key={r.id} className="grid grid-cols-12 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 group hover:border-red-200 transition-all">
                        <div className="col-span-4">
                           <p className="text-xs font-black text-slate-900 uppercase italic tracking-tighter">{r.prospectName}</p>
                           <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 truncate">{from?.name} → {to?.name}</p>
                        </div>
                        <div className="col-span-8 flex justify-end items-center gap-1.5">
                           {[ { id: 'In Progress', active: 'bg-blue-600 text-white' }, { id: 'Closed Business', active: 'bg-green-600 text-white' }, { id: 'Dead', active: 'bg-red-600 text-white' } ].map(opt => (
                             <button 
                               key={opt.id} 
                               onClick={() => setPendingReferralUpdates({...pendingReferralUpdates, [r.id]: opt.id as ReferralStatus})}
                               className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-tighter transition-all ${currentStatus === opt.id ? opt.active : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'}`}
                             >
                               {opt.id}
                             </button>
                           ))}
                           {currentStatus === 'Closed Business' && (
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                <input
                                    type="number"
                                    placeholder="Revenue"
                                    value={sessionRevenueData[r.id] || ''}
                                    onChange={(e) => setSessionRevenueData({...sessionRevenueData, [r.id]: Number(e.target.value)})}
                                    onClick={e => e.stopPropagation()}
                                    className="pl-6 w-28 py-2 rounded-xl text-xs font-black uppercase border border-slate-200 bg-white"
                                />
                              </div>
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-[2rem] shadow-sm border"><div className="p-6 border-b flex justify-between items-center"><div className="flex items-center gap-3"><Handshake className="w-5 h-5 text-red-600" /><h3 className="text-lg font-black italic uppercase text-slate-900">6. Referral Entry</h3></div><button onClick={() => setSessionReferrals(p => [...p, {status: 'New', type: ReferralType.INSIDE}])} className="bg-red-600 px-3 py-1.5 rounded-lg text-white text-[8px] font-black uppercase flex items-center gap-1.5"><Plus className="w-3 h-3" /> Add Lead</button></div><div className="p-4 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">{sessionReferrals.map((r, i) => <div key={i} className="grid grid-cols-12 gap-2 bg-slate-50 p-3 rounded-xl items-center border"><select className="col-span-3 bg-white p-1.5 rounded-lg text-[8px] font-black uppercase" value={r.fromMemberId || ''} onChange={e => { const nl = [...sessionReferrals]; nl[i].fromMemberId = e.target.value; setSessionReferrals(nl); }}><option value="">GIVER</option>{activeMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select><ArrowRightCircle className="col-span-1 mx-auto w-3.5 h-3.5 text-slate-300" /><select className="col-span-3 bg-white p-1.5 rounded-lg text-[8px] font-black uppercase" value={r.toMemberId || ''} onChange={e => { const nl = [...sessionReferrals]; nl[i].toMemberId = e.target.value; setSessionReferrals(nl); }}><option value="">RECV</option>{activeMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select><input placeholder="PROSPECT" className="col-span-4 bg-white p-1.5 rounded-lg text-[8px] font-black uppercase" value={r.prospectName || ''} onChange={e => { const nl = [...sessionReferrals]; nl[i].prospectName = e.target.value; setSessionReferrals(nl); }} /><button onClick={() => setSessionReferrals(p => p.filter((_, idx) => idx !== i))} className="col-span-1 text-slate-300 flex justify-center"><Trash2 className="w-3.5 h-3.5" /></button></div>)}</div></section>
          
          <section className="bg-white rounded-[2rem] shadow-sm border">
            <div className="p-6 border-b flex justify-between items-center">
                <div className="flex items-center gap-3"><Gift className="w-5 h-5 text-red-600" /><h3 className="text-lg font-black italic uppercase text-slate-900">7. Birthday Alerts</h3></div>
                {upcomingBirthdays.length > 0 && <span className="text-sm font-black text-red-600">{upcomingBirthdays.length} Upcoming</span>}
            </div>
            <div className="p-8">
                {upcomingBirthdays.length === 0 ? (
                    <div className="py-8 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed"><p className="text-[10px] text-slate-300 font-black uppercase">No birthdays in the next 7 days.</p></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {upcomingBirthdays.map(member => (
                            <div key={member.id} className="p-4 bg-slate-50 rounded-2xl border flex items-center gap-4">
                                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-black italic border border-amber-200">{member.name[0]}</div>
                                <div>
                                    <p className="text-xs font-black uppercase italic text-slate-900">{member.name}</p>
                                    <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase">{member.dob}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-[2rem] shadow-sm border"><div className="p-6 border-b flex justify-between items-center"><div className="flex items-center gap-3"><Gift className="w-5 h-5 text-red-600" /><h3 className="text-lg font-black italic uppercase text-slate-900">8. Gratitude Incentives</h3></div><span className="text-sm font-black text-red-600">{totalCorporateGI + totalMemberGI}</span></div><div className="px-4 pt-2 pb-4 flex justify-end gap-4"><p className="text-[10px] font-black text-slate-400 tracking-widest w-20 text-center"><span className="uppercase">CGI</span><span className="normal-case">s</span></p><p className="text-[10px] font-black text-slate-400 tracking-widest w-20 text-center"><span className="uppercase">MGI</span><span className="normal-case">s</span></p></div><div className="max-h-[300px] overflow-y-auto divide-y custom-scrollbar">{activeMembers.map(m => <div key={m.id} className="p-4 flex items-center justify-between"><p className="text-xs font-black uppercase italic text-slate-900">{m.name}</p><div className="flex gap-4"><div className="w-20 flex items-center justify-center gap-2"><button onClick={() => updateMetric(m.id, 'corporate', -1)} className="p-1 bg-slate-100 rounded-md"><Minus className="w-3 h-3" /></button><span className="text-[10px] font-black w-3 text-center">{sessionGratitude[m.id]?.corporate || 0}</span><button onClick={() => updateMetric(m.id, 'corporate', 1)} className="p-1 bg-red-600 text-white rounded-md"><Plus className="w-3 h-3" /></button></div><div className="w-20 flex items-center justify-center gap-2"><button onClick={() => updateMetric(m.id, 'member', -1)} className="p-1 bg-slate-100 rounded-md"><Minus className="w-3 h-3" /></button><span className="text-[10px] font-black w-3 text-center">{sessionGratitude[m.id]?.member || 0}</span><button onClick={() => updateMetric(m.id, 'member', 1)} className="p-1 bg-slate-900 text-white rounded-md"><Plus className="w-3 h-3" /></button></div></div></div>)}</div></section>
            
            <section className="bg-white rounded-[2rem] shadow-sm border">
              <div className="p-6 border-b flex justify-between items-center">
                <div className="flex items-center gap-3"><MessageSquare className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-black italic uppercase text-slate-900">9. BizChats</h3>
                </div>
                <span className="text-sm font-black text-red-600">{totalTeamBizChats}</span>
              </div>
              <div className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {activeMembers.map(m => 
                    <div key={m.id} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between">
                      <p className="text-xs font-black uppercase italic text-slate-900 truncate">{m.name}</p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateMetric(m.id, 'bizchat', -1)} className="p-1 bg-slate-100 rounded-md"><Minus className="w-3 h-3" /></button>
                        <span className="text-[10px] font-black w-3 text-center">{sessionBizChatCounts[m.id] || 0}</span>
                        <button onClick={() => updateMetric(m.id, 'bizchat', 1)} className="p-1 bg-red-600 text-white rounded-md"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
          
          <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3"><Kanban className="w-5 h-5 text-red-600" /><h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">10. Application Pipeline</h3></div>
              <span className="text-[10px] font-black bg-red-100 text-red-600 px-3 py-1 rounded-full uppercase italic">{pendingAppsForReport.length} PENDING</span>
            </div>
            <div className="p-8 max-h-[400px] overflow-y-auto custom-scrollbar">
              {pendingAppsForReport.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs italic">No pending applications</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-12 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    <div className="col-span-6">Applicant</div>
                    <div className="col-span-6 text-right">Update Stage</div>
                  </div>
                  {pendingAppsForReport.map(app => {
                    const currentStatus = sessionApplicationUpdates[app.id] || app.status;
                    return (
                      <div key={app.id} className="grid grid-cols-12 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="col-span-6">
                          <p className="text-xs font-black text-slate-900 uppercase italic tracking-tighter">{app.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 truncate">{app.professionalClassification}</p>
                        </div>
                        <div className="col-span-6 flex justify-end">
                          <select value={currentStatus} onChange={e => setSessionApplicationUpdates({...sessionApplicationUpdates, [app.id]: e.target.value as ApplicationStatus})} className="p-2 text-xs font-black uppercase border rounded-lg bg-white">
                              <option>Applied</option><option>GC BizChat Complete</option><option>Interview Complete</option><option>Approved</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-[2rem] shadow-sm border">
            <div className="p-6 border-b flex justify-between items-center">
              <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-red-600" /><h3 className="text-lg font-black italic uppercase text-slate-900">11. New Applications Received</h3></div>
              <button onClick={() => setSessionApplications(p => [...p, {}])} className="bg-red-600 px-3 py-1.5 rounded-lg text-white text-[8px] font-black uppercase flex items-center gap-1.5"><Plus className="w-3 h-3" /> Log New Application</button>
            </div>
            <div className="p-6 space-y-4">
              {sessionApplications.length === 0 ? (
                <div className="py-12 text-center text-slate-300 font-black uppercase tracking-widest text-xs italic">No applications recorded this meeting</div>
              ) : (
                sessionApplications.map((app, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-black text-slate-500 uppercase italic">Applicant #{i+1}</p>
                      <button onClick={() => setSessionApplications(p => p.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor={`appName-${i}`} className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Full Name</label>
                        <div className="relative">
                          <input 
                            id={`appName-${i}`}
                            className="w-full p-3 bg-white rounded-lg text-[10px] font-black uppercase relative z-10 bg-transparent"
                            value={app.name || ''}
                            onChange={e => handleAppNameChange(e.target.value, i)} 
                            onKeyDown={e => handleAppNameKeyDown(e, i)}
                            onBlur={() => setAutofillSuggestion(null)}
                            autoComplete="off"
                          />
                          {autofillSuggestion && autofillSuggestion.appIndex === i && (
                            <div className="absolute inset-0 p-3 pointer-events-none text-[10px] font-black uppercase">
                                <span className="text-transparent">{app.name}</span>
                                <span className="text-slate-400">{autofillSuggestion.visitor.name.substring((app.name || '').length)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Email Address</label><input type="email" className="w-full p-3 bg-white rounded-lg text-[10px] font-black uppercase" value={app.email || ''} onChange={e => updateSessionApplication(i, 'email', e.target.value)} /></div>
                      <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Company Name</label><input className="w-full p-3 bg-white rounded-lg text-[10px] font-black uppercase" value={app.companyName || ''} onChange={e => updateSessionApplication(i, 'companyName', e.target.value)} /></div>
                      <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Professional Classification</label><input className="w-full p-3 bg-white rounded-lg text-[10px] font-black uppercase" value={app.professionalClassification || ''} onChange={e => updateSessionApplication(i, 'professionalClassification', e.target.value)} /></div>
                      <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Direct Phone</label><input type="tel" className="w-full p-3 bg-white rounded-lg text-[10px] font-black uppercase" value={app.phone || ''} onChange={e => updateSessionApplication(i, 'phone', e.target.value)} /></div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Date of Birth (MM/DD)</label>
                        <input type="text" placeholder="MM/DD" maxLength={5} className="w-full p-3 bg-white rounded-lg text-[10px] font-black uppercase" value={app.dob || ''} onChange={e => handleAppDobChange(e, i)} />
                      </div>
                      <div className="md:col-span-2"><label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Mailing Address</label><input className="w-full p-3 bg-white rounded-lg text-[10px] font-black uppercase" value={app.address || ''} onChange={e => updateSessionApplication(i, 'address', e.target.value)} /></div>
                      <div className="md:col-span-2"><label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Sponsoring Member</label><select className="w-full p-3 bg-white rounded-lg text-[10px] font-black uppercase" value={app.sponsoredByMemberId || ''} onChange={e => updateSessionApplication(i, 'sponsoredByMemberId', e.target.value)}><option value="">Select Member</option>{activeMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      ) : (
      <div className="space-y-4">
        <h3 className="text-xl font-black italic uppercase flex items-center gap-3"><History className="w-6 h-6 text-red-600" /> Meeting History</h3>
        {meetingHistory.length === 0 ? (
          <div className="p-12 bg-white rounded-[2rem] border-2 border-dashed text-center"><p className="text-[10px] text-slate-300 font-black uppercase">No records</p></div>
        ) : (
          meetingHistory.map(h => (
            <div key={h.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border flex items-center justify-between">
              <div className="flex items-center gap-5"><div className={`p-4 rounded-2xl ${h.status === 'Finalized' ? 'bg-green-50' : 'bg-amber-50'}`}><ShieldCheck className={`w-6 h-6 ${h.status === 'Finalized' ? 'text-green-600' : 'text-amber-600'}`} /></div>
              <div><h4 className="font-black uppercase italic text-slate-900">{h.date}</h4><p className="text-[8px] text-slate-400 font-black uppercase mt-1.5">{h.time} • {h.status}</p></div></div>
              <div className="flex items-center gap-2">
                <button onClick={() => loadHistoryForEdit(h.id)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"><Edit3 className="w-5 h-5" /></button>
                {h.status === 'Finalized' && <button onClick={() => handleExportPdf(h.id)} className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors"><FileDown className="w-5 h-5" /></button>}
                <button onClick={() => deleteHistory(h.id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
          ))
        )}
      </div>
    )}

      {showCheckInForm && <div className="fixed inset-0 bg-slate-900 z-[200] flex flex-col items-center justify-center animate-in fade-in">{checkInSuccess && <div className="absolute inset-0 bg-slate-900 z-[210] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in"><div className="p-12 bg-green-600 rounded-full mb-12 animate-bounce"><Check className="w-24 h-24 text-white" /></div><h2 className="text-6xl font-black italic uppercase text-white mb-6">{isReturningGuest ? "Welcome Back!" : "Welcome!"}</h2><div className="bg-white/10 p-8 rounded-[3rem] border border-white/10"><p className="text-2xl font-black text-white uppercase italic">Please grab a name tag!</p></div></div>}{showPinPad && <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl z-[220] flex items-center justify-center p-8 animate-in fade-in zoom-in"><div className={`w-full max-w-sm bg-white rounded-[3rem] p-10 shadow-2xl ${pinError ? 'animate-shake bg-red-50' : ''}`}><div className="text-center mb-8"><div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4"><Lock className={`w-8 h-8 ${pinError ? 'text-red-500' : 'text-white'}`} /></div><h3 className="text-2xl font-black italic uppercase">Access Restricted</h3></div><div className="flex justify-center gap-3 mb-8">{[0,1,2,3,4,5].map(i => <div key={i} className={`w-4 h-4 rounded-full border-2 ${pinInput.length > i ? 'bg-slate-900 border-slate-900' : 'border-slate-200'}`}></div>)}</div><div className="grid grid-cols-3 gap-4">{[1,2,3,4,5,6,7,8,9].map(n => <button key={n} onClick={() => pinInput.length < 6 && setPinInput(p => p+n)} className="h-16 rounded-2xl bg-slate-50 font-black text-xl">{n}</button>)}<button onClick={() => setPinInput('')} className="h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center"><Delete className="w-6 h-6" /></button><button onClick={() => pinInput.length < 6 && setPinInput(p => p+'0')} className="h-16 rounded-2xl bg-slate-50 font-black text-xl">0</button><button onClick={handlePinSubmit} disabled={pinInput.length < 6} className="h-16 rounded-2xl bg-green-600 text-white flex items-center justify-center disabled:opacity-50"><Check className="w-8 h-8" /></button></div><button onClick={() => {setShowPinPad(false); setPinInput('')}} className="w-full mt-8 py-4 text-[10px] font-black uppercase text-slate-400">Abort</button></div></div>}<div className="w-full h-full max-w-6xl bg-white lg:rounded-[4rem] shadow-2xl flex overflow-hidden relative z-10"><div className="hidden lg:block lg:w-1/3 bg-slate-900 p-16 text-white relative"><button onClick={() => setShowPinPad(true)} className="absolute top-8 left-8 p-3 bg-white/5 rounded-2xl flex items-center gap-2"><ArrowLeft className="w-5 h-5 text-slate-500" /><span className="text-[10px] font-black uppercase text-slate-500">GC HUB</span></button><div className="mt-16"><div className="flex items-center gap-4 mb-12"><div className="p-4 bg-red-600 rounded-[1.5rem]"><Flame className="w-10 h-10" /></div><div><h2 className="text-4xl font-black italic uppercase leading-none">Heatwave</h2><p className="text-red-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">RDU Team</p></div></div><h1 className="text-7xl font-black italic uppercase leading-[0.85] mb-8">Visitor<br/>Check-In</h1></div></div><div className="flex-1 p-10 lg:p-24 overflow-y-auto custom-scrollbar bg-slate-50/50"><div className="max-w-2xl mx-auto space-y-12"><header className="text-left"><h3 className="text-3xl font-black italic uppercase">{isReturningGuest ? "Welcome Back!" : "Register Your Visit"}</h3><p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">{isReturningGuest ? "Verify your info." : "Fill out all fields."}</p></header>
              <form onSubmit={handleGuestCheckIn} className="space-y-12">
                <section className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input required className="w-full p-6 bg-white rounded-3xl text-sm font-black uppercase" value={guestEntry.name || ''} onChange={e => setGuestEntry({...guestEntry, name: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Birthday (MM/DD)</label>
                      <input type="text" placeholder="MM/DD" maxLength={5} className="w-full p-6 bg-white rounded-3xl text-sm font-black uppercase" value={guestEntry.dob || ''} onChange={handleGuestDobChange} />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                      <input type="email" required className="w-full p-6 bg-white rounded-3xl text-sm font-black" value={guestEntry.email || ''} onChange={e => setGuestEntry({...guestEntry, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                      <input type="tel" required className="w-full p-6 bg-white rounded-3xl text-sm font-black uppercase" value={guestEntry.phone || ''} onChange={e => setGuestEntry({...guestEntry, phone: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company</label>
                      <input className="w-full p-6 bg-white rounded-3xl text-sm font-black uppercase" value={guestEntry.companyName || ''} onChange={e => setGuestEntry({...guestEntry, companyName: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profession</label>
                      <input className="w-full p-6 bg-white rounded-3xl text-sm font-black uppercase" value={guestEntry.professionalClassification || ''} onChange={e => setGuestEntry({...guestEntry, professionalClassification: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Whose guest?</label>
                      <select required className="w-full p-6 bg-white rounded-3xl text-sm font-black uppercase appearance-none" value={guestEntry.invitedByMemberId || ''} onChange={e => setGuestEntry({...guestEntry, invitedByMemberId: e.target.value})}>
                          <option value="">Select Member</option>
                          {activeMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                  </div>
                </section>
                <button type="submit" className="w-full p-10 bg-red-600 text-white rounded-[3rem] font-black italic uppercase text-3xl flex items-center justify-center gap-6 group">Register <ChevronRight className="w-12 h-12 group-hover:translate-x-2 transition-transform" /></button>
              </form>
            </div></div></div></div>}

      <style>{`.custom-scrollbar::-webkit-scrollbar{width:4px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.1);border-radius:10px}@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}.animate-shake{animation:shake .2s cubic-bezier(.36,.07,.19,.97) both;animation-iteration-count:2}`}</style>
    </div>
  );
};

const MeetingPDFLayout: React.FC<{ meeting: MeetingDraft; members: Member[]; applications: Application[] }> = ({ meeting, members, applications }) => {
  const { date, time, meetingStatus, justification, data } = meeting;
  const activeMembers = members.filter(m => m.status === 'Active');

  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
      <h3 className="text-lg font-bold uppercase tracking-wider text-slate-800 pb-2 border-b-2 border-red-600 mb-3">{title}</h3>
      <div className="text-sm">{children}</div>
    </div>
  );

  return (
    <div className="bg-white p-12" style={{ width: '800px' }}>
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-red-600">RDU Heatwave Meeting Report</h1>
        <p className="text-lg font-bold text-slate-600">{date} @ {time}</p>
      </header>

      {meetingStatus !== 'Normal' && (
        <Section title="Meeting Status">
          <p className="font-bold text-amber-700 text-base">{meetingStatus}</p>
          <p className="text-slate-600 mt-2">{justification}</p>
        </Section>
      )}

      {meetingStatus === 'Normal' && data.attendance && (
        <Section title="Attendance">
          <table className="w-full text-left text-xs">
            <thead><tr className="border-b bg-slate-50"><th className="p-2">Member</th><th className="p-2">Status</th><th className="p-2">Substitute</th></tr></thead>
            <tbody>
              {activeMembers.map(m => {
                const att = data.attendance[m.id];
                return (
                  <tr key={m.id} className="border-b">
                    <td className="p-2 font-bold">{m.name}</td>
                    <td className="p-2">{att?.status || 'Present'}</td>
                    <td className="p-2">{att?.status === 'Substitute' ? att.subName : 'N/A'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Section>
      )}
      
      {data.visitors?.length > 0 && (
        <Section title="Guests">
          <ul className="list-disc list-inside">{data.visitors.map((v, i) => <li key={i}>{v.name} ({v.companyName}) - Guest of {members.find(m => m.id === v.invitedByMemberId)?.name}</li>)}</ul>
        </Section>
      )}

      {data.referrals?.length > 0 && (
        <Section title="Referrals Passed">
          <ul className="list-disc list-inside">{data.referrals.map((r, i) => <li key={i}>{members.find(m=>m.id === r.fromMemberId)?.name} → {members.find(m=>m.id === r.toMemberId)?.name} for {r.prospectName}</li>)}</ul>
        </Section>
      )}

      {data.gratitude && data.bizChatCounts && (
        <Section title="Performance Metrics">
            <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 p-3 rounded-lg text-center"><p className="text-xs font-bold uppercase text-slate-500">Corporate GIs</p><p className="text-2xl font-black">{Object.values(data.gratitude).reduce((s: number, g: any) => s + g.corporate, 0)}</p></div>
            <div className="bg-slate-50 p-3 rounded-lg text-center"><p className="text-xs font-bold uppercase text-slate-500">Member GIs</p><p className="text-2xl font-black">{Object.values(data.gratitude).reduce((s: number, g: any) => s + g.member, 0)}</p></div>
            <div className="bg-slate-50 p-3 rounded-lg text-center"><p className="text-xs font-bold uppercase text-slate-500">BizChats</p><p className="text-2xl font-black">{Object.values(data.bizChatCounts).reduce((s: number, c: any) => s + c, 0)}</p></div>
            </div>
        </Section>
      )}


       {data.inductedMemberIds?.length > 0 && (
        <Section title="New Member Inductions">
          <ul className="list-disc list-inside">{data.inductedMemberIds.map((appId, i) => {
              const app = applications.find(a => a.id === appId);
              return <li key={i}>{app?.name || 'Unknown'} - {app?.professionalClassification}</li>
          })}</ul>
        </Section>
      )}

      {data.applications?.length > 0 && (
        <Section title="New Applications Received">
          <ul className="list-disc list-inside">{data.applications.map((app, i) => <li key={i}>{app.name} ({app.professionalClassification}) - Sponsored by {members.find(m => m.id === app.sponsoredByMemberId)?.name}</li>)}</ul>
        </Section>
      )}
    </div>
  );
};


export default MeetingEntry;
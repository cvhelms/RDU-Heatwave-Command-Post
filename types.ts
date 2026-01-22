
export enum AttendanceStatus {
  PRESENT = 'Present',
  ABSENT = 'Absent',
  SUBSTITUTE = 'Substitute',
  LATE = 'Late'
}

export enum ReferralType {
  INSIDE = 'Inside (Member to Member)',
  OUTSIDE = 'Outside (Member to External)'
}

export type ReferralStatus = 'New' | 'In Progress' | 'Closed Business' | 'Dead';

export interface ArchivalRecord {
  date: string;
  category: string;
  reason: string;
}

export type ApplicationStatus = 'Applied' | 'GC BizChat Complete' | 'Interview Complete' | 'Approved' | 'Declined';

export interface Application {
  id: string;
  name: string;
  dob?: string;
  address: string;
  companyName: string;
  professionalClassification: string;
  email: string;
  phone: string;
  appliedDate: string;
  status: ApplicationStatus;
  sponsoredByMemberId?: string;
  notes?: string;
  declineDate?: string;
  previousStatus?: ApplicationStatus;
}

export interface Member {
  id: string;
  name: string;
  dob?: string;
  address: string;
  companyName: string;
  professionalClassification: string;
  email: string;
  phone: string;
  memberSince: string;
  renewalDate: string;
  status: 'Active' | 'Inactive';
  sponsoredByMemberId?: string;
  archivalReason?: string;
  archivalCategory?: string;
  archivalDate?: string;
  archivalHistory?: ArchivalRecord[];
  isGoverningCommittee?: boolean;
}

export interface Referral {
  id: string;
  date: string;
  fromMemberId: string;
  toMemberId: string;
  prospectName: string;
  type: ReferralType;
  status: ReferralStatus;
  statusUpdateDate?: string;
  needsRevenue?: boolean;
  value?: number;
}

export interface Visitor {
  id: string;
  date: string;
  name: string;
  dob?: string;
  phone: string;
  email: string;
  professionalClassification: string;
  companyName: string;
  invitedByMemberId: string;
  followUpStatus: 'Contacted' | 'Pending' | 'Applied';
  isFirstVisit?: boolean;
}

export interface Attendance {
  id: string;
  date: string;
  memberId: string;
  status: AttendanceStatus;
  subName?: string;
}

export interface RevenueRecord {
  id: string;
  date: string;
  referralId: string;
  amount: number;
  memberId: string;
}

export interface BizChat {
  id: string;
  date: string;
  member1Id: string;
  member2Id: string;
}

export interface GratitudeIncentive {
  id: string;
  date: string;
  fromMemberId: string;
  toMemberId?: string;
  amount: number;
  type: 'Corporate' | 'Member';
}

export interface Testimonial {
  id: string;
  date: string;
  fromMemberId: string;
  toMemberId: string;
  notes: string;
}

export type MeetingStatus = 'Normal' | 'Cancelled' | 'Attendance Excused';

export interface MeetingDraft {
  id: string;
  date: string;
  time: string;
  lastSaved: string;
  status: 'Draft' | 'Finalized';
  meetingStatus?: MeetingStatus;
  justification?: string;
  data: {
    attendance: Record<string, { status: AttendanceStatus; subName?: string }>;
    visitors: Partial<Visitor>[];
    referrals: Partial<Referral>[];
    gratitude: Record<string, { corporate: number; member: number }>;
    bizChatCounts: Record<string, number>;
    inductedMemberIds: string[];
    applications?: Partial<Application>[];
    revenueData?: Record<string, number>;
  };
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'admin' | 'super-admin';
}

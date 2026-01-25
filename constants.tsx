
import React from 'react';
import { Application, Member, Visitor, Referral, RevenueRecord, Attendance, AttendanceStatus, BizChat, GratitudeIncentive, ReferralType } from './types';

export const COLORS = {
  primary: '#dc2626', // RDU Heatwave Red
  secondary: '#f97316', // Orange
  accent: '#facc15', // Yellow
  bg: '#f8fafc',
  card: '#ffffff'
};

// ===== MEMBERS =====
// Imported from Google Sheet "Members" tab
export const MOCK_MEMBERS_EXTENDED: Member[] = [
  {
    id: '1',
    name: 'Carter Helms',
    dob: '03/10',
    address: '',
    companyName: '',
    professionalClassification: 'Insurance',
    email: 'chelms8576@gmail.com',
    phone: '(252) 294-5396',
    memberSince: '2026-01-08',
    renewalDate: '2027-01-08',
    status: 'Active',
    isGoverningCommittee: true
  },
  {
    id: '2',
    name: 'Craig Morrill',
    dob: '',
    address: '',
    companyName: '',
    professionalClassification: 'Financial Advisor',
    email: 'craig.morrill@sgpw.com',
    phone: '(919) 298-2930',
    memberSince: '2026-01-08',
    renewalDate: '2027-01-08',
    status: 'Active',
    isGoverningCommittee: true
  },
  {
    id: '3',
    name: 'Chad Haywood',
    dob: '10/18',
    address: '',
    companyName: '',
    professionalClassification: 'Real Estate Broker',
    email: 'ChadHaywood@kw.com',
    phone: '(910) 995-3901',
    memberSince: '2026-01-08',
    renewalDate: '2027-01-08',
    status: 'Active',
    isGoverningCommittee: true
  },
  {
    id: '4',
    name: 'Rusty Sutton',
    dob: '08/26',
    address: '',
    companyName: '',
    professionalClassification: 'Digital Marketer',
    email: 'rusty@monkeyfansraleigh.com',
    phone: '(919) 801-7920',
    memberSince: '2026-01-08',
    renewalDate: '2027-01-08',
    status: 'Active'
  },
  {
    id: '5',
    name: 'Will Sigmon',
    dob: '10/22',
    address: '',
    companyName: '',
    professionalClassification: 'Software Developer',
    email: 'wjsigmon@gmail.com',
    phone: '(919) 215-4255',
    memberSince: '2026-01-22',
    renewalDate: '2027-01-22',
    status: 'Active',
    // Lifecycle tracking - Will was a visitor on 1-15, applied, then inducted on 1-22
    sourceVisitorId: 'v1',
    originalInviterMemberId: '1',  // Carter Helms invited him
    firstVisitDate: '2026-01-15',
    appliedDate: '2026-01-15'
  },
  {
    id: '6',
    name: 'Dana Walsh',
    dob: '12/19',
    address: '',
    companyName: '',
    professionalClassification: 'Publicist',
    email: 'dana.walsh@strollmag.com',
    phone: '(609) 707-5497',
    memberSince: '2026-01-22',
    renewalDate: '2028-01-22',
    status: 'Active'
  },
  {
    id: '7',
    name: 'Nate Senn',
    dob: '',
    address: '',
    companyName: '',
    professionalClassification: 'Business Development Manager',
    email: 'nsenn@francorestorations.com',
    phone: '(984) 325-3379',
    memberSince: '2026-01-08',
    renewalDate: '2028-01-08',
    status: 'Active'
  },
  {
    id: '8',
    name: 'Robert Courts',
    dob: '',
    address: '',
    companyName: '',
    professionalClassification: 'Loan Officer',
    email: 'rcourts@advantagelending.com',
    phone: '(919) 812-5063',
    memberSince: '2026-01-08',
    renewalDate: '2028-01-08',
    status: 'Active'
  },
];

// ===== REFERRALS =====
// Imported from Google Sheet "Referrals" tab
// Team Totals: Given=9, Received=9, Revenue=$603
export const MOCK_REFERRALS_EXTENDED: Referral[] = [
  // 01-08-2026
  { id: 'ref-1', date: '2026-01-08', fromMemberId: '1', toMemberId: '3', prospectName: 'Pam Ribet', type: ReferralType.OUTSIDE, status: 'In Progress' },
  { id: 'ref-2', date: '2026-01-08', fromMemberId: '1', toMemberId: '2', prospectName: 'Chris Gold', type: ReferralType.OUTSIDE, status: 'In Progress' },
  { id: 'ref-3', date: '2026-01-08', fromMemberId: '1', toMemberId: '2', prospectName: 'Josh Mohar', type: ReferralType.OUTSIDE, status: 'In Progress' },
  { id: 'ref-4', date: '2026-01-08', fromMemberId: '2', toMemberId: '1', prospectName: 'Molly Luxton', type: ReferralType.OUTSIDE, status: 'Dead' },
  { id: 'ref-5', date: '2026-01-08', fromMemberId: '6', toMemberId: '1', prospectName: 'Chris Gold', type: ReferralType.OUTSIDE, status: 'In Progress' },
  { id: 'ref-6', date: '2026-01-08', fromMemberId: '1', toMemberId: '6', prospectName: 'Abigail Bruffy', type: ReferralType.OUTSIDE, status: 'In Progress' },
  { id: 'ref-7', date: '2026-01-08', fromMemberId: '6', toMemberId: '1', prospectName: 'Mohar Brothers Landscaping', type: ReferralType.OUTSIDE, status: 'Closed Business', statusUpdateDate: '2026-01-08' },
  // 01-15-2026
  { id: 'ref-8', date: '2026-01-15', fromMemberId: '8', toMemberId: '1', prospectName: 'Grant Streit', type: ReferralType.OUTSIDE, status: 'In Progress' },
  { id: 'ref-9', date: '2026-01-15', fromMemberId: '6', toMemberId: '3', prospectName: 'Katie and Paolo Mannacio', type: ReferralType.OUTSIDE, status: 'In Progress' },
];

// ===== REVENUE =====
// From closed business referrals
export const MOCK_REVENUE_EXTENDED: RevenueRecord[] = [
  { id: 'rev-1', date: '2026-01-08', referralId: 'ref-7', amount: 603, memberId: '1' },
];

// ===== ATTENDANCE =====
// From Google Sheet "Attendance" tab
export const MOCK_ATTENDANCE_EXTENDED: Attendance[] = [
  // 01-08-2026 - All present (founding meeting)
  { id: 'att-2026-01-08-1', date: '2026-01-08', memberId: '1', status: AttendanceStatus.PRESENT },
  { id: 'att-2026-01-08-2', date: '2026-01-08', memberId: '2', status: AttendanceStatus.PRESENT },
  { id: 'att-2026-01-08-3', date: '2026-01-08', memberId: '3', status: AttendanceStatus.PRESENT },
  { id: 'att-2026-01-08-4', date: '2026-01-08', memberId: '4', status: AttendanceStatus.PRESENT },
  { id: 'att-2026-01-08-5', date: '2026-01-08', memberId: '5', status: AttendanceStatus.PRESENT },
  { id: 'att-2026-01-08-6', date: '2026-01-08', memberId: '6', status: AttendanceStatus.PRESENT },
  { id: 'att-2026-01-08-7', date: '2026-01-08', memberId: '7', status: AttendanceStatus.PRESENT },
  { id: 'att-2026-01-08-8', date: '2026-01-08', memberId: '8', status: AttendanceStatus.PRESENT },
  // 01-15-2026 - Nate Senn had substitute: Miller Lawson
  { id: 'att-2026-01-15-1', date: '2026-01-15', memberId: '1', status: AttendanceStatus.PRESENT },
  { id: 'att-2026-01-15-2', date: '2026-01-15', memberId: '2', status: AttendanceStatus.PRESENT },
  { id: 'att-2026-01-15-3', date: '2026-01-15', memberId: '3', status: AttendanceStatus.PRESENT },
  { id: 'att-2026-01-15-4', date: '2026-01-15', memberId: '4', status: AttendanceStatus.PRESENT },
  { id: 'att-2026-01-15-5', date: '2026-01-15', memberId: '5', status: AttendanceStatus.PRESENT },
  { id: 'att-2026-01-15-6', date: '2026-01-15', memberId: '6', status: AttendanceStatus.PRESENT },
  { id: 'att-2026-01-15-7', date: '2026-01-15', memberId: '7', status: AttendanceStatus.SUBSTITUTE, subName: 'Miller Lawson' },
  { id: 'att-2026-01-15-8', date: '2026-01-15', memberId: '8', status: AttendanceStatus.PRESENT },
];

// ===== BIZCHATS =====
// From Google Sheet "BizChats" tab - January 2026 totals:
// Carter=4, Chad=2, Craig=0, Dana=3, Nate=0, Robert=2, Rusty=1, Will=0
export const MOCK_BIZCHATS_EXTENDED: BizChat[] = [
  { id: 'bc-1', date: '2026-01-08', member1Id: '1', member2Id: '3' },  // Carter + Chad
  { id: 'bc-2', date: '2026-01-08', member1Id: '1', member2Id: '4' },  // Carter + Rusty
  { id: 'bc-3', date: '2026-01-15', member1Id: '1', member2Id: '6' },  // Carter + Dana
  { id: 'bc-4', date: '2026-01-15', member1Id: '1', member2Id: '8' },  // Carter + Robert
  { id: 'bc-5', date: '2026-01-15', member1Id: '3', member2Id: '6' },  // Chad + Dana
  { id: 'bc-6', date: '2026-01-15', member1Id: '6', member2Id: '8' },  // Dana + Robert
];

// ===== GRATITUDE INCENTIVES =====
// From Google Sheet "GIs" tab
// Corporate: Carter Helms gave 2 in January
// Member: Carter Helms gave 6 in January, received by Chad, Craig, Dana, Nate, Robert, Rusty (1 each)
export const MOCK_INCENTIVES_EXTENDED: GratitudeIncentive[] = [
  // Corporate Gratitude Incentives - Carter Helms gave 2 in Jan
  { id: 'gi-corp-1', date: '2026-01-08', fromMemberId: '1', amount: 1, type: 'Corporate' },
  { id: 'gi-corp-2', date: '2026-01-15', fromMemberId: '1', amount: 1, type: 'Corporate' },
  // Member Gratitude Incentives - Carter Helms gave 6 in January (one to each member except Will)
  { id: 'gi-mem-1', date: '2026-01-15', fromMemberId: '1', toMemberId: '3', amount: 1, type: 'Member' },  // to Chad
  { id: 'gi-mem-2', date: '2026-01-15', fromMemberId: '1', toMemberId: '2', amount: 1, type: 'Member' },  // to Craig
  { id: 'gi-mem-3', date: '2026-01-15', fromMemberId: '1', toMemberId: '6', amount: 1, type: 'Member' },  // to Dana
  { id: 'gi-mem-4', date: '2026-01-15', fromMemberId: '1', toMemberId: '7', amount: 1, type: 'Member' },  // to Nate
  { id: 'gi-mem-5', date: '2026-01-15', fromMemberId: '1', toMemberId: '8', amount: 1, type: 'Member' },  // to Robert
  { id: 'gi-mem-6', date: '2026-01-15', fromMemberId: '1', toMemberId: '4', amount: 1, type: 'Member' },  // to Rusty
];

// ===== VISITORS =====
// From Google Sheet "QR SIGN IN" tab - 1-15-2026 meeting visitors
export const MOCK_VISITORS_EXTENDED: Visitor[] = [
  { id: 'v1', date: '2026-01-15', name: 'Will Sigmon', phone: '(919) 215-4255', email: 'wjsigmon@gmail.com', professionalClassification: 'Software Developer', companyName: '', invitedByMemberId: '1', followUpStatus: 'Member', convertedToMemberId: '5' },
  { id: 'v2', date: '2026-01-15', name: 'Mitch Ludwig', phone: '(819) 283-6911', email: 'mitch@carolinawealth.com', professionalClassification: 'Financial Planner', companyName: '', invitedByMemberId: '1', followUpStatus: 'Pending' },
  { id: 'v3', date: '2026-01-15', name: 'Gabriel Trincado', phone: '(919) 808-4592', email: 'gtrincado@triangleconciergept.com', professionalClassification: 'Physical Therapist', companyName: '', invitedByMemberId: '6', followUpStatus: 'Pending' },
  { id: 'v4', date: '2026-01-15', name: 'Garth McGee', phone: '(704) 589-6773', email: 'garth@homedockusa.com', professionalClassification: 'Home Services Advertising', companyName: '', invitedByMemberId: '1', followUpStatus: 'Pending' },
  { id: 'v5', date: '2026-01-15', name: 'Nick Sullivan', phone: '(919) 995-7612', email: 'nicksullivanjr@gmail.com', professionalClassification: 'Health Benefits', companyName: '', invitedByMemberId: '1', followUpStatus: 'Pending' },
  { id: 'v6', date: '2026-01-15', name: 'Hennessey Stuart', phone: '', email: 'hennessey.stuart@captrust.com', professionalClassification: 'Financial Planner', companyName: '', invitedByMemberId: '1', followUpStatus: 'Pending' },
  { id: 'v7', date: '2026-01-15', name: 'Miller Lawson', phone: '(919) 846-2090', email: 'miller.lawson@highstreetins.com', professionalClassification: 'Insurance Agent', companyName: '', invitedByMemberId: '7', followUpStatus: 'Pending' },
  { id: 'v8', date: '2026-01-15', name: 'Lanya Savage', phone: '', email: 'savagepropertyinvestments@gmail.com', professionalClassification: 'Real Estate Investor', companyName: '', invitedByMemberId: '1', followUpStatus: 'Pending' },
  { id: 'v9', date: '2026-01-15', name: 'Oliver George', phone: '', email: 'oliver.george@myvoda.com', professionalClassification: 'Restoration', companyName: '', invitedByMemberId: '1', followUpStatus: 'Pending' },
  { id: 'v10', date: '2026-01-15', name: 'Abigail Bruffy', phone: '(609) 287-5439', email: 'abigail.bruffy@n2co.com', professionalClassification: 'Magazine Publisher', companyName: '', invitedByMemberId: '6', followUpStatus: 'Pending' },
  { id: 'v11', date: '2026-01-15', name: 'Matt Snuggs', phone: '(703) 400-1717', email: 'matt@pursuitwealthteam.com', professionalClassification: 'Financial Planner', companyName: '', invitedByMemberId: '1', followUpStatus: 'Pending' },
  { id: 'v12', date: '2026-01-15', name: 'Shawn Bair', phone: '(919) 249-8366', email: 'shawn@aerolensllc.com', professionalClassification: 'Videographer', companyName: '', invitedByMemberId: '1', followUpStatus: 'Pending' },
  { id: 'v13', date: '2026-01-15', name: 'Richie Bogdovics', phone: '(919) 801-1243', email: 'ncbogflooring@gmail.com', professionalClassification: 'Flooring', companyName: '', invitedByMemberId: '2', followUpStatus: 'Pending' },
];

// ===== APPLICATIONS =====
// No current applications in the system
export const MOCK_APPLICATIONS_EXTENDED: Application[] = [];

// Legacy exports for backwards compatibility
export const MOCK_MEMBERS = MOCK_MEMBERS_EXTENDED;
export const MOCK_APPLICATIONS = MOCK_APPLICATIONS_EXTENDED;
export const MOCK_VISITORS = MOCK_VISITORS_EXTENDED;

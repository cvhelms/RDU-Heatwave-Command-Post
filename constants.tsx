
import React from 'react';
import { Application, Member, Visitor, Referral, ReferralStatus, ReferralType, RevenueRecord, Attendance, AttendanceStatus, BizChat, GratitudeIncentive } from './types';

export const COLORS = {
  primary: '#dc2626', // RDU Heatwave Red
  secondary: '#f97316', // Orange
  accent: '#facc15', // Yellow
  bg: '#f8fafc',
  card: '#ffffff'
};

// --- START OF MOCK DATA GENERATION ---

// Helper to generate random dates
const randomDate = (start: Date, end: Date): string => {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
};

const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;


// 1. EXTENDED MEMBERS
export const MOCK_MEMBERS_EXTENDED: Member[] = [
  { id: '1', name: 'John Smith', dob: '05/12', address: '123 Oak St, Raleigh, NC', companyName: 'Smith Plumbing', professionalClassification: 'Plumbing', email: 'john@smith.com', phone: '(555) 123-4567', memberSince: '2023-01-15', renewalDate: '2025-01-15', status: 'Active', isGoverningCommittee: true },
  { id: '2', name: 'Sarah Jones', dob: '09/22', address: '456 Business Blvd, Durham, NC', companyName: 'Bright Legal', professionalClassification: 'Lawyer', email: 'sarah@bright.com', phone: '(555) 234-5678', memberSince: '2023-03-20', renewalDate: '2025-03-20', status: 'Active', sponsoredByMemberId: '1', isGoverningCommittee: true },
  { id: '3', name: 'Mike Miller', dob: '12/05', address: '789 Pine Rd, Cary, NC', companyName: 'Miller Insurance', professionalClassification: 'Insurance', email: 'mike@miller.com', phone: '(555) 345-6789', memberSince: '2023-05-10', renewalDate: '2025-05-10', status: 'Active', sponsoredByMemberId: '2', isGoverningCommittee: true },
  { id: '4', name: 'Elena Rodriguez', dob: '02/28', address: '101 Maple Ln, Apex, NC', companyName: 'Rod-Designs', professionalClassification: 'Interior Design', email: 'elena@rod-designs.com', phone: '(555) 456-7890', memberSince: '2023-08-12', renewalDate: '2025-08-12', status: 'Active', sponsoredByMemberId: '1' },
  { id: '5', name: 'David Chen', dob: '07/19', address: '210 Tech Park, Morrisville, NC', companyName: 'Chen Web Solutions', professionalClassification: 'Web Development', email: 'david@chenweb.com', phone: '(555) 567-8901', memberSince: '2023-09-01', renewalDate: '2024-09-15', status: 'Active', sponsoredByMemberId: '4' },
  { id: '6', name: 'Jessica Williams', dob: '03/15', address: '321 Finance Dr, Raleigh, NC', companyName: 'Williams CPA', professionalClassification: 'Accountant', email: 'jess@williamscpa.com', phone: '(555) 678-9012', memberSince: '2023-10-20', renewalDate: '2024-08-01', status: 'Active', sponsoredByMemberId: '3' },
  { id: '7', name: 'Tom Wilson', dob: '11/02', address: '432 Builder Ave, Wake Forest, NC', companyName: 'Wilson Homes', professionalClassification: 'General Contractor', email: 'tom@wilsonhomes.com', phone: '(555) 789-0123', memberSince: '2023-11-15', renewalDate: '2024-11-15', status: 'Active', sponsoredByMemberId: '1' },
  { id: '8', name: 'Laura Martinez', dob: '01/30', address: '543 Photo Ln, Durham, NC', companyName: 'Martinez Studios', professionalClassification: 'Photographer', email: 'laura@martinezstudios.com', phone: '(555) 890-1234', memberSince: '2024-01-10', renewalDate: '2025-01-10', status: 'Active', sponsoredByMemberId: '4' },
  { id: '9', name: 'Brian Thompson', dob: '08/11', address: '654 Marketing Way, Cary, NC', companyName: 'Thompson Digital', professionalClassification: 'Digital Marketing', email: 'brian@thompsondigital.com', phone: '(555) 901-2345', memberSince: '2024-02-22', renewalDate: '2025-02-22', status: 'Active', sponsoredByMemberId: '5' },
  { id: '10', name: 'Sophia Garcia', dob: '04/05', address: '765 Event Pl, Raleigh, NC', companyName: 'Garcia Events', professionalClassification: 'Event Planner', email: 'sophia@garciaevents.com', phone: '(555) 112-2334', memberSince: '2024-03-18', renewalDate: '2025-03-18', status: 'Active', sponsoredByMemberId: '8' },
  { id: '11', name: 'Chris Evans', dob: '06/13', address: '876 Shield St, Raleigh, NC', companyName: 'Evans Security', professionalClassification: 'Security Systems', email: 'chris@evanssec.com', phone: '(555) 223-3445', memberSince: '2024-04-01', renewalDate: '2025-04-01', status: 'Active', sponsoredByMemberId: '7' },
  { id: '12', name: 'Olivia Brown', dob: '10/18', address: '987 Health Rd, Chapel Hill, NC', companyName: 'Brown Nutrition', professionalClassification: 'Nutritionist', email: 'olivia@brownnutrition.com', phone: '(555) 334-4556', memberSince: '2024-05-05', renewalDate: '2025-05-05', status: 'Active', sponsoredByMemberId: '6' },
  { id: '13', name: 'Robert Downey', dob: '04/04', address: '1 Tech Plaza, Raleigh, NC', companyName: 'Stark Industries', professionalClassification: 'Business Consultant', email: 'rdj@stark.com', phone: '(555) 445-5667', memberSince: '2022-08-01', renewalDate: '2024-08-30', status: 'Active' },
  { id: '14', name: 'Anna Kendrick', dob: '08/09', address: '2 Pitch Ave, Durham, NC', companyName: 'Pitch Perfect Audio', professionalClassification: 'Audio/Visual', email: 'anna@ppa.com', phone: '(555) 556-6778', memberSince: '2022-09-15', renewalDate: '2024-09-15', status: 'Active' },
  { id: '15', name: 'Ryan Reynolds', dob: '10/23', address: '3 Witty Ct, Cary, NC', companyName: 'Maximum Effort', professionalClassification: 'Creative Agency', email: 'ryan@maxeffort.com', phone: '(555) 667-7889', memberSince: '2022-11-20', renewalDate: '2024-11-20', status: 'Active', sponsoredByMemberId: '9' },
  { id: '16', name: 'Zoe Saldana', dob: '06/19', address: '4 Guardian Galaxy, Apex, NC', companyName: 'Galaxy Guardians Inc.', professionalClassification: 'Life Coach', email: 'zoe@ggi.com', phone: '(555) 778-8990', memberSince: '2023-02-12', renewalDate: '2025-02-12', status: 'Active', sponsoredByMemberId: '10' },
  { id: '17', name: 'Dwayne Johnson', dob: '05/02', address: '5 Rock Solid Rd, Holly Springs, NC', companyName: 'The Rock Foundation', professionalClassification: 'Foundations', email: 'dwayne@therock.com', phone: '(555) 889-9001', memberSince: '2023-04-01', renewalDate: '2025-04-01', status: 'Active', sponsoredByMemberId: '7' },
  { id: '18', name: 'Margot Robbie', dob: '07/02', address: '6 Doll House Dr, Raleigh, NC', companyName: 'Robbie Architecture', professionalClassification: 'Architect', email: 'margot@robbie.com', phone: '(555) 990-0112', memberSince: '2023-06-18', renewalDate: '2025-06-18', status: 'Active', sponsoredByMemberId: '4' },
  { id: '19', name: 'Paul Rudd', dob: '04/06', address: '7 Ant Hill, Cary, NC', companyName: 'Rudd Pest Control', professionalClassification: 'Pest Control', email: 'paul@ruddpc.com', phone: '(555) 121-2323', memberSince: '2023-07-07', renewalDate: '2025-07-07', status: 'Active' },
  { id: '20', name: 'Scarlett Johansson', dob: '11/22', address: '8 Widow Way, Durham, NC', companyName: 'Johansson Investigations', professionalClassification: 'Private Investigator', email: 'scarlett@ji.com', phone: '(555) 343-4545', memberSince: '2023-08-30', renewalDate: '2025-08-30', status: 'Active', sponsoredByMemberId: '2' },
  { id: '21', name: 'Archived Member', dob: '01/01', address: '1 Old Rd, Raleigh, NC', companyName: 'Old Company', professionalClassification: 'Retired', email: 'archive@old.com', phone: '(555) 000-0000', memberSince: '2021-01-01', renewalDate: '2023-01-01', status: 'Inactive', archivalCategory: 'Other', archivalDate: '2023-01-01', archivalReason: 'Member moved out of state.' },
];

const activeMemberIds = MOCK_MEMBERS_EXTENDED.filter(m => m.status === 'Active').map(m => m.id);
const prospectNames = ['ABC Corp', 'Global Tech', 'Innovate LLC', 'Synergy Group', 'Quantum Solutions', 'Apex Industries', 'Starlight Co.', 'Dynamic Systems', 'Future Forward', 'NextGen Partners'];


// 2. EXTENDED REFERRALS
export const MOCK_REFERRALS_EXTENDED: Referral[] = Array.from({ length: 150 }, (_, i) => {
  const statusDist: ReferralStatus[] = ['New', 'In Progress', 'In Progress', 'Closed Business', 'Closed Business', 'Closed Business', 'Dead', 'Dead'];
  const status = randomItem(statusDist);
  
  const date = randomDate(new Date(2023, 0, 1), new Date());
  let statusUpdateDate: string | undefined = undefined;
  if (status === 'Closed Business' || status === 'Dead') {
    const statusUpdate = new Date(date);
    statusUpdate.setDate(statusUpdate.getDate() + randomNumber(5, 90));
    statusUpdateDate = statusUpdate.toISOString().split('T')[0];
  }

  let fromMemberId = randomItem(activeMemberIds);
  let toMemberId = randomItem(activeMemberIds);
  while(fromMemberId === toMemberId) { toMemberId = randomItem(activeMemberIds); }

  return {
    id: `ref-ext-${i}`,
    date,
    fromMemberId,
    toMemberId,
    prospectName: randomItem(prospectNames),
    type: ReferralType.OUTSIDE,
    status,
    statusUpdateDate
  };
});

// 3. EXTENDED REVENUE
export const MOCK_REVENUE_EXTENDED: RevenueRecord[] = MOCK_REFERRALS_EXTENDED
  .filter(r => r.status === 'Closed Business')
  .map(r => ({
    id: `rev-ext-${r.id}`,
    date: r.statusUpdateDate || r.date,
    referralId: r.id,
    amount: randomNumber(100, 15000),
    memberId: r.toMemberId,
  }));

// 4. EXTENDED ATTENDANCE
export const MOCK_ATTENDANCE_EXTENDED: Attendance[] = [];
const startDate = new Date(2023, 0, 5); // First Thursday of 2023
const today = new Date();
for (let d = startDate; d <= today; d.setDate(d.getDate() + 7)) {
  if (d.getDay() !== 4) continue; // Only Thursdays
  const dateStr = d.toISOString().split('T')[0];
  activeMemberIds.forEach(memberId => {
    const roll = Math.random();
    let status: AttendanceStatus;
    if (roll < 0.9) status = AttendanceStatus.PRESENT;
    else if (roll < 0.95) status = AttendanceStatus.ABSENT;
    else status = AttendanceStatus.SUBSTITUTE;

    MOCK_ATTENDANCE_EXTENDED.push({
      id: `att-${dateStr}-${memberId}`,
      date: dateStr,
      memberId,
      status,
      subName: status === AttendanceStatus.SUBSTITUTE ? 'GUEST SUB' : undefined,
    });
  });
}

// 5. EXTENDED BIZCHATS
export const MOCK_BIZCHATS_EXTENDED: BizChat[] = Array.from({ length: 400 }, (_, i) => {
  let member1Id = randomItem(activeMemberIds);
  let member2Id = randomItem(activeMemberIds);
  while(member1Id === member2Id) { member2Id = randomItem(activeMemberIds); }
  return {
    id: `bc-ext-${i}`,
    date: randomDate(new Date(2023, 0, 1), new Date()),
    member1Id,
    member2Id,
  };
});

// 6. EXTENDED GRATITUDE INCENTIVES
export const MOCK_INCENTIVES_EXTENDED: GratitudeIncentive[] = Array.from({ length: 500 }, (_, i) => {
  const type = Math.random() < 0.3 ? 'Corporate' : 'Member';
  let fromMemberId = randomItem(activeMemberIds);
  let toMemberId: string | undefined = undefined;
  if (type === 'Member') {
    toMemberId = randomItem(activeMemberIds);
    while (fromMemberId === toMemberId) { toMemberId = randomItem(activeMemberIds); }
  }
  return {
    id: `gi-ext-${i}`,
    date: randomDate(new Date(2023, 0, 1), new Date()),
    fromMemberId,
    toMemberId,
    amount: 1,
    type,
  };
});


// 7. EXTENDED VISITORS AND APPLICATIONS
export const MOCK_VISITORS_EXTENDED: Visitor[] = [
  { id: 'v1', date: '2024-05-15', name: 'Alice Cooper', phone: '(555) 099-9999', email: 'alice@rockweb.com', professionalClassification: 'Web Development', companyName: 'Rock Web Design', invitedByMemberId: '1', followUpStatus: 'Contacted' },
  { id: 'v2', date: '2024-04-10', name: 'Bob Dylan', phone: '(555) 111-2222', email: 'bob@rollingstone.com', professionalClassification: 'Content Writer', companyName: 'Rolling Stone Inc.', invitedByMemberId: '9', followUpStatus: 'Applied' },
  { id: 'v3', date: '2024-03-20', name: 'Carol King', phone: '(555) 333-4444', email: 'carol@tapestry.com', professionalClassification: 'Graphic Designer', companyName: 'Tapestry Designs', invitedByMemberId: '4', followUpStatus: 'Pending' },
  { id: 'v4', date: '2024-05-01', name: 'Diana Ross', phone: '(555) 555-6666', email: 'diana@supreme.com', professionalClassification: 'PR Specialist', companyName: 'The Supremes Agency', invitedByMemberId: '10', followUpStatus: 'Contacted' },
];

export const MOCK_APPLICATIONS_EXTENDED: Application[] = [
  { id: 'app1', name: 'Marcus Thorne', dob: '11/30', address: '555 Venture Dr, Raleigh, NC', companyName: 'Thorne Tech Solutions', professionalClassification: 'Managed IT', email: 'marcus@thornetech.com', phone: '(555) 888-9999', appliedDate: '2024-05-20', status: 'Applied', sponsoredByMemberId: '3' },
  { id: 'app2', name: 'Brenda Walsh', dob: '04/12', address: '222 Realty Ct, Cary, NC', companyName: 'Prime Properties', professionalClassification: 'Real Estate Agent', email: 'brenda@primeprop.com', phone: '(555) 777-6666', appliedDate: '2024-05-18', status: 'Approved', sponsoredByMemberId: '4' },
  { id: 'app3', name: 'David Silver', dob: '06/15', address: '333 Media Way, Durham, NC', companyName: 'Silver Screen Media', professionalClassification: 'Videography', email: 'david@silverscreen.com', phone: '(555) 444-3333', appliedDate: '2024-05-15', status: 'GC BizChat Complete', sponsoredByMemberId: '1' },
  { id: 'app4', name: 'Kelly Taylor', dob: '03/01', address: '444 Fashion Ave, Raleigh, NC', companyName: 'Taylor Boutique', professionalClassification: 'Personal Stylist', email: 'kelly@taylor.com', phone: '(555) 222-1111', appliedDate: '2024-04-25', status: 'Interview Complete', sponsoredByMemberId: '18' },
  { id: 'app5', name: 'Donna Martin', dob: '10/10', address: '555 Graduate Rd, Chapel Hill, NC', companyName: 'Martin Designs', professionalClassification: 'Fashion Design', email: 'donna@martin.com', phone: '(555) 333-2222', appliedDate: '2024-04-12', status: 'Declined', previousStatus: 'Applied', notes: 'Industry conflict with existing member.', declineDate: '2024-04-15' },
];

// Original smaller mocks for initial load if needed, but extended are now default
export const MOCK_MEMBERS = MOCK_MEMBERS_EXTENDED.slice(0, 4);
export const MOCK_APPLICATIONS = MOCK_APPLICATIONS_EXTENDED.slice(0, 3);
export const MOCK_VISITORS = MOCK_VISITORS_EXTENDED.slice(0, 1);

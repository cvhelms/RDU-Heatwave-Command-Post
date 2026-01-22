
import React from 'react';
import { Application, Member, Visitor, Referral, RevenueRecord, Attendance, BizChat, GratitudeIncentive } from './types';

export const COLORS = {
  primary: '#dc2626', // RDU Heatwave Red
  secondary: '#f97316', // Orange
  accent: '#facc15', // Yellow
  bg: '#f8fafc',
  card: '#ffffff'
};

// Empty data arrays - app starts fresh
export const MOCK_MEMBERS_EXTENDED: Member[] = [];
export const MOCK_REFERRALS_EXTENDED: Referral[] = [];
export const MOCK_REVENUE_EXTENDED: RevenueRecord[] = [];
export const MOCK_ATTENDANCE_EXTENDED: Attendance[] = [];
export const MOCK_BIZCHATS_EXTENDED: BizChat[] = [];
export const MOCK_INCENTIVES_EXTENDED: GratitudeIncentive[] = [];
export const MOCK_VISITORS_EXTENDED: Visitor[] = [];
export const MOCK_APPLICATIONS_EXTENDED: Application[] = [];

// Legacy exports for backwards compatibility
export const MOCK_MEMBERS = MOCK_MEMBERS_EXTENDED;
export const MOCK_APPLICATIONS = MOCK_APPLICATIONS_EXTENDED;
export const MOCK_VISITORS = MOCK_VISITORS_EXTENDED;

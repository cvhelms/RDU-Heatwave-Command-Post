
import { Member } from '../types';

/**
 * Gets members with birthdays in the upcoming 7 days from a given reference date.
 * @param members - Array of all members.
 * @param referenceDateString - The starting date for the 7-day window (e.g., '2024-12-28'). Defaults to today.
 * @returns An array of members with upcoming birthdays.
 */
export const getUpcomingBirthdays = (members: Member[], referenceDateString?: string): Member[] => {
  const referenceDate = referenceDateString ? new Date(referenceDateString) : new Date();
  // Ensure we are comparing dates only, by setting time to midnight.
  referenceDate.setUTCHours(0, 0, 0, 0);

  const toDate = new Date(referenceDate);
  toDate.setDate(referenceDate.getDate() + 7);

  const upcomingBirthdays: Member[] = [];
  const currentYear = referenceDate.getFullYear();

  members.forEach(member => {
    if (!member.dob) return;

    const [month, day] = member.dob.split('/').map(Number);
    if (isNaN(month) || isNaN(day)) return;
    
    // Create birthday date for the current year of the reference date
    const birthdayThisYear = new Date(Date.UTC(currentYear, month - 1, day));
    
    // Create birthday date for the next year to handle rollovers (e.g., ref date is Dec 28, birthday is Jan 2)
    const birthdayNextYear = new Date(Date.UTC(currentYear + 1, month - 1, day));
    
    if ((birthdayThisYear >= referenceDate && birthdayThisYear <= toDate) ||
        (birthdayNextYear >= referenceDate && birthdayNextYear <= toDate)) {
      upcomingBirthdays.push(member);
    }
  });

  // Sort by month and then day
  return upcomingBirthdays.sort((a, b) => {
      const [monthA, dayA] = a.dob!.split('/').map(Number);
      const [monthB, dayB] = b.dob!.split('/').map(Number);
      
      // Adjust month for sorting across year boundary
      const sortableMonthA = monthA < (referenceDate.getMonth() + 1) ? monthA + 12 : monthA;
      const sortableMonthB = monthB < (referenceDate.getMonth() + 1) ? monthB + 12 : monthB;

      if (sortableMonthA !== sortableMonthB) return sortableMonthA - sortableMonthB;
      return dayA - dayB;
  });
};

import { Appointment, RecurrenceFrequency } from '../types/appointments';
import { MINIMUM_ADVANCE_BOOKING_HOURS } from './constants';

export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function getMinimumBookingTime(): Date {
  return addHours(new Date(), MINIMUM_ADVANCE_BOOKING_HOURS);
}

export function isInThePast(date: Date): boolean {
  return date < new Date();
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function generateRecurringInstances(
  startTime: Date,
  endTime: Date,
  frequency: RecurrenceFrequency,
  recurringEndDate?: Date
): Array<{ startTime: Date; endTime: Date }> {
  if (frequency === 'none') {
    return [{ startTime, endTime }];
  }

  const instances: Array<{ startTime: Date; endTime: Date }> = [];
  const duration = endTime.getTime() - startTime.getTime();
  let currentStart = new Date(startTime);
  const limit = recurringEndDate || addDays(startOfDay(new Date()), 90);

  while (currentStart <= limit) {
    const currentEnd = new Date(currentStart.getTime() + duration);
    instances.push({ startTime: currentStart, endTime: currentEnd });

    if (frequency === 'daily') {
      currentStart = addDays(currentStart, 1);
    } else if (frequency === 'weekly') {
      currentStart = addWeeks(currentStart, 1);
    } else if (frequency === 'monthly') {
      currentStart = addMonths(currentStart, 1);
    }
  }

  return instances;
}

export function getWeekDates(centerDate: Date): Date[] {
  const dates: Date[] = [];
  const dayOfWeek = centerDate.getDay();
  const startOfWeek = addDays(centerDate, -dayOfWeek);

  for (let i = 0; i < 7; i++) {
    dates.push(addDays(startOfWeek, i));
  }

  return dates;
}

export function formatTimeForDisplay(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

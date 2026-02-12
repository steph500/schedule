import { Appointment } from '../types/appointments';
import { addHours, addDays } from '../utils/dateHelpers';

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const yesterday = addDays(today, -4);


export const DUMMY_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    title: 'Team Standup',
    startTime: addHours(addDays(today, 1), 9),
    endTime: addHours(addDays(today, 1), 9.5),
    description: 'Daily team synchronization',
    recurring: { frequency: 'daily', endDate: addDays(today, 30) },
  },
  {
    id: '2',
    title: 'Client Meeting',
    startTime: addHours(addDays(today, 1), 14),
    endTime: addHours(addDays(today, 1), 15),
    description: 'Q1 Planning session',
  }, 
  {
    id: '3',
    title: '1:1 with Manager',
    startTime: addHours(addDays(today, 2), 10),
    endTime: addHours(addDays(today, 2), 10.75),
    description: 'Performance review',
    recurring: { frequency: 'weekly', endDate: addDays(today, 60) },
  },
  {
    id: '4',
    title: 'Project Review',
    startTime: addHours(addDays(today, 3), 15),
    endTime: addHours(addDays(today, 3), 16),
    description: 'Sprint retrospective',
  },
  {
    id: '5',
    title: 'Lunch Break',
    startTime: addHours(addDays(today, 4), 12),
    endTime: addHours(addDays(today, 4), 13),
    description: 'Personal time',
    recurring: { frequency: 'daily', endDate: addDays(today, 30) },
  },
  {
    id: '6',
    title: 'Stefan Testing Past Appointment',
    startTime: addHours(addDays(yesterday, 2), 10),
    endTime: addHours(addDays(yesterday, 2), 10.75),
    description: 'Performance review',
    recurring: { frequency: 'weekly', endDate: addDays(today, 60) },
  },
];

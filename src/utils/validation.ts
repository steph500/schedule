import { Appointment, ValidationError } from '../types/appointments';
import {
  MINIMUM_ADVANCE_BOOKING_HOURS,
  MINIMUM_APPOINTMENT_DURATION_MINUTES,
} from './constants';
import { isInThePast, addHours, getMinimumBookingTime } from './dateHelpers';

export function validateAppointmentBooking(
  title: string,
  startTime: Date,
  endTime: Date,
  existingAppointments: Appointment[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!title.trim()) {
    errors.push({ field: 'title', message: 'Title is required' });
  }

  if (startTime >= endTime) {
    errors.push({ field: 'time', message: 'End time must be after start time' });
  }

  const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  if (durationMinutes < MINIMUM_APPOINTMENT_DURATION_MINUTES) {
    errors.push({
      field: 'duration',
      message: `Minimum appointment duration is ${MINIMUM_APPOINTMENT_DURATION_MINUTES} minutes`,
    });
  }

  if (isInThePast(endTime)) {
    errors.push({ field: 'startTime', message: 'Cannot book appointments in the past' });
  }

  const minimumBookingTime = getMinimumBookingTime();
  if (startTime < minimumBookingTime) {
    errors.push({
      field: 'startTime',
      message: `Appointments must be booked at least ${MINIMUM_ADVANCE_BOOKING_HOURS} hours in advance`,
    });
  }

  const hasConflict = checkConflict(startTime, endTime, existingAppointments);
  if (hasConflict) {
    errors.push({
      field: 'time',
      message: 'This time slot conflicts with an existing appointment',
    });
  }

  return errors;
}

export function checkConflict(
  startTime: Date,
  endTime: Date,
  existingAppointments: Appointment[]
): boolean {
  return existingAppointments.some((apt) => {
    return !(endTime <= apt.startTime || startTime >= apt.endTime);
  });
}

export function getConflictingAppointments(
  startTime: Date,
  endTime: Date,
  existingAppointments: Appointment[]
): Appointment[] {
  return existingAppointments.filter((apt) => {
    return !(endTime <= apt.startTime || startTime >= apt.endTime);
  });
}

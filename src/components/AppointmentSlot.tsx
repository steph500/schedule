import React from 'react';
import { Appointment } from '../types/appointments';
import { formatTimeForDisplay } from '../utils/dateHelpers';

interface AppointmentSlotProps {
  appointment: Appointment;
}

export default function AppointmentSlot({ appointment }: AppointmentSlotProps) {
  const startTime = formatTimeForDisplay(appointment.startTime);
  const endTime = formatTimeForDisplay(appointment.endTime);

  return (
    <div className="bg-blue-500 text-white rounded px-2 py-1 text-xs overflow-hidden hover:bg-blue-600 transition-colors">
      <div className="font-semibold truncate">{appointment.title}</div>
      <div className="text-blue-100 text-xs">{startTime} - {endTime}</div>
    </div>
  );
}

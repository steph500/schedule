import React from 'react';
import { Appointment } from '../types/appointments';
import { formatDateForDisplay } from '../utils/dateHelpers';
import { Calendar } from 'lucide-react';
import AppointmentList from './AppointmentList';

interface SidebarProps {
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
}

export default function Sidebar({ appointments, onEdit, onDelete }: SidebarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingAppointments = appointments
    // Filter for appointments that are today or in the future
    .filter((apt) => apt.startTime >= today)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, 5);

    console.log("Sidebar upcoming appointments: ", upcomingAppointments);

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <Calendar size={24} className="text-blue-500" />
        <h1 className="text-xl font-bold text-gray-900">Scheduler</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Upcoming Appointments
          </h2>
          <AppointmentList
            appointments={upcomingAppointments}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
}

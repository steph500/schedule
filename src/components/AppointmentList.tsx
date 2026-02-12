import React from 'react';
import { Appointment } from '../types/appointments';
import { formatDateForDisplay, formatTimeForDisplay } from '../utils/dateHelpers';
import { Trash2, Edit2 } from 'lucide-react';

interface AppointmentListProps {
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
}

export default function AppointmentList({ appointments, onEdit, onDelete }: AppointmentListProps) {
  if (appointments.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
        <p>No appointments scheduled</p>
      </div>
    );
  }

  const sortedAppointments = [...appointments].sort((a, b) =>
    a.startTime.getTime() - b.startTime.getTime()
  );

  return (
    <div className="space-y-2">
      {sortedAppointments.map((apt) => (
        <div
          key={apt.id}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{apt.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {formatDateForDisplay(apt.startTime)} • {formatTimeForDisplay(apt.startTime)} -{' '}
                {formatTimeForDisplay(apt.endTime)}
              </p>
              {apt.description && <p className="text-sm text-gray-600 mt-2">{apt.description}</p>}
              {apt.recurring && apt.recurring.frequency !== 'none' && (
                <p className="text-xs text-blue-600 mt-2">
                  Recurring: {apt.recurring.frequency.charAt(0).toUpperCase() + apt.recurring.frequency.slice(1)}
                </p>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onEdit(apt)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => {
                  if (confirm('Delete this appointment?')) {
                    onDelete(apt.id);
                  }
                }}
                className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

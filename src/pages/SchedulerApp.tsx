import React, { useState } from 'react';
import { useAppointments } from '../context/AppointmentContext';
import CalendarGrid from '../components/CalendarGrid';
import Sidebar from '../components/Sidebar';

export default function SchedulerApp() {
  const { allInstances, updateAppointment, deleteAppointment } = useAppointments();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEdit = (apt: any) => {
    setEditingId(apt.id);
  };

  const handleDelete = (id: string) => {
    deleteAppointment(id);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        appointments={allInstances}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <div className="flex-1 p-6 overflow-auto">
        <CalendarGrid appointments={allInstances} />
      </div>
    </div>
  );
}

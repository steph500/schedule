import React, { useState } from 'react';
import { useAppointments } from '../context/AppointmentContext';
import CalendarGrid from '../components/CalendarGrid';
import Sidebar from '../components/Sidebar';
import { Appointment } from "../types/appointments";
import BookingModal from '../components/BookingModal';

export default function SchedulerApp() {
  const { allInstances, updateAppointment, deleteAppointment } = useAppointments();
  const [selectedSlot, setSelectedSlot] = useState<{date: Date; hour: number;} | null>(null);
  const [editingAppointment, setEditingAppointment] =
  useState<Appointment | null>(null);

  const handleEdit = (apt: any) => {
    setEditingAppointment(apt);
  };

  const handleDelete = (id: string) => {
    console.log("handle delete called with id: not right ", id);
    deleteAppointment(id);
  };

  const handleCloseModal = () => {
    setSelectedSlot(null);
    setEditingAppointment(null);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        appointments={allInstances}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <div className="flex-1 p-6 overflow-auto">
        <CalendarGrid
          appointments={allInstances}
          onDelete={deleteAppointment}
        />
      </div>

      {(selectedSlot || editingAppointment) && (
        <BookingModal
          selectedDate={selectedSlot?.date ?? editingAppointment!.startTime}
          selectedHour={selectedSlot?.hour ?? editingAppointment!.startTime.getHours()}
          appointmentToEdit={editingAppointment}
          existingAppointments={allInstances}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

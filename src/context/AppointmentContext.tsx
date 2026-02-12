import React, { createContext, useContext, useState, useCallback } from 'react';
import { Appointment } from '../types/appointments';
import { DUMMY_APPOINTMENTS } from '../data/dummyAppointments';
import { generateRecurringInstances } from '../utils/dateHelpers';

interface AppointmentContextType {
  appointments: Appointment[];
  allInstances: Appointment[];
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, appointment: Appointment) => void;
  deleteAppointment: (id: string) => void;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export function AppointmentProvider({ children }: { children: React.ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>(DUMMY_APPOINTMENTS);

  const expandRecurringAppointments = useCallback((apts: Appointment[]) => {
    const expanded: Appointment[] = [];

    apts.forEach((apt) => {
      if (apt.recurring && apt.recurring.frequency !== 'none') {
        const instances = generateRecurringInstances(
          apt.startTime,
          apt.endTime,
          apt.recurring.frequency,
          apt.recurring.endDate
        );

        instances.forEach((instance, index) => {
          expanded.push({
            ...apt,
            id: `${apt.id}-${index}`,
            startTime: instance.startTime,
            endTime: instance.endTime,
          });
        });
      } else {
        expanded.push(apt);
      }
    });

    return expanded;
  }, []);

  const allInstances = expandRecurringAppointments(appointments);

  const addAppointment = useCallback((appointment: Appointment) => {
    setAppointments((prev) => [...prev, appointment]);
  }, []);

  const updateAppointment = useCallback((id: string, updated: Appointment) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, ...updated } : apt))
    );
  }, []);

  const deleteAppointment = useCallback((id: string) => {
    setAppointments((prev) => prev.filter((apt) => apt.id !== id));
  }, []);

  return (
    <AppointmentContext.Provider
      value={{ appointments, allInstances, addAppointment, updateAppointment, deleteAppointment }}
    >
      {children}
    </AppointmentContext.Provider>
  );
}

export function useAppointments() {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within AppointmentProvider');
  }
  return context;
}

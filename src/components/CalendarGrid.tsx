import React, { useState } from 'react';
import { Appointment } from '../types/appointments';
import { BUSINESS_HOURS_START, BUSINESS_HOURS_END } from '../utils/constants';
import { formatDateForDisplay, formatTimeForDisplay, isSameDay, addDays, getWeekDates } from '../utils/dateHelpers';
import AppointmentSlot from './AppointmentSlot';
import BookingModal from './BookingModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarGridProps {
  appointments: Appointment[];
  onWeekChange?: (date: Date) => void;
}

export default function CalendarGrid({ appointments }: CalendarGridProps) {
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>(null);
  const weekDates = getWeekDates(currentWeek);

  const handlePrevWeek = () => {
    setCurrentWeek(addDays(currentWeek, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };

  const getAppointmentsForSlot = (date: Date, hour: number): Appointment[] => {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return appointments.filter((apt) => {
      return (
        isSameDay(apt.startTime, date) &&
        apt.startTime.getHours() === hour
      );
    });
  };

  const hours = Array.from(
    { length: BUSINESS_HOURS_END - BUSINESS_HOURS_START },
    (_, i) => BUSINESS_HOURS_START + i
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <button
          onClick={handlePrevWeek}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-lg font-semibold text-center flex-1">
          Week of {formatDateForDisplay(weekDates[0])}
        </div>
        <button
          onClick={handleNextWeek}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="inline-block w-full">
          <div className="flex">
            <div className="w-20 flex-shrink-0 bg-gray-50 border-r">
              <div className="h-16"></div>
              {hours.map((hour) => (
                <div key={hour} className="h-24 border-b flex items-start justify-center pt-1">
                  <span className="text-xs text-gray-500">
                    {hour}:00
                  </span>
                </div>
              ))}
            </div>

            {weekDates.map((date) => (
              <div key={date.toISOString()} className="flex-1 min-w-[150px] border-r">
                <div className="h-16 border-b bg-gray-50 flex flex-col items-center justify-center">
                  <div className="text-sm font-semibold text-gray-900">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]}
                  </div>
                  <div className="text-xs text-gray-500">{date.getDate()}</div>
                </div>

                {hours.map((hour) => {
                  const slotAppointments = getAppointmentsForSlot(date, hour);
                  return (
                    <div
                      key={`${date.toISOString()}-${hour}`}
                      className="h-24 border-b cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() => setSelectedSlot({ date, hour })}
                    >
                      <div className="h-full flex flex-col gap-1 p-1 overflow-y-auto">
                        {slotAppointments.map((apt) => (
                          <AppointmentSlot key={apt.id} appointment={apt} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedSlot && (
        <BookingModal
          selectedDate={selectedSlot.date}
          selectedHour={selectedSlot.hour}
          existingAppointments={appointments}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </div>
  );
}

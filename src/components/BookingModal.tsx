import React, { useState } from 'react';
import { Appointment, AppointmentFormData, ValidationError } from '../types/appointments';
import { useAppointments } from '../context/AppointmentContext';
import { validateAppointmentBooking } from '../utils/validation';
import { X } from 'lucide-react';

interface BookingModalProps {
  selectedDate: Date;
  selectedHour: number;
  existingAppointments: Appointment[];
  onClose: () => void;
}

export default function BookingModal({
  selectedDate,
  selectedHour,
  existingAppointments,
  onClose,
}: BookingModalProps) {
  const { addAppointment } = useAppointments();
  const [formData, setFormData] = useState<AppointmentFormData>({
    title: '',
    startTime: new Date(selectedDate.setHours(selectedHour, 0, 0, 0)),
    endTime: new Date(selectedDate.setHours(selectedHour + 1, 0, 0, 0)),
    description: '',
    recurringFrequency: 'none',
  });
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateAppointmentBooking(
      formData.title,
      formData.startTime,
      formData.endTime,
      existingAppointments
    );

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const newAppointment: Appointment = {
      id: Date.now().toString(),
      title: formData.title,
      startTime: formData.startTime,
      endTime: formData.endTime,
      description: formData.description,
      recurring:
        formData.recurringFrequency !== 'none'
          ? {
              frequency: formData.recurringFrequency,
              endDate: formData.recurringEndDate,
            }
          : undefined,
    };

    addAppointment(newAppointment);
    setErrors([]);
    onClose();
  };

  const handleTimeChange = (field: 'start' | 'end', value: string) => {
    const [hours, minutes] = value.split(':').map(Number);
    const newDate = new Date(selectedDate);
    newDate.setHours(hours, minutes, 0, 0);

    if (field === 'start') {
      setFormData((prev) => ({ ...prev, startTime: newDate }));
    } else {
      setFormData((prev) => ({ ...prev, endTime: newDate }));
    }
  };

  const startTimeValue = `${String(formData.startTime.getHours()).padStart(2, '0')}:${String(
    formData.startTime.getMinutes()
  ).padStart(2, '0')}`;

  const endTimeValue = `${String(formData.endTime.getHours()).padStart(2, '0')}:${String(
    formData.endTime.getMinutes()
  ).padStart(2, '0')}`;

  const hasErrors = errors.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Book Appointment</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {hasErrors && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((error, idx) => (
                <li key={idx}>• {error.message}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Appointment title"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={startTimeValue}
                onChange={(e) => handleTimeChange('start', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={endTimeValue}
                onChange={(e) => handleTimeChange('end', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recurring</label>
            <select
              value={formData.recurringFrequency}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  recurringFrequency: e.target.value as any,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">No Recurrence</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {formData.recurringFrequency !== 'none' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recurrence End Date (optional)
              </label>
              <input
                type="date"
                value={
                  formData.recurringEndDate
                    ? formData.recurringEndDate.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    recurringEndDate: e.target.value ? new Date(e.target.value) : undefined,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Book Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

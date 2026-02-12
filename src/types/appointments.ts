export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'none';

export interface RecurrencePattern {
  frequency: RecurrenceFrequency;
  endDate?: Date;
}

export interface Appointment {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  recurring?: RecurrencePattern;
}

export interface AppointmentFormData {
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  recurringFrequency: RecurrenceFrequency;
  recurringEndDate?: Date;
}

export interface ValidationError {
  field: string;
  message: string;
}

package service

import (
	"errors"
	"strings"
	"time"

	"backend/gen/schedulepb"
	"backend/internal/store"

	"github.com/golang/protobuf/ptypes"
)

func fromPB(a *schedulepb.Appointment) (store.Appointment, error) {
	start, err := ptypes.Timestamp(a.StartTime)
	if err != nil {
		return store.Appointment{}, errors.New("invalid start_time")
	}
	end, err := ptypes.Timestamp(a.EndTime)
	if err != nil {
		return store.Appointment{}, errors.New("invalid end_time")
	}
	if !start.Before(end) {
		return store.Appointment{}, errors.New("start_time must be before end_time")
	}

	freq := store.RecurrenceNone
	switch a.RecurrenceFrequency {
	case schedulepb.Appointment_RECURRENCE_FREQUENCY_NONE:
		freq = store.RecurrenceNone
	case schedulepb.Appointment_RECURRENCE_FREQUENCY_DAILY:
		freq = store.RecurrenceDaily
	case schedulepb.Appointment_RECURRENCE_FREQUENCY_WEEKLY:
		freq = store.RecurrenceWeekly
	case schedulepb.Appointment_RECURRENCE_FREQUENCY_MONTHLY:
		freq = store.RecurrenceMonthly
	default:
		freq = store.RecurrenceNone
	}

	var rEnd *time.Time
	if a.RecurrenceEndTime != nil {
		t, err := ptypes.Timestamp(a.RecurrenceEndTime)
		if err != nil {
			return store.Appointment{}, errors.New("invalid recurrence_end_time")
		}
		rEnd = &t
	}

	return store.Appointment{
		ID:          strings.TrimSpace(a.Id),
		Title:       strings.TrimSpace(a.Title),
		Description: strings.TrimSpace(a.Description),
		StartTime:   start,
		EndTime:     end,
		Recurrence: store.RecurrencePattern{
			Frequency: freq,
			EndTime:   rEnd,
		},
	}, nil
}

func toPB(a store.Appointment) *schedulepb.Appointment {
	start := ptypes.TimestampProto(a.StartTime)
	end := ptypes.TimestampProto(a.EndTime)

	freq := schedulepb.Appointment_RECURRENCE_FREQUENCY_NONE
	switch a.Recurrence.Frequency {
	case store.RecurrenceDaily:
		freq = schedulepb.Appointment_RECURRENCE_FREQUENCY_DAILY
	case store.RecurrenceWeekly:
		freq = schedulepb.Appointment_RECURRENCE_FREQUENCY_WEEKLY
	case store.RecurrenceMonthly:
		freq = schedulepb.Appointment_RECURRENCE_FREQUENCY_MONTHLY
	case store.RecurrenceNone:
		freq = schedulepb.Appointment_RECURRENCE_FREQUENCY_NONE
	default:
		freq = schedulepb.Appointment_RECURRENCE_FREQUENCY_NONE
	}

	pb := &schedulepb.Appointment{
		Id:                  a.ID,
		Title:               a.Title,
		Description:         a.Description,
		StartTime:           start,
		EndTime:             end,
		RecurrenceFrequency: freq,
	}
	if a.Recurrence.EndTime != nil {
		pb.RecurrenceEndTime = ptypes.TimestampProto(*a.Recurrence.EndTime)
	}
	return pb
}

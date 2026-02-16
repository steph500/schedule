package service

import (
	"context"
	"strings"
	"time"

	"backend/gen/schedulepb"
	"backend/internal/store"

	"github.com/golang/protobuf/ptypes"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type ScheduleService struct {
	schedulepb.UnimplementedScheduleServiceServer
	store *store.Store
}

func New(s *store.Store) *ScheduleService {
	return &ScheduleService{store: s}
}

func (s *ScheduleService) CreateAppointment(ctx context.Context, req *schedulepb.CreateAppointmentRequest) (*schedulepb.CreateAppointmentResponse, error) {
	if req == nil || req.Appointment == nil {
		return nil, status.Error(codes.InvalidArgument, "appointment is required")
	}
	apt, err := fromPB(req.Appointment)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}

	created, conflicts, err := s.store.Create(apt)
	if err != nil {
		switch err {
		case store.ErrBadInput:
			return nil, status.Error(codes.InvalidArgument, err.Error())
		case store.ErrTooManyOccurrences:
			return nil, status.Error(codes.InvalidArgument, err.Error())
		case store.ErrConflict:
			msg := buildConflictMessage(conflicts)
			return nil, status.Error(codes.FailedPrecondition, msg)
		default:
			return nil, status.Error(codes.Internal, err.Error())
		}
	}

	resp := &schedulepb.CreateAppointmentResponse{Created: make([]*schedulepb.Appointment, 0, len(created))}
	for _, a := range created {
		resp.Created = append(resp.Created, toPB(a))
	}
	return resp, nil
}

func (s *ScheduleService) ListAppointments(ctx context.Context, req *schedulepb.ListAppointmentsRequest) (*schedulepb.ListAppointmentsResponse, error) {
	var rs, re time.Time
	var err error
	if req != nil {
		if req.RangeStart != nil {
			rs, err = ptypes.Timestamp(req.RangeStart)
			if err != nil {
				return nil, status.Error(codes.InvalidArgument, "invalid range_start")
			}
		}
		if req.RangeEnd != nil {
			re, err = ptypes.Timestamp(req.RangeEnd)
			if err != nil {
				return nil, status.Error(codes.InvalidArgument, "invalid range_end")
			}
		}
	}
	items := s.store.List(rs, re)
	resp := &schedulepb.ListAppointmentsResponse{Appointments: make([]*schedulepb.Appointment, 0, len(items))}
	for _, a := range items {
		resp.Appointments = append(resp.Appointments, toPB(a))
	}
	return resp, nil
}

func (s *ScheduleService) DeleteAppointment(ctx context.Context, req *schedulepb.DeleteAppointmentRequest) (*schedulepb.DeleteAppointmentResponse, error) {
	if req == nil || strings.TrimSpace(req.Id) == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}
	if err := s.store.Delete(req.Id); err != nil {
		switch err {
		case store.ErrNotFound:
			return nil, status.Error(codes.NotFound, err.Error())
		default:
			return nil, status.Error(codes.Internal, err.Error())
		}
	}
	return &schedulepb.DeleteAppointmentResponse{}, nil
}

func buildConflictMessage(conflicts []store.Appointment) string {
	if len(conflicts) == 0 {
		return store.ErrConflict.Error()
	}
	b := strings.Builder{}
	b.WriteString("This time slot conflicts with existing appointment(s): ")
	for i, c := range conflicts {
		if i > 0 {
			b.WriteString("; ")
		}
		b.WriteString(c.Title)
		b.WriteString(" (")
		b.WriteString(c.StartTime.Format(time.RFC3339))
		b.WriteString(" - ")
		b.WriteString(c.EndTime.Format(time.RFC3339))
		b.WriteString(")")
	}
	return b.String()
}

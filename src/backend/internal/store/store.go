package store

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sort"
	"sync"
	"time"
)

var (
	ErrNotFound  = errors.New("appointment not found")
	ErrConflict  = errors.New("appointment conflicts with an existing appointment")
	ErrBadInput  = errors.New("invalid appointment")
	ErrTooManyOccurrences = errors.New("recurring appointment produces too many occurrences")
)

type RecurrenceFrequency string

const (
	RecurrenceNone    RecurrenceFrequency = "none"
	RecurrenceDaily   RecurrenceFrequency = "daily"
	RecurrenceWeekly  RecurrenceFrequency = "weekly"
	RecurrenceMonthly RecurrenceFrequency = "monthly"
)

type Appointment struct {
	ID          string             `json:"id"`
	Title       string             `json:"title"`
	Description string             `json:"description,omitempty"`
	StartTime   time.Time          `json:"startTime"`
	EndTime     time.Time          `json:"endTime"`
	Recurrence  RecurrencePattern  `json:"recurrence"`
}

type RecurrencePattern struct {
	Frequency RecurrenceFrequency `json:"frequency"`
	EndTime   *time.Time          `json:"endTime,omitempty"`
}

type Store struct {
	mu      sync.Mutex
	byID    map[string]Appointment
	dataPath string
}

type persisted struct {
	Appointments []Appointment `json:"appointments"`
}

func New(dataPath string) (*Store, error) {
	s := &Store{byID: map[string]Appointment{}, dataPath: dataPath}
	if dataPath == "" {
		return s, nil
	}
	if err := s.load(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *Store) load() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	b, err := os.ReadFile(s.dataPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	var p persisted
	if err := json.Unmarshal(b, &p); err != nil {
		return err
	}
	for _, a := range p.Appointments {
		s.byID[a.ID] = a
	}
	return nil
}

func (s *Store) saveLocked() error {
	if s.dataPath == "" {
		return nil
	}
	p := persisted{Appointments: make([]Appointment, 0, len(s.byID))}
	for _, a := range s.byID {
		p.Appointments = append(p.Appointments, a)
	}
	// Deterministic output for diffs.
	sort.Slice(p.Appointments, func(i, j int) bool {
		return p.Appointments[i].StartTime.Before(p.Appointments[j].StartTime)
	})
	b, err := json.MarshalIndent(&p, "", "  ")
	if err != nil {
		return err
	}

	if err := os.MkdirAll(filepath.Dir(s.dataPath), 0o755); err != nil {
		return err
	}
	tmp := s.dataPath + ".tmp"
	if err := os.WriteFile(tmp, b, 0o644); err != nil {
		return err
	}
	return os.Rename(tmp, s.dataPath)
}

// List returns appointments in ascending start time order. If rangeStart/rangeEnd
// are non-zero, results are filtered to those that overlap the given range.
func (s *Store) List(rangeStart, rangeEnd time.Time) []Appointment {
	s.mu.Lock()
	defer s.mu.Unlock()

	out := make([]Appointment, 0, len(s.byID))
	for _, a := range s.byID {
		if !rangeStart.IsZero() || !rangeEnd.IsZero() {
			if !overlapsRange(a.StartTime, a.EndTime, rangeStart, rangeEnd) {
				continue
			}
		}
		out = append(out, a)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].StartTime.Before(out[j].StartTime) })
	return out
}

func overlapsRange(aStart, aEnd, rStart, rEnd time.Time) bool {
	// If only one side specified, treat as open ended.
	if rStart.IsZero() {
		rStart = time.Time{}
	}
	if rEnd.IsZero() {
		rEnd = time.Date(9999, 12, 31, 23, 59, 59, 0, time.UTC)
	}
	return !(aEnd.Before(rStart) || aStart.After(rEnd) || aEnd.Equal(rStart) || aStart.Equal(rEnd))
}

// Create inserts one or more appointments. For recurring requests, occurrences are
// expanded and added atomically (all-or-nothing) to prevent partial creation.
func (s *Store) Create(a Appointment) ([]Appointment, []Appointment, error) {
	occ, err := expandOccurrences(a)
	if err != nil {
		return nil, nil, err
	}

	// Ensure each occurrence has a unique ID.
	for i := range occ {
		if occ[i].ID == "" {
			occ[i].ID = newID()
			continue
		}
		if len(occ) > 1 {
			// Prevent collisions if the caller provided a base ID.
			occ[i].ID = occ[i].ID + "-" + newID()
		}
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// Check conflicts for all occurrences first.
	conflicts := make([]Appointment, 0)
	for _, cand := range occ {
		for _, existing := range s.byID {
			if overlaps(cand.StartTime, cand.EndTime, existing.StartTime, existing.EndTime) {
				conflicts = append(conflicts, existing)
			}
		}
	}
	if len(conflicts) > 0 {
		sort.Slice(conflicts, func(i, j int) bool { return conflicts[i].StartTime.Before(conflicts[j].StartTime) })
		return nil, conflicts, ErrConflict
	}

	for _, created := range occ {
		s.byID[created.ID] = created
	}
	if err := s.saveLocked(); err != nil {
		// On persistence error, keep in-memory data but surface error.
		return occ, nil, err
	}
	return occ, nil, nil
}

func overlaps(aStart, aEnd, bStart, bEnd time.Time) bool {
	// Half-open interval: [start, end)
	return aStart.Before(bEnd) && bStart.Before(aEnd)
}

func (s *Store) Delete(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.byID[id]; !ok {
		return ErrNotFound
	}
	delete(s.byID, id)
	return s.saveLocked()
}

func expandOccurrences(a Appointment) ([]Appointment, error) {
	if a.Title == "" || a.StartTime.IsZero() || a.EndTime.IsZero() || !a.StartTime.Before(a.EndTime) {
		return nil, ErrBadInput
	}
	if a.Recurrence.Frequency == "" {
		a.Recurrence.Frequency = RecurrenceNone
	}
	if a.Recurrence.Frequency == RecurrenceNone {
		return []Appointment{a}, nil
	}
	if a.Recurrence.EndTime == nil {
		return nil, ErrBadInput
	}

	max := 366 // safety cap
	out := make([]Appointment, 0, 16)
	start := a.StartTime
	end := a.EndTime
	for i := 0; i < max; i++ {
		if start.After(*a.Recurrence.EndTime) {
			break
		}
		occ := a
		occ.StartTime = start
		occ.EndTime = end
		// caller should already set a unique ID per occurrence.
		out = append(out, occ)

		switch a.Recurrence.Frequency {
		case RecurrenceDaily:
			start = start.AddDate(0, 0, 1)
			end = end.AddDate(0, 0, 1)
		case RecurrenceWeekly:
			start = start.AddDate(0, 0, 7)
			end = end.AddDate(0, 0, 7)
		case RecurrenceMonthly:
			start = start.AddDate(0, 1, 0)
			end = end.AddDate(0, 1, 0)
		default:
			return nil, ErrBadInput
		}
	}
	if len(out) == max {
		return nil, ErrTooManyOccurrences
	}
	return out, nil
}

func newID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b) // best effort; collisions still extremely unlikely
	return hex.EncodeToString(b)
}

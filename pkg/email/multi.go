package email

import (
	"context"
	"fmt"
	"log/slog"
	"sync"
	"sync/atomic"
)

// Strategy defines how the MultiProvider selects senders.
type Strategy string

const (
	StrategyPrimaryFallback Strategy = "primary_fallback"
	StrategyRoundRobin      Strategy = "round_robin"
)

// WeightedSender pairs a Sender with a weight for round-robin selection.
type WeightedSender struct {
	Sender Sender
	Name   string
	Weight int
}

// MultiProvider implements Sender by managing multiple email providers
// with configurable routing strategies (primary-fallback or round-robin).
type MultiProvider struct {
	mu        sync.RWMutex
	senders   []WeightedSender
	strategy  Strategy
	rrCounter atomic.Uint64
}

// NewMultiProvider creates a new MultiProvider.
func NewMultiProvider(strategy Strategy) *MultiProvider {
	return &MultiProvider{
		senders:  make([]WeightedSender, 0),
		strategy: strategy,
	}
}

// AddSender adds a sender to the provider pool.
func (m *MultiProvider) AddSender(name string, sender Sender, weight int) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.senders = append(m.senders, WeightedSender{
		Sender: sender,
		Name:   name,
		Weight: weight,
	})
}

// RemoveSender removes a sender by name from the pool.
func (m *MultiProvider) RemoveSender(name string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for i, ws := range m.senders {
		if ws.Name == name {
			m.senders = append(m.senders[:i], m.senders[i+1:]...)
			return
		}
	}
}

// SetStrategy changes the routing strategy.
func (m *MultiProvider) SetStrategy(strategy Strategy) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.strategy = strategy
}

// Senders returns a copy of the current sender list.
func (m *MultiProvider) Senders() []WeightedSender {
	m.mu.RLock()
	defer m.mu.RUnlock()
	result := make([]WeightedSender, len(m.senders))
	copy(result, m.senders)
	return result
}

// SendPrimary sends using the first healthy sender, falling back to the next on error.
func (m *MultiProvider) SendPrimary(ctx context.Context, req SendRequest) error {
	m.mu.RLock()
	senders := make([]WeightedSender, len(m.senders))
	copy(senders, m.senders)
	m.mu.RUnlock()

	if len(senders) == 0 {
		return fmt.Errorf("multi: no email providers configured")
	}

	var lastErr error
	for _, ws := range senders {
		if err := ws.Sender.Send(ctx, req); err != nil {
			slog.Warn("multi: primary fallback - sender failed",
				"sender", ws.Name, "error", err)
			lastErr = err
			continue
		}
		return nil
	}

	return fmt.Errorf("multi: all providers failed: %w", lastErr)
}

// SendRoundRobin rotates through available senders using weighted selection.
func (m *MultiProvider) SendRoundRobin(ctx context.Context, req SendRequest) error {
	m.mu.RLock()
	senders := make([]WeightedSender, len(m.senders))
	copy(senders, m.senders)
	strategy := m.strategy
	m.mu.RUnlock()

	if len(senders) == 0 {
		return fmt.Errorf("multi: no email providers configured")
	}

	// If only one sender, use it directly
	if strategy != StrategyRoundRobin || len(senders) == 1 {
		return senders[0].Sender.Send(ctx, req)
	}

	// Weighted round-robin: build a virtual list based on weights
	virtual := make([]WeightedSender, 0)
	for _, ws := range senders {
		w := ws.Weight
		if w < 1 {
			w = 1
		}
		for i := 0; i < w; i++ {
			virtual = append(virtual, ws)
		}
	}

	if len(virtual) == 0 {
		return fmt.Errorf("multi: no providers in virtual rotation list")
	}

	counter := m.rrCounter.Add(1)
	idx := int(counter-1) % len(virtual)

	return virtual[idx].Sender.Send(ctx, req)
}

// SendAll sends the email to all configured providers (for critical emails).
func (m *MultiProvider) SendAll(ctx context.Context, req SendRequest) error {
	m.mu.RLock()
	senders := make([]WeightedSender, len(m.senders))
	copy(senders, m.senders)
	m.mu.RUnlock()

	if len(senders) == 0 {
		return fmt.Errorf("multi: no email providers configured")
	}

	var wg sync.WaitGroup
	errCh := make(chan error, len(senders))

	for _, ws := range senders {
		wg.Add(1)
		go func(s Sender) {
			defer wg.Done()
			if err := s.Send(ctx, req); err != nil {
				errCh <- err
			}
		}(ws.Sender)
	}

	wg.Wait()
	close(errCh)

	var errs []error
	for err := range errCh {
		errs = append(errs, err)
	}

	if len(errs) > 0 {
		return fmt.Errorf("multi: %d/%d providers failed: %v",
			len(errs), len(senders), errs[0])
	}

	return nil
}

// Send implements Sender using the current strategy.
func (m *MultiProvider) Send(ctx context.Context, req SendRequest) error {
	m.mu.RLock()
	strategy := m.strategy
	m.mu.RUnlock()

	switch strategy {
	case StrategyRoundRobin:
		return m.SendRoundRobin(ctx, req)
	default:
		return m.SendPrimary(ctx, req)
	}
}

// SendTemplate implements Sender using the current strategy.
func (m *MultiProvider) SendTemplate(ctx context.Context, req TemplateRequest) error {
	m.mu.RLock()
	senders := make([]WeightedSender, len(m.senders))
	copy(senders, m.senders)
	m.mu.RUnlock()

	if len(senders) == 0 {
		return fmt.Errorf("multi: no email providers configured")
	}

	var lastErr error
	for _, ws := range senders {
		if err := ws.Sender.SendTemplate(ctx, req); err != nil {
			slog.Warn("multi: sender failed for template",
				"sender", ws.Name, "error", err)
			lastErr = err
			continue
		}
		return nil
	}

	return fmt.Errorf("multi: all providers failed for template: %w", lastErr)
}
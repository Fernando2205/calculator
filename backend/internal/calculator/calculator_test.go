package calculator

import (
	"errors"
	"math"
	"testing"
)

func TestAdd(t *testing.T) {
	tests := []struct {
		name string
		a, b float64
		want float64
	}{
		{"two positive numbers", 1, 2, 3},
		{"two negative numbers", -2, -3, -5},
		{"one positive and one negative number", 5, -3, 2},
		{"two zeros", 0, 0, 0},
		{"zero and a positive number", 0, 5, 5},
		{"zero and a negative number", 0, -5, -5},
		{"floating point numbers", 0.1, 0.2, 0.3},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Add(tt.a, tt.b)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !almostEqual(got, tt.want) {
				t.Errorf("Add(%v,%v)= %v, want %v", tt.a, tt.b, got, tt.want)
			}
		})
	}
}

func TestSubtract(t *testing.T) {
	tests := []struct {
		name string
		a, b float64
		want float64
	}{
		{"two positive numbers", 5, 3, 2},
		{"two negative numbers", -5, -3, -2},
		{"one positive and one negative number", 5, -3, 8},
		{"two zeros", 0, 0, 0},
		{"zero and a positive number", 0, 5, -5},
		{"zero and a negative number", 0, -5, 5},
		{"floating point numbers", 0.3, 0.1, 0.2},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Subtract(tt.a, tt.b)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !almostEqual(got, tt.want) {
				t.Errorf("Subtract(%v,%v)= %v, want %v", tt.a, tt.b, got, tt.want)
			}
		})
	}
}

func TestMultiply(t *testing.T) {
	tests := []struct {
		name string
		a, b float64
		want float64
	}{
		{"two positive numbers", 2, 3, 6},
		{"two negative numbers", -2, -3, 6},
		{"one positive and one negative number", 5, -3, -15},
		{"two zeros", 0, 0, 0},
		{"zero and a positive number", 0, 5, 0},
		{"zero and a negative number", 0, -5, 0},
		{"floating point numbers", 0.1, 0.2, 0.02},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Multiply(tt.a, tt.b)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !almostEqual(got, tt.want) {
				t.Errorf("Multiply(%v,%v)= %v, want %v", tt.a, tt.b, got, tt.want)
			}
		})
	}
}

func TestDivide(t *testing.T) {
	tests := []struct {
		name    string
		a, b    float64
		want    float64
		wantErr error //We dont want errors so we verify that the error is nil
	}{
		{"two positive numbers", 6, 3, 2, nil},
		{"two negative numbers", -6, -3, 2, nil},
		{"one positive and one negative number", 6, -3, -2, nil},
		{"zero divided by a number", 0, 5, 0, nil},
		{"non integer result", 1, 3, 0.33333333333, nil},
		{"positive number divided by zero", 5, 0, 0, ErrDivisionByZero},
		{"negative number divided by zero", -5, 0, 0, ErrDivisionByZero},
		{"zero divided by zero", 0, 0, 0, ErrDivisionByZero},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Divide(tt.a, tt.b)
			if tt.wantErr != nil {
				if !errors.Is(err, tt.wantErr) {
					t.Fatalf("Divide(%v,%v)error =  %v, want %v", tt.a, tt.b, err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !almostEqual(got, tt.want) {
				t.Errorf("Divide(%v,%v)= %v, want %v", tt.a, tt.b, got, tt.want)
			}

		})
	}
}

func TestPower(t *testing.T) {
	tests := []struct {
		name      string
		base, exp float64
		want      float64
	}{
		{"positive base and exponent", 2, 3, 8},
		{"exponent zero", 5, 0, 1},
		{"exponent one", 7, 1, 7},
		{"negative base, even exponent", -2, 2, 4},
		{"negative base, odd exponent", -2, 3, -8},
		{"negative exponent", 2, -2, 0.25},
		{"fractional exponent", 9, 0.5, 3},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Power(tt.base, tt.exp)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !almostEqual(got, tt.want) {
				t.Errorf("Power(%v,%v)= %v, want %v", tt.base, tt.exp, got, tt.want)
			}
		})
	}
}

func TestSqrt(t *testing.T) {
	tests := []struct {
		name    string
		a       float64
		want    float64
		wantErr error
	}{
		{"perfect square", 16, 4, nil},
		{"non-perfect square", 2, 1.4142135623, nil},
		{"zero", 0, 0, nil},
		{"decimal", 0.25, 0.5, nil},
		{"negative number", -4, 0, ErrNegativeSqrt},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Sqrt(tt.a)
			if tt.wantErr != nil {
				if !errors.Is(err, tt.wantErr) {
					t.Fatalf("Sqrt(%v) error = %v, want %v", tt.a, err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !almostEqual(got, tt.want) {
				t.Errorf("Sqrt(%v)= %v, want %v", tt.a, got, tt.want)
			}
		})
	}
}

func TestPercentage(t *testing.T) {
	tests := []struct {
		name    string
		pct, of float64
		want    float64
	}{
		{"20 percent of 150", 20, 150, 30},
		{"100 percent", 100, 80, 80},
		{"zero percent", 0, 80, 0},
		{"percent of zero", 50, 0, 0},
		{"more than 100 percent", 150, 20, 30},
		{"decimal percent", 12.5, 80, 10},
		{"negative percent", -10, 50, -5},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Percentage(tt.pct, tt.of)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !almostEqual(got, tt.want) {
				t.Errorf("Percentage(%v,%v)= %v, want %v", tt.pct, tt.of, got, tt.want)
			}
		})
	}
}

func TestNonFiniteResults(t *testing.T) {
	tests := []struct {
		name string
		op   func() (float64, error)
	}{
		{"add overflow", func() (float64, error) { return Add(math.MaxFloat64, math.MaxFloat64) }},
		{"subtract overflow", func() (float64, error) { return Subtract(-math.MaxFloat64, math.MaxFloat64) }},
		{"multiply overflow", func() (float64, error) { return Multiply(math.MaxFloat64, 2) }},
		{"divide overflow", func() (float64, error) { return Divide(math.MaxFloat64, 0.5) }},
		{"power overflow", func() (float64, error) { return Power(10, 400) }},
		{"zero to a negative power", func() (float64, error) { return Power(0, -1) }},
		{"negative base with fractional exponent", func() (float64, error) { return Power(-8, 1.0/3) }},
		{"percentage overflow", func() (float64, error) { return Percentage(math.MaxFloat64, 200) }},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := tt.op()
			if !errors.Is(err, ErrNonFiniteResult) {
				t.Fatalf("got (%v, %v), want error %v", got, err, ErrNonFiniteResult)
			}
		})
	}
}

const epsilon = 1e-9

func almostEqual(a, b float64) bool {
	return math.Abs(a-b) < epsilon
}

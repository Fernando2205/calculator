package calculator

import (
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

const epsilon = 1e-9

func almostEqual(a, b float64) bool {
	return math.Abs(a-b) < epsilon
}

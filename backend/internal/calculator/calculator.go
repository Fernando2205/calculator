package calculator

import (
	"errors"
	"math"
)

// ErrDivisionByZero is returned when the divisor is zero.
var ErrDivisionByZero = errors.New("division by zero")

// ErrNegativeSqrt is returned when attempting to calculate the square root of a negative number.
var ErrNegativeSqrt = errors.New("square root of negative number")

func Add(a, b float64) (float64, error) {
	return a + b, nil
}

func Subtract(a, b float64) (float64, error) {
	return a - b, nil
}

func Multiply(a, b float64) (float64, error) {
	return a * b, nil
}

func Divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, ErrDivisionByZero
	}
	return a / b, nil
}

func Power(base, exp float64) (float64, error) {
	return math.Pow(base, exp), nil
}

func Sqrt(a float64) (float64, error) {
	if a < 0 {
		return 0, ErrNegativeSqrt
	}
	return math.Sqrt(a), nil
}

// Percentage returns pct percent of the given value, e.g. Percentage(20, 150) = 30.
func Percentage(pct, of float64) (float64, error) {
	return pct * of / 100, nil
}

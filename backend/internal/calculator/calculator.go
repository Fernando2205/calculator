package calculator

import (
	"errors"
	"math"
)

// ErrDivisionByZero is returned when the divisor is zero.
var ErrDivisionByZero = errors.New("division by zero")

// ErrNegativeSqrt is returned when attempting to calculate the square root of a negative number.
var ErrNegativeSqrt = errors.New("square root of negative number")

// ErrNonFiniteResult is returned when an operation overflows or its result is undefined.
var ErrNonFiniteResult = errors.New("result is not a finite number")

func Add(a, b float64) (float64, error) {
	return finite(a + b)
}

func Subtract(a, b float64) (float64, error) {
	return finite(a - b)
}

func Multiply(a, b float64) (float64, error) {
	return finite(a * b)
}

func Divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, ErrDivisionByZero
	}
	return finite(a / b)
}

func Power(base, exp float64) (float64, error) {
	return finite(math.Pow(base, exp))
}

func Sqrt(a float64) (float64, error) {
	if a < 0 {
		return 0, ErrNegativeSqrt
	}
	return math.Sqrt(a), nil
}

// Percentage returns pct percent of the given value, e.g. Percentage(20, 150) = 30.
func Percentage(pct, of float64) (float64, error) {
	return finite(pct * of / 100)
}

// finite returns v unchanged, or ErrNonFiniteResult if v is Inf or NaN,
// since those values cannot be represented in JSON.
func finite(v float64) (float64, error) {
	if math.IsInf(v, 0) || math.IsNaN(v) {
		return 0, ErrNonFiniteResult
	}
	return v, nil
}

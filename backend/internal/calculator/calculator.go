package calculator

import "errors"

var ErrDivisionByZero = errors.New("division by zero")

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

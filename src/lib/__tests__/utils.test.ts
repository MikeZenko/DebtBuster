import {
  calculateMonthlyPayment,
  calculateTotalInterest,
  generateAmortizationSchedule,
  calculateSnowballOrder,
  calculateAvalancheOrder,
  calculatePayoffTimeline,
  formatCurrency,
  formatPercent,
  validateLoanInputs,
  detectPredatoryFlags,
  type Debt
} from '../utils';

describe('Financial Calculation Utils', () => {
  describe('calculateMonthlyPayment', () => {
    test('should calculate correct monthly payment for standard loan', () => {
      const principal = 100000;
      const apr = 5.0;
      const termMonths = 360; // 30 years
      
      const payment = calculateMonthlyPayment(principal, apr, termMonths);
      
      // Expected payment should be around $536.82
      expect(payment).toBeCloseTo(536.82, 1);
    });

    test('should handle zero interest rate', () => {
      const principal = 12000;
      const apr = 0;
      const termMonths = 24;
      
      const payment = calculateMonthlyPayment(principal, apr, termMonths);
      
      // Should be simple division: 12000 / 24 = 500
      expect(payment).toBe(500);
    });

    test('should calculate correctly for short-term loan', () => {
      const principal = 5000;
      const apr = 6.5;
      const termMonths = 12;
      
      const payment = calculateMonthlyPayment(principal, apr, termMonths);
      
      // Should be around $430.33
      expect(payment).toBeCloseTo(430.33, 1);
    });

    test('should handle edge cases', () => {
      expect(() => calculateMonthlyPayment(0, 5, 12)).not.toThrow();
      expect(() => calculateMonthlyPayment(1000, 100, 12)).not.toThrow(); // 100% APR edge case
    });
  });

  describe('calculateTotalInterest', () => {
    test('should calculate total interest correctly', () => {
      const principal = 10000;
      const apr = 5.0;
      const termMonths = 24;
      
      const totalInterest = calculateTotalInterest(principal, apr, termMonths);
      const monthlyPayment = calculateMonthlyPayment(principal, apr, termMonths);
      const expectedTotal = (monthlyPayment * termMonths) - principal;
      
      expect(totalInterest).toBeCloseTo(expectedTotal, 2);
    });

    test('should return zero interest for zero APR', () => {
      const principal = 5000;
      const apr = 0;
      const termMonths = 12;
      
      const totalInterest = calculateTotalInterest(principal, apr, termMonths);
      
      expect(totalInterest).toBe(0);
    });
  });

  describe('generateAmortizationSchedule', () => {
    test('should generate correct amortization schedule', () => {
      const principal = 1000;
      const apr = 12; // 12% APR for easy calculation
      const termMonths = 12;
      
      const schedule = generateAmortizationSchedule(principal, apr, termMonths);
      
      expect(schedule).toHaveLength(12);
      expect(schedule[0].month).toBe(1);
      expect(schedule[11].month).toBe(12);
      
      // First payment should have more interest than principal
      expect(schedule[0].interest).toBeGreaterThan(schedule[0].principal);
      
      // Last payment should have more principal than interest
      expect(schedule[11].principal).toBeGreaterThan(schedule[11].interest);
      
      // Balance should decrease each month
      expect(schedule[0].balance).toBeGreaterThan(schedule[5].balance);
      expect(schedule[5].balance).toBeGreaterThan(schedule[11].balance);
      
      // Final balance should be close to zero
      expect(schedule[11].balance).toBeCloseTo(0, 2);
    });

    test('should handle single payment loan', () => {
      const principal = 1000;
      const apr = 10;
      const termMonths = 1;
      
      const schedule = generateAmortizationSchedule(principal, apr, termMonths);
      
      expect(schedule).toHaveLength(1);
      expect(schedule[0].balance).toBeCloseTo(0, 2);
    });
  });

  describe('debt ordering strategies', () => {
    const sampleDebts: Debt[] = [
      { id: '1', name: 'Credit Card', balance: 2000, apr: 24.9, minimumPayment: 50 },
      { id: '2', name: 'Student Loan', balance: 15000, apr: 5.5, minimumPayment: 150 },
      { id: '3', name: 'Auto Loan', balance: 8000, apr: 7.2, minimumPayment: 200 },
      { id: '4', name: 'Personal Loan', balance: 3000, apr: 12.0, minimumPayment: 100 }
    ];

    describe('calculateSnowballOrder', () => {
      test('should order debts by balance (lowest first)', () => {
        const ordered = calculateSnowballOrder(sampleDebts);
        
        expect(ordered[0].balance).toBe(2000); // Credit Card
        expect(ordered[1].balance).toBe(3000); // Personal Loan
        expect(ordered[2].balance).toBe(8000); // Auto Loan
        expect(ordered[3].balance).toBe(15000); // Student Loan
      });

      test('should not modify original array', () => {
        const originalLength = sampleDebts.length;
        calculateSnowballOrder(sampleDebts);
        
        expect(sampleDebts).toHaveLength(originalLength);
        expect(sampleDebts[0].id).toBe('1'); // Original order preserved
      });
    });

    describe('calculateAvalancheOrder', () => {
      test('should order debts by APR (highest first)', () => {
        const ordered = calculateAvalancheOrder(sampleDebts);
        
        expect(ordered[0].apr).toBe(24.9); // Credit Card
        expect(ordered[1].apr).toBe(12.0); // Personal Loan
        expect(ordered[2].apr).toBe(7.2);  // Auto Loan
        expect(ordered[3].apr).toBe(5.5);  // Student Loan
      });
    });
  });

  describe('calculatePayoffTimeline', () => {
    const testDebts: Debt[] = [
      { id: '1', name: 'Card 1', balance: 1000, apr: 20, minimumPayment: 25 },
      { id: '2', name: 'Card 2', balance: 2000, apr: 15, minimumPayment: 50 }
    ];

    test('should calculate snowball timeline', () => {
      const timeline = calculatePayoffTimeline(testDebts, 'snowball', 100);
      
      expect(timeline.length).toBeGreaterThan(0);
      expect(timeline[0].month).toBe(1);
      
      // Total balance should decrease over time
      const firstMonth = timeline[0];
      const lastMonth = timeline[timeline.length - 1];
      expect(lastMonth.totalBalance).toBeLessThan(firstMonth.totalBalance);
      
      // Should reach zero balance
      expect(lastMonth.totalBalance).toBeCloseTo(0, 2);
    });

    test('should calculate avalanche timeline', () => {
      const timeline = calculatePayoffTimeline(testDebts, 'avalanche', 100);
      
      expect(timeline.length).toBeGreaterThan(0);
      expect(timeline[timeline.length - 1].totalBalance).toBeCloseTo(0, 2);
    });

    test('should handle zero extra payment', () => {
      const timeline = calculatePayoffTimeline(testDebts, 'snowball', 0);
      
      expect(timeline.length).toBeGreaterThan(0);
      // Should still pay off debt with minimum payments only
    });

    test('should prevent infinite loops', () => {
      const largeDebt: Debt[] = [
        { id: '1', name: 'Large Debt', balance: 1000000, apr: 25, minimumPayment: 10 }
      ];
      
      const timeline = calculatePayoffTimeline(largeDebt, 'snowball', 0);
      
      // Should stop at safety limit (600 months / 50 years)
      expect(timeline.length).toBeLessThanOrEqual(600);
    });
  });

  describe('formatting utilities', () => {
    describe('formatCurrency', () => {
      test('should format currency correctly', () => {
        expect(formatCurrency(1234.56)).toBe('$1,235');
        expect(formatCurrency(0)).toBe('$0');
        expect(formatCurrency(1000000)).toBe('$1,000,000');
      });

      test('should handle negative numbers', () => {
        expect(formatCurrency(-1234.56)).toBe('-$1,235');
      });
    });

    describe('formatPercent', () => {
      test('should format percentages correctly', () => {
        expect(formatPercent(5.5)).toBe('5.5%');
        expect(formatPercent(0)).toBe('0.0%');
        expect(formatPercent(100)).toBe('100.0%');
      });
    });
  });

  describe('validation utilities', () => {
    describe('validateLoanInputs', () => {
      test('should accept valid loan inputs', () => {
        const errors = validateLoanInputs(10000, 5.5, 360);
        expect(errors).toHaveLength(0);
      });

      test('should reject invalid principal', () => {
        const errors = validateLoanInputs(0, 5.5, 360);
        expect(errors).toContain('Principal must be greater than 0');
      });

      test('should reject invalid APR', () => {
        let errors = validateLoanInputs(10000, -1, 360);
        expect(errors).toContain('APR must be between 0 and 100');
        
        errors = validateLoanInputs(10000, 101, 360);
        expect(errors).toContain('APR must be between 0 and 100');
      });

      test('should reject invalid term', () => {
        let errors = validateLoanInputs(10000, 5.5, 0);
        expect(errors).toContain('Term must be between 1 and 600 months');
        
        errors = validateLoanInputs(10000, 5.5, 601);
        expect(errors).toContain('Term must be between 1 and 600 months');
      });
    });

    describe('detectPredatoryFlags', () => {
      test('should detect high APR', () => {
        const flags = detectPredatoryFlags(30, 0, 10000);
        expect(flags).toContain('Extremely high APR (>25%)');
      });

      test('should detect extremely high APR', () => {
        const flags = detectPredatoryFlags(40, 0, 10000);
        expect(flags).toContain('Potentially predatory APR (>36%)');
      });

      test('should detect high fees', () => {
        const flags = detectPredatoryFlags(5, 600, 10000); // 6% fees
        expect(flags).toContain('High fees (>5% of principal)');
      });

      test('should return empty array for good loan terms', () => {
        const flags = detectPredatoryFlags(5.5, 100, 10000); // 1% fees, 5.5% APR
        expect(flags).toHaveLength(0);
      });

      test('should detect multiple flags', () => {
        const flags = detectPredatoryFlags(45, 1000, 10000); // High APR and fees
        expect(flags.length).toBeGreaterThan(1);
      });
    });
  });
});

describe('Edge cases and error handling', () => {
  test('should handle very small numbers', () => {
    expect(() => calculateMonthlyPayment(0.01, 0.01, 1)).not.toThrow();
  });

  test('should handle very large numbers', () => {
    expect(() => calculateMonthlyPayment(1000000000, 50, 600)).not.toThrow();
  });

  test('should handle floating point precision', () => {
    const payment = calculateMonthlyPayment(1000, 10.33333333, 12);
    expect(payment).toBeFinite();
    expect(payment).toBeGreaterThan(0);
  });
});

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Loan calculation utilities
export function calculateMonthlyPayment(principal: number, apr: number, termMonths: number): number {
  const monthlyRate = apr / 100 / 12;
  if (monthlyRate === 0) return principal / termMonths;
  
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
         (Math.pow(1 + monthlyRate, termMonths) - 1);
}

export function calculateTotalInterest(principal: number, apr: number, termMonths: number): number {
  const monthlyPayment = calculateMonthlyPayment(principal, apr, termMonths);
  return (monthlyPayment * termMonths) - principal;
}

export function generateAmortizationSchedule(
  principal: number, 
  apr: number, 
  termMonths: number
): Array<{ month: number; payment: number; interest: number; principal: number; balance: number }> {
  const monthlyPayment = calculateMonthlyPayment(principal, apr, termMonths);
  const monthlyRate = apr / 100 / 12;
  let balance = principal;
  const schedule = [];

  for (let month = 1; month <= termMonths; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance -= principalPayment;

    schedule.push({
      month,
      payment: monthlyPayment,
      interest: interestPayment,
      principal: principalPayment,
      balance: Math.max(0, balance)
    });
  }

  return schedule;
}

// Debt payoff calculations
export interface Debt {
  id: string;
  name: string;
  balance: number;
  apr: number;
  minimumPayment: number;
  extraPayment?: number;
  isFromPlaid?: boolean;
  plaidAccountId?: string;
  debtType?: 'credit_card' | 'loan' | 'line_of_credit';
  lastUpdated?: string;
}

export function calculateSnowballOrder(debts: Debt[]): Debt[] {
  return [...debts].sort((a, b) => a.balance - b.balance);
}

export function calculateAvalancheOrder(debts: Debt[]): Debt[] {
  return [...debts].sort((a, b) => b.apr - a.apr);
}

export function calculatePayoffTimeline(
  debts: Debt[], 
  strategy: 'snowball' | 'avalanche',
  extraPayment: number = 0
): Array<{ month: number; debts: Debt[]; totalBalance: number; monthlyPayment: number }> {
  const sortedDebts = strategy === 'snowball' 
    ? calculateSnowballOrder(debts) 
    : calculateAvalancheOrder(debts);
  
  let workingDebts = sortedDebts.map(debt => ({ ...debt }));
  const timeline = [];
  let month = 0;
  
  while (workingDebts.some(debt => debt.balance > 0)) {
    month++;
    const totalMinimumPayment = workingDebts.reduce((sum, debt) => 
      debt.balance > 0 ? sum + debt.minimumPayment : sum, 0
    );
    
    let remainingExtraPayment = extraPayment;
    
    // Pay minimums first
    workingDebts.forEach(debt => {
      if (debt.balance > 0) {
        const payment = Math.min(debt.minimumPayment, debt.balance);
        debt.balance -= payment;
      }
    });
    
    // Apply extra payment to first debt with balance
    const targetDebt = workingDebts.find(debt => debt.balance > 0);
    if (targetDebt && remainingExtraPayment > 0) {
      const extraApplied = Math.min(remainingExtraPayment, targetDebt.balance);
      targetDebt.balance -= extraApplied;
      remainingExtraPayment -= extraApplied;
    }
    
    const totalBalance = workingDebts.reduce((sum, debt) => sum + debt.balance, 0);
    
    timeline.push({
      month,
      debts: workingDebts.map(debt => ({ ...debt })),
      totalBalance,
      monthlyPayment: totalMinimumPayment + (extraPayment - remainingExtraPayment)
    });
    
    if (month > 600) break; // Safety check for 50 years
  }
  
  return timeline;
}

// Formatting utilities
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(percent: number): string {
  return `${percent.toFixed(1)}%`;
}

// Validation utilities
export function validateLoanInputs(principal: number, apr: number, termMonths: number): string[] {
  const errors = [];
  
  if (principal <= 0) errors.push("Principal must be greater than 0");
  if (apr < 0 || apr > 100) errors.push("APR must be between 0 and 100");
  if (termMonths <= 0 || termMonths > 600) errors.push("Term must be between 1 and 600 months");
  
  return errors;
}

export function detectPredatoryFlags(apr: number, fees: number, principal: number): string[] {
  const flags = [];
  
  if (apr > 25) flags.push("Extremely high APR (>25%)");
  if (fees > principal * 0.05) flags.push("High fees (>5% of principal)");
  if (apr > 36) flags.push("Potentially predatory APR (>36%)");
  
  return flags;
}

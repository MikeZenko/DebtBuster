import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Debt, calculatePayoffTimeline, generateAmortizationSchedule } from '../lib/utils';
import { PlaidDebt } from '../services/plaidServiceSecure';
import { errorService, FinancialCalculationError } from '../services/errorService';

export interface LoanComparison {
  id: string;
  name: string;
  principal: number;
  apr: number;
  termMonths: number;
  fees: number;
  lastModified?: number;
}

export interface PayoffStrategy {
  type: 'snowball' | 'avalanche';
  extraPayment: number;
  targetMonths?: number;
}

interface CalculationCache {
  [key: string]: {
    result: any;
    timestamp: number;
    inputs: string;
  };
}

interface AppState {
  // Core data
  loans: LoanComparison[];
  debts: Debt[];
  payoffStrategy: PayoffStrategy;
  
  // Connection state
  isConnectedToBank: boolean;
  lastSyncDate: string | null;
  plaidAccountIds: string[];
  
  // UI state
  activeTab: string;
  showAmortization: { [loanId: string]: boolean };
  
  // Performance optimizations
  calculationCache: CalculationCache;
  isCalculating: boolean;
  
  // Actions with optimized selectors
  addLoan: (loan: Omit<LoanComparison, 'id'>) => void;
  updateLoan: (id: string, updates: Partial<LoanComparison>) => void;
  removeLoan: (id: string) => void;
  
  addDebt: (debt: Omit<Debt, 'id'>) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  removeDebt: (id: string) => void;
  importDebtsFromPlaid: (plaidDebts: PlaidDebt[]) => void;
  
  // Connection actions
  setConnectionStatus: (connected: boolean) => void;
  updateLastSync: () => void;
  
  // Settings actions
  setPayoffStrategy: (strategy: PayoffStrategy) => void;
  setActiveTab: (tab: string) => void;
  toggleAmortization: (loanId: string) => void;
  
  // Optimized computed values with caching
  getLoanCalculations: (loanId: string) => {
    monthlyPayment: number;
    totalInterest: number;
    totalCost: number;
    amortizationSchedule: any[];
  } | null;
  
  getPayoffTimeline: () => any[];
  getTotalDebtBalance: () => number;
  getMonthlyMinimumPayments: () => number;
  
  // Cache management
  clearCache: () => void;
  invalidateCache: (pattern?: string) => void;
}

// Create optimized store with middleware
export const useAppStoreOptimized = create<AppState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // Initial state
        loans: [
          {
            id: 'loan-1',
            name: 'Loan A',
            principal: 10000,
            apr: 6.5,
            termMonths: 36,
            fees: 0,
            lastModified: Date.now()
          },
          {
            id: 'loan-2',
            name: 'Loan B',
            principal: 10000,
            apr: 8.2,
            termMonths: 36,
            fees: 250,
            lastModified: Date.now()
          }
        ],
        
        debts: [
          {
            id: 'debt-1',
            name: 'Student Loan A',
            balance: 12300,
            apr: 5.2,
            minimumPayment: 145
          },
          {
            id: 'debt-2',
            name: 'Credit Card X',
            balance: 2980,
            apr: 24.9,
            minimumPayment: 75
          },
          {
            id: 'debt-3',
            name: 'Auto Loan',
            balance: 8560,
            apr: 7.1,
            minimumPayment: 210
          }
        ],
        
        payoffStrategy: {
          type: 'avalanche',
          extraPayment: 150
        },
        
        // Connection state
        isConnectedToBank: false,
        lastSyncDate: null,
        plaidAccountIds: [],
        
        // UI state
        activeTab: 'compare',
        showAmortization: {},
        
        // Performance state
        calculationCache: {},
        isCalculating: false,
        
        // Optimized actions with Immer
        addLoan: (loan) => {
          set((state) => {
            const id = `loan-${Date.now()}`;
            state.loans.push({ ...loan, id, lastModified: Date.now() });
            state.calculationCache = {}; // Clear cache when data changes
          });
        },
        
        updateLoan: (id, updates) => {
          set((state) => {
            const loanIndex = state.loans.findIndex(loan => loan.id === id);
            if (loanIndex !== -1) {
              Object.assign(state.loans[loanIndex], updates, { lastModified: Date.now() });
              // Clear only related cache entries
              Object.keys(state.calculationCache).forEach(key => {
                if (key.includes(id)) {
                  delete state.calculationCache[key];
                }
              });
            }
          });
        },
        
        removeLoan: (id) => {
          set((state) => {
            state.loans = state.loans.filter(loan => loan.id !== id);
            // Clear related cache
            Object.keys(state.calculationCache).forEach(key => {
              if (key.includes(id)) {
                delete state.calculationCache[key];
              }
            });
            // Clear amortization display state
            delete state.showAmortization[id];
          });
        },
        
        addDebt: (debt) => {
          set((state) => {
            const id = `debt-${Date.now()}`;
            state.debts.push({ ...debt, id });
            // Clear payoff-related cache
            Object.keys(state.calculationCache).forEach(key => {
              if (key.includes('payoff') || key.includes('timeline')) {
                delete state.calculationCache[key];
              }
            });
          });
        },
        
        updateDebt: (id, updates) => {
          set((state) => {
            const debtIndex = state.debts.findIndex(debt => debt.id === id);
            if (debtIndex !== -1) {
              Object.assign(state.debts[debtIndex], updates);
              // Clear payoff-related cache
              Object.keys(state.calculationCache).forEach(key => {
                if (key.includes('payoff') || key.includes('timeline')) {
                  delete state.calculationCache[key];
                }
              });
            }
          });
        },
        
        removeDebt: (id) => {
          set((state) => {
            state.debts = state.debts.filter(debt => debt.id !== id);
            // Clear payoff-related cache
            Object.keys(state.calculationCache).forEach(key => {
              if (key.includes('payoff') || key.includes('timeline')) {
                delete state.calculationCache[key];
              }
            });
          });
        },
        
        importDebtsFromPlaid: (plaidDebts) => {
          set((state) => {
            const newDebts = plaidDebts.map(plaidDebt => ({
              id: `plaid-${plaidDebt.account_id}`,
              name: plaidDebt.name,
              balance: plaidDebt.balance,
              apr: plaidDebt.apr || 18.0,
              minimumPayment: plaidDebt.minimum_payment || Math.max(25, plaidDebt.balance * 0.02),
              isFromPlaid: true,
              plaidAccountId: plaidDebt.account_id,
              debtType: plaidDebt.type,
            }));
            
            // Remove existing Plaid debts and add new ones
            state.debts = [
              ...state.debts.filter(debt => !debt.plaidAccountId),
              ...newDebts
            ];
            
            state.plaidAccountIds = plaidDebts.map(d => d.account_id);
            state.lastSyncDate = new Date().toISOString();
            
            // Clear all payoff-related cache
            Object.keys(state.calculationCache).forEach(key => {
              if (key.includes('payoff') || key.includes('timeline') || key.includes('balance')) {
                delete state.calculationCache[key];
              }
            });
          });
        },
        
        setConnectionStatus: (connected) => {
          set((state) => {
            state.isConnectedToBank = connected;
          });
        },
        
        updateLastSync: () => {
          set((state) => {
            state.lastSyncDate = new Date().toISOString();
          });
        },
        
        setPayoffStrategy: (strategy) => {
          set((state) => {
            state.payoffStrategy = strategy;
            // Clear payoff-related cache
            Object.keys(state.calculationCache).forEach(key => {
              if (key.includes('payoff') || key.includes('timeline')) {
                delete state.calculationCache[key];
              }
            });
          });
        },
        
        setActiveTab: (tab) => {
          set((state) => {
            state.activeTab = tab;
          });
        },
        
        toggleAmortization: (loanId) => {
          set((state) => {
            state.showAmortization[loanId] = !state.showAmortization[loanId];
          });
        },
        
        // Optimized computed values with caching
        getLoanCalculations: (loanId) => {
          const state = get();
          const loan = state.loans.find(l => l.id === loanId);
          if (!loan) return null;
          
          // Create cache key based on loan data
          const cacheKey = `loan-${loanId}-${loan.principal}-${loan.apr}-${loan.termMonths}-${loan.fees}`;
          const cached = state.calculationCache[cacheKey];
          
          // Return cached result if valid (within 5 minutes)
          if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
            return cached.result;
          }
          
          try {
            set((state) => { state.isCalculating = true; });
            
            const amortizationSchedule = generateAmortizationSchedule(
              loan.principal + loan.fees,
              loan.apr,
              loan.termMonths
            );
            
            const monthlyPayment = amortizationSchedule[0]?.payment || 0;
            const totalInterest = amortizationSchedule.reduce((sum, entry) => sum + entry.interest, 0);
            const totalCost = loan.principal + loan.fees + totalInterest;
            
            const result = {
              monthlyPayment,
              totalInterest,
              totalCost,
              amortizationSchedule
            };
            
            // Cache the result
            set((state) => {
              state.calculationCache[cacheKey] = {
                result,
                timestamp: Date.now(),
                inputs: cacheKey
              };
              state.isCalculating = false;
            });
            
            return result;
          } catch (error) {
            set((state) => { state.isCalculating = false; });
            
            errorService.handleError(
              new FinancialCalculationError('Loan calculation failed', 'loan_calculation'),
              { component: 'AppStore', action: 'getLoanCalculations' }
            );
            
            return null;
          }
        },
        
        getPayoffTimeline: () => {
          const state = get();
          const { debts, payoffStrategy } = state;
          
          if (debts.length === 0) return [];
          
          // Create cache key
          const debtSignature = debts
            .map(d => `${d.id}-${d.balance}-${d.apr}-${d.minimumPayment}`)
            .join('|');
          const cacheKey = `payoff-${payoffStrategy.type}-${payoffStrategy.extraPayment}-${debtSignature}`;
          const cached = state.calculationCache[cacheKey];
          
          // Return cached result if valid
          if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
            return cached.result;
          }
          
          try {
            set((state) => { state.isCalculating = true; });
            
            const result = calculatePayoffTimeline(debts, payoffStrategy.type, payoffStrategy.extraPayment);
            
            // Cache the result
            set((state) => {
              state.calculationCache[cacheKey] = {
                result,
                timestamp: Date.now(),
                inputs: cacheKey
              };
              state.isCalculating = false;
            });
            
            return result;
          } catch (error) {
            set((state) => { state.isCalculating = false; });
            
            errorService.handleError(
              new FinancialCalculationError('Payoff timeline calculation failed', 'payoff_calculation'),
              { component: 'AppStore', action: 'getPayoffTimeline' }
            );
            
            return [];
          }
        },
        
        getTotalDebtBalance: () => {
          const state = get();
          const cacheKey = `debt-balance-${state.debts.map(d => `${d.id}-${d.balance}`).join('|')}`;
          const cached = state.calculationCache[cacheKey];
          
          if (cached && Date.now() - cached.timestamp < 60 * 1000) { // 1 minute cache
            return cached.result;
          }
          
          const result = state.debts.reduce((sum, debt) => sum + debt.balance, 0);
          
          set((state) => {
            state.calculationCache[cacheKey] = {
              result,
              timestamp: Date.now(),
              inputs: cacheKey
            };
          });
          
          return result;
        },
        
        getMonthlyMinimumPayments: () => {
          const state = get();
          const cacheKey = `min-payments-${state.debts.map(d => `${d.id}-${d.minimumPayment}`).join('|')}`;
          const cached = state.calculationCache[cacheKey];
          
          if (cached && Date.now() - cached.timestamp < 60 * 1000) { // 1 minute cache
            return cached.result;
          }
          
          const result = state.debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
          
          set((state) => {
            state.calculationCache[cacheKey] = {
              result,
              timestamp: Date.now(),
              inputs: cacheKey
            };
          });
          
          return result;
        },
        
        // Cache management
        clearCache: () => {
          set((state) => {
            state.calculationCache = {};
          });
        },
        
        invalidateCache: (pattern) => {
          set((state) => {
            if (pattern) {
              Object.keys(state.calculationCache).forEach(key => {
                if (key.includes(pattern)) {
                  delete state.calculationCache[key];
                }
              });
            } else {
              state.calculationCache = {};
            }
          });
        }
      })),
      {
        name: 'debttruth-storage-optimized',
        partialize: (state) => ({
          loans: state.loans,
          debts: state.debts,
          payoffStrategy: state.payoffStrategy,
          showAmortization: state.showAmortization,
          isConnectedToBank: state.isConnectedToBank,
          lastSyncDate: state.lastSyncDate,
          plaidAccountIds: state.plaidAccountIds,
          activeTab: state.activeTab
          // Don't persist cache - it should be rebuilt on load
        })
      }
    )
  )
);

// Selective hooks for better performance
export const useLoans = () => useAppStoreOptimized(state => state.loans);
export const useDebts = () => useAppStoreOptimized(state => state.debts);
export const usePayoffStrategy = () => useAppStoreOptimized(state => state.payoffStrategy);
export const useConnectionStatus = () => useAppStoreOptimized(state => ({
  isConnected: state.isConnectedToBank,
  lastSync: state.lastSyncDate
}));

export const useLoanActions = () => useAppStoreOptimized(state => ({
  addLoan: state.addLoan,
  updateLoan: state.updateLoan,
  removeLoan: state.removeLoan,
  getLoanCalculations: state.getLoanCalculations
}));

export const useDebtActions = () => useAppStoreOptimized(state => ({
  addDebt: state.addDebt,
  updateDebt: state.updateDebt,
  removeDebt: state.removeDebt,
  importDebtsFromPlaid: state.importDebtsFromPlaid,
  getPayoffTimeline: state.getPayoffTimeline,
  getTotalDebtBalance: state.getTotalDebtBalance,
  getMonthlyMinimumPayments: state.getMonthlyMinimumPayments
}));

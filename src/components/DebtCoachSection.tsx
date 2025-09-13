import React, { useState } from 'react';
import { Brain, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Badge } from "./ui/badge";
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatPercent, Debt } from '../lib/utils';
import { SpendingAnalysis } from './SpendingAnalysis';
import { BankConnectionModal } from './BankConnectionModal';
import { FinancialHealthScore } from './FinancialHealthScore';
import { ExportModal } from './ExportModal';

const CHART_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export function DebtCoachSection() {
  const { 
    debts, 
    addDebt, 
    updateDebt, 
    removeDebt, 
    payoffStrategy, 
    setPayoffStrategy, 
    getPayoffTimeline,
    getTotalDebtBalance,
    getMonthlyMinimumPayments 
  } = useAppStore();

  const [newDebt, setNewDebt] = useState({
    name: '',
    balance: '',
    apr: '',
    minimumPayment: ''
  });

  const timeline = getPayoffTimeline();
  const totalBalance = getTotalDebtBalance();
  const monthlyMinimums = getMonthlyMinimumPayments();

  const handleAddDebt = () => {
    if (newDebt.name && newDebt.balance && newDebt.apr && newDebt.minimumPayment) {
      addDebt({
        name: newDebt.name,
        balance: parseFloat(newDebt.balance),
        apr: parseFloat(newDebt.apr),
        minimumPayment: parseFloat(newDebt.minimumPayment)
      });
      setNewDebt({ name: '', balance: '', apr: '', minimumPayment: '' });
    }
  };

  const handleDebtUpdate = (debtId: string, field: keyof Debt, value: string) => {
    const numValue = field === 'name' ? value : parseFloat(value) || 0;
    updateDebt(debtId, { [field]: numValue });
  };

  const handleStrategyChange = (type: 'snowball' | 'avalanche') => {
    setPayoffStrategy({ ...payoffStrategy, type });
  };

  const handleExtraPaymentChange = (extraPayment: string) => {
    setPayoffStrategy({ ...payoffStrategy, extraPayment: parseFloat(extraPayment) || 0 });
  };

  // Generate timeline chart data
  const timelineChartData = React.useMemo(() => {
    if (timeline.length === 0) return [];
    
    return timeline.slice(0, 60).map(entry => ({
      month: entry.month,
      totalBalance: entry.totalBalance,
      percentage: Math.round((1 - entry.totalBalance / totalBalance) * 100)
    }));
  }, [timeline, totalBalance]);

  // Generate debt distribution chart
  const debtDistribution = React.useMemo(() => {
    return debts.map((debt, index) => ({
      name: debt.name,
      value: debt.balance,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));
  }, [debts]);

  // Calculate payoff summary
  const payoffSummary = React.useMemo(() => {
    if (timeline.length === 0) return null;
    
    const totalMonths = timeline.length;
    const totalPaid = timeline.reduce((sum, entry) => sum + entry.monthlyPayment, 0);
    const totalInterest = totalPaid - totalBalance;
    
    return {
      totalMonths,
      totalPaid,
      totalInterest,
      monthlyPayment: monthlyMinimums + payoffStrategy.extraPayment
    };
  }, [timeline, totalBalance, monthlyMinimums, payoffStrategy.extraPayment]);

  return (
    <section id="coach" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">DebtBuster Payoff Coach</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Build a strategic plan using Snowball or Avalanche methods with real calculations.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <Card className="rounded-2xl lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" /> Your Debts
              </CardTitle>
              <CardDescription>
                Add and manage your debts with working payoff calculations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Bank Connection and Add New Debt Form */}
              <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between p-4 border border-dashed rounded-xl">
                  <div>
                    <div className="text-sm font-medium">Connect Bank Account</div>
                    <div className="text-xs text-muted-foreground">Automatically import debt accounts</div>
                  </div>
                  <BankConnectionModal />
                </div>
                
                <div className="p-4 border border-dashed rounded-xl">
                  <div className="text-sm font-medium mb-3">Add New Debt Manually</div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Input
                    placeholder="Credit Card X"
                    value={newDebt.name}
                    onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                  />
                  <Input
                    placeholder="$2,980"
                    value={newDebt.balance}
                    onChange={(e) => setNewDebt({ ...newDebt, balance: e.target.value })}
                    type="number"
                  />
                  <Input
                    placeholder="24.9%"
                    value={newDebt.apr}
                    onChange={(e) => setNewDebt({ ...newDebt, apr: e.target.value })}
                    type="number"
                    step="0.1"
                  />
                  <Input
                    placeholder="$75"
                    value={newDebt.minimumPayment}
                    onChange={(e) => setNewDebt({ ...newDebt, minimumPayment: e.target.value })}
                    type="number"
                  />
                  <Button onClick={handleAddDebt} className="col-span-2 md:col-span-1">
                    Add Debt
                  </Button>
                </div>
              </div>
              </div>

              {/* Debt List */}
              <div className="rounded-xl border overflow-hidden mb-6">
                <div className="grid grid-cols-6 text-xs uppercase tracking-wide bg-muted/60 p-3">
                  <div>Debt</div>
                  <div>Balance</div>
                  <div>APR</div>
                  <div>Min Payment</div>
                  <div>Priority</div>
                  <div>Actions</div>
                </div>
                <div className="divide-y">
                  {debts.map((debt, index) => (
                    <div key={debt.id} className="grid grid-cols-6 p-3 text-sm items-center">
                      <Input
                        value={debt.name}
                        onChange={(e) => handleDebtUpdate(debt.id, 'name', e.target.value)}
                        className="h-8"
                      />
                      <Input
                        value={debt.balance}
                        onChange={(e) => handleDebtUpdate(debt.id, 'balance', e.target.value)}
                        type="number"
                        className="h-8"
                      />
                      <div className="flex items-center gap-1">
                        <Input
                          value={debt.apr}
                          onChange={(e) => handleDebtUpdate(debt.id, 'apr', e.target.value)}
                          type="number"
                          step="0.1"
                          className="h-8"
                        />
                        {debt.apr > 20 && <AlertCircle className="h-4 w-4 text-destructive" />}
                      </div>
                      <Input
                        value={debt.minimumPayment}
                        onChange={(e) => handleDebtUpdate(debt.id, 'minimumPayment', e.target.value)}
                        type="number"
                        className="h-8"
                      />
                      <Badge variant={index < 2 ? "default" : "secondary"}>
                        {index + 1}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeDebt(debt.id)}
                        className="h-8 w-8 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategy and Timeline */}
              <div className="grid sm:grid-cols-2 gap-6">
                <Card className="rounded-xl border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base">Payoff Strategy</CardTitle>
                    <CardDescription>Choose your approach</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup 
                      value={payoffStrategy.type} 
                      onValueChange={handleStrategyChange}
                      className="grid grid-cols-1 gap-3"
                    >
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="avalanche" id="avalanche" />
                        <div className="flex-1">
                          <Label htmlFor="avalanche" className="font-medium">Avalanche (High APR First)</Label>
                          <div className="text-xs text-muted-foreground">Mathematically optimal</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="snowball" id="snowball" />
                        <div className="flex-1">
                          <Label htmlFor="snowball" className="font-medium">Snowball (Low Balance First)</Label>
                          <div className="text-xs text-muted-foreground">Motivational wins</div>
                        </div>
                      </div>
                    </RadioGroup>
                    
                    <div className="mt-4 space-y-3">
                      <div className="grid gap-2">
                        <Label>Extra Monthly Payment</Label>
                        <Input
                          value={payoffStrategy.extraPayment}
                          onChange={(e) => handleExtraPaymentChange(e.target.value)}
                          placeholder="$150"
                          type="number"
                        />
                      </div>
                      
                      {payoffSummary && (
                        <div className="text-xs space-y-1 pt-2 border-t">
                          <div className="flex justify-between">
                            <span>Total Monthly:</span>
                            <span>{formatCurrency(payoffSummary.monthlyPayment)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Payoff Time:</span>
                            <span>{payoffSummary.totalMonths} months</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Interest:</span>
                            <span>{formatCurrency(payoffSummary.totalInterest)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="rounded-xl border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base">Payoff Progress</CardTitle>
                    <CardDescription>Your debt elimination timeline</CardDescription>
                  </CardHeader>
                  <CardContent className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timelineChartData} margin={{ left: 10, right: 10 }}>
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'totalBalance' ? formatCurrency(Number(value)) : `${value}%`,
                            name === 'totalBalance' ? 'Remaining Balance' : 'Paid Off'
                          ]} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="totalBalance" 
                          strokeWidth={2} 
                          fillOpacity={0.5}
                          fill="#3b82f6"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <FinancialHealthScore />
            <SpendingAnalysis />
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" /> 
                  Debt Overview
                </CardTitle>
                <CardDescription>Current debt snapshot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
                  <div className="text-sm text-muted-foreground">Total Debt</div>
                </div>
                
                {debtDistribution.length > 0 && (
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={debtDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={20}
                          outerRadius={50}
                          dataKey="value"
                        >
                          {debtDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Monthly Minimums:</span>
                    <span>{formatCurrency(monthlyMinimums)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average APR:</span>
                    <span>
                      {debts.length > 0 
                        ? formatPercent(debts.reduce((sum, debt) => sum + debt.apr, 0) / debts.length)
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Highest APR:</span>
                    <span>
                      {debts.length > 0 
                        ? formatPercent(Math.max(...debts.map(d => d.apr)))
                        : '0%'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> 
                  Milestones
                </CardTitle>
                <CardDescription>Track your progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>First $1k paid</span>
                  <Badge variant={totalBalance < getTotalDebtBalance() - 1000 ? "default" : "secondary"}>
                    {totalBalance < getTotalDebtBalance() - 1000 ? "Complete" : "Pending"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Highest APR debt</span>
                  <Badge variant="secondary">Next target</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Debt-free date</span>
                  <Badge variant="secondary">
                    {payoffSummary ? `${payoffSummary.totalMonths} months` : 'Set strategy'}
                  </Badge>
                </div>
                <ExportModal />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

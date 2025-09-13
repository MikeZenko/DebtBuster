import React, { useState } from 'react';
import { Scale, Calculator, ShieldAlert, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, detectPredatoryFlags } from '../lib/utils';

export function LoanComparisonSection() {
  const { loans, updateLoan, addLoan, getLoanCalculations, showAmortization, toggleAmortization } = useAppStore();
  const [newLoan, setNewLoan] = useState({
    name: '',
    principal: '',
    apr: '',
    termMonths: '',
    fees: ''
  });

  const handleAddLoan = () => {
    if (newLoan.name && newLoan.principal && newLoan.apr && newLoan.termMonths) {
      addLoan({
        name: newLoan.name,
        principal: parseFloat(newLoan.principal),
        apr: parseFloat(newLoan.apr),
        termMonths: parseInt(newLoan.termMonths),
        fees: parseFloat(newLoan.fees) || 0
      });
      setNewLoan({ name: '', principal: '', apr: '', termMonths: '', fees: '' });
    }
  };

  const handleLoanUpdate = (loanId: string, field: string, value: string) => {
    const numValue = field === 'name' ? value : parseFloat(value) || 0;
    updateLoan(loanId, { [field]: numValue });
  };

  // Generate comparison chart data
  const chartData = React.useMemo(() => {
    if (loans.length < 2) return [];
    
    const calc1 = getLoanCalculations(loans[0].id);
    const calc2 = getLoanCalculations(loans[1].id);
    
    if (!calc1 || !calc2) return [];
    
    const maxMonths = Math.max(loans[0].termMonths, loans[1].termMonths);
    
    return Array.from({ length: Math.min(maxMonths, 60) }, (_, i) => {
      const month = i + 1;
      const entry1 = calc1.amortizationSchedule[i];
      const entry2 = calc2.amortizationSchedule[i];
      
      return {
        month: month.toString(),
        [loans[0].name]: entry1 ? Math.round(entry1.balance) : 0,
        [loans[1].name]: entry2 ? Math.round(entry2.balance) : 0,
      };
    });
  }, [loans, getLoanCalculations]);

  return (
    <section id="compare" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Loan Truth‑Teller</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Compare loans side‑by‑side and reveal the true cost with working calculations.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <Card className="rounded-2xl lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" /> Compare Loans
              </CardTitle>
              <CardDescription>Interactive loan comparison with real calculations.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add New Loan Form */}
              <div className="mb-6 p-4 border border-dashed rounded-xl">
                <div className="text-sm font-medium mb-3">Add New Loan</div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Input
                    placeholder="Loan name"
                    value={newLoan.name}
                    onChange={(e) => setNewLoan({ ...newLoan, name: e.target.value })}
                  />
                  <Input
                    placeholder="$10,000"
                    value={newLoan.principal}
                    onChange={(e) => setNewLoan({ ...newLoan, principal: e.target.value })}
                  />
                  <Input
                    placeholder="6.5%"
                    value={newLoan.apr}
                    onChange={(e) => setNewLoan({ ...newLoan, apr: e.target.value })}
                  />
                  <Input
                    placeholder="36 months"
                    value={newLoan.termMonths}
                    onChange={(e) => setNewLoan({ ...newLoan, termMonths: e.target.value })}
                  />
                  <Button onClick={handleAddLoan} className="col-span-2 md:col-span-1">
                    Add Loan
                  </Button>
                </div>
              </div>

              {/* Existing Loans */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {loans.slice(0, 2).map((loan) => {
                  const calc = getLoanCalculations(loan.id);
                  const flags = detectPredatoryFlags(loan.apr, loan.fees, loan.principal);
                  
                  return (
                    <div key={loan.id} className="space-y-3 p-4 border rounded-xl">
                      <div className="flex items-center justify-between">
                        <Input
                          value={loan.name}
                          onChange={(e) => handleLoanUpdate(loan.id, 'name', e.target.value)}
                          className="font-medium"
                        />
                        {flags.length > 0 && (
                          <ShieldAlert className="h-4 w-4 text-destructive ml-2" />
                        )}
                      </div>
                      
                      <div className="grid gap-2">
                        <Label>Principal</Label>
                        <Input
                          value={loan.principal}
                          onChange={(e) => handleLoanUpdate(loan.id, 'principal', e.target.value)}
                          type="number"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label>APR (%)</Label>
                        <Input
                          value={loan.apr}
                          onChange={(e) => handleLoanUpdate(loan.id, 'apr', e.target.value)}
                          type="number"
                          step="0.1"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label>Term (months)</Label>
                        <Input
                          value={loan.termMonths}
                          onChange={(e) => handleLoanUpdate(loan.id, 'termMonths', e.target.value)}
                          type="number"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label>Fees</Label>
                        <Input
                          value={loan.fees}
                          onChange={(e) => handleLoanUpdate(loan.id, 'fees', e.target.value)}
                          type="number"
                        />
                      </div>
                      
                      {calc && (
                        <div className="pt-2 text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Monthly Payment:</span>
                            <span className="font-medium">{formatCurrency(calc.monthlyPayment)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Interest:</span>
                            <span className="font-medium">{formatCurrency(calc.totalInterest)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Cost:</span>
                            <span className="font-medium">{formatCurrency(calc.totalCost)}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between py-2">
                        <div className="text-xs text-muted-foreground">Show amortization</div>
                        <Switch 
                          checked={showAmortization[loan.id] || false}
                          onCheckedChange={() => toggleAmortization(loan.id)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator className="my-6" />
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Red Flags Alert */}
                {loans.some(loan => detectPredatoryFlags(loan.apr, loan.fees, loan.principal).length > 0) && (
                  <Alert>
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Potential Red Flags</AlertTitle>
                    <AlertDescription>
                      {loans.flatMap(loan => 
                        detectPredatoryFlags(loan.apr, loan.fees, loan.principal)
                      ).join(' • ')}
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Balance Chart */}
                {chartData.length > 0 && (
                  <Card className="rounded-xl border-dashed">
                    <CardHeader>
                      <CardTitle className="text-base">Loan Balance Over Time</CardTitle>
                      <CardDescription>How your loan balances decrease</CardDescription>
                    </CardHeader>
                    <CardContent className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Balance']} />
                          <Legend />
                          {loans.slice(0, 2).map((loan, index) => (
                            <Line 
                              key={loan.id}
                              type="monotone" 
                              dataKey={loan.name} 
                              strokeWidth={2}
                              stroke={index === 0 ? '#3b82f6' : '#ef4444'}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Summary Sidebar */}
          <div className="space-y-6">
            {loans.length >= 2 && (
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" /> 
                    Comparison Summary
                  </CardTitle>
                  <CardDescription>Which loan costs less?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {loans.slice(0, 2).map((loan) => {
                    const calc = getLoanCalculations(loan.id);
                    return calc ? (
                      <div key={loan.id} className="flex justify-between">
                        <span>{loan.name} Interest:</span>
                        <span>{formatCurrency(calc.totalInterest)}</span>
                      </div>
                    ) : null;
                  })}
                  <Separator className="my-2" />
                  {(() => {
                    const calc1 = getLoanCalculations(loans[0]?.id);
                    const calc2 = getLoanCalculations(loans[1]?.id);
                    if (calc1 && calc2) {
                      const cheaperLoan = calc1.totalInterest < calc2.totalInterest ? loans[0] : loans[1];
                      const savings = Math.abs(calc1.totalInterest - calc2.totalInterest);
                      return (
                        <div className="flex justify-between font-medium">
                          <span>Better Deal:</span>
                          <span>{cheaperLoan.name} (saves {formatCurrency(savings)})</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>
            )}
            
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> 
                  Lender Questions
                </CardTitle>
                <CardDescription>Print this checklist before visiting lenders.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>• Request full APR including all fees</div>
                <div>• Ask for complete amortization schedule</div>
                <div>• Confirm no prepayment penalties</div>
                <div>• Verify rate is fixed (not variable)</div>
                <Button className="w-full mt-2">Print Checklist</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

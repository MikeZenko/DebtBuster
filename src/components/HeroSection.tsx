import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Calculator, Brain, TrendingUp, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useAppStore } from '../store/useAppStore';

const sampleInterestData = [
  { month: "0", loanA: 0, loanB: 0 },
  { month: "6", loanA: 420, loanB: 510 },
  { month: "12", loanA: 860, loanB: 980 },
  { month: "24", loanA: 1710, loanB: 1950 },
  { month: "36", loanA: 2600, loanB: 3020 },
];

const Stat = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-2xl bg-muted" aria-hidden>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  </div>
);

export function HeroSection() {
  const loans = useAppStore(state => state.loans);
  const getLoanCalculations = useAppStore(state => state.getLoanCalculations);
  
  // Generate real chart data from actual loans if available
  const chartData = React.useMemo(() => {
    if (loans.length >= 2) {
      const loan1 = loans[0];
      const loan2 = loans[1];
      const calc1 = getLoanCalculations(loan1.id);
      const calc2 = getLoanCalculations(loan2.id);
      
      if (calc1 && calc2) {
        return Array.from({ length: 5 }, (_, i) => {
          const month = i * 6;
          const progress = month / loan1.termMonths;
          return {
            month: month.toString(),
            loanA: Math.round(calc1.totalInterest * progress),
            loanB: Math.round(calc2.totalInterest * progress),
          };
        });
      }
    }
    return sampleInterestData;
  }, [loans, getLoanCalculations]);

  return (
    <section id="main" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-70 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(15,23,42,0.06),transparent_60%)]" />
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 text-xs mb-4">
              <Badge variant="outline" className="rounded-full">Debt clarity, finally.</Badge>
              <span className="text-muted-foreground">Interactive demo</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              See the <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">real cost</span>. <br className="hidden sm:block" />
              Crush your <span className="underline decoration-dotted">debt</span>.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl">
              DebtTruth Coach blends <strong>Loan Truth‑Teller</strong> (transparent loan comparisons) with <strong>DebtBuster AI</strong> (personalized payoff plans).
              It spots predatory terms, visualizes amortization, and plots a clear path to debt‑free.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#compare"><Button size="lg">Try Loan Compare</Button></a>
              <a href="#coach"><Button variant="secondary" size="lg">Open Payoff Coach</Button></a>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg">Printable Lender Checklist</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Questions to Ask Any Lender</DialogTitle>
                  </DialogHeader>
                  <ul className="grid gap-3 text-sm">
                    <li>• What is the <strong>APR</strong> including all fees? (Ask in writing.)</li>
                    <li>• Are there <strong>origination</strong>, <strong>prepayment</strong>, or <strong>late</strong> fees?</li>
                    <li>• Is the <strong>rate variable</strong>? If so, how and when can it change?</li>
                    <li>• What happens if I pay extra? Does it reduce <em>principal</em> immediately?</li>
                    <li>• Any <strong>add‑on products</strong> (warranties, insurance) bundled by default?</li>
                    <li>• Can I receive a full <strong>amortization schedule</strong> before signing?</li>
                    <li>• What is the process and cost to <strong>refinance</strong> or <strong>pay off early</strong>?</li>
                  </ul>
                  <Button className="mt-4 w-full">Print Checklist</Button>
                </DialogContent>
              </Dialog>
            </div>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
              <Stat icon={ShieldAlert} label="Predatory Flags" value="APR spikes, junk fees" />
              <Stat icon={Calculator} label="Amortization" value="Side‑by‑side" />
              <Stat icon={Brain} label="Payoff Coach" value="Snowball/Avalanche" />
              <Stat icon={TrendingUp} label="Progress" value="Charts & milestones" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5" /> 
                  Loan Interest Over Time
                </CardTitle>
                <CardDescription>
                  {loans.length >= 2 ? 'Comparing your actual loans' : 'Sample comparison data'}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="currentColor" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="currentColor" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="currentColor" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="currentColor" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [`$${value}`, name === 'loanA' ? 'Loan A' : 'Loan B']} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="loanA" 
                      strokeWidth={2} 
                      fillOpacity={0.6} 
                      fill="url(#gA)" 
                      name="Loan A"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="loanB" 
                      strokeWidth={2} 
                      fillOpacity={0.6} 
                      fill="url(#gB)" 
                      name="Loan B"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

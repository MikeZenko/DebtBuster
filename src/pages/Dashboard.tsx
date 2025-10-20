<<<<<<< Current (Your changes)

=======
import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, Calculator, Brain, TrendingUp, Users, BookOpen, ArrowRight, CreditCard, DollarSign, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { FinancialHealthScore } from '../components/FinancialHealthScore';
import { BankConnectionModal } from '../components/BankConnectionModal';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { OnboardingFlow } from '../components/OnboardingFlow';
import { formatCurrency } from '../lib/utils';

const QuickActionCard = ({ icon: Icon, title, description, href, color = "primary" }: {
  icon: any;
  title: string;
  description: string;
  href: string;
  color?: string;
}) => (
  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
    <Link to={href}>
      <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-${color}/10`}>
              <Icon className={`h-6 w-6 text-${color}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  </motion.div>
);

const StatCard = ({ icon: Icon, label, value, trend, color = "blue" }: {
  icon: any;
  label: string;
  value: string;
  trend?: { direction: 'up' | 'down'; value: string };
  color?: string;
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`h-4 w-4 ${trend.direction === 'down' ? 'rotate-180' : ''}`} />
              {trend.value}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export function Dashboard() {
  const { debts, loans, isConnectedToBank, getTotalDebtBalance, getMonthlyMinimumPayments } = useAppStore();
  const { user } = useAuthStore();
  
  const totalDebt = getTotalDebtBalance();
  const monthlyPayments = getMonthlyMinimumPayments();
  const debtCount = debts.length;
  const loanComparisons = loans.length;
  
  // Show onboarding for new users
  if (!user?.onboardingCompleted) {
    return <OnboardingFlow onComplete={() => {}} />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Financial Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Your complete debt management and financial health overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BankConnectionModal />
          {isConnectedToBank && (
            <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Bank Connected
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={CreditCard}
          label="Total Debt"
          value={formatCurrency(totalDebt)}
          trend={totalDebt > 0 ? { direction: 'down', value: '2.1% this month' } : undefined}
          color="red"
        />
        <StatCard
          icon={DollarSign}
          label="Monthly Payments"
          value={formatCurrency(monthlyPayments)}
          color="blue"
        />
        <StatCard
          icon={BarChart2}
          label="Debt Accounts"
          value={debtCount.toString()}
          color="purple"
        />
        <StatCard
          icon={Calculator}
          label="Loan Comparisons"
          value={loanComparisons.toString()}
          color="green"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <QuickActionCard
                icon={Calculator}
                title="Compare Loans"
                description="Analyze loan offers side-by-side"
                href="/loans"
              />
              <QuickActionCard
                icon={Brain}
                title="Debt Payoff Plan"
                description="Create your debt elimination strategy"
                href="/debt-coach"
              />
              <QuickActionCard
                icon={BarChart2}
                title="Financial Analytics"
                description="View spending patterns and insights"
                href="/analytics"
              />
              <QuickActionCard
                icon={BookOpen}
                title="Learn & Grow"
                description="Educational resources and guides"
                href="/education"
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
            <Card>
              <CardContent className="p-6">
                {debts.length > 0 ? (
                  <div className="space-y-4">
                    {debts.slice(0, 3).map((debt) => (
                      <div key={debt.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                        <div>
                          <p className="font-medium">{debt.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {debt.isFromPlaid ? 'Connected Account' : 'Manual Entry'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(debt.balance)}</p>
                          <p className="text-sm text-muted-foreground">{debt.apr}% APR</p>
                        </div>
                      </div>
                    ))}
                    {debts.length > 3 && (
                      <div className="text-center pt-2">
                        <Link to="/debt-coach">
                          <Button variant="ghost" size="sm">
                            View All {debts.length} Debts
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                      <Brain className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">No debts added yet</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                      Start by adding your debts or connecting your bank account to begin your debt-free journey
                    </p>
                    <Link to="/debt-coach">
                      <Button size="lg">Get Started</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Financial Health */}
        <div className="space-y-6">
          <FinancialHealthScore />
          
          {/* Getting Started */}
          {(!isConnectedToBank || debts.length === 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Complete these steps to get the most out of DebtTruth Coach</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${isConnectedToBank ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {isConnectedToBank && <CheckCircle className="h-3 w-3 text-white" />}
                  </div>
                  <span className={`text-sm ${isConnectedToBank ? 'line-through text-muted-foreground' : ''}`}>
                    Connect your bank account
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${debts.length > 0 ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {debts.length > 0 && <CheckCircle className="h-3 w-3 text-white" />}
                  </div>
                  <span className={`text-sm ${debts.length > 0 ? 'line-through text-muted-foreground' : ''}`}>
                    Add your debts
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gray-200 mt-0.5" />
                  <span className="text-sm">Create a payoff plan</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gray-200 mt-0.5" />
                  <span className="text-sm">Compare loan offers</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Community Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Community
              </CardTitle>
              <CardDescription>Connect with others on their debt-free journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="font-semibold text-green-900 mb-1">Success Story</p>
                  <p className="text-green-700">"Paid off $15k in 18 months using the avalanche method!"</p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-semibold text-blue-900 mb-1">Tip of the Day</p>
                  <p className="text-blue-700">"Consider balance transfers for high-interest credit cards"</p>
                </div>
              </div>
              <Link to="/community" className="block mt-4">
                <Button variant="outline" className="w-full">
                  Join Community
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
>>>>>>> Incoming (Background Agent changes)

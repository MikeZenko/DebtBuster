import React from 'react';
import { BarChart3, Activity, TrendingUp, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { FinancialHealthScore } from '../components/FinancialHealthScore';
import { SpendingAnalysis } from '../components/SpendingAnalysis';
import { BankConnectionModal } from '../components/BankConnectionModal';
import { useAppStore } from '../store/useAppStore';

export function Analytics() {
  const { isConnectedToBank } = useAppStore();

  return (
    <div className="space-y-8 pb-8">
      {/* Page Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
          <BarChart3 className="h-8 w-8 text-purple-600" />
        </div>
        <h1 className="text-4xl font-bold">Financial Analytics</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Understand your financial health with comprehensive analysis and personalized recommendations
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline">Health Score</Badge>
          <Badge variant="outline">Spending Analysis</Badge>
          <Badge variant="outline">Progress Tracking</Badge>
        </div>
      </div>

      {/* Bank Connection CTA */}
      {!isConnectedToBank && (
        <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
          <CardContent className="p-8 text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <h3 className="text-xl font-semibold mb-2">Unlock Advanced Analytics</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Connect your bank account to access real-time spending analysis, transaction categorization, 
              and personalized financial insights
            </p>
            <BankConnectionModal />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Bank-grade security</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Read-only access</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Real-time updates</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Data stays local</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Financial Health
            </CardTitle>
            <CardDescription>Comprehensive assessment of your financial position</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get a complete picture of your debt-to-income ratio, credit utilization, 
              and overall financial wellness with actionable recommendations.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-green-600" />
              Spending Insights
            </CardTitle>
            <CardDescription>Understand where your money goes each month</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Automatic transaction categorization helps you identify spending patterns 
              and find opportunities to increase debt payments.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Progress Tracking
            </CardTitle>
            <CardDescription>Monitor your debt payoff journey over time</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track your progress with visual charts, milestone celebrations, 
              and predictive timelines for achieving debt freedom.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Components */}
      <div className="grid lg:grid-cols-2 gap-8">
        <FinancialHealthScore />
        <SpendingAnalysis />
      </div>

      {/* Educational Section */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle>Understanding Your Financial Metrics</CardTitle>
          <CardDescription>Learn what these numbers mean and how to improve them</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Key Financial Ratios</h4>
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-sm">Debt-to-Income Ratio</h5>
                  <p className="text-sm text-muted-foreground">
                    Total monthly debt payments ÷ gross monthly income. Aim for under 36%.
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-sm">Credit Utilization</h5>
                  <p className="text-sm text-muted-foreground">
                    Total credit card balances ÷ total credit limits. Keep under 30%.
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-sm">Emergency Fund Ratio</h5>
                  <p className="text-sm text-muted-foreground">
                    Emergency savings ÷ monthly expenses. Target 3-6 months.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Improving Your Score</h4>
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-sm">Quick Wins</h5>
                  <p className="text-sm text-muted-foreground">
                    Pay down credit card balances, automate payments, review subscriptions.
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-sm">Long-term Strategy</h5>
                  <p className="text-sm text-muted-foreground">
                    Increase income, build emergency fund, diversify debt types.
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-sm">Monitoring Progress</h5>
                  <p className="text-sm text-muted-foreground">
                    Check your score monthly, track trends, celebrate improvements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





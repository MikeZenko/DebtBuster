import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, AlertTriangle, PieChart } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { plaidService } from '../services/plaidService';
import { formatCurrency } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';

const CHART_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

interface SpendingData {
  totalSpending: number;
  categorizedSpending: Record<string, number>;
  averageMonthlySpending: number;
  debtPayments: number;
}

export function SpendingAnalysis() {
  const [spendingData, setSpendingData] = useState<SpendingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isConnectedToBank, payoffStrategy } = useAppStore();

  useEffect(() => {
    if (isConnectedToBank) {
      loadSpendingData();
    }
  }, [isConnectedToBank]);

  const loadSpendingData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await plaidService.getSpendingAnalysis(3); // Last 3 months
      setSpendingData(data);
    } catch (err) {
      setError('Failed to load spending data');
      console.error('Spending analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate chart data for spending categories
  const categoryChartData = React.useMemo(() => {
    if (!spendingData) return [];
    
    return Object.entries(spendingData.categorizedSpending)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8) // Top 8 categories
      .map(([category, amount], index) => ({
        category: category.replace(/([A-Z])/g, ' $1').trim(),
        amount,
        color: CHART_COLORS[index]
      }));
  }, [spendingData]);

  // Calculate spending insights
  const insights = React.useMemo(() => {
    if (!spendingData) return [];
    
    const insights = [];
    const { totalSpending, debtPayments, averageMonthlySpending } = spendingData;
    
    // Debt payment ratio
    const debtPaymentRatio = (debtPayments / totalSpending) * 100;
    if (debtPaymentRatio < 10) {
      insights.push({
        type: 'warning',
        title: 'Low Debt Payment Ratio',
        description: `Only ${debtPaymentRatio.toFixed(1)}% of spending goes to debt payments. Consider increasing payments.`,
        icon: AlertTriangle
      });
    } else if (debtPaymentRatio > 20) {
      insights.push({
        type: 'positive',
        title: 'Strong Debt Focus',
        description: `${debtPaymentRatio.toFixed(1)}% of spending goes to debt payments. Great progress!`,
        icon: TrendingUp
      });
    }
    
    // Extra payment potential
    const extraPaymentPotential = averageMonthlySpending * 0.1; // 10% of spending
    if (extraPaymentPotential > payoffStrategy.extraPayment) {
      insights.push({
        type: 'opportunity',
        title: 'Extra Payment Opportunity',
        description: `You could potentially add ${formatCurrency(extraPaymentPotential - payoffStrategy.extraPayment)} more to debt payments.`,
        icon: DollarSign
      });
    }
    
    // High spending categories
    const topCategory = Object.entries(spendingData.categorizedSpending)[0];
    if (topCategory && topCategory[1] > totalSpending * 0.3) {
      insights.push({
        type: 'info',
        title: 'Top Spending Category',
        description: `${topCategory[0]} accounts for ${((topCategory[1] / totalSpending) * 100).toFixed(1)}% of your spending.`,
        icon: PieChart
      });
    }
    
    return insights;
  }, [spendingData, payoffStrategy.extraPayment]);

  if (!isConnectedToBank) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Spending Analysis
          </CardTitle>
          <CardDescription>Connect your bank account to see spending insights</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Analyze your spending patterns and find opportunities to increase debt payments
          </p>
          <Badge variant="secondary">Requires Bank Connection</Badge>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Loading Spending Analysis...</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !spendingData) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Spending Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Data</AlertTitle>
            <AlertDescription>
              {error || 'Unable to load spending data. Please try again.'}
            </AlertDescription>
          </Alert>
          <Button onClick={loadSpendingData} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Spending Analysis
        </CardTitle>
        <CardDescription>Last 3 months of spending patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{formatCurrency(spendingData.totalSpending)}</div>
                <div className="text-sm text-muted-foreground">Total Spending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatCurrency(spendingData.averageMonthlySpending)}</div>
                <div className="text-sm text-muted-foreground">Monthly Average</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatCurrency(spendingData.debtPayments)}</div>
                <div className="text-sm text-muted-foreground">Debt Payments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {((spendingData.debtPayments / spendingData.totalSpending) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Debt Payment Ratio</div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="categories" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="amount"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Category List */}
              <div className="space-y-2">
                {categoryChartData.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm">{category.category}</span>
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrency(category.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-4">
            {insights.length > 0 ? (
              <div className="space-y-3">
                {insights.map((insight, index) => {
                  const Icon = insight.icon;
                  return (
                    <Alert key={index} variant={insight.type === 'warning' ? 'destructive' : 'default'}>
                      <Icon className="h-4 w-4" />
                      <AlertTitle>{insight.title}</AlertTitle>
                      <AlertDescription>{insight.description}</AlertDescription>
                    </Alert>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your spending patterns look balanced!</p>
                <p className="text-sm">Keep up the good work with your debt payoff plan.</p>
              </div>
            )}
            
            <Button onClick={loadSpendingData} variant="outline" className="w-full">
              Refresh Analysis
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

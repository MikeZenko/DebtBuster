import React from 'react';
import { Activity, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { formatCurrency } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';

interface HealthScoreFactors {
  debtToIncomeRatio: number;
  creditUtilization: number;
  paymentHistory: number;
  debtDiversification: number;
  emergencyFund: number;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  impact: string;
}

export function FinancialHealthScore() {
  const { debts, getTotalDebtBalance, getMonthlyMinimumPayments, payoffStrategy } = useAppStore();

  // Calculate health score factors (mock calculations for demo)
  const calculateHealthScore = (): { score: number; factors: HealthScoreFactors; grade: string } => {
    const totalDebt = getTotalDebtBalance();
    const monthlyPayments = getMonthlyMinimumPayments();
    
    // Mock monthly income for calculation (in real app, this would come from Plaid or user input)
    const estimatedMonthlyIncome = 5000;
    
    const factors: HealthScoreFactors = {
      debtToIncomeRatio: Math.min(100, (monthlyPayments / estimatedMonthlyIncome) * 100),
      creditUtilization: Math.min(100, (totalDebt / 50000) * 100), // Assume $50k total credit limit
      paymentHistory: 85, // Mock payment history score
      debtDiversification: Math.min(100, (debts.length / 5) * 100), // Ideal: 3-5 types
      emergencyFund: 30, // Mock emergency fund coverage
    };
    
    // Weight factors differently
    const weightedScore = 
      (factors.debtToIncomeRatio * 0.3) +
      (factors.creditUtilization * 0.25) +
      (factors.paymentHistory * 0.25) +
      (factors.debtDiversification * 0.1) +
      (factors.emergencyFund * 0.1);
    
    const score = Math.max(0, 100 - weightedScore);
    
    let grade = 'F';
    if (score >= 90) grade = 'A+';
    else if (score >= 80) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 60) grade = 'C';
    else if (score >= 50) grade = 'D';
    
    return { score, factors, grade };
  };

  const generateRecommendations = (factors: HealthScoreFactors): Recommendation[] => {
    const recommendations: Recommendation[] = [];
    
    if (factors.debtToIncomeRatio > 36) {
      recommendations.push({
        priority: 'high',
        title: 'Reduce Debt-to-Income Ratio',
        description: `Your debt payments are ${factors.debtToIncomeRatio.toFixed(1)}% of income (ideal: <36%)`,
        action: `Increase extra payments by ${formatCurrency(100)} monthly`,
        impact: 'Could improve score by 15-20 points'
      });
    }
    
    if (factors.creditUtilization > 30) {
      recommendations.push({
        priority: 'high',
        title: 'Lower Credit Utilization',
        description: 'High credit card balances hurt your credit score',
        action: 'Focus on paying down credit cards first (avalanche method)',
        impact: 'Could improve score by 10-15 points'
      });
    }
    
    if (factors.emergencyFund < 75) {
      recommendations.push({
        priority: 'medium',
        title: 'Build Emergency Fund',
        description: 'Low emergency savings increase financial risk',
        action: 'Save $50-100 monthly in high-yield savings account',
        impact: 'Provides financial stability buffer'
      });
    }
    
    if (payoffStrategy.extraPayment < 200) {
      recommendations.push({
        priority: 'medium',
        title: 'Increase Debt Payments',
        description: 'Higher extra payments accelerate debt freedom',
        action: 'Review spending analysis for additional payment opportunities',
        impact: 'Could save thousands in interest'
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const { score, factors, grade } = calculateHealthScore();
  const recommendations = generateRecommendations(factors);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeBadgeVariant = (grade: string) => {
    if (grade.startsWith('A')) return 'default';
    if (grade === 'B') return 'secondary';
    return 'destructive';
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Financial Health Score
        </CardTitle>
        <CardDescription>
          Overall assessment of your financial position
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center space-y-4">
          <div className="relative">
            <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
              {score.toFixed(0)}
            </div>
            <Badge variant={getGradeBadgeVariant(grade)} className="absolute -top-2 -right-8">
              {grade}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Improvement'}
          </div>
          <Progress value={score} className="w-full" />
        </div>

        {/* Score Factors */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Key Factors</div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Debt-to-Income Ratio</span>
              <span className={factors.debtToIncomeRatio > 36 ? 'text-red-600' : 'text-green-600'}>
                {factors.debtToIncomeRatio.toFixed(1)}%
              </span>
            </div>
            <Progress value={Math.min(100, factors.debtToIncomeRatio)} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Credit Utilization</span>
              <span className={factors.creditUtilization > 30 ? 'text-red-600' : 'text-green-600'}>
                {factors.creditUtilization.toFixed(1)}%
              </span>
            </div>
            <Progress value={factors.creditUtilization} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Payment History</span>
              <span className={factors.paymentHistory < 80 ? 'text-red-600' : 'text-green-600'}>
                {factors.paymentHistory}%
              </span>
            </div>
            <Progress value={factors.paymentHistory} className="h-2" />
          </div>
        </div>

        {/* Top Recommendations */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Top Recommendations</div>
          
          {recommendations.slice(0, 2).map((rec, index) => (
            <Alert key={index} variant={rec.priority === 'high' ? 'destructive' : 'default'}>
              {rec.priority === 'high' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <AlertTitle className="flex items-center gap-2">
                {rec.title}
                <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                  {rec.priority}
                </Badge>
              </AlertTitle>
              <AlertDescription className="space-y-1">
                <div>{rec.description}</div>
                <div className="text-xs">
                  <strong>Action:</strong> {rec.action}
                </div>
                <div className="text-xs text-muted-foreground">
                  {rec.impact}
                </div>
              </AlertDescription>
            </Alert>
          ))}
          
          {recommendations.length > 2 && (
            <div className="text-center">
              <Badge variant="outline">
                +{recommendations.length - 2} more recommendations
              </Badge>
            </div>
          )}
        </div>

        {/* Progress Indicators */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>Improving</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Following debt plan
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm">
              <Activity className="h-4 w-4 text-blue-600" />
              <span>Monitored</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Updated weekly
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import React from 'react';
import { Brain, Target, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { DebtCoachSection } from '../components/DebtCoachSection';

export function DebtCoach() {
  return (
    <div className="space-y-8 pb-8">
      {/* Page Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <Brain className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold">DebtBuster Payoff Coach</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Build a strategic plan using Snowball or Avalanche methods with real calculations and progress tracking
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline">Snowball & Avalanche</Badge>
          <Badge variant="outline">Real-time Tracking</Badge>
          <Badge variant="outline">Progress Milestones</Badge>
        </div>
      </div>

      {/* Strategy Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Debt Snowball Method
            </CardTitle>
            <CardDescription>Build momentum by paying smallest debts first</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">How it works:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• List debts from smallest to largest balance</li>
                <li>• Pay minimums on all debts</li>
                <li>• Attack smallest debt with extra payments</li>
                <li>• Roll payments to next smallest debt</li>
              </ul>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <p className="text-sm font-medium text-blue-800">Best for: Motivation & quick wins</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Debt Avalanche Method
            </CardTitle>
            <CardDescription>Save money by targeting highest interest rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">How it works:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• List debts from highest to lowest APR</li>
                <li>• Pay minimums on all debts</li>
                <li>• Attack highest APR debt with extra payments</li>
                <li>• Move to next highest APR debt</li>
              </ul>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <p className="text-sm font-medium text-purple-800">Best for: Maximum interest savings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Debt Coach Tool */}
      <DebtCoachSection />

      {/* Success Tips */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tips for Debt Payoff Success
          </CardTitle>
          <CardDescription>Proven strategies to accelerate your debt-free journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Increase Income</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Take on side work or freelancing</li>
                <li>• Sell items you no longer need</li>
                <li>• Ask for a raise at work</li>
                <li>• Rent out a room or parking space</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Cut Expenses</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Review and cancel subscriptions</li>
                <li>• Cook at home more often</li>
                <li>• Find cheaper insurance rates</li>
                <li>• Use the 24-hour rule for purchases</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Stay Motivated</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Celebrate small wins and milestones</li>
                <li>• Track progress visually</li>
                <li>• Join supportive communities</li>
                <li>• Remember your "why"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}









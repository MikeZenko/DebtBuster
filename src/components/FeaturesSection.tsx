import React from 'react';
import { Scale, Brain, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">What you get</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Transparent loan comparisons × Personalized payoff plans with working calculations.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" /> 
                Loan Truth‑Teller
              </CardTitle>
              <CardDescription>
                Side‑by‑side APR, amortization, total interest, and red‑flag warnings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>• Interactive loan input with real-time calculations</div>
              <div>• Visualize true cost and payoff timeline</div>
              <div>• Automatic flags: high APR, excessive fees, predatory terms</div>
              <div>• Complete amortization schedules and comparisons</div>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" /> 
                DebtBuster Coach
              </CardTitle>
              <CardDescription>
                Snowball or Avalanche strategies with milestone tracking and progress visualization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>• Choose between Snowball (psychological) or Avalanche (mathematical) methods</div>
              <div>• Real-time progress charts and payoff timeline calculations</div>
              <div>• Milestone tracking with achievement badges</div>
              <div>• Export detailed payoff plans as PDF</div>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> 
                Community & Learning
              </CardTitle>
              <CardDescription>
                Peer support, bite‑sized lessons on loans, interest, and consumer rights.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>• Interactive financial education modules</div>
              <div>• Printable lender question checklists</div>
              <div>• Templates for loan disputes & requests</div>
              <div>• Community support and progress sharing</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle, Target, Calculator, BarChart3, Users } from 'lucide-react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { useAuthStore } from '../store/useAuthStore';

const steps = [
  {
    id: 1,
    title: "Welcome to DebtTruth Coach!",
    description: "Let's get you set up for financial success in just a few steps.",
    icon: Target,
    content: (
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <Target className="h-10 w-10 text-blue-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-2">You're taking control!</h3>
          <p className="text-muted-foreground">
            DebtTruth Coach will help you understand your debt, create a payoff plan, 
            and track your progress to financial freedom.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div className="text-center">
            <Calculator className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <p className="text-xs font-medium">Analyze</p>
          </div>
          <div className="text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-xs font-medium">Plan</p>
          </div>
          <div className="text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <p className="text-xs font-medium">Track</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: "Your Financial Goals",
    description: "What's your main motivation for tackling debt?",
    icon: Target,
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center mb-6">What drives your debt-free journey?</h3>
        <div className="grid gap-3">
          {[
            { id: 'peace', label: '🧘‍♀️ Peace of mind and less stress', popular: true },
            { id: 'house', label: '🏠 Buy a home or upgrade housing' },
            { id: 'retirement', label: '💰 Save for retirement' },
            { id: 'travel', label: '✈️ Travel and experiences' },
            { id: 'emergency', label: '🛡️ Build emergency fund' },
            { id: 'other', label: '🎯 Other financial goals' }
          ].map(goal => (
            <Card key={goal.id} className="p-4 cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/20">
              <div className="flex items-center justify-between">
                <span className="font-medium">{goal.label}</span>
                {goal.popular && <Badge variant="secondary">Most Popular</Badge>}
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 3,
    title: "Connect Your Accounts",
    description: "Link your bank accounts for automatic debt tracking (optional but recommended).",
    icon: BarChart3,
    content: (
      <div className="space-y-6">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 bg-green-100 rounded-full p-4 mx-auto mb-4 text-green-600" />
          <h3 className="text-xl font-semibold mb-2">Automatic Account Import</h3>
          <p className="text-muted-foreground">
            Connect your bank accounts to automatically import debts and track progress in real-time.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h4 className="font-semibold mb-2">✅ Why connect?</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Automatic debt import</li>
              <li>• Real-time balance updates</li>
              <li>• Spending analysis</li>
              <li>• Progress tracking</li>
            </ul>
          </Card>
          
          <Card className="p-4">
            <h4 className="font-semibold mb-2">🔒 Security</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Bank-grade encryption</li>
              <li>• Read-only access</li>
              <li>• No stored credentials</li>
              <li>• Powered by Plaid</li>
            </ul>
          </Card>
        </div>
        
        <div className="text-center space-y-3">
          <Button size="lg" className="w-full md:w-auto">
            Connect Bank Account
          </Button>
          <p className="text-sm text-muted-foreground">
            You can also add debts manually or connect accounts later
          </p>
        </div>
      </div>
    )
  },
  {
    id: 4,
    title: "You're All Set!",
    description: "Welcome to your debt-free journey. Let's explore your dashboard.",
    icon: CheckCircle,
    content: (
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-2">Welcome aboard! 🎉</h3>
          <p className="text-muted-foreground">
            You've completed the setup. Now let's start building your path to financial freedom.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <Card className="p-4 text-center">
            <Calculator className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <h4 className="font-semibold">Compare Loans</h4>
            <p className="text-xs text-muted-foreground">Find the best rates</p>
          </Card>
          
          <Card className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <h4 className="font-semibold">Debt Coach</h4>
            <p className="text-xs text-muted-foreground">Create your plan</p>
          </Card>
          
          <Card className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <h4 className="font-semibold">Community</h4>
            <p className="text-xs text-muted-foreground">Get support</p>
          </Card>
        </div>
      </div>
    )
  }
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { completeOnboarding } = useAuthStore();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    onComplete();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {currentStep + 1} of {steps.length}</span>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip setup
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
            <CardDescription className="text-lg">{currentStepData.description}</CardDescription>
          </CardHeader>
          
          <CardContent className="pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStepData.content}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            className="flex items-center gap-2"
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}





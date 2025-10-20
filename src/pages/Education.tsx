import React from 'react';
import { BookOpen, PlayCircle, FileText, Award, TrendingUp, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { EducationSection } from '../components/EducationSection';

const LessonCard = ({ icon: Icon, title, description, difficulty, duration, comingSoon = false }: {
  icon: any;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  comingSoon?: boolean;
}) => (
  <Card className={`relative ${comingSoon ? 'opacity-60' : 'hover:shadow-lg transition-shadow cursor-pointer'}`}>
    {comingSoon && (
      <Badge variant="secondary" className="absolute top-2 right-2 z-10">
        Coming Soon
      </Badge>
    )}
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-100">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {difficulty}
            </Badge>
            <span className="text-xs text-muted-foreground">{duration}</span>
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <CardDescription>{description}</CardDescription>
      {!comingSoon && (
        <Button variant="ghost" size="sm" className="mt-3 p-0">
          Start Lesson →
        </Button>
      )}
    </CardContent>
  </Card>
);

const ResourceCard = ({ icon: Icon, title, description, type }: {
  icon: any;
  title: string;
  description: string;
  type: string;
}) => (
  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-green-100">
          <Icon className="h-6 w-6 text-green-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">{title}</h3>
            <Badge variant="secondary">{type}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
          <Button variant="ghost" size="sm" className="mt-2 p-0">
            Download →
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

export function Education() {
  const lessons = [
    {
      icon: Calculator,
      title: "APR vs Interest Rate",
      description: "Learn the difference between APR and interest rates, and why APR gives you the true cost of borrowing.",
      difficulty: 'Beginner' as const,
      duration: '5 min',
    },
    {
      icon: TrendingUp,
      title: "Compound Interest Explained",
      description: "Understand how compound interest works for and against you in savings and debt.",
      difficulty: 'Beginner' as const,
      duration: '8 min',
    },
    {
      icon: Award,
      title: "Snowball vs Avalanche",
      description: "Compare debt payoff strategies and learn which method works best for your situation.",
      difficulty: 'Intermediate' as const,
      duration: '10 min',
    },
    {
      icon: FileText,
      title: "Reading Loan Documents",
      description: "Navigate complex loan paperwork and spot potential red flags before signing.",
      difficulty: 'Intermediate' as const,
      duration: '12 min',
    },
    {
      icon: TrendingUp,
      title: "Advanced Debt Strategies",
      description: "Explore refinancing, consolidation, and other advanced debt management techniques.",
      difficulty: 'Advanced' as const,
      duration: '15 min',
    },
    {
      icon: Calculator,
      title: "Investment vs Debt Payoff",
      description: "Learn when to prioritize investing over debt payoff and how to balance both goals.",
      difficulty: 'Advanced' as const,
      duration: '18 min',
    },
  ];

  const resources = [
    {
      icon: FileText,
      title: "Lender Question Checklist",
      description: "Essential questions to ask any lender before signing a loan agreement.",
      type: "PDF",
    },
    {
      icon: Calculator,
      title: "Debt Payoff Spreadsheet",
      description: "Track your progress with this customizable debt payoff calculator.",
      type: "Excel",
    },
    {
      icon: BookOpen,
      title: "Consumer Rights Guide",
      description: "Know your rights when dealing with lenders and debt collectors.",
      type: "PDF",
    },
    {
      icon: Award,
      title: "Credit Score Improvement Plan",
      description: "Step-by-step guide to improving your credit score over time.",
      type: "PDF",
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Page Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
          <BookOpen className="h-8 w-8 text-orange-600" />
        </div>
        <h1 className="text-4xl font-bold">Financial Education</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Learn by seeing - interactive lessons that make complex financial concepts click
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline">Interactive Lessons</Badge>
          <Badge variant="outline">Downloadable Resources</Badge>
          <Badge variant="outline">Expert Tips</Badge>
        </div>
      </div>

      {/* Learning Path */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Recommended Learning Path
          </CardTitle>
          <CardDescription>
            Start here if you're new to debt management and financial planning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">1</div>
              <span>APR vs Interest Rate</span>
            </div>
            <div className="w-8 h-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">2</div>
              <span>Compound Interest</span>
            </div>
            <div className="w-8 h-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">3</div>
              <span>Payoff Strategies</span>
            </div>
          </div>
          <Button className="mt-4">Start Learning Path</Button>
        </CardContent>
      </Card>

      {/* Interactive Lessons */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Interactive Lessons</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson, index) => (
            <LessonCard key={index} {...lesson} />
          ))}
        </div>
      </div>

      {/* Current Education Component */}
      <EducationSection />

      {/* Downloadable Resources */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Downloadable Resources</h2>
          <Button variant="outline">View All Resources</Button>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {resources.map((resource, index) => (
            <ResourceCard key={index} {...resource} />
          ))}
        </div>
      </div>

      {/* Financial Calculators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Financial Calculators
          </CardTitle>
          <CardDescription>
            Interactive tools to help you make informed financial decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <Calculator className="h-6 w-6 mb-2" />
              <span>Loan Calculator</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <TrendingUp className="h-6 w-6 mb-2" />
              <span>Debt Payoff Calculator</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Award className="h-6 w-6 mb-2" />
              <span>Credit Score Simulator</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





import React from 'react';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { BankConnectionModal } from "./BankConnectionModal";

export function Header() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-white focus:p-2 focus:rounded-md">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/95 border-b shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white grid place-items-center font-bold text-sm" aria-label="DebtTruth Coach logo">
              DT
            </div>
            <div>
              <div className="font-semibold text-base leading-tight">DebtTruth Coach</div>
              <div className="text-xs text-muted-foreground">Financial Freedom Platform</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium" aria-label="Primary">
            <a href="#features" className="hover:text-slate-900 text-muted-foreground transition-colors">Features</a>
            <a href="#compare" className="hover:text-slate-900 text-muted-foreground transition-colors">Loan Compare</a>
            <a href="#coach" className="hover:text-slate-900 text-muted-foreground transition-colors">Payoff Coach</a>
            <a href="#education" className="hover:text-slate-900 text-muted-foreground transition-colors">Education</a>
            <a href="#community" className="hover:text-slate-900 text-muted-foreground transition-colors">Community</a>
          </nav>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="hidden sm:flex px-3 py-1">Live Demo</Badge>
            <BankConnectionModal />
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">Get Started</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl">Create your debt payoff plan</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Start by adding your debts or comparing loan offers. Your data is stored securely and locally.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="budget">Monthly extra payment budget (optional)</Label>
                    <Input id="budget" placeholder="$300" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email for progress updates (optional)</Label>
                    <Input id="email" placeholder="you@example.com" type="email" className="h-10" />
                  </div>
                  <Button className="w-full h-11">Continue to Debt Coach</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
    </>
  );
}

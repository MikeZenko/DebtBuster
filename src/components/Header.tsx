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
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-slate-900 text-white grid place-items-center font-bold" aria-label="DebtTruth Coach logo">
              DT
            </div>
            <div>
              <div className="font-semibold leading-tight">DebtTruth Coach</div>
              <div className="text-xs text-muted-foreground -mt-0.5">Loan Truth‑Teller × DebtBuster AI</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm" aria-label="Primary">
            <a href="#features" className="hover:text-slate-900 text-muted-foreground">Features</a>
            <a href="#compare" className="hover:text-slate-900 text-muted-foreground">Loan Compare</a>
            <a href="#coach" className="hover:text-slate-900 text-muted-foreground">Payoff Coach</a>
            <a href="#education" className="hover:text-slate-900 text-muted-foreground">Education</a>
            <a href="#community" className="hover:text-slate-900 text-muted-foreground">Community</a>
          </nav>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:flex">Live Demo</Badge>
            <BankConnectionModal />
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">Get Started</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create your debt payoff plan</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Start by adding your debts or comparing loan offers. Your data is stored locally.
                  </p>
                  <div className="grid gap-3">
                    <Label htmlFor="budget">Monthly extra payment budget (optional)</Label>
                    <Input id="budget" placeholder="$300" />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="email">Email for progress updates (optional)</Label>
                    <Input id="email" placeholder="you@example.com" type="email" />
                  </div>
                  <Button className="w-full">Continue to Debt Coach</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
    </>
  );
}

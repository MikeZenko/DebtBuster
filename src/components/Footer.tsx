import React from 'react';

export function Footer() {
  return (
    <footer className="border-t py-10">
      <div className="container mx-auto px-4 grid md:grid-cols-3 gap-6 items-start">
        <div>
          <div className="font-semibold">DebtTruth Coach</div>
          <div className="text-xs text-muted-foreground">Loan Truth‑Teller × DebtBuster AI</div>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Interactive financial tool with working calculations. Your data stays local in your browser.
            Not financial advice - use for educational purposes.
          </p>
        </div>
        <div className="text-sm">
          <div className="font-medium mb-2">Tools</div>
          <ul className="space-y-1">
            <li><a href="#compare" className="hover:underline">Loan Comparison Calculator</a></li>
            <li><a href="#coach" className="hover:underline">Debt Payoff Planner</a></li>
            <li><a href="#education" className="hover:underline">Financial Education</a></li>
            <li><a href="#community" className="hover:underline">Community Support</a></li>
          </ul>
        </div>
        <div className="text-sm">
          <div className="font-medium mb-2">Resources</div>
          <ul className="space-y-1">
            <li><button className="hover:underline text-left">Printable Lender Checklist</button></li>
            <li><button className="hover:underline text-left">APR vs Interest Rate Guide</button></li>
            <li><button className="hover:underline text-left">Snowball vs Avalanche Explained</button></li>
            <li><button className="hover:underline text-left">Predatory Lending Red Flags</button></li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-8 text-xs text-muted-foreground">
        © 2025 DebtTruth Coach – Interactive Financial Education Tool
      </div>
    </footer>
  );
}

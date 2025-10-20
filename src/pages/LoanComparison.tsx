import React from 'react';
import { motion } from 'framer-motion';
import { Scale, Calculator, FileText, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { LoanComparisonSection } from '../components/LoanComparisonSection';

export function LoanComparison() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 pb-8"
    >
      {/* Page Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
          <Scale className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold">Loan Truth-Teller</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Compare loan offers side-by-side and reveal the true cost with working calculations
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline">Real APR Calculations</Badge>
          <Badge variant="outline">Amortization Schedules</Badge>
          <Badge variant="outline">Red Flag Detection</Badge>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-dashed">
          <CardContent className="p-4 text-center">
            <Calculator className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-semibold mb-1">Real Math</h3>
            <p className="text-sm text-muted-foreground">
              See actual monthly payments and total interest with precise calculations
            </p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-4 text-center">
            <TrendingDown className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <h3 className="font-semibold mb-1">Hidden Costs</h3>
            <p className="text-sm text-muted-foreground">
              Uncover fees, penalties, and other costs that inflate your loan
            </p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <h3 className="font-semibold mb-1">Export Reports</h3>
            <p className="text-sm text-muted-foreground">
              Download detailed comparisons and lender question checklists
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Comparison Tool */}
      <LoanComparisonSection />

      {/* Educational Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle>Pro Tips for Loan Shopping</CardTitle>
          <CardDescription>Expert advice to help you make informed decisions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Before You Apply</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Check your credit score first</li>
                <li>• Get quotes from 3-5 lenders</li>
                <li>• Apply within 14-45 days to minimize credit impact</li>
                <li>• Don't just look at monthly payments</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Red Flags to Avoid</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Teaser rates that jump after intro period</li>
                <li>• High origination or processing fees</li>
                <li>• Prepayment penalties</li>
                <li>• Pressure to sign immediately</li>
              </ul>
            </div>
          </div>
          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full md:w-auto">
              <FileText className="h-4 w-4 mr-2" />
              Download Lender Question Checklist
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

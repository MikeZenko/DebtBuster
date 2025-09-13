import React, { useState, useCallback } from 'react';
import { usePlaidLink, PlaidLinkOnSuccess, PlaidLinkOnEvent, PlaidLinkOnExit } from 'react-plaid-link';
import { CreditCard, Building2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { plaidService } from '../services/plaidService';
import { useAppStore } from '../store/useAppStore';

interface BankConnectionModalProps {
  onSuccess?: () => void;
}

export function BankConnectionModal({ onSuccess }: BankConnectionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(plaidService.isConnected());
  const { importDebtsFromPlaid, setConnectionStatus } = useAppStore();

  // Plaid Link configuration
  const config = {
    token: process.env.REACT_APP_PLAID_LINK_TOKEN || '', // You'll need to get this from your backend
    onSuccess: useCallback<PlaidLinkOnSuccess>((public_token, metadata) => {
      setIsLoading(true);
      setError(null);
      
      plaidService.exchangePublicToken(public_token)
        .then(async () => {
          // Import debt accounts automatically
          const debtAccounts = await plaidService.getDebtAccounts();
          importDebtsFromPlaid(debtAccounts);
          
          setIsConnected(true);
          setConnectionStatus(true);
          onSuccess?.();
        })
        .catch((err) => {
          setError('Failed to connect bank account. Please try again.');
          console.error('Plaid connection error:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, [importDebtsFromPlaid, onSuccess, setConnectionStatus]),
    
    onEvent: useCallback<PlaidLinkOnEvent>((eventName, metadata) => {
      console.log('Plaid event:', eventName, metadata);
    }, []),
    
    onExit: useCallback<PlaidLinkOnExit>((err, metadata) => {
      if (err) {
        setError('Bank connection was cancelled or failed.');
        console.error('Plaid exit error:', err);
      }
    }, []),
  };

  const { open, ready } = usePlaidLink(config);

  const handleDisconnect = () => {
    plaidService.disconnect();
    setIsConnected(false);
    setConnectionStatus(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          {isConnected ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              Bank Connected
            </>
          ) : (
            <>
              <Building2 className="h-4 w-4" />
              Connect Bank Account
            </>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Bank Account Connection
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!isConnected ? (
            <>
              {/* Connection Benefits */}
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg">Why Connect Your Bank?</CardTitle>
                  <CardDescription>Automatically import and track your debt accounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Auto-import credit cards, loans, and lines of credit</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Real-time balance updates and payment tracking</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Spending analysis and payment detection</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Bank-level security with read-only access</span>
                  </div>
                </CardContent>
              </Card>

              {/* Security Notice */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Secure & Private</AlertTitle>
                <AlertDescription>
                  We use Plaid's bank-grade security. Your login credentials are never stored, 
                  and we only access read-only financial data to help with debt management.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Connection Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Connect Button */}
              <div className="flex justify-center">
                <Button 
                  onClick={() => open()} 
                  disabled={!ready || isLoading}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Building2 className="h-4 w-4" />
                      Connect Bank Account
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Connected Status */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    Bank Account Connected
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Your debt accounts are being automatically tracked
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <Badge variant="secondary" className="mb-2">Last Sync</Badge>
                      <div className="text-sm text-muted-foreground">Just now</div>
                    </div>
                    <div className="text-center">
                      <Badge variant="secondary" className="mb-2">Status</Badge>
                      <div className="text-sm text-green-600 font-medium">Active</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="flex-1">
                      Refresh Data
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDisconnect} className="flex-1">
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Feature Preview */}
              <div className="text-center space-y-2">
                <Badge variant="secondary">✨ Premium Features Available</Badge>
                <p className="text-sm text-muted-foreground">
                  Automatic payment tracking, spending insights, and optimized payoff strategies
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}




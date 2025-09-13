import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { useAuthStoreReal } from '../store/useAuthStoreReal';

interface AuthModalRealProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'login' | 'register';
  onModeChange: (mode: 'login' | 'register') => void;
}

export function AuthModalReal({ open, onOpenChange, mode, onModeChange }: AuthModalRealProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [success, setSuccess] = useState(false);

  const { login, register, isLoading, error, clearError } = useAuthStoreReal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Client-side validation
    if (mode === 'register') {
      if (!formData.firstName.trim()) {
        return;
      }
      if (!formData.lastName.trim()) {
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        return;
      }
    }

    if (!formData.email.trim() || !formData.password) {
      return;
    }

    let success = false;
    
    if (mode === 'login') {
      success = await login({
        email: formData.email,
        password: formData.password,
      });
    } else {
      success = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
    }

    if (success) {
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
      }, 1500);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) {
      clearError();
    }
  };

  const benefits = [
    "🏦 Connect bank accounts securely",
    "📊 AI-powered debt strategies", 
    "📈 Real-time progress tracking",
    "🎯 Personalized recommendations",
    "👥 Community support network",
    "🔒 Bank-grade security"
  ];

  const passwordStrength = React.useMemo(() => {
    if (!formData.password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (formData.password.length >= 8) score++;
    if (/[a-z]/.test(formData.password)) score++;
    if (/[A-Z]/.test(formData.password)) score++;
    if (/\d/.test(formData.password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) score++;
    
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    
    return {
      score,
      label: labels[score - 1] || '',
      color: colors[score - 1] || 'bg-gray-300'
    };
  }, [formData.password]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Left side - Benefits */}
          <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 text-primary-foreground">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {mode === 'login' ? 'Welcome Back!' : 'Join DebtTruth Coach'}
                </h2>
                <p className="opacity-90">
                  {mode === 'login' 
                    ? 'Continue your journey to financial freedom'
                    : 'Start your journey to becoming debt-free'
                  }
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">What you get:</h3>
                <ul className="space-y-2">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center text-sm opacity-90">
                      <span className="mr-2">{benefit.split(' ')[0]}</span>
                      <span>{benefit.substring(benefit.indexOf(' ') + 1)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-white/20">
                <p className="text-sm opacity-75">
                  Trusted by thousands of users who have paid off over{' '}
                  <span className="font-semibold">$50M in debt</span> using our platform.
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="p-8">
            <DialogHeader className="text-center mb-6">
              <DialogTitle className="text-2xl">
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </DialogTitle>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  ✅ Real Backend
                </Badge>
                <Badge variant="outline" className="text-xs">
                  🔒 JWT Auth
                </Badge>
                <Badge variant="outline" className="text-xs">
                  🏦 Plaid Ready
                </Badge>
              </div>
            </DialogHeader>

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-700 font-medium">
                  {mode === 'login' ? 'Login successful!' : 'Account created successfully!'}
                </span>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={mode === 'login' ? 'Enter your password' : 'Create a strong password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                
                {mode === 'register' && formData.password && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Password Strength</span>
                      <span className={passwordStrength.score >= 3 ? 'text-green-600' : 'text-orange-600'}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-sm text-destructive">Passwords do not match</p>
                  )}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || (mode === 'register' && formData.password !== formData.confirmPassword)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                  </>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </Button>

              <Separator />

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                  <button
                    type="button"
                    className="ml-2 text-primary hover:underline font-medium"
                    onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
                    disabled={isLoading}
                  >
                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>

              {mode === 'register' && (
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  By creating an account, you agree to our{' '}
                  <a href="#" className="underline hover:text-primary">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="underline hover:text-primary">Privacy Policy</a>.
                  Your financial data is encrypted and secure.
                </p>
              )}
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

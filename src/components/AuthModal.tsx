import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Mail, User, Lock, CheckCircle } from 'lucide-react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { Separator } from "./ui/separator";
import { useAuthStore } from '../store/useAuthStore';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'login' | 'register';
  onModeChange: (mode: 'login' | 'register') => void;
}

export function AuthModal({ open, onOpenChange, mode, onModeChange }: AuthModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const { login, register, isLoading } = useAuthStore();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (mode === 'register') {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    let success = false;
    
    if (mode === 'login') {
      success = await login(formData.email, formData.password);
    } else {
      success = await register(formData.firstName, formData.lastName, formData.email, formData.password);
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
    } else {
      setErrors({ 
        general: mode === 'login' 
          ? 'Invalid email or password' 
          : 'Registration failed. Please try again.' 
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 gap-0">
        <div className="grid md:grid-cols-2 min-h-[600px]">
          {/* Left side - Benefits */}
          <div className="hidden md:block bg-gradient-to-br from-blue-600 to-purple-600 p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">
                  {mode === 'login' ? 'Welcome back!' : 'Join DebtTruth Coach'}
                </h2>
                <p className="text-blue-100">
                  {mode === 'login' 
                    ? 'Continue your debt-free journey' 
                    : 'Start your path to financial freedom'}
                </p>
              </div>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-2 h-2 bg-white rounded-full flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                <div className="text-sm font-medium mb-2">Trusted by 10,000+ users</div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-yellow-400 rounded-sm" />
                  ))}
                  <span className="ml-2 text-sm">4.9/5 average rating</span>
                </div>
              </div>
            </div>
            
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-20 right-10 w-32 h-32 bg-white rounded-full" />
              <div className="absolute bottom-20 left-10 w-24 h-24 bg-white rounded-full" />
            </div>
          </div>

          {/* Right side - Form */}
          <div className="p-8">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">
                  {mode === 'login' ? 'Welcome back!' : 'Account created!'}
                </h2>
                <p className="text-muted-foreground">
                  {mode === 'login' 
                    ? 'Redirecting to your dashboard...' 
                    : 'Welcome to DebtTruth Coach! Redirecting...'}
                </p>
              </motion.div>
            ) : (
              <>
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-2xl">
                    {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {errors.general && (
                    <Alert variant="destructive">
                      <AlertDescription>{errors.general}</AlertDescription>
                    </Alert>
                  )}

                  {mode === 'register' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="firstName"
                            type="text"
                            placeholder="John"
                            className="pl-10"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                          />
                        </div>
                        {errors.firstName && (
                          <p className="text-sm text-destructive mt-1">{errors.firstName}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="lastName">Last name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="lastName"
                            type="text"
                            placeholder="Doe"
                            className="pl-10"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                          />
                        </div>
                        {errors.lastName && (
                          <p className="text-sm text-destructive mt-1">{errors.lastName}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={mode === 'register' ? "At least 6 characters" : "Your password"}
                        className="pl-10 pr-10"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive mt-1">{errors.password}</p>
                    )}
                  </div>

                  {mode === 'register' && (
                    <div>
                      <Label htmlFor="confirmPassword">Confirm password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          className="pl-10"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>
                      )}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                      </>
                    ) : (
                      mode === 'login' ? 'Sign in' : 'Create account'
                    )}
                  </Button>
                </form>

                <div className="mt-6">
                  <Separator className="mb-4" />
                  <div className="text-center text-sm">
                    {mode === 'login' ? (
                      <>
                        Don't have an account?{' '}
                        <button
                          onClick={() => onModeChange('register')}
                          className="font-medium text-primary hover:underline"
                        >
                          Sign up for free
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{' '}
                        <button
                          onClick={() => onModeChange('login')}
                          className="font-medium text-primary hover:underline"
                        >
                          Sign in
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {mode === 'register' && (
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    By creating an account, you agree to our{' '}
                    <button className="underline">Terms of Service</button> and{' '}
                    <button className="underline">Privacy Policy</button>.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

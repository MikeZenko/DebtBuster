import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  CheckCircle, 
  Shield, 
  BarChart3, 
  Users, 
  Star,
  Play,
  TrendingUp,
  Calculator,
  Brain
} from 'lucide-react';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { AuthModal } from '../components/AuthModal';

const FeatureCard = ({ icon: Icon, title, description }: {
  icon: any;
  title: string;
  description: string;
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    transition={{ duration: 0.2 }}
  >
    <Card className="h-full border-2 border-transparent hover:border-primary/20 transition-all">
      <CardContent className="p-6">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

const TestimonialCard = ({ name, role, content, rating }: {
  name: string;
  role: string;
  content: string;
  rating: number;
}) => (
  <Card className="h-full">
    <CardContent className="p-6">
      <div className="flex items-center gap-1 mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-sm mb-4 italic">"{content}"</p>
      <div>
        <div className="font-semibold text-sm">{name}</div>
        <div className="text-xs text-muted-foreground">{role}</div>
      </div>
    </CardContent>
  </Card>
);

const StatCard = ({ number, label }: { number: string; label: string }) => (
  <div className="text-center">
    <div className="text-3xl md:text-4xl font-bold text-primary">{number}</div>
    <div className="text-sm text-muted-foreground mt-1">{label}</div>
  </div>
);

export function Landing() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const features = [
    {
      icon: Calculator,
      title: "Loan Truth-Teller",
      description: "Compare loan offers side-by-side with real APR calculations and red flag detection."
    },
    {
      icon: Brain,
      title: "Smart Debt Payoff",
      description: "AI-powered strategies using Snowball or Avalanche methods with real progress tracking."
    },
    {
      icon: BarChart3,
      title: "Bank Integration",
      description: "Connect your accounts via Plaid for automatic debt import and spending analysis."
    },
    {
      icon: Shield,
      title: "Financial Health Score",
      description: "Comprehensive assessment with personalized recommendations for improvement."
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      description: "Visual charts, milestone celebrations, and predictive debt-free timelines."
    },
    {
      icon: Users,
      title: "Community Support",
      description: "Connect with others on their debt-free journey for motivation and advice."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Teacher from Austin",
      content: "DebtTruth Coach helped me pay off $32,000 in 2.5 years. The avalanche method saved me thousands in interest!",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Software Engineer",
      content: "The loan comparison tool saved me $4,800 when refinancing my student loans. Amazing transparency!",
      rating: 5
    },
    {
      name: "Lisa Rodriguez",
      role: "Small Business Owner",
      content: "Finally understood my finances with the health score feature. Improved from 'Fair' to 'Excellent' in 8 months.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/95 border-b shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white grid place-items-center font-bold text-sm">
              DT
            </div>
            <div>
              <div className="font-semibold text-base leading-tight">DebtTruth Coach</div>
              <div className="text-xs text-muted-foreground">Financial Freedom Platform</div>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground">Success Stories</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</a>
          </nav>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => openAuth('login')}>
              Sign In
            </Button>
            <Button onClick={() => openAuth('register')}>
              Get Started Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-70" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="outline" className="mb-6">
                Join 10,000+ people on their debt-free journey
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                See the <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">real cost</span> of debt.
                <br />
                Build your path to <span className="underline decoration-wavy decoration-green-400">freedom</span>.
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                DebtTruth Coach combines transparent loan analysis with AI-powered payoff strategies. 
                Connect your bank accounts, get personalized recommendations, and join a community 
                of people crushing their debt together.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Button size="lg" className="text-base px-8 py-6" onClick={() => openAuth('register')}>
                  Start Your Journey Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <Button variant="outline" size="lg" className="text-base px-8 py-6">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo (2 min)
                </Button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
                <StatCard number="$2.1M+" label="Debt Eliminated" />
                <StatCard number="10,000+" label="Active Users" />
                <StatCard number="94%" label="Success Rate" />
                <StatCard number="4.9★" label="User Rating" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to become debt-free
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional-grade tools that make complex financial decisions simple and transparent.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why DebtTruth Coach works where others fail
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Real bank data, not guesswork</h3>
                    <p className="text-muted-foreground">Connect your accounts for automatic updates and accurate tracking.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">AI-powered optimization</h3>
                    <p className="text-muted-foreground">Smart recommendations based on your spending patterns and goals.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Community accountability</h3>
                    <p className="text-muted-foreground">Join thousands of others sharing wins and staying motivated.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Bank-grade security</h3>
                    <p className="text-muted-foreground">Your data stays safe with read-only access and local storage.</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-xl"
            >
              <h3 className="text-xl font-semibold mb-6">Average user saves:</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span>Interest on loans</span>
                  <span className="font-bold text-green-600">$4,200</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Time to debt-free</span>
                  <span className="font-bold text-green-600">18 months</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Stress & anxiety</span>
                  <span className="font-bold text-green-600">Priceless</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-semibold">Total value:</span>
                    <span className="font-bold text-2xl text-green-600">$8,400+</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Real stories from real people
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands who've transformed their financial lives
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <TestimonialCard {...testimonial} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Start free, upgrade when you're ready for advanced features
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Free Forever
                  <Badge variant="secondary">Most Popular</Badge>
                </CardTitle>
                <CardDescription>Perfect for getting started</CardDescription>
                <div className="text-3xl font-bold">$0<span className="text-base font-normal">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Loan comparison tool</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Basic debt payoff planning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Educational resources</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Community access</span>
                  </div>
                </div>
                <Button className="w-full" onClick={() => openAuth('register')}>
                  Start Free
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-primary shadow-lg relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary">Recommended</Badge>
              </div>
              <CardHeader>
                <CardTitle>Premium</CardTitle>
                <CardDescription>For serious debt elimination</CardDescription>
                <div className="text-3xl font-bold">$9<span className="text-base font-normal">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Everything in Free</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Bank account integration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Advanced analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Financial health score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Priority support</span>
                  </div>
                </div>
                <Button className="w-full" onClick={() => openAuth('register')}>
                  Start 14-Day Free Trial
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to take control of your financial future?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of people who've already started their debt-free journey
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8"
              onClick={() => openAuth('register')}
            >
              Get Started Free Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm mt-4 opacity-75">
              No credit card required • Free forever plan available
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white grid place-items-center font-bold text-xs">
                  DT
                </div>
                <span className="font-semibold">DebtTruth Coach</span>
              </div>
              <p className="text-sm text-slate-400">
                Professional-grade financial tools combining transparent loan analysis with AI-powered debt strategies.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><button className="hover:text-white text-left">Security</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Support</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><button className="hover:text-white text-left">Help Center</button></li>
                <li><button className="hover:text-white text-left">Contact Us</button></li>
                <li><button className="hover:text-white text-left">Status</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Company</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><button className="hover:text-white text-left">About</button></li>
                <li><button className="hover:text-white text-left">Privacy</button></li>
                <li><button className="hover:text-white text-left">Terms</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-400">
            © 2025 DebtTruth Coach. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
}

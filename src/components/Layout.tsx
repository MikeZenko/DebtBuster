
<<<<<<< Current (Your changes)
=======
const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Loan Compare', href: '/loans', icon: Calculator },
  { name: 'Debt Coach', href: '/debt-coach', icon: Brain },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Education', href: '/education', icon: BookOpen },
  { name: 'Community', href: '/community', icon: Users },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const { isConnectedToBank } = useAppStore();
  const { user, logout } = useAuthStore();

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/90 border-b shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white grid place-items-center font-bold text-sm">
              DT
            </div>
            <div className="hidden sm:block">
              <div className="font-semibold text-base leading-tight">DebtTruth Coach</div>
              <div className="text-xs text-muted-foreground">Financial Freedom Platform</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Bank Connection Status */}
            <div className="hidden sm:flex items-center gap-2">
              {isConnectedToBank ? (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Bank Connected
                </Badge>
              ) : (
                <BankConnectionModal />
              )}
            </div>

            {/* User Menu */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Hi, {user?.firstName}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Sign out
              </Button>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-white">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
              
              {/* Mobile User Actions */}
              <div className="pt-4 border-t space-y-2">
                {!isConnectedToBank && (
                  <BankConnectionModal />
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Signed in as {user?.firstName}
                  </span>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    Sign out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white grid place-items-center text-xs font-bold">
                  DT
                </div>
                <span className="font-semibold">DebtTruth Coach</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Transparent loan comparisons and personalized debt payoff plans with real bank integration.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Tools</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/loans" className="text-muted-foreground hover:text-foreground">Loan Comparison</Link></li>
                <li><Link to="/debt-coach" className="text-muted-foreground hover:text-foreground">Debt Payoff Planner</Link></li>
                <li><Link to="/analytics" className="text-muted-foreground hover:text-foreground">Financial Analytics</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Learn</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/education" className="text-muted-foreground hover:text-foreground">Educational Resources</Link></li>
                <li><Link to="/community" className="text-muted-foreground hover:text-foreground">Community Support</Link></li>
                <li><button className="text-muted-foreground hover:text-foreground text-left">Lender Checklist</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Security</h3>
              <ul className="space-y-2 text-sm">
                <li className="text-muted-foreground">Bank-grade security</li>
                <li className="text-muted-foreground">Data stays local</li>
                <li className="text-muted-foreground">Read-only access</li>
                <li className="text-muted-foreground">Privacy focused</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              © 2025 DebtTruth Coach. Educational tool - not financial advice.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Powered by Plaid</span>
              <span>•</span>
              <span>Built with React</span>
              <span>•</span>
              <span>Hosted on Vercel</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
>>>>>>> Incoming (Background Agent changes)

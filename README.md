# DebtTruth Coach

An interactive financial tool that combines **Loan Truth-Teller** (transparent loan comparisons) with **DebtBuster AI** (personalized debt payoff plans). Built with React, TypeScript, and modern UI components.

## Features

### 🏦 Loan Truth-Teller
- **Side-by-side loan comparison** with real-time calculations
- **Complete amortization schedules** and interest visualization
- **Automatic red flag detection** for predatory lending terms
- **Interactive charts** showing loan costs over time

### 🎯 DebtBuster Payoff Coach
- **Debt Snowball vs Avalanche** strategy comparison
- **Real-time payoff timeline** calculations
- **Progress tracking** with milestone achievements
- **Interactive debt management** with drag-and-drop prioritization

### 📊 **Advanced Analytics Dashboard**
- **Financial Health Score** with personalized recommendations
- **Spending Analysis** with transaction categorization
- **Real-time Progress Tracking** with connected bank accounts
- **Export & Reporting** in multiple formats (PDF, CSV, JSON)

### 🏦 **Plaid Bank Integration**
- **Automatic Debt Import** from connected accounts
- **Real-time Balance Updates** and payment tracking
- **Transaction Categorization** and spending insights
- **Bank-grade Security** with read-only access

### 📚 Financial Education
- **Interactive learning modules** about APR, compound interest, and debt strategies
- **Printable lender checklists** with questions to ask before signing
- **Consumer protection resources** and red flag identification guides

### 👥 Community Support
- **Progress sharing** and peer motivation
- **Discussion forums** for advice and success stories
- **Resource library** with templates and guides

## Key Improvements Over Original

The original was a beautiful static prototype. This enhanced version adds:

### 🏦 **Financial Data Integration**
✅ **Plaid Bank Connection**: Real bank account data import
✅ **Automatic Debt Import**: Credit cards, loans, lines of credit
✅ **Real-time Balance Updates**: Connected accounts sync automatically
✅ **Transaction Analysis**: Spending categorization and insights

### 🧮 **Advanced Calculations**
✅ **Working Financial Math**: Real loan calculations, amortization schedules
✅ **Interactive Data**: Add/edit loans and debts with live updates
✅ **Smart Optimization**: Automatic red flag detection, strategy recommendations
✅ **Progress Tracking**: Real payment detection and milestone achievements

### 📊 **Enhanced Analytics**
✅ **Financial Health Score**: Comprehensive assessment with recommendations
✅ **Spending Analysis**: Transaction categorization and budget insights
✅ **Payoff Optimization**: Advanced debt elimination strategies
✅ **Export Functionality**: PDF reports, CSV data, JSON exports

### 🛠 **Technical Excellence**
✅ **Component Architecture**: Modular, maintainable React components
✅ **Type Safety**: Full TypeScript implementation with Plaid SDK
✅ **State Management**: Zustand with localStorage persistence
✅ **Bank-Grade Security**: Read-only access with Plaid integration

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone and navigate to the project**:
   ```bash
   cd /Users/tairnarynov/Desktop/DebtB
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Open your browser** to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
```

The build folder will contain the optimized production files.

## How to Use

### Comparing Loans
1. Navigate to the **Loan Compare** section
2. Add loan details (principal, APR, term, fees)
3. View side-by-side calculations and charts
4. Look for red flag warnings about predatory terms

### Planning Debt Payoff
1. Go to the **Payoff Coach** section
2. Add your debts (name, balance, APR, minimum payment)
3. Choose Snowball (smallest balance first) or Avalanche (highest APR first)
4. Set your extra payment amount
5. View your complete payoff timeline

### Key Calculations

- **Monthly Payment**: Using standard amortization formula
- **Total Interest**: Sum of all interest payments over loan term
- **Payoff Timeline**: Month-by-month debt reduction with chosen strategy
- **Red Flags**: Automatic detection of APR >25%, fees >5% of principal, etc.

## Technology Stack

### Frontend Architecture
- **React 18** with hooks and functional components
- **TypeScript** for type safety and better development experience
- **React Router** for multi-page navigation and routing
- **Tailwind CSS** for styling with shadcn/ui components
- **Framer Motion** for smooth page transitions and animations
- **Radix UI** for accessible component primitives

### Data & State Management
- **Zustand** for lightweight state management with persistence
- **Authentication Store** for user sessions and profile management
- **Plaid SDK** for secure bank account integration
- **localStorage** for client-side data persistence
- **Recharts** for interactive data visualization

### Application Structure
- **SaaS Architecture**: Landing page + authenticated application
- **Protected Routes**: Conditional access based on user authentication
- **Multi-page application** with dedicated routes for each feature
- **Onboarding System**: Guided setup flow for new users
- **Responsive design** optimized for desktop and mobile
- **Component-based architecture** for maintainability
- **Page transitions** for smooth user experience

### Financial Features
- **Real loan calculations** with amortization schedules
- **Debt optimization algorithms** (Snowball/Avalanche)
- **Spending analysis** with transaction categorization
- **Financial health scoring** with personalized recommendations

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   ├── Header.tsx      # Navigation and branding
│   ├── HeroSection.tsx # Landing section with overview
│   ├── LoanComparisonSection.tsx # Loan calculator
│   ├── DebtCoachSection.tsx      # Debt payoff planner
│   └── ...
├── lib/
│   └── utils.ts        # Financial calculations and utilities
├── store/
│   └── useAppStore.ts  # Zustand state management
└── App.tsx             # Main component
```

## Data Privacy

- **All data stays local** - no server connections for personal information
- **Browser storage** - your loans and debts are saved in localStorage
- **No tracking** - purely educational tool with no analytics
- **Open source** - review the code to verify privacy

## Disclaimer

This tool is for **educational purposes only** and should not be considered financial advice. Always consult with qualified financial professionals for personalized guidance. Calculations are based on standard financial formulas but actual loan terms may vary.

## Contributing

This is a demonstration project, but contributions are welcome! Areas for improvement:

- [ ] Additional chart types and visualizations
- [ ] Export functionality (PDF, CSV)
- [ ] More sophisticated predatory lending detection
- [ ] Interactive financial education modules
- [ ] Accessibility improvements
- [ ] Mobile-responsive optimizations

## License

MIT License - feel free to use this code for educational purposes.

---

**DebtTruth Coach** - *See the real cost. Crush your debt.* 💪

import React, { useState } from 'react';
import { Calculator, ArrowRight, TrendingUp, Briefcase, Activity } from 'lucide-react';

export interface UserDetails {
  name: string;
  email: string;
  gender: string;
  mainRank: string;
  advRank: string;
  category: string;
  state: string;
}

interface LandingPageProps {
  onProceed: (details: UserDetails) => void;
}

const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const CATEGORIES = [
  "OPEN", "OPEN (PwD)", "EWS", "EWS (PwD)", "OBC-NCL", 
  "OBC-NCL (PwD)", "SC", "SC (PwD)", "ST", "ST (PwD)"
];

export function LandingPage({ onProceed }: LandingPageProps) {
  const [details, setDetails] = useState<UserDetails>({
    name: '',
    email: '',
    gender: 'Gender-Neutral',
    mainRank: '',
    advRank: '',
    category: 'OPEN',
    state: ''
  });

  const [errors, setErrors] = useState<Partial<UserDetails>>({});

  const validate = () => {
    const newErrors: Partial<UserDetails> = {};
    if (!details.name.trim()) newErrors.name = 'Name is required';
    if (!details.email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(details.email)) newErrors.email = 'Valid email is required';
    
    if (!details.mainRank) newErrors.mainRank = 'JEE Main Rank is required';
    else if (isNaN(Number(details.mainRank)) || Number(details.mainRank) <= 0) newErrors.mainRank = 'Valid positive rank is required';

    if (!details.state) newErrors.state = 'Domicile State is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onProceed(details);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-multiply opacity-70"></div>
      
      {/* Navbar */}
      <header className="h-20 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant flex items-center justify-between px-8 shrink-0 z-10 w-full">
        <div className="flex items-center gap-3">
          <div className="size-10 flex items-center justify-center shrink-0">
            <img src="/logo.svg" alt="JEE Toolkit Logo" className="w-[125%] h-[125%] max-w-none object-contain" />
          </div>
          <h1 className="font-extrabold text-[17px] tracking-tight text-primary">JEE TOOLKIT</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-8 py-12 flex flex-col lg:flex-row gap-12 lg:gap-24 items-center z-10">
        
        {/* Left Side: Copy & Benefits */}
        <div className="flex-1 flex flex-col items-start text-left max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Updated for 2024 / 2025 Admissions
          </div>
          
          <h2 className="text-5xl lg:text-6xl font-extrabold text-on-surface leading-[1.1] tracking-tight mb-6">
            Predict Your <span className="text-primary">Future College</span>
          </h2>
          
          <p className="text-lg text-on-surface-variant font-medium leading-relaxed mb-12 max-w-lg">
            Stop guessing. Start planning. Use our advanced algorithm to analyze cutoffs, placement records, and get expert support for your engineering journey.
          </p>

          <div className="space-y-4 w-full">
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm transition-all hover:shadow-md hover:border-outline-variant">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <h4 className="font-bold text-on-surface mb-1">Data-driven Cutoff Analysis</h4>
                <p className="text-sm text-on-surface-variant font-medium leading-relaxed">Deep dive into historical trends to predict admission chances with high accuracy.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm transition-all hover:shadow-md hover:border-outline-variant">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                <Briefcase className="size-5" />
              </div>
              <div>
                <h4 className="font-bold text-on-surface mb-1">Placement Insights</h4>
                <p className="text-sm text-on-surface-variant font-medium leading-relaxed">Compare median packages and recruiter lists to ensure a strong ROI.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm transition-all hover:shadow-md hover:border-outline-variant">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                <Activity className="size-5" />
              </div>
              <div>
                <h4 className="font-bold text-on-surface mb-1">JoSAA / CSAB Support</h4>
                <p className="text-sm text-on-surface-variant font-medium leading-relaxed">Step-by-step guidance through complex counseling processes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full max-w-[480px] bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant shadow-xl shadow-primary/5">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-on-surface mb-2 tracking-tight">Quick Eligibility Check</h3>
            <p className="text-sm text-on-surface-variant font-medium">Get instant college recommendations based on your rank. Ranks should be your category rank if applicable, otherwise CRL.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Student Name</label>
              <input 
                type="text" 
                placeholder="Enter your full name" 
                className={`w-full px-4 py-3 rounded-lg bg-surface-container-low border ${errors.name ? 'border-error focus:ring-error' : 'border-outline-variant focus:ring-primary'} focus:outline-none focus:ring-1 transition-shadow text-sm`}
                value={details.name}
                onChange={e => setDetails({...details, name: e.target.value})}
              />
              {errors.name && <p className="text-error text-xs font-medium mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Email Address</label>
              <input 
                type="email" 
                placeholder="your.email@example.com" 
                className={`w-full px-4 py-3 rounded-lg bg-surface-container-low border ${errors.email ? 'border-error focus:ring-error' : 'border-outline-variant focus:ring-primary'} focus:outline-none focus:ring-1 transition-shadow text-sm`}
                value={details.email}
                onChange={e => setDetails({...details, email: e.target.value})}
              />
              {errors.email && <p className="text-error text-xs font-medium mt-1">{errors.email}</p>}
            </div>

            {/* Ranks Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">JEE Main Rank</label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="e.g. 15420" 
                    className={`w-full pl-9 pr-4 py-3 rounded-lg bg-surface-container-low border ${errors.mainRank ? 'border-error focus:ring-error' : 'border-outline-variant focus:ring-primary'} focus:outline-none focus:ring-1 transition-shadow text-sm font-medium`}
                    value={details.mainRank}
                    onChange={e => setDetails({...details, mainRank: e.target.value})}
                  />
                  <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant opacity-60" />
                </div>
                {errors.mainRank && <p className="text-error text-xs font-medium mt-1">{errors.mainRank}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">JEE Adv Rank <span className="opacity-60 lowercase">(Optional)</span></label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="e.g. 4500" 
                    className={`w-full pl-9 pr-4 py-3 rounded-lg bg-surface-container-low border ${errors.advRank ? 'border-error focus:ring-error' : 'border-outline-variant focus:ring-primary'} focus:outline-none focus:ring-1 transition-shadow text-sm font-medium`}
                    value={details.advRank}
                    onChange={e => setDetails({...details, advRank: e.target.value})}
                  />
                  <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant opacity-60" />
                </div>
              </div>
            </div>

            {/* Dropdowns Row 1: Category & Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Category</label>
                <select 
                  className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant focus:ring-primary focus:outline-none focus:ring-1 transition-shadow text-sm font-medium appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5H7z%22%20fill%3D%22%235c3f40%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_8px_center]"
                  value={details.category}
                  onChange={e => setDetails({...details, category: e.target.value})}
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Gender</label>
                <select 
                  className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant focus:ring-primary focus:outline-none focus:ring-1 transition-shadow text-sm font-medium appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5H7z%22%20fill%3D%22%235c3f40%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_8px_center]"
                  value={details.gender}
                  onChange={e => setDetails({...details, gender: e.target.value})}
                >
                  <option value="Gender-Neutral">Gender-Neutral</option>
                  <option value="Female-only (including Supernumerary)">Female-only</option>
                </select>
              </div>
            </div>

            {/* Domicile State */}
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Home State (Domicile)</label>
              <select 
                className={`w-full px-4 py-3 rounded-lg bg-surface-container-low border ${errors.state ? 'border-error focus:ring-error' : 'border-outline-variant focus:ring-primary'} focus:outline-none focus:ring-1 transition-shadow text-sm font-medium appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5H7z%22%20fill%3D%22%235c3f40%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_8px_center]`}
                value={details.state}
                onChange={e => setDetails({...details, state: e.target.value})}
              >
                <option value="" disabled>Select State</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && <p className="text-error text-xs font-medium mt-1">{errors.state}</p>}
            </div>

            <button 
              type="submit" 
              className="w-full mt-4 py-4 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-container transition-all hover:-translate-y-[1px] flex items-center justify-center gap-2 group"
            >
              Proceed to Prediction
              <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-center text-xs text-on-surface-variant font-medium mt-4 opacity-70">
              By proceeding, you agree to our <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

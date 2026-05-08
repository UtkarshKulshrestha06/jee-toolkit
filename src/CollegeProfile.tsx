import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ArrowLeft, MapPin, Building2, Calendar, Maximize2, Trophy, Briefcase, 
  IndianRupee, TrendingUp, GraduationCap, Download
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { ChanceLevel, calculateChance, RawData } from './data';

const getChanceStyles = (chance: ChanceLevel) => {
  switch (chance) {
    case 'Very Unlikely':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' };
    case 'Unlikely':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' };
    case 'Difficult':
      return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' };
    case 'Borderline':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' };
    case 'Likely':
      return { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-100' };
    case 'Very Likely':
      return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100' };
    case 'Guaranteed':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100' };
  }
};

export function CollegeProfile({ college, rawData, userRank, onBack }: { college: any, rawData?: RawData | null, userRank?: number, onBack: () => void }) {
  // Try to find the actual entries from rawData if they exist.
  const rawDataCollege = rawData?.colleges.find(c => String(c.id) === String(college.id) || c.name === college.name);
  const collegeEntries = rawDataCollege?.entries || college.rawEntries || [];

  // Use passed college details or fallback to dummy
  const raw = college._rawInstData || {};
  
  const yearsData = [];
  if (raw.placements?.overall) {
    for (const [year, data] of Object.entries(raw.placements.overall)) {
       if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          const yLabel = year === 'Latest' ? '2024' : year;
          const avg = (data as any).average_package_lpa || 0;
          const median = (data as any).median_package_lpa || 0;
          const highest = (data as any).highest_package_lpa || 0;
          if (avg || median || highest) {
             yearsData.push({ year: yLabel, avg, median, highest });
          }
       }
    }
  }
  yearsData.sort((a, b) => a.year.localeCompare(b.year));

  const branchesPlacements = raw.placements?.branch_wise?.Latest?.map((b: any) => ({
      name: b.branch_name,
      avg: b.average_package_lpa || '-',
      median: b.median_package_lpa || '-',
      highest: b.highest_package_lpa || '-',
      percentage: (b.placement_ratio_percentage && b.placement_ratio_percentage !== 0 && b.placement_ratio_percentage !== '0') ? `${b.placement_ratio_percentage}%` : 'NA'
  })) || [];

  const profile = {
    fullName: raw.institute_name || college.name || "Unknown Institute",
    aka: raw.short_name || "Institute",
    establishmentYear: raw.establishment_year || "N/A",
    state: raw.state || "N/A",
    campusArea: raw.campus_area || "N/A",
    description: raw.description || `${college.name} is a premier engineering institution known for its rigorous academic programs and excellent placement records.`,
    highlights: raw.highlights || [
       `Excellent placement record with ${raw.placements?.overall?.Latest?.placement_ratio_percentage || 'many'}% placed`,
       `Ranked #${raw.rankings?.nirf_overall || 'Top'} among all institutions in India (NIRF)`
    ],
    stats: {
       nirfOverall: raw.rankings?.nirf_overall || '-',
       nirfEngineering: raw.rankings?.nirf_engineering || '-',
       avgPackage: raw.placements?.overall?.Latest?.average_package_lpa || '-',
       medianPackage: raw.placements?.overall?.Latest?.median_package_lpa || '-',
       highestPackage: raw.placements?.overall?.Latest?.highest_package_lpa || '-',
    },
    placements: {
      overall: { 
        avg: raw.placements?.overall?.Latest?.average_package_lpa ? `₹${raw.placements.overall.Latest.average_package_lpa} LPA` : '-', 
        median: raw.placements?.overall?.Latest?.median_package_lpa ? `₹${raw.placements.overall.Latest.median_package_lpa} LPA` : '-', 
        highest: raw.placements?.overall?.Latest?.highest_package_lpa ? `₹${raw.placements.overall.Latest.highest_package_lpa} LPA` : '-', 
        percentage: (raw.placements?.overall?.Latest?.placement_ratio_percentage && raw.placements.overall.Latest.placement_ratio_percentage !== 0 && raw.placements.overall.Latest.placement_ratio_percentage !== '0') ? `${raw.placements.overall.Latest.placement_ratio_percentage}%` : "NA"
      },
      yearsData: yearsData.length > 0 ? yearsData : [
         { year: '2024', avg: parseFloat(String(college.avgPackage).replace(/[^0-9.]/g, '')) || 12.5, highest: parseFloat(String(college.highestPackage).replace(/[^0-9.]/g, '')) || 52.8, median: parseFloat(String(college.medianPackage).replace(/[^0-9.]/g, '')) || 10.8 }
      ],
      branches: branchesPlacements
    },
    fee: {
      tuitionSemester: raw.fee_structure?.tuition_fee_per_semester ? `₹${raw.fee_structure.tuition_fee_per_semester.toLocaleString()}` : "N/A",
      overallEstimate: raw.fee_structure?.overall_rough_estimate_4_years ? `₹${(raw.fee_structure.overall_rough_estimate_4_years/100000).toFixed(1)} Lakhs (4 Years)` : "N/A"
    }
  };

  // Scroll Navigation State
  const [activeTab, setActiveTab] = useState<'overview' | 'cutoffs' | 'placements' | 'fees'>('overview');
  
  const overviewRef = useRef<HTMLDivElement>(null);
  const cutoffsRef = useRef<HTMLDivElement>(null);
  const placementsRef = useRef<HTMLDivElement>(null);
  const feesRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observerOptions = {
      root: scrollContainerRef.current,
      rootMargin: '-100px 0px -60% 0px',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target === overviewRef.current) setActiveTab('overview');
          if (entry.target === cutoffsRef.current) setActiveTab('cutoffs');
          if (entry.target === placementsRef.current) setActiveTab('placements');
          if (entry.target === feesRef.current) setActiveTab('fees');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    if (overviewRef.current) observer.observe(overviewRef.current);
    if (cutoffsRef.current) observer.observe(cutoffsRef.current);
    if (placementsRef.current) observer.observe(placementsRef.current);
    if (feesRef.current) observer.observe(feesRef.current);

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string, ref: React.RefObject<HTMLDivElement>) => {
    setActiveTab(id as any);
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  
  // Cutoffs Tab State
  // Initialize to the first branch's state if we came from Predictor, otherwise defaults
  const defaults = (college.branches && college.branches.length > 0) 
    ? { category: college.branches[0].seatType, gender: college.branches[0].gender, quota: college.branches[0].quota }
    : { category: 'OPEN', gender: 'Gender-Neutral', quota: 'OS' };

  const [cutoffFilterYear, setCutoffFilterYear] = useState('2025');
  const [cutoffSearchQuery, setCutoffSearchQuery] = useState('');
  const [cutoffCategory, setCutoffCategory] = useState(defaults.category);
  const [cutoffGender, setCutoffGender] = useState(defaults.gender);
  const [cutoffQuota, setCutoffQuota] = useState(defaults.quota);

  const filteredCutoffBranches = useMemo(() => {
    let sourceList: any[] = [];
    
    // If we have raw entries, we use our local filter state to create the branches list
    if (collegeEntries && collegeEntries.length > 0) {
      sourceList = collegeEntries
        .filter((entry: any) => 
          entry.seatType === cutoffCategory && 
          entry.quota === cutoffQuota && 
          entry.gender === cutoffGender
        )
        .map((b: any, i: number) => ({
          id: `${college.id}-${i}`,
          name: b.program,
          quota: b.quota,
          seatType: b.seatType,
          gender: b.gender,
          opening: b.openingRank,
          closing: b.closingRank,
          chance: userRank !== undefined ? calculateChance(userRank, b.openingRank, b.closingRank) : 'Unknown'
        }));
    } else {
      // Fallback for when rawEntries isn't available
      sourceList = college.branches || [];
    }

    return sourceList.filter((b: any) => 
      b.name.toLowerCase().includes(cutoffSearchQuery.toLowerCase())
    ).map((b: any) => {
      // simulate different cutoffs for previous years using dummy variations
      if (cutoffFilterYear === '2025') return b;
      const variation = cutoffFilterYear === '2024' ? 0.9 : 0.85; // Previous years had slightly tougher closing ranks (lower values)
      return {
        ...b,
        opening: Math.floor(b.opening * variation),
        closing: Math.floor(b.closing * variation),
        chance: userRank !== undefined ? calculateChance(userRank, Math.floor(b.opening * variation), Math.floor(b.closing * variation)) : b.chance
      }
    });
  }, [collegeEntries, college.branches, college.id, cutoffSearchQuery, cutoffFilterYear, cutoffCategory, cutoffGender, cutoffQuota, userRank]);

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-container-lowest overflow-hidden">
      {/* Top Header */}
      <header className="h-16 border-b border-outline-variant bg-surface-container-lowest flex items-center px-6 flex-shrink-0 gap-4 sticky top-0 z-20">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="size-4" />
          Back to Predictor
        </button>
      </header>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto w-full no-scrollbar">
        {/* Hero Section */}
        <div className="bg-surface-container w-full border-b border-outline-variant">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
            <div className="flex items-start gap-4 md:gap-6">
              <div className="size-20 md:size-24 rounded-lg bg-white p-2 flex items-center justify-center shrink-0 border border-outline-variant shadow-sm hidden sm:flex">
                 <img src={college.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex flex-wrap items-baseline gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface leading-tight">
                    {profile.fullName}
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-outline-variant bg-surface-container-lowest sticky top-0 z-10 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 md:px-6 flex gap-6 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Overview', ref: overviewRef },
              { id: 'cutoffs', label: 'Branches & Cutoffs', ref: cutoffsRef },
              { id: 'placements', label: 'Placements', ref: placementsRef },
              { id: 'fees', label: 'Fees & Structure', ref: feesRef, hidden: true }
            ].filter(t => !t.hidden).map((tab: any) => (
              <button
                key={tab.id}
                onClick={() => scrollToSection(tab.id, tab.ref)}
                className={`py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-12 md:space-y-16">
          
          <div ref={overviewRef} className="space-y-6 md:space-y-8 scroll-mt-20">
              {/* Basic Details Grid */}
              <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-outline-variant">
                  <div className="flex p-4 items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Building2 className="size-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Also Known As</p>
                      <p className="font-semibold text-on-surface text-sm">{profile.aka}</p>
                    </div>
                  </div>
                  <div className="flex p-4 items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <MapPin className="size-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">State</p>
                      <p className="font-semibold text-on-surface text-sm">{profile.state}</p>
                    </div>
                  </div>
                  <div className="flex p-4 items-center gap-4 border-t md:border-t-0 border-outline-variant">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Calendar className="size-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Est. Year</p>
                      <p className="font-semibold text-on-surface text-sm">{profile.establishmentYear}</p>
                    </div>
                  </div>
                  <div className="flex p-4 items-center gap-4 border-t md:border-t-0 border-outline-variant">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Maximize2 className="size-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Campus Area</p>
                      <p className="font-semibold text-on-surface text-sm">{profile.campusArea}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard 
                  title="NIRF Engineering" 
                  value={'#' + profile.stats.nirfEngineering} 
                  icon={<Trophy className="size-5 text-primary" />} 
                />
                <StatCard 
                  title="Average Package" 
                  value={'₹' + profile.stats.avgPackage + ' LPA'} 
                  icon={<Briefcase className="size-5 text-primary" />} 
                />
                <StatCard 
                  title="Median Package" 
                  value={'₹' + profile.stats.medianPackage + ' LPA'} 
                  icon={<IndianRupee className="size-5 text-primary" />} 
                />
                <StatCard 
                  title="Highest Package" 
                  value={'₹' + profile.stats.highestPackage + ' LPA'} 
                  icon={<TrendingUp className="size-5 text-primary" />} 
                />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* About snippet */}
                <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6">
                  <h3 className="text-lg font-bold text-on-surface mb-3">About College</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">
                    {profile.description}
                  </p>
                </div>
                
                {/* Quick Highlights */}
                <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6">
                  <h3 className="text-lg font-bold text-on-surface mb-3">Highlights</h3>
                  <ul className="space-y-3 text-sm text-on-surface-variant">
                    {profile.highlights.map((highlight: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                         <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Location Map */}
              <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden h-64 relative">
                <iframe
                  title="Google Maps"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d113941.51659918925!2d80.86591343710936!3d26.818276700000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399bfd19bc2f60a5%3A0x8ec8c3b44b806d20!2sNIT!5e0!3m2!1sen!2sin!4v1714545224300!5m2!1sen!2sin"
                  className="absolute inset-0 w-full h-full border-0"
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
          </div>

          <div ref={cutoffsRef} className="space-y-6 scroll-mt-20">
             <div>
               <h2 className="text-xl md:text-2xl font-bold text-on-surface mb-4 md:mb-6">Branches & Cutoffs</h2>
               <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 items-start sm:items-end gap-3 bg-surface-container-low p-4 border border-outline-variant rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Year</span>
                      <select 
                        value={cutoffFilterYear} 
                        onChange={(e) => setCutoffFilterYear(e.target.value)}
                        className="bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 text-sm font-semibold text-on-surface w-full outline-none focus:border-primary"
                      >
                        <option value="2025">2025 (Current)</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Category</span>
                      <select 
                        value={cutoffCategory} 
                        onChange={(e) => setCutoffCategory(e.target.value)}
                        className="bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 text-sm font-semibold text-on-surface w-full outline-none focus:border-primary"
                      >
                        <option value="OPEN">General / OPEN</option>
                        <option value="OBC-NCL">OBC-NCL</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="EWS">EWS</option>
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Gender</span>
                      <select 
                        value={cutoffGender} 
                        onChange={(e) => setCutoffGender(e.target.value)}
                        className="bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 text-sm font-semibold text-on-surface w-full outline-none focus:border-primary"
                      >
                        <option value="Gender-Neutral">Gender-Neutral</option>
                        <option value="Female-only (including Supernumerary)">Female-Only</option>
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Quota</span>
                      <select 
                        value={cutoffQuota} 
                        onChange={(e) => setCutoffQuota(e.target.value)}
                        className="bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 text-sm font-semibold text-on-surface w-full outline-none focus:border-primary"
                      >
                        <option value="OS">Outside State (OS)</option>
                        <option value="HS">Home State (HS)</option>
                      </select>
                    </div>
                    <div className="flex flex-col lg:col-span-2 xl:col-span-1">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Search Branch</span>
                      <input 
                        type="text" 
                        value={cutoffSearchQuery}
                        onChange={(e) => setCutoffSearchQuery(e.target.value)}
                        placeholder="e.g. Computer Science..."
                        className="bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 text-sm font-semibold text-on-surface w-full outline-none focus:border-primary"
                      />
                    </div>
                    <div className="bg-primary/10 px-3 py-1.5 rounded border border-primary/20 flex flex-col w-full sm:w-auto xl:col-start-6 shrink-0 h-[38px] justify-center items-center mt-2 sm:mt-0">
                       <span className="text-[12px] font-bold text-primary">Matches: {filteredCutoffBranches.length}</span>
                    </div>
               </div>

               <div className="border border-outline-variant rounded-xl overflow-hidden mt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-surface-container-low">
                          <th className="px-5 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant">Branch Name</th>
                          <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right border-b border-outline-variant">Opening Rank</th>
                          <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right border-b border-outline-variant">Closing Rank</th>
                          <th className="px-5 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant">Chance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCutoffBranches.map((branch: any, idx: number) => {
                          const cellStyle = getChanceStyles(branch.chance);
                          return (
                          <tr key={idx} className="hover:bg-surface-container-lowest transition-colors border-b border-outline-variant last:border-0 bg-white">
                            <td className="px-5 py-3 text-[13px] font-semibold text-on-surface">{branch.name}</td>
                            <td className="px-4 py-3 text-[13px] text-right tabular-nums font-medium text-slate-600">{branch.opening}</td>
                            <td className="px-4 py-3 text-[13px] text-right tabular-nums font-medium text-slate-800">{branch.closing}</td>
                            <td className={`px-4 py-3 w-36 border-l ${cellStyle.border} ${cellStyle.bg}`}>
                              <span className={`block w-full text-center text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest ${cellStyle.text}`}>
                                {branch.chance}
                              </span>
                            </td>
                          </tr>
                        )})}
                        {filteredCutoffBranches.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-5 py-8 text-center text-sm font-medium text-on-surface-variant">No branches found matching your search.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>
             </div>
          </div>

          <div ref={placementsRef} className="space-y-8 scroll-mt-20">
               <div>
                 <h2 className="text-xl md:text-2xl font-bold text-on-surface mb-4 md:mb-6">Placements</h2>
                 {/* Overall Stats */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col justify-center text-center">
                    <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Overall Placed</p>
                    <p className="text-3xl font-extrabold text-primary">{profile.placements.overall.percentage}</p>
                  </div>
                  <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col justify-center text-center">
                    <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Avg Package</p>
                    <p className="text-2xl font-bold text-on-surface">{profile.placements.overall.avg}</p>
                  </div>
                  <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col justify-center text-center">
                    <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Median Package</p>
                    <p className="text-2xl font-bold text-on-surface">{profile.placements.overall.median}</p>
                  </div>
                  <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col justify-center text-center">
                    <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Highest Package</p>
                    <p className="text-2xl font-bold text-on-surface">{profile.placements.overall.highest}</p>
                  </div>
               </div>

               {/* Graph Section */}
               {false && (
               <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-on-surface">Placement Trends (LPA)</h3>
                    <div className="flex items-center gap-4 text-xs font-semibold text-on-surface-variant">
                       <div className="flex items-center gap-1.5">
                         <div className="w-3 h-3 rounded-full bg-primary" /> Average
                       </div>
                       <div className="flex items-center gap-1.5">
                         <div className="w-3 h-3 rounded-full bg-blue-500" /> Median
                       </div>
                    </div>
                  </div>
                  <div className="h-72 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={profile.placements.yearsData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5bdbe" opacity={0.5} />
                          <XAxis dataKey="year" tick={{fontSize: 12, fill: '#5c3f40', fontWeight: 600}} axisLine={false} tickLine={false} dy={10} />
                          <YAxis tick={{fontSize: 12, fill: '#5c3f40', fontWeight: 600}} axisLine={false} tickLine={false} dx={-10} />
                          <RechartsTooltip cursor={{stroke: '#e5bdbe', strokeWidth: 1, strokeDasharray: '4 4'}} contentStyle={{borderRadius: '8px', border: '1px solid #e5bdbe', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                          <Line type="monotone" dataKey="avg" name="Average (LPA)" stroke="var(--color-primary)" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                          <Line type="monotone" dataKey="median" name="Median (LPA)" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                        </LineChart>
                     </ResponsiveContainer>
                  </div>
               </div>
               )}

               {/* Branch-wise placement table */}
               <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-lowest">
                    <h3 className="font-bold text-on-surface">Branch-wise Previous Year Placements</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-surface-container-low">
                          <th className="px-5 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant">Branch</th>
                          <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right border-b border-outline-variant">Placed %</th>
                          <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right border-b border-outline-variant">Average (LPA)</th>
                          <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right border-b border-outline-variant">Median (LPA)</th>
                          <th className="px-5 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right border-b border-outline-variant">Highest (LPA)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-primary/5 border-b border-primary/20">
                          <td className="px-5 py-3 text-[13px] font-extrabold text-primary">Overall (All Branches)</td>
                          <td className="px-4 py-3 text-[13px] font-bold text-emerald-600 text-right">{profile.placements.overall.percentage}</td>
                          <td className="px-4 py-3 text-[13px] font-bold text-primary tabular-nums text-right">{profile.placements.overall.avg}</td>
                          <td className="px-4 py-3 text-[13px] font-bold text-primary tabular-nums text-right">{profile.placements.overall.median}</td>
                          <td className="px-5 py-3 text-[13px] font-extrabold text-primary tabular-nums text-right">{profile.placements.overall.highest}</td>
                        </tr>
                        {profile.placements.branches.map((b: any, i: number) => (
                          <tr key={i} className="hover:bg-surface-container-low/50 transition-colors border-b border-outline-variant/60 last:border-0">
                            <td className="px-5 py-3 text-[13px] font-semibold text-on-surface">{b.name}</td>
                            <td className={`px-4 py-3 text-[13px] font-bold text-right ${b.percentage === 'NA' ? 'text-on-surface-variant' : 'text-emerald-600'}`}>{b.percentage === '0%' ? 'NA' : b.percentage}</td>
                            <td className="px-4 py-3 text-[13px] font-medium text-slate-700 tabular-nums text-right">₹{b.avg}</td>
                            <td className="px-4 py-3 text-[13px] font-medium text-slate-700 tabular-nums text-right">₹{b.median}</td>
                            <td className="px-5 py-3 text-[13px] font-bold text-slate-900 tabular-nums text-right">₹{b.highest}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
             </div>
          </div>

          {false && (
          <div ref={feesRef} className="space-y-6 scroll-mt-20 max-w-3xl">
             <div>
               <h2 className="text-xl md:text-2xl font-bold text-on-surface mb-4 md:mb-6">Fees & Structure</h2>
              <div className="bg-surface-container border border-outline-variant rounded-xl p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-on-surface mb-1">Estimated Overall Fees</h3>
                  <p className="text-xs md:text-sm text-on-surface-variant font-medium">For a 4-year B.Tech program (Tution + Hostel)</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xl md:text-2xl font-extrabold text-primary">{profile.fee.overallEstimate}</p>
                </div>
              </div>

              <div className="bg-white border border-outline-variant rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center">
                    <h3 className="font-bold text-on-surface">Fee Breakdown</h3>
                  </div>
                  <div className="p-0">
                    <table className="w-full text-left border-collapse">
                      <tbody>
                        <tr className="border-b border-outline-variant/50">
                          <td className="px-6 py-4 text-sm font-semibold text-on-surface">Tuition Fee (Per Semester)</td>
                          <td className="px-6 py-4 text-sm font-bold text-right tabular-nums">{profile.fee.tuitionSemester}</td>
                        </tr>
                        <tr className="border-b border-outline-variant/50">
                          <td className="px-6 py-4 text-sm font-semibold text-on-surface">Hostel Seat Rent (Per Semester)</td>
                          <td className="px-6 py-4 text-sm font-bold text-right tabular-nums">₹4,000</td>
                        </tr>
                        <tr className="border-b border-outline-variant/50">
                          <td className="px-6 py-4 text-sm font-semibold text-on-surface">Electricity & Water (Per Semester)</td>
                          <td className="px-6 py-4 text-sm font-bold text-right tabular-nums">₹3,000</td>
                        </tr>
                        <tr className="border-b border-outline-variant/50">
                          <td className="px-6 py-4 text-sm font-semibold text-on-surface">Mess Advance (Per Semester)</td>
                          <td className="px-6 py-4 text-sm font-bold text-right tabular-nums">₹20,000</td>
                        </tr>
                        <tr className="bg-surface-container-lowest">
                          <td className="px-6 py-4 text-sm font-extrabold text-on-surface">Total per Semester (Approx)</td>
                          <td className="px-6 py-4 text-sm font-extrabold text-right tabular-nums text-primary">₹89,500</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                 <h4 className="font-bold text-blue-900 mb-2 text-sm flex items-center gap-2">
                   <IndianRupee className="size-4" /> Tuition Fee Waivers
                 </h4>
                 <ul className="text-xs text-blue-800 space-y-2 list-disc pl-5">
                   <li>100% Tuition Fee waiver for SC/ST/PH students.</li>
                   <li>Full remission of the Tuition Fee for General & OBC students whose family income is less than ₹1 lakh per annum.</li>
                   <li>Remission of 2/3rd of the Tuition Fee for General & OBC students whose family income is between ₹1 lakh to ₹5 lakh per annum.</li>
                 </ul>
              </div>
            </div>
          </div>
          )}

        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className="bg-surface-container w-8 h-8 rounded shrink-0 flex items-center justify-center">
          {icon}
        </div>
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider leading-tight">
          {title}
        </p>
      </div>
      <p className="text-2xl font-extrabold text-on-surface tabular-nums truncate" title={value}>{value}</p>
    </div>
  );
}

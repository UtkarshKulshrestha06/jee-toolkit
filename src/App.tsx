import React, { useState, useEffect, useMemo } from 'react';
import { 
  PanelLeftClose, 
  Calculator, 
  Search, 
  ArrowLeftRight, 
  Briefcase, 
  Star, 
  User, 
  Bell, 
  Settings, 
  Filter,
  ChevronDown,
  Edit2,
  Check,
  X,
  Building2,
  Target
} from 'lucide-react';
import { ChanceLevel, RawData, BranchData, CollegeData, calculateChance, getInitialsSvg, matchesInstituteType, findInstituteInfo } from './data';
import { CollegeProfile } from './CollegeProfile';
import { CollegeCompare } from './CollegeCompare';
import { CutoffSearch } from './CutoffSearch';
import { Placements } from './Placements';
import { CustomDropdown } from './components/CustomDropdown';
import { useShortlist } from './ShortlistContext';
import { Shortlist } from './Shortlist';
import { LandingPage } from './LandingPage';

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

const ChanceWeights: Record<ChanceLevel, number> = {
  'Guaranteed': 6,
  'Very Likely': 5,
  'Likely': 4,
  'Borderline': 3,
  'Difficult': 2,
  'Unlikely': 1,
  'Very Unlikely': 0
};

const toSingleCollegeTypeSelection = (previous: string[], next: string[]) => {
  const newlySelected = next.filter(type => !previous.includes(type));
  if (newlySelected.length > 0) return [newlySelected[newlySelected.length - 1]];
  return next.slice(-1);
};

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [rawData, setRawData] = useState<RawData | null>(null);
  const [instituteData, setInstituteData] = useState<any[]>([]);
  const [selectedCollegeForProfile, setSelectedCollegeForProfile] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'predictor' | 'colleges' | 'cutoff-search' | 'placements' | 'shortlist'>('predictor');

  const { shortlist, addToShortlist, removeFromShortlist, isShortlisted } = useShortlist();

  // User Details State
  const initialData = useMemo(() => {
    const data = localStorage.getItem('userDetails');
    if (data) {
      try { return JSON.parse(data); } catch (e) {}
    }
    return null;
  }, []);

  const [hasLanded, setHasLanded] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>(initialData?.name || 'Student');
  const [userRank, setUserRank] = useState<number>(Number(initialData?.mainRank) || 12450);
  const [userCategory, setUserCategory] = useState<string>(initialData?.category || 'OPEN');
  const [userQuota, setUserQuota] = useState<string>('OS');
  const [userGender, setUserGender] = useState<string>(initialData?.gender || 'Gender-Neutral');

  const handleLandingProceed = (details: any) => {
    localStorage.setItem('userDetails', JSON.stringify(details));
    setUserName(details.name);
    setUserRank(Number(details.mainRank));
    setUserCategory(details.category);
    setUserGender(details.gender);
    setHasLanded(true);
  };

  useEffect(() => {
    if (hasLanded) {
      try {
        const stored = JSON.parse(localStorage.getItem('userDetails') || '{}');
        const updated = {
          ...stored,
          name: userName,
          mainRank: userRank.toString(),
          category: userCategory,
          gender: userGender
        };
        localStorage.setItem('userDetails', JSON.stringify(updated));
      } catch(e) {}
    }
  }, [userName, userRank, userCategory, userGender, hasLanded]);

  // Search/Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [collegeTypes, setCollegeTypes] = useState<string[]>([]);
  const [branchFilters, setBranchFilters] = useState<string[]>([]);
  const [minChanceFilter, setMinChanceFilter] = useState<number>(1); // Default to Unlikely (1) to Guaranteed
  const [sortBy, setSortBy] = useState<string>('cutoff_asc');

  // Editing state for UI
  const [editingField, setEditingField] = useState<string | null>(null);

  const [selectedCounselling, setSelectedCounselling] = useState<string>('JoSAA');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedRound, setSelectedRound] = useState<number>(1);

  useEffect(() => {
    const cShort = selectedCounselling === 'JoSAA' ? 'j' : 'c';
    
    // Fetch all possible types
    const typesToFetch = ['NIT', 'IIT', 'IIIT', 'GFTI'];
    
    const fetchPromises = typesToFetch.map(type => {
      const fileName = `/${selectedYear}_${cShort}_${type}_r${selectedRound}.json`;
      return fetch(fileName).then(r => r.ok ? r.json() : null).catch(() => null);
    });

    Promise.all([
      Promise.all(fetchPromises),
      fetch('/scraped_colleges.json').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/iiit_participating_institutes.json').then(r => r.ok ? r.json() : []).catch(() => [])
    ])
    .then(([typeDataArray, nitData, iiitData]) => {
        const validData = typeDataArray.filter(d => d !== null);
        if (validData.length > 0) {
          const combinedColleges = validData.flatMap(d =>
            d.colleges.map((college: any) => ({
              ...college,
              sourceId: college.id,
              id: `${d.meta?.type || college.collegeType || 'UNKNOWN'}-${college.id}`,
              collegeType: d.meta?.type || college.collegeType
            }))
          );
          setRawData({
            meta: validData[0].meta, 
            colleges: combinedColleges
        });
      } else {
        setRawData(null);
      }
      setInstituteData([...nitData, ...iiitData]);
    })
    .catch(e => {
      console.error("Failed to load data", e);
      setRawData(null);
    });
  }, [selectedCounselling, selectedYear, selectedRound]);

  const allBranches = useMemo(() => {
    if (!rawData) return [];
    const branches = new Set<string>();
    rawData.colleges.forEach(c => c.entries.forEach(e => branches.add(e.program)));
    return Array.from(branches).sort();
  }, [rawData]);

  const displayedColleges = useMemo(() => {
    if (!rawData) return [];

    let filtered = rawData.colleges.map(college => {
      if (!matchesInstituteType(college.name, collegeTypes, college.collegeType)) return null;

      let matchesCollegeName = searchQuery && college.name.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter branches for this college based on the user's category/quota/gender
      let validBranches = college.entries.filter(entry => {
        const matchQuota = (userQuota === 'AI' || userQuota === 'OS') 
          ? (entry.quota === 'AI' || entry.quota === 'OS')
          : (entry.quota === userQuota);
          
        return entry.seatType === userCategory && 
               matchQuota && 
               entry.gender === userGender;
      });

      if (searchQuery && !matchesCollegeName) {
        const q = searchQuery.toLowerCase();
        validBranches = validBranches.filter(b => b.program.toLowerCase().includes(q));
      }

      if (branchFilters.length > 0) {
          validBranches = validBranches.filter(b => branchFilters.includes(b.program));
      }

      let branches: BranchData[] = validBranches.map((b, i) => ({
        id: `${college.id}-${i}`,
        name: b.program,
        quota: b.quota,
        seatType: b.seatType,
        gender: b.gender,
        opening: b.openingRank,
        closing: b.closingRank,
        chance: calculateChance(userRank, b.openingRank, b.closingRank)
      })).filter(b => ChanceWeights[b.chance] >= minChanceFilter)
         .sort((a, b) => a.closing - b.closing);

      const instInfo = findInstituteInfo(instituteData, college.name, college.collegeType);

      return {
        id: String(college.id),
        name: college.name,
        nirfOverall: instInfo?.rankings?.nirf_overall ? `Overall #${instInfo.rankings.nirf_overall}` : '-',
        nirfEngineering: instInfo?.rankings?.nirf_engineering ? `Engineering #${instInfo.rankings.nirf_engineering}` : '-',
        logoUrl: instInfo?.media?.logo_url || getInitialsSvg(college.name),
        avgPackage: instInfo?.placements?.overall?.Latest?.average_package_lpa ? `₹${instInfo.placements.overall.Latest.average_package_lpa} LPA` : 'N/A',
        medianPackage: instInfo?.placements?.overall?.Latest?.median_package_lpa ? `₹${instInfo.placements.overall.Latest.median_package_lpa} LPA` : 'N/A',
        highestPackage: instInfo?.placements?.overall?.Latest?.highest_package_lpa ? `₹${instInfo.placements.overall.Latest.highest_package_lpa} LPA` : 'N/A',
        branches,
        rawEntries: college.entries,
        _rawInstData: instInfo // Pass to sorter
      };
    }).filter((c): c is NonNullable<typeof c> => c !== null && c.branches.length > 0);

    filtered.sort((a, b) => {
      if (sortBy === 'cutoff_asc') {
        return a.branches[0].closing - b.branches[0].closing;
      }
      if (sortBy === 'cutoff_desc') {
        return b.branches[0].closing - a.branches[0].closing;
      }
      if (sortBy === 'package_desc') {
        const pA = a._rawInstData?.placements?.overall?.Latest?.average_package_lpa || 0;
        const pB = b._rawInstData?.placements?.overall?.Latest?.average_package_lpa || 0;
        return pB - pA;
      }
      if (sortBy === 'nirf_asc') {
        const nA = a._rawInstData?.rankings?.nirf_overall || 9999;
        const nB = b._rawInstData?.rankings?.nirf_overall || 9999;
        return nA - nB;
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

    return filtered;
  }, [rawData, instituteData, userRank, userCategory, userQuota, userGender, searchQuery, branchFilters, collegeTypes, minChanceFilter, sortBy]);

  if (!hasLanded) {
    return <LandingPage onProceed={handleLandingProceed} initialData={initialData} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] overflow-hidden bg-background text-on-surface font-body-standard">
      {/* Sidebar Navigation */}
      <aside 
        className={`hidden md:flex flex-shrink-0 flex-col border-r border-outline-variant bg-surface-container-lowest transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          sidebarCollapsed ? 'w-[4.5rem]' : 'w-64'
        }`}
      >
        <div className={`py-4 border-b border-outline-variant flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-5 gap-3'}`}>
            <div className="size-8 flex items-center justify-center shrink-0">
              <img src="/logo.svg" alt="JEE Toolkit Logo" className="w-full h-full object-contain" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex flex-col justify-center mt-0.5">
                <h1 className="font-extrabold text-[17px] leading-none tracking-tight text-primary">JEE TOOLKIT</h1>
              </div>
            )}
        </div>

        <nav className={`flex-1 overflow-y-auto py-4 space-y-1 ${sidebarCollapsed ? 'px-[0.375rem]' : 'px-3'}`}>
          <button 
            onClick={() => setActiveTab('predictor')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
              activeTab === 'predictor' ? 'bg-primary-fixed text-on-primary-fixed font-semibold' : 'text-on-surface hover:bg-surface-container'
            } ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
             <Target className={`size-5 ${activeTab === 'predictor' ? 'text-primary' : ''}`} />
            {!sidebarCollapsed && <span className="text-sm">Predictor</span>}
          </button>
          <button 
            onClick={() => setActiveTab('cutoff-search')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
              activeTab === 'cutoff-search' ? 'bg-primary-fixed text-on-primary-fixed font-semibold' : 'text-on-surface hover:bg-surface-container'
            } ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
             <Search className={`size-5 ${activeTab === 'cutoff-search' ? 'text-primary' : ''}`} />
            {!sidebarCollapsed && <span className="text-sm">Cutoff Search</span>}
          </button>
          <button 
            onClick={() => setActiveTab('colleges')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
              activeTab === 'colleges' ? 'bg-primary-fixed text-on-primary-fixed font-semibold' : 'text-on-surface hover:bg-surface-container'
            } ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <Building2 className={`size-5 ${activeTab === 'colleges' ? 'text-primary' : ''}`} />
            {!sidebarCollapsed && <span className="text-sm">Colleges</span>}
          </button>
          <button 
            onClick={() => setActiveTab('placements')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
              activeTab === 'placements' ? 'bg-primary-fixed text-on-primary-fixed font-semibold' : 'text-on-surface hover:bg-surface-container'
            } ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <Briefcase className={`size-5 ${activeTab === 'placements' ? 'text-primary' : ''}`} />
            {!sidebarCollapsed && <span className="text-sm">Placements</span>}
          </button>
          <div className="px-3 pt-4 pb-2">
             {sidebarCollapsed ? <div className="h-px bg-outline-variant w-full" /> : <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Saved</p>}
          </div>
          <button 
            onClick={() => setActiveTab('shortlist')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
              activeTab === 'shortlist' ? 'bg-primary-fixed text-on-primary-fixed font-semibold' : 'text-on-surface hover:bg-surface-container'
            } ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <Star className={`size-5 ${activeTab === 'shortlist' ? 'text-primary fill-current' : ''}`} />
            {!sidebarCollapsed && <span className="text-sm">My Shortlist</span>}
          </button>
        </nav>

        <div className={`p-4 border-t border-outline-variant flex flex-col gap-3 ${sidebarCollapsed ? 'px-[0.375rem]' : 'px-4'}`}>
          <button 
            className={`flex items-center gap-3 w-full py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer ${
              sidebarCollapsed ? 'justify-center px-0' : 'px-2'
            }`}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand Menu" : "Collapse Menu"}
          >
            <PanelLeftClose className={`size-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            {!sidebarCollapsed && <span className="font-medium text-sm">Collapse Sidebar</span>}
          </button>
          <div 
            className={`mt-1 ${sidebarCollapsed ? 'flex justify-center py-2' : 'p-3 bg-surface-container-low border border-outline-variant rounded-xl cursor-pointer hover:border-primary/40 hover:bg-surface-container transition-all group shadow-sm'}`} 
            onClick={() => setHasLanded(false)}
            title={sidebarCollapsed ? "Edit Profile" : undefined}
          >
            {sidebarCollapsed ? (
              <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors">
                <span className="text-sm font-bold">{userName.charAt(0).toUpperCase()}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20 group-hover:scale-105 transition-transform">
                  <span className="text-sm font-bold">{userName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">{userName}</p>
                  <p className="text-[11px] text-primary font-medium flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity mt-0.5">
                    <Edit2 className="size-2.5" /> Edit Profile
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      {selectedCollegeForProfile ? (
        <CollegeProfile college={selectedCollegeForProfile} rawData={rawData} userRank={userRank} onBack={() => setSelectedCollegeForProfile(null)} />
      ) : activeTab === 'colleges' ? (
        <CollegeCompare rawData={rawData} instituteData={instituteData} onSelectCollege={setSelectedCollegeForProfile} />
      ) : activeTab === 'cutoff-search' ? (
        <CutoffSearch rawData={rawData} instituteData={instituteData} />
      ) : activeTab === 'placements' ? (
        <Placements rawData={rawData} instituteData={instituteData} onSelectCollege={setSelectedCollegeForProfile} />
      ) : activeTab === 'shortlist' ? (
        <Shortlist />
      ) : (
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-auto min-h-[5rem] py-3 md:py-0 md:h-20 border-b border-outline-variant bg-surface-container-lowest flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-gutter flex-shrink-0 gap-3 md:gap-4">
          <div className="flex items-center gap-4 flex-shrink-0 w-full md:w-auto justify-between md:justify-start">
            <h2 className="font-bold text-lg text-on-surface">Predictor Dashboard</h2>
            {/* Mobile Search Icon placeholder if needed */}
          </div>

          <div className="w-full md:w-auto flex-1 flex flex-col md:flex-row items-center justify-start md:justify-end gap-4 md:gap-6 overflow-hidden">
            {/* User Details Editor */}
            <div className="flex items-center gap-4 bg-surface-container-low px-4 py-2 rounded-lg border border-outline-variant w-full md:w-auto overflow-x-auto hide-scrollbar">
              {/* Rank */}
              <div 
                className="flex flex-col cursor-pointer group"
                onClick={() => setEditingField('rank')}
              >
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">AIR Rank</span>
                {editingField === 'rank' ? (
                  <input 
                    autoFocus
                    type="number" 
                    className="text-sm font-bold bg-transparent outline-none w-20 text-primary border-b border-primary" 
                    value={userRank}
                    onChange={(e) => setUserRank(Number(e.target.value) || 0)}
                    onBlur={() => setEditingField(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                  />
                ) : (
                  <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1">
                    {userRank.toLocaleString()} <Edit2 className="size-3 opacity-0 group-hover:opacity-100" />
                  </span>
                )}
              </div>

              {/* Category */}
              <div 
                className="flex flex-col cursor-pointer group"
                onClick={() => setEditingField('category')}
              >
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Category</span>
                {editingField === 'category' ? (
                  <select 
                    autoFocus
                    className="text-sm font-bold bg-surface-container outline-none border-b border-primary text-primary"
                    value={userCategory}
                    onChange={(e) => setUserCategory(e.target.value)}
                    onBlur={() => setEditingField(null)}
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="OPEN (PwD)">OPEN (PwD)</option>
                    <option value="EWS">EWS</option>
                    <option value="EWS (PwD)">EWS (PwD)</option>
                    <option value="OBC-NCL">OBC-NCL</option>
                    <option value="OBC-NCL (PwD)">OBC-NCL (PwD)</option>
                    <option value="SC">SC</option>
                    <option value="SC (PwD)">SC (PwD)</option>
                    <option value="ST">ST</option>
                    <option value="ST (PwD)">ST (PwD)</option>
                  </select>
                ) : (
                  <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1">
                    {userCategory} <Edit2 className="size-3 opacity-0 group-hover:opacity-100" />
                  </span>
                )}
              </div>

              {/* Quota */}
              <div 
                className="flex flex-col cursor-pointer group"
                onClick={() => setEditingField('quota')}
              >
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Quota</span>
                {editingField === 'quota' ? (
                  <select 
                    autoFocus
                    className="text-sm font-bold bg-surface-container outline-none border-b border-primary text-primary"
                    value={userQuota}
                    onChange={(e) => setUserQuota(e.target.value)}
                    onBlur={() => setEditingField(null)}
                  >
                    <option value="AI">AI</option>
                    <option value="HS">HS</option>
                    <option value="OS">OS</option>
                    <option value="GO">GO</option>
                    <option value="JK">JK</option>
                    <option value="LA">LA</option>
                  </select>
                ) : (
                  <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1">
                    {userQuota} <Edit2 className="size-3 opacity-0 group-hover:opacity-100" />
                  </span>
                )}
              </div>

              {/* Gender */}
              <div 
                className="flex flex-col cursor-pointer group"
                onClick={() => setEditingField('gender')}
              >
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Gender</span>
                {editingField === 'gender' ? (
                  <select 
                    autoFocus
                    className="text-sm font-bold bg-surface-container outline-none border-b border-primary text-primary max-w-[120px] truncate"
                    value={userGender}
                    onChange={(e) => setUserGender(e.target.value)}
                    onBlur={() => setEditingField(null)}
                  >
                    <option value="Gender-Neutral">Gender-Neutral</option>
                    <option value="Female-only (including Supernumerary)">Female-only</option>
                  </select>
                ) : (
                  <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1 max-w-[100px] truncate">
                    {userGender === 'Gender-Neutral' ? 'Neutral' : 'Female'} <Edit2 className="size-3 opacity-0 group-hover:opacity-100 shrink-0" />
                  </span>
                )}
              </div>
            </div>

            <div className="relative w-64 hidden xl:block shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant size-5" />
              <input 
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
                placeholder="Search colleges or branches..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Sticky Filter Bar */}
        <div className="bg-surface-container-lowest border-b border-outline-variant px-4 md:px-gutter py-3 flex flex-col gap-3 sticky top-0 z-40 flex-shrink-0 shadow-sm relative">
          {isFiltersOpen ? (
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <CustomDropdown
                  label="Type"
                  value={collegeTypes}
                  multi={true}
                  options={[
                    { value: "NIT",  label: "NITs" },
                    { value: "IIIT", label: "IIITs" },
                    { value: "IIT",  label: "IITs",  disabled: true },
                    { value: "GFTI", label: "GFTIs", disabled: true }
                  ]}
                  onChange={(next: string[]) => setCollegeTypes(previous => toSingleCollegeTypeSelection(previous, next))}
                />
                <CustomDropdown
                  label="Year"
                  value={selectedYear.toString()}
                  options={[
                    { value: "2025", label: "2025" },
                    { value: "2024", label: "2024" }
                  ]}
                  onChange={(val: string) => setSelectedYear(parseInt(val))}
                />
                <CustomDropdown
                  label="Counseling"
                  value={selectedCounselling}
                  options={[
                    { value: "JoSAA", label: "JoSAA" },
                    { value: "CSAB",  label: "CSAB" }
                  ]}
                  onChange={setSelectedCounselling}
                />
                <CustomDropdown
                  label="Round"
                  value={selectedRound.toString()}
                  options={[
                    { value: "1", label: "Round 1" },
                    { value: "2", label: "Round 2" },
                    { value: "3", label: "Round 3" },
                    { value: "4", label: "Round 4" },
                    { value: "5", label: "Round 5" },
                    { value: "6", label: "Round 6" },
                  ]}
                  onChange={(val: string) => setSelectedRound(parseInt(val))}
                />
                <CustomDropdown
                  label="Quota"
                  value={userQuota}
                  options={[
                    { value: "AI", label: "All India (AI)" },
                    { value: "HS", label: "Home State (HS)" },
                    { value: "OS", label: "Other State (OS)" },
                    { value: "GO", label: "GO" },
                    { value: "JK", label: "JK" },
                    { value: "LA", label: "LA" }
                  ]}
                  onChange={setUserQuota}
                />
                <CustomDropdown
                  label="Category"
                  value={userCategory}
                  options={[
                    { value: "OPEN",           label: "OPEN" },
                    { value: "OPEN (PwD)",     label: "OPEN (PwD)" },
                    { value: "EWS",            label: "EWS" },
                    { value: "EWS (PwD)",      label: "EWS (PwD)" },
                    { value: "OBC-NCL",        label: "OBC-NCL" },
                    { value: "OBC-NCL (PwD)",  label: "OBC-NCL (PwD)" },
                    { value: "SC",             label: "SC" },
                    { value: "SC (PwD)",       label: "SC (PwD)" },
                    { value: "ST",             label: "ST" },
                    { value: "ST (PwD)",       label: "ST (PwD)" }
                  ]}
                  onChange={setUserCategory}
                />
                <CustomDropdown
                  label="Gender"
                  value={userGender}
                  options={[
                    { value: "Gender-Neutral",                         label: "Neutral" },
                    { value: "Female-only (including Supernumerary)",  label: "Female Only" }
                  ]}
                  onChange={setUserGender}
                />
                <CustomDropdown
                  label="Branch"
                  value={branchFilters}
                  multi={true}
                  searchable={true}
                  options={allBranches.map(b => ({ value: b, label: b }))}
                  onChange={setBranchFilters}
                />
                <CustomDropdown
                  label="Min Chance"
                  value={minChanceFilter.toString()}
                  options={[
                    { value: "0", label: "All" },
                    { value: "1", label: "Unlikely+" },
                    { value: "2", label: "Difficult+" },
                    { value: "3", label: "Borderline+" },
                    { value: "4", label: "Likely+" },
                    { value: "5", label: "Very Likely+" },
                    { value: "6", label: "Guaranteed" }
                  ]}
                  onChange={(val: string) => setMinChanceFilter(Number(val))}
                />
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                <CustomDropdown
                  label="Sort:"
                  value={sortBy}
                  options={[
                    { value: "cutoff_asc",   label: "Cutoff ↑ Best" },
                    { value: "cutoff_desc",  label: "Cutoff ↓ Lowest" },
                    { value: "package_desc", label: "Highest Package" },
                    { value: "nirf_asc",     label: "Best NIRF" },
                    { value: "name_asc",     label: "Name A–Z" },
                    { value: "name_desc",    label: "Name Z–A" }
                  ]}
                  onChange={setSortBy}
                />
                <div className="h-5 w-px bg-outline-variant hidden sm:block"></div>
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest text-right shrink-0">
                  <span className="text-[#982b35] text-base md:text-lg tabular-nums font-extrabold">{displayedColleges.reduce((acc, c) => acc + c.branches.length, 0)}</span> matches
                </p>
                <button 
                  onClick={() => setIsFiltersOpen(false)} 
                  className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-md transition-colors"
                  title="Hide Filters"
                >
                  <Filter className="size-5" /> 
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 min-h-[38px]">
              <div className="text-xs font-medium text-on-surface-variant truncate flex-1">
                {`${collegeTypes.length ? collegeTypes.join(', ') : 'All Types'} • ${selectedYear} ${selectedCounselling} R${selectedRound} • ${userCategory} • ${userQuota} • ${userGender === 'Gender-Neutral' ? 'Neutral' : 'Female'} • Min Chance: ${minChanceFilter > 0 ? Object.keys(ChanceWeights).find(k => ChanceWeights[k as ChanceLevel] === minChanceFilter) : 'All'} • ${branchFilters.length ? branchFilters.length + ' branches' : 'All branches'}`}
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                <CustomDropdown
                  label="Sort:"
                  value={sortBy}
                  options={[
                    { value: "cutoff_asc",   label: "Cutoff ↑ Best" },
                    { value: "cutoff_desc",  label: "Cutoff ↓ Lowest" },
                    { value: "package_desc", label: "Highest Package" },
                    { value: "nirf_asc",     label: "Best NIRF" },
                    { value: "name_asc",     label: "Name A–Z" },
                    { value: "name_desc",    label: "Name Z–A" }
                  ]}
                  onChange={setSortBy}
                />
                <div className="h-5 w-px bg-outline-variant hidden sm:block"></div>
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest text-right shrink-0 hidden sm:block">
                  <span className="text-[#982b35] text-base md:text-lg tabular-nums font-extrabold">{displayedColleges.reduce((acc, c) => acc + c.branches.length, 0)}</span> matches
                </p>
                <button 
                  onClick={() => setIsFiltersOpen(true)} 
                  className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-md transition-colors"
                  title="Show Filters"
                >
                  <Filter className="size-5" /> 
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-3 md:space-y-4">
          {!rawData ? (
            <div className="w-full p-8 md:p-12 flex flex-col items-center justify-center text-on-surface-variant space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="font-medium">Loading admission patterns...</p>
            </div>
          ) : displayedColleges.length === 0 ? (
            <div className="w-full p-12 flex flex-col items-center justify-center text-on-surface-variant">
              <p className="font-medium text-lg">No branches matched your current criteria.</p>
              <p className="text-sm mt-2">Try relaxing your rank, changing quota, or adjusting your search.</p>
            </div>
          ) : (
            displayedColleges.map(college => (
            <div key={college.id} className="bg-surface-container-lowest border border-outline-variant rounded-lg shadow-sm overflow-hidden flex flex-col lg:flex-row lg:min-h-[260px]">
              
              {/* Left Section: College Info */}
              <div className="w-full lg:w-[320px] p-5 flex flex-col justify-start border-b lg:border-b-0 lg:border-r border-outline-variant bg-surface-container-low/30 shrink-0">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="size-14 rounded bg-white flex items-center justify-center p-2 border border-outline-variant shadow-sm shrink-0">
                    <img 
                      alt={`${college.name} Logo`} 
                      className="max-w-full max-h-full object-contain" 
                      src={college.logoUrl} 
                      onError={(e) => { e.currentTarget.src = getInitialsSvg(college.name); }}
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-[14px] leading-snug text-on-surface line-clamp-2" title={college.name}>{college.name}</h3>
                  </div>
                </div>
                
                {/* Enhanced College Snippets */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-3 mt-4 mb-4 py-3 border-y border-outline-variant/50 shrink-0">
                  <div>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter opacity-70">NIRF Overall</p>
                    <p className="text-[13px] font-bold text-on-surface tabular-nums">{college.nirfOverall}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter opacity-70">NIRF Engg</p>
                    <p className="text-[13px] font-bold text-on-surface tabular-nums">{college.nirfEngineering?.replace('Engineering ', '')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter opacity-70">Avg Package</p>
                    <p className="text-[13px] font-bold text-on-surface tabular-nums">{college.avgPackage}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter opacity-70">Median Package</p>
                    <p className="text-[13px] font-bold text-on-surface tabular-nums">{college.medianPackage}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2 shrink-0">
                  <button 
                    onClick={() => setSelectedCollegeForProfile(college)}
                    className="w-full py-2 bg-[#982b35]/5 text-[#982b35] border border-[#982b35]/20 text-[11px] font-bold rounded shadow-sm hover:bg-[#982b35] hover:text-white hover:border-[#982b35] transition-all"
                  >
                    VIEW DETAILS
                  </button>
                </div>
              </div>
              
              {/* Right Section: Branch Table */}
              <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden bg-white">
                <div className="overflow-auto w-full max-w-[100vw] sm:max-w-none">
                  <table className="w-full text-left border-collapse min-w-[600px] h-max">
                    <thead className="sticky top-0 z-10 shadow-[0_1px_0_var(--color-outline-variant)]">
                      <tr className="bg-surface-container-low">
                        <th className="px-5 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider bg-surface-container-low border-b border-outline-variant">Branch Name</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right bg-surface-container-low border-b border-outline-variant">Opening</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right bg-surface-container-low border-b border-outline-variant">Closing</th>
                        <th className="px-5 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider bg-surface-container-low border-b border-outline-variant">Chance</th>
                        <th className="px-4 py-3 w-10 text-center bg-surface-container-low border-b border-outline-variant"></th>
                      </tr>
                    </thead>
                    <tbody className="">
                      {college.branches.map(branch => {
                        const cellStyle = getChanceStyles(branch.chance);
                        const itemId = `${college.name}-${branch.name}-${branch.quota}-${branch.seatType}-${branch.gender}`;
                        const saved = isShortlisted(itemId);
                        return (
                        <tr key={branch.id} className="hover:bg-surface-container-low/50 transition-colors border-b border-outline-variant/50 last:border-0">
                          <td className="px-5 py-4 text-[15px] font-semibold text-on-surface max-w-sm tracking-tight">
                            <p className="truncate" title={branch.name}>{branch.name}</p>
                          </td>
                          <td className="px-4 py-4 text-[15px] text-right tabular-nums text-on-surface-variant font-medium">{branch.opening}</td>
                          <td className="px-4 py-4 text-[15px] text-right tabular-nums text-on-surface-variant font-medium">{branch.closing}</td>
                          <td className={`px-4 py-4 w-36 border-l ${cellStyle.border} ${cellStyle.bg}`}>
                            <span className={`block w-full text-center text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest ${cellStyle.text}`}>
                              {branch.chance}
                            </span>
                          </td>
                          <td className="px-4 py-2 w-14 text-center">
                            <button
                              onClick={() => {
                                if (saved) {
                                  removeFromShortlist(itemId);
                                } else {
                                  addToShortlist({
                                    id: itemId,
                                    institute: college.name,
                                    program: branch.name,
                                    quota: branch.quota,
                                    seatType: branch.seatType,
                                    gender: branch.gender,
                                    opening: branch.opening,
                                    closing: branch.closing,
                                    chance: branch.chance,
                                    nirfOverall: college._rawInstData?.rankings?.nirf_overall,
                                    medianPackage: college._rawInstData?.placements?.overall?.Latest?.median_package_lpa || 0,
                                    averagePackage: college._rawInstData?.placements?.overall?.Latest?.average_package_lpa || 0
                                  });
                                }
                              }}
                              className="text-on-surface-variant hover:text-primary transition-colors focus:outline-none w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container"
                            >
                               <Star className={`size-5 ${saved ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                            </button>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )))}
        </div>
      </main>
      )}

      {/* Bottom Nav for mobile */}
      <nav className="md:hidden flex items-center justify-around bg-surface-container-lowest border-t border-outline-variant h-16 shrink-0 px-2 pb-safe z-50">
          <button 
            onClick={() => { setActiveTab('predictor'); setSelectedCollegeForProfile(null); }}
            className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
              activeTab === 'predictor' && !selectedCollegeForProfile ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
             <Target className={`size-5 ${activeTab === 'predictor' && !selectedCollegeForProfile ? 'text-primary' : ''}`} />
             <span className="text-[10px] font-bold">Predictor</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('cutoff-search'); setSelectedCollegeForProfile(null); }}
            className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
              activeTab === 'cutoff-search' && !selectedCollegeForProfile ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
             <Search className="size-5" />
             <span className="text-[10px] font-bold">Cutoffs</span>
          </button>

          <button 
            onClick={() => { setActiveTab('colleges'); setSelectedCollegeForProfile(null); }}
            className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
              (activeTab === 'colleges' || selectedCollegeForProfile) ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
             <Building2 className={`size-5 ${activeTab === 'colleges' || selectedCollegeForProfile ? 'fill-current' : ''}`} />
             <span className="text-[10px] font-bold">Colleges</span>
          </button>

          <button 
            onClick={() => { setActiveTab('placements'); setSelectedCollegeForProfile(null); }}
            className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
              activeTab === 'placements' && !selectedCollegeForProfile ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
             <Briefcase className={`size-5 ${activeTab === 'placements' && !selectedCollegeForProfile ? 'fill-current' : ''}`} />
             <span className="text-[10px] font-bold">Placements</span>
          </button>

          <button 
            onClick={() => { setActiveTab('shortlist'); setSelectedCollegeForProfile(null); }}
            className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
              activeTab === 'shortlist' && !selectedCollegeForProfile ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
             <Star className={`size-5 ${activeTab === 'shortlist' && !selectedCollegeForProfile ? 'fill-current' : ''}`} />
             <span className="text-[10px] font-bold">Shortlist</span>
          </button>
      </nav>
      </div>
    </div>
  );
}

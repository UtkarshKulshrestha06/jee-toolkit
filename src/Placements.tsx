import React, { useState, useMemo } from 'react';
import { Search, MapPin, ExternalLink, Activity, Trophy, Percent, TrendingUp } from 'lucide-react';
import { CustomDropdown } from './components/CustomDropdown';
import { RawData, resolveInstituteType, isSameInstituteName, normalizeBranchName } from './data';

interface PlacementsProps {
  rawData: RawData | null;
  instituteData: any[];
  onSelectCollege: (college: any) => void;
}

export function Placements({ rawData, instituteData, onSelectCollege }: PlacementsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState<string[]>([]);
  const [collegeTypeFilter, setCollegeTypeFilter] = useState<string[]>([]);
  const [collegeNameFilter, setCollegeNameFilter] = useState<string[]>([]);
  const [yearFilter, setYearFilter] = useState('2024');
  const [sortBy, setSortBy] = useState('avg_desc');
  const [minPlacement, setMinPlacement] = useState<number>(0);

  // Generate branches and college lists for dropdowns
  const { allBranches, allColleges, allCollegeTypes } = useMemo(() => {
    if (!rawData || !instituteData) return { allBranches: [], allColleges: [], allCollegeTypes: [] };
    
    const branches = new Set<string>();
    rawData.colleges.forEach(c => c.entries.forEach(e => {
        let parts = e.program.split('(');
        let baseName = parts[0].trim();
        branches.add(baseName);
    }));

    const colleges = new Set<string>();
    const types = new Set<string>();
    instituteData.forEach(inst => {
      colleges.add(inst.institute_name);
      types.add(resolveInstituteType(inst.institute_name, inst.college_type));
    });

    return {
      allBranches: Array.from(branches).sort(),
      allColleges: Array.from(colleges).sort(),
      allCollegeTypes: Array.from(types).sort()
    };
  }, [rawData, instituteData]);

  // Generate mock placement records combining real college data with mock branch specific data
  const placementRecords = useMemo(() => {
     if (!instituteData || instituteData.length === 0) return [];
     
     let records: any[] = [];
     
     instituteData.forEach((inst, index) => {
         const rawCollege = rawData?.colleges.find(c => isSameInstituteName(c.name, inst.institute_name));
         const collegeType = resolveInstituteType(inst.institute_name, inst.college_type);

         const baseProfileCollege = {
            id: rawCollege ? String(rawCollege.id) : inst.institute_id || inst.institute_name,
            name: rawCollege ? rawCollege.name : inst.institute_name,
            type: collegeType,
            nirfOverall: inst.rankings?.nirf_overall ? `Overall #${inst.rankings.nirf_overall}` : '-',
            nirfEngineering: inst.rankings?.nirf_engineering ? `Engineering #${inst.rankings.nirf_engineering}` : '-',
            logoUrl: inst.media?.logo_url || 'https://upload.wikimedia.org/wikipedia/commons/0/0b/NITT_logo.png',
            avgPackage: inst.placements?.overall?.Latest?.average_package_lpa ? `₹${inst.placements.overall.Latest.average_package_lpa} LPA` : 'N/A',
            medianPackage: inst.placements?.overall?.Latest?.median_package_lpa ? `₹${inst.placements.overall.Latest.median_package_lpa} LPA` : 'N/A',
            highestPackage: inst.placements?.overall?.Latest?.highest_package_lpa ? `₹${inst.placements.overall.Latest.highest_package_lpa} LPA` : 'N/A',
            rawEntries: rawCollege ? rawCollege.entries : [],
            _rawInstData: inst
         };

         const latestBranches = inst.placements?.branch_wise?.Latest || [];

         latestBranches.forEach((branchData: any, bIdx: number) => {
             const branch = branchData.branch_name;
             const normalizedBranch = normalizeBranchName(branch);
             const avg = branchData.average_package_lpa || inst.placements?.overall?.Latest?.average_package_lpa || 0;
             const median = branchData.median_package_lpa || inst.placements?.overall?.Latest?.median_package_lpa || 0;
             const highest = branchData.highest_package_lpa || inst.placements?.overall?.Latest?.highest_package_lpa || 0;
             const plRt = branchData.placement_ratio_percentage || 0;

             if (plRt >= minPlacement || minPlacement === 0) {
                // Filters
                const typeMatch = collegeTypeFilter.length === 0 || collegeTypeFilter.includes(collegeType);
                const nameMatch = collegeNameFilter.length === 0 || collegeNameFilter.includes(inst.institute_name);
                const branchMatch = branchFilter.length === 0 || branchFilter.some(f => normalizeBranchName(f) === normalizedBranch);

                if (typeMatch && nameMatch && branchMatch) {
                    if (!searchQuery || 
                        baseProfileCollege.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        branch.toLowerCase().includes(searchQuery.toLowerCase())
                        ) {
                            records.push({
                                id: `${inst.institute_name}-${bIdx}`,
                                collegeProfile: baseProfileCollege,
                                branchName: branch,
                                year: 'Latest',
                                avgPackage: Number(avg.toFixed(2)),
                                medianPackage: Number(median.toFixed(2)),
                                highestPackage: Number(highest.toFixed(2)),
                                placementRate: plRt,
                            });
                        }
                }
             }
         });
     });

     // Sort records
     records.sort((a, b) => {
         if (sortBy === 'avg_desc') return b.avgPackage - a.avgPackage;
         if (sortBy === 'median_desc') return b.medianPackage - a.medianPackage;
         if (sortBy === 'high_desc') return b.highestPackage - a.highestPackage;
         if (sortBy === 'percent_desc') return b.placementRate - a.placementRate;
         if (sortBy === 'nirf_asc') {
             const getRank = (c: any) => parseInt(c.collegeProfile.nirfEngineering.replace(/\D/g, '')) || 999;
             return getRank(a) - getRank(b);
         }
         if (sortBy === 'name_asc') return a.collegeProfile.name.localeCompare(b.collegeProfile.name);
         return 0;
     });

     return records;

  }, [instituteData, rawData, branchFilter, collegeTypeFilter, collegeNameFilter, searchQuery, minPlacement, sortBy]);


  return (
    <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
      {/* Header */}
      <header className="h-20 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between px-gutter flex-shrink-0 gap-4">
          <div>
            <h2 className="font-bold text-lg text-on-surface">Placement Analytics</h2>
            <p className="text-xs text-on-surface-variant font-medium">Explore & compare granular placement data across colleges.</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="relative w-72 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant size-4" />
              <input 
                className="w-full pl-9 pr-4 py-2 bg-surface-container border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface placeholder:text-on-surface-variant" 
                placeholder="Search college or branch..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
      </header>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest border-b border-outline-variant px-gutter py-3 flex flex-col gap-3 sticky top-0 z-40 flex-shrink-0 shadow-sm relative">
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             <div className="flex flex-wrap items-center gap-2 flex-1">
               <CustomDropdown
                  label="Academic Year"
                  value={yearFilter}
                  options={[
                    { value: "2024", label: "2024" },
                    { value: "2023", label: "2023", disabled: true },
                    { value: "2022", label: "2022", disabled: true }
                  ]}
                  onChange={setYearFilter}
                />
               <CustomDropdown
                  label="College Type"
                  value={collegeTypeFilter}
                  multi={true}
                  options={[
                    ...allCollegeTypes.map(t => ({ value: t, label: t }))
                  ]}
                  onChange={setCollegeTypeFilter}
                />
               <CustomDropdown
                  label="College Name"
                  value={collegeNameFilter}
                  multi={true}
                  searchable={true}
                  options={[
                    ...allColleges.map(c => ({ value: c, label: c }))
                  ]}
                  onChange={setCollegeNameFilter}
                />
               <CustomDropdown
                  label="Branch"
                  value={branchFilter}
                  multi={true}
                  searchable={true}
                  options={[
                    ...allBranches.map(b => ({ value: b, label: b }))
                  ]}
                  onChange={setBranchFilter}
                />
               <CustomDropdown
                  label="Placed %"
                  value={minPlacement.toString()}
                  options={[
                    { value: "0", label: "Any %" },
                    { value: "50", label: "> 50%" },
                    { value: "70", label: "> 70%" },
                    { value: "85", label: "> 85%" },
                    { value: "90", label: "> 90%" },
                    { value: "95", label: "> 95%" }
                  ]}
                  onChange={(val) => setMinPlacement(Number(val))}
                />
                {(collegeTypeFilter.length > 0 || collegeNameFilter.length > 0 || branchFilter.length > 0 || minPlacement > 0) && (
                  <button
                    onClick={() => { setCollegeTypeFilter([]); setCollegeNameFilter([]); setBranchFilter([]); setMinPlacement(0); }}
                    className="text-[11px] font-bold text-[#982b35] hover:underline shrink-0 px-2"
                  >
                    Clear all
                  </button>
                )}
             </div>

             <div className="flex flex-wrap items-center gap-3 shrink-0 self-start sm:self-auto mt-1 sm:mt-0 justify-end">
               <CustomDropdown
                  label="Sort By:"
                  value={sortBy}
                  options={[
                    { value: "avg_desc", label: "Avg Package (High to Low)" },
                    { value: "median_desc", label: "Median Package (High to Low)" },
                    { value: "high_desc", label: "Highest Package (High to Low)" },
                    { value: "percent_desc", label: "Placement Rate (High to Low)" },
                    { value: "nirf_asc", label: "Best NIRF Ranking" },
                    { value: "name_asc", label: "College Name (A-Z)" }
                  ]}
                  onChange={setSortBy}
                  className="!bg-surface-container"
                />
               <div className="h-5 w-px bg-outline-variant hidden sm:block"></div>
               <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest text-right shrink-0 hidden sm:block">
                 <span className="text-[#982b35] text-base md:text-lg tabular-nums font-extrabold">{placementRecords.length}</span> records
               </p>
             </div>
           </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-gutter bg-surface-container-low/50">
          {!instituteData || instituteData.length === 0 ? (
            <div className="w-full p-12 flex flex-col items-center justify-center text-on-surface-variant space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="font-medium">Loading placement records...</p>
            </div>
          ) : placementRecords.length === 0 ? (
             <div className="w-full p-12 flex flex-col items-center justify-center text-on-surface-variant">
              <p className="font-medium text-lg">No placement records found.</p>
              <p className="text-sm mt-2">Try relaxing your filters or searching for something else.</p>
            </div>
          ) : (
             <div className="grid grid-cols-1 md:flex md:flex-col gap-4 max-w-[1400px] mx-auto">
                {placementRecords.map((record) => (
                    <div key={record.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:shadow-sm hover:border-primary/40 transition-all duration-200 flex flex-col md:flex-row cursor-default group">
                        
                        {/* Top: College & Branch Info */}
                        <div className="p-4 flex items-center gap-4 flex-1">
                            <div className="size-14 rounded bg-white border border-outline-variant flex items-center justify-center p-1 shadow-sm shrink-0">
                                <img src={record.collegeProfile.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                    <span className="text-[9px] uppercase font-bold tracking-wider text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                                        {record.collegeProfile.type}
                                    </span>
                                    {record.collegeProfile.nirfEngineering !== '-' && (
                                        <span className="text-[9px] uppercase font-bold tracking-wider text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">
                                            {record.collegeProfile.nirfEngineering}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-sm font-bold leading-snug text-on-surface line-clamp-2 mb-1" title={record.collegeProfile.name}>
                                    {record.collegeProfile.name}
                                </h3>
                                <p className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-sm line-clamp-2 inline-block w-fit" title={record.branchName}>
                                    {record.branchName}
                                </p>
                            </div>
                        </div>

                        {/* Middle: Stats */}
                        <div className="px-4 pb-4 md:p-4 bg-surface-container-lowest border-b md:border-b-0 md:border-l border-outline-variant/30 flex flex-col justify-center gap-3 md:w-[400px] shrink-0">
                            <div className="grid grid-cols-3 gap-2 bg-surface-container px-2 py-2 rounded-lg">
                               <div className="flex flex-col text-center border-r border-outline-variant/50">
                                   <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Average</span>
                                   <span className="text-[11px] md:text-[13px] font-bold text-on-surface">₹{record.avgPackage}</span>
                               </div>
                               <div className="flex flex-col text-center border-r border-outline-variant/50">
                                   <span className="text-[9px] font-bold text-red-600/80 uppercase tracking-wider">Median</span>
                                   <span className="text-[11px] md:text-[13px] font-black text-red-600">₹{record.medianPackage}</span>
                               </div>
                               <div className="flex flex-col text-center">
                                   <span className="text-[9px] font-bold text-amber-500/80 uppercase tracking-wider">Highest</span>
                                   <span className="text-[11px] md:text-[13px] font-black text-amber-500">₹{record.highestPackage}</span>
                               </div>
                            </div>
                            
                            {/* Placement Rate */}
                            <div className="flex flex-col w-full px-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">
                                        Placement Rate
                                    </span>
                                    <span className={`text-[11px] font-bold tabular-nums opacity-90 ${
                                        record.placementRate === 0 ? 'text-on-surface-variant' :
                                        record.placementRate >= 90 ? 'text-emerald-600' :
                                        record.placementRate >= 70 ? 'text-amber-600' :
                                        'text-red-600'
                                    }`}>{record.placementRate === 0 ? 'NA' : `${record.placementRate}%`}</span>
                                </div>
                                <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                     <div className={`h-full rounded-full relative ${
                                         record.placementRate === 0 ? 'bg-transparent' :
                                         record.placementRate >= 90 ? 'bg-emerald-500' :
                                         record.placementRate >= 70 ? 'bg-amber-500' :
                                         'bg-red-500'
                                     }`} style={{ width: `${record.placementRate}%` }}>
                                     </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom: Action */}
                        <button 
                            onClick={() => onSelectCollege(record.collegeProfile)}
                            className="w-full md:w-20 flex md:flex-col items-center justify-center p-3 bg-surface-container-low transition-colors text-xs md:text-[10px] text-primary font-bold hover:bg-primary hover:text-white md:border-l border-outline-variant/30 shrink-0"
                        >
                            <span className="md:hidden">VIEW INSTITUTE</span>
                            <span className="hidden md:block mt-1">VIEW</span>
                            <ExternalLink className="size-3.5 ml-1.5 md:ml-0 md:mb-1" />
                        </button>
                    </div>
                ))}
             </div>
          )}
      </div>
    </main>
  );
}

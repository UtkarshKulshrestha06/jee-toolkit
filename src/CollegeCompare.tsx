import React, { useState, useMemo } from 'react';
import { Search, MapPin, Building2, Trophy, ArrowRight } from 'lucide-react';
import { RawData, getInitialsSvg, matchesInstituteType, normalizeInstituteName } from './data';
import { CustomDropdown } from './components/CustomDropdown';

const STATE_MAP: Record<string, string> = {
  "Tiruchirappalli": "Tamil Nadu",
  "Surathkal": "Karnataka",
  "Rourkela": "Odisha",
  "Warangal": "Telangana",
  "Calicut": "Kerala",
  "Jaipur": "Rajasthan",
  "Nagpur": "Maharashtra",
  "Kurukshetra": "Haryana",
  "Allahabad": "Uttar Pradesh",
  "Durgapur": "West Bengal",
  "Silchar": "Assam",
  "Jalandhar": "Punjab",
  "Meghalaya": "Meghalaya",
  "Bhopal": "Madhya Pradesh",
  "Raipur": "Chhattisgarh",
  "Agartala": "Tripura",
  "Goa": "Goa",
  "Jamshedpur": "Jharkhand",
  "Patna": "Bihar",
  "Hamirpur": "Himachal Pradesh",
  "Puducherry": "Puducherry",
  "Manipur": "Manipur",
  "Srinagar": "Jammu and Kashmir",
  "Delhi": "Delhi",
  "Mizoram": "Mizoram",
  "Nagaland": "Nagaland",
  "Sikkim": "Sikkim",
  "Uttarakhand": "Uttarakhand",
  "Arunachal Pradesh": "Arunachal Pradesh",
  "Andhra Pradesh": "Andhra Pradesh",
  "Shibpur": "West Bengal"
};

const getStateFromName = (name: string) => {
  for (const [key, value] of Object.entries(STATE_MAP)) {
    if (name.includes(key)) {
      return value;
    }
  }
  return "Unknown State";
};

const toSingleCollegeTypeSelection = (previous: string[], next: string[]) => {
  const newlySelected = next.filter(type => !previous.includes(type));
  if (newlySelected.length > 0) return [newlySelected[newlySelected.length - 1]];
  return next.slice(-1);
};

export function CollegeCompare({
  rawData,
  instituteData,
  onSelectCollege
}: {
  rawData: RawData | null;
  instituteData: any[];
  onSelectCollege: (college: any) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [counsellingFilter, setCounsellingFilter] = useState('JoSAA');
  const [stateFilter, setStateFilter] = useState<string[]>([]);
  const [nirfFilter, setNirfFilter] = useState('');
  const [sortBy, setSortBy] = useState('nirf_asc');
  const [collegeTypeFilter, setCollegeTypeFilter] = useState<string[]>([]);

  const enrichedColleges = useMemo(() => {
    if (!instituteData || instituteData.length === 0) return [];

    const rawMap = new Map();
    if (rawData) {
      rawData.colleges.forEach(c => {
        rawMap.set(normalizeInstituteName(c.name), c);
      });
    }

    return instituteData.map(inst => {
      const rawCollege = rawMap.get(normalizeInstituteName(inst.institute_name));

      return {
        id: rawCollege ? String(rawCollege.id) : inst.institute_id || inst.institute_name,
        name: rawCollege ? rawCollege.name : inst.institute_name,
        state: inst.state || getStateFromName(inst.institute_name) || "Unknown State",
        nirfOverall: inst.rankings?.nirf_overall ? `Overall #${inst.rankings.nirf_overall}` : '-',
        nirfEngineering: inst.rankings?.nirf_engineering ? `Engineering #${inst.rankings.nirf_engineering}` : '-',
        logoUrl: inst.media?.logo_url || getInitialsSvg(inst.institute_name),
        avgPackage: inst.placements?.overall?.Latest?.average_package_lpa ? `₹${inst.placements.overall.Latest.average_package_lpa} LPA` : 'N/A',
        medianPackage: inst.placements?.overall?.Latest?.median_package_lpa ? `₹${inst.placements.overall.Latest.median_package_lpa} LPA` : 'N/A',
        highestPackage: inst.placements?.overall?.Latest?.highest_package_lpa ? `₹${inst.placements.overall.Latest.highest_package_lpa} LPA` : 'N/A',
        branches: [],
        rawEntries: rawCollege ? rawCollege.entries : [],
        _rawInstData: inst,
        _nirfOverallNum: inst.rankings?.nirf_overall || 9999
      };
    });
  }, [rawData, instituteData]);

  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    enrichedColleges.forEach(c => {
      if (c.state !== 'Unknown State') states.add(c.state);
    });
    return Array.from(states).sort();
  }, [enrichedColleges]);

  const filteredColleges = useMemo(() => {
    const result = enrichedColleges.filter(college => {
      if (searchQuery && !college.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (stateFilter.length > 0 && !stateFilter.includes(college.state)) {
        return false;
      }

      if (!matchesInstituteType(college.name, collegeTypeFilter, college._rawInstData?.college_type)) {
        return false;
      }

      if (nirfFilter === 'Top 10' && college._nirfOverallNum > 10) return false;
      if (nirfFilter === 'Top 20' && college._nirfOverallNum > 20) return false;
      if (nirfFilter === 'Top 50' && college._nirfOverallNum > 50) return false;

      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'nirf_asc') {
        return a._nirfOverallNum - b._nirfOverallNum;
      }
      if (sortBy === 'median_desc') {
        const aPkg = a._rawInstData?.placements?.overall?.Latest?.median_package_lpa || 0;
        const bPkg = b._rawInstData?.placements?.overall?.Latest?.median_package_lpa || 0;
        return bPkg - aPkg;
      }
      if (sortBy === 'average_desc') {
        const aPkg = a._rawInstData?.placements?.overall?.Latest?.average_package_lpa || 0;
        const bPkg = b._rawInstData?.placements?.overall?.Latest?.average_package_lpa || 0;
        return bPkg - aPkg;
      }
      if (sortBy === 'highest_desc') {
        const aPkg = a._rawInstData?.placements?.overall?.Latest?.highest_package_lpa || 0;
        const bPkg = b._rawInstData?.placements?.overall?.Latest?.highest_package_lpa || 0;
        return bPkg - aPkg;
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

    return result;
  }, [enrichedColleges, searchQuery, stateFilter, collegeTypeFilter, nirfFilter, sortBy]);

  return (
    <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
      <header className="h-20 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between px-gutter flex-shrink-0 gap-4">
        <div className="flex items-center gap-4 flex-shrink-0">
          <h2 className="font-bold text-lg text-on-surface">Participating Colleges</h2>
        </div>
      </header>

      <div className="bg-surface-container-lowest border-b border-outline-variant px-gutter py-3 flex flex-col gap-3 sticky top-0 z-40 flex-shrink-0 shadow-sm relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="flex-1 min-w-[150px] max-w-[200px] relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant size-4" />
                <input
                  className="w-full pl-8 pr-3 py-1.5 h-[34px] bg-surface-container-low border border-outline-variant rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="Search..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <CustomDropdown
                label="Type"
                value={collegeTypeFilter}
                multi={true}
                options={[
                  { value: "IIT", label: "IITs" },
                  { value: "NIT", label: "NITs" },
                  { value: "IIIT", label: "IIITs" },
                  { value: "GFTI", label: "GFTIs" }
                ]}
                onChange={(next: string[]) => setCollegeTypeFilter(previous => toSingleCollegeTypeSelection(previous, next))}
              />
              <CustomDropdown
                label="State"
                value={stateFilter}
                multi={true}
                searchable={true}
                options={uniqueStates.map(st => ({ value: st, label: st }))}
                onChange={setStateFilter}
              />
              <CustomDropdown
                label="NIRF"
                value={nirfFilter}
                options={[
                  { value: "", label: "All Rankings" },
                  { value: "Top 10", label: "Top 10" },
                  { value: "Top 20", label: "Top 20" },
                  { value: "Top 50", label: "Top 50" }
                ]}
                onChange={setNirfFilter}
              />
              {(collegeTypeFilter.length > 0 || stateFilter.length > 0 || nirfFilter || searchQuery) && (
                <button
                  onClick={() => { setSearchQuery(''); setStateFilter([]); setNirfFilter(''); setCollegeTypeFilter([]); }}
                  className="text-[11px] font-bold text-[#982b35] hover:underline shrink-0 px-2"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0 self-start sm:self-auto mt-1 sm:mt-0 justify-end">
              <CustomDropdown
                label="Sort:"
                value={sortBy}
                options={[
                  { value: "nirf_asc", label: "NIRF Ranking" },
                  { value: "median_desc", label: "Median Package (High to Low)" },
                  { value: "average_desc", label: "Average Package (High to Low)" },
                  { value: "highest_desc", label: "Highest Package (High to Low)" },
                  { value: "name_asc", label: "Name (A-Z)" },
                  { value: "name_desc", label: "Name (Z-A)" }
                ]}
                onChange={setSortBy}
              />
              <div className="h-5 w-px bg-outline-variant hidden sm:block"></div>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest text-right shrink-0 hidden sm:block">
                <span className="text-[#982b35] text-base md:text-lg tabular-nums font-extrabold">{filteredColleges.length}</span> colleges
              </p>
            </div>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-surface-container-lowest">
        <div className="grid grid-cols-1 md:flex md:flex-col gap-4 lg:gap-6 max-w-7xl mx-auto">
          {filteredColleges.map((college) => (
            <div
              key={college.id}
              className="bg-white border border-outline-variant rounded-xl overflow-hidden hover:border-primary/50 transition-colors shadow-sm hover:shadow flex flex-col md:flex-row justify-between cursor-pointer group"
              onClick={() => onSelectCollege(college)}
            >
              <div className="p-4 sm:p-5 flex items-center md:items-start gap-4 flex-1">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded bg-white flex items-center justify-center p-2 border border-outline-variant shrink-0 shadow-sm relative top-1 md:top-0">
                  <img
                    src={college.logoUrl}
                    alt={`${college.name} Logo`}
                    className="max-w-full max-h-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.currentTarget.src = getInitialsSvg(college.name); }}
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                  <h3 className="font-bold text-base leading-snug text-on-surface mb-2 md:mb-1 group-hover:text-primary transition-colors pr-2 break-words">
                    {college.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant bg-surface-container-low px-1.5 py-0.5 rounded truncate max-w-full">
                      <MapPin className="size-3 shrink-0" /> {college.state}
                    </div>
                    {college.nirfOverall !== '-' && (
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant bg-surface-container-low px-1.5 py-0.5 rounded shrink-0">
                        <Trophy className="size-3 text-amber-500" /> {college.nirfOverall}
                      </div>
                    )}
                    {college.nirfEngineering !== '-' && (
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant bg-surface-container-low px-1.5 py-0.5 rounded shrink-0">
                        <Trophy className="size-3 text-blue-500" /> {college.nirfEngineering}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t md:border-t-0 md:border-l border-outline-variant flex items-stretch md:w-80 shrink-0">
                <div className="flex-1 p-3 bg-surface-container-lowest flex flex-col items-center justify-center border-r border-outline-variant">
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase mb-0.5">
                    {college.medianPackage !== 'N/A' ? 'Median Package' : 'Average Package'}
                  </span>
                  <span className={`text-[13px] md:text-[15px] font-extrabold ${(college.medianPackage !== 'N/A' || college.avgPackage !== 'N/A') ? 'text-green-700' : 'text-on-surface-variant'}`}>
                    {college.medianPackage !== 'N/A' ? college.medianPackage : college.avgPackage}
                  </span>
                </div>

                <div className="px-6 bg-surface-container-low flex justify-center text-primary text-xs font-bold items-center gap-1.5 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="hidden md:inline">VIEW PROFILE</span>
                  <span className="md:hidden">VIEW</span>
                  <ArrowRight className="size-4" />
                </div>
              </div>
            </div>
          ))}

          {filteredColleges.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-on-surface-variant">
              <Building2 className="size-16 mb-4 opacity-20" />
              <p className="font-medium text-lg">No colleges match your current filters.</p>
              <button
                onClick={() => { setSearchQuery(''); setStateFilter([]); setNirfFilter(''); setCollegeTypeFilter([]); }}
                className="mt-4 text-primary font-semibold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

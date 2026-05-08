import React, { useState, useMemo, useEffect } from 'react';
import { RawData, getInitialsSvg, isSameInstituteName, matchesInstituteType } from './data';
import { useShortlist } from './ShortlistContext';
import { Search, Star } from 'lucide-react';

import { CustomDropdown } from './components/CustomDropdown';

const FieldWrapper = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[12px] font-extrabold text-[#5a2e25] uppercase tracking-wider ml-1">{label}</label>
    {children}
  </div>
);

export function CutoffSearch({ rawData: initialRawData, instituteData }: { rawData: RawData | null; instituteData: any[] }) {
  const { shortlist, addToShortlist, removeFromShortlist, isShortlisted } = useShortlist();
  const [counselling, setCounselling] = useState<string>('JoSAA');
  const [year, setYear] = useState<string>('2025');
  const [round, setRound] = useState<string>('1');
  const [collegeType, setCollegeType] = useState<string>('ALL');
  const [collegeName, setCollegeName] = useState<string>('ALL');
  const [branch, setBranch] = useState<string[]>([]);
  const [quota, setQuota] = useState<string>('ALL');
  const [category, setCategory] = useState<string>('ALL');
  const [gender, setGender] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('institute_asc');

  const [rawData, setRawData] = useState<RawData | null>(initialRawData);

  // Defer the states that trigger heavy filtering to improve UI responsiveness
  const deferredCollegeType = React.useDeferredValue(collegeType);
  const deferredCollegeName = React.useDeferredValue(collegeName);
  const deferredBranch = React.useDeferredValue(branch);
  const deferredQuota = React.useDeferredValue(quota);
  const deferredCategory = React.useDeferredValue(category);
  const deferredGender = React.useDeferredValue(gender);
  const deferredSortBy = React.useDeferredValue(sortBy);

  useEffect(() => {
    if (counselling === '--Select--' || year === '--Select--' || round === '--Select--') return;
    const cShort = counselling === 'JoSAA' ? 'j' : 'c';
    
    // Fetch all possible types
    const typesToFetch = ['NIT', 'IIT', 'IIIT', 'GFTI'];
    
    const fetchPromises = typesToFetch.map(type => {
      const fileName = `/${year}_${cShort}_${type}_r${round}.json`;
      return fetch(fileName).then(r => r.ok ? r.json() : null).catch(() => null);
    });

    Promise.all(fetchPromises)
      .then(typeDataArray => {
        const validData = typeDataArray.filter(d => d !== null);
        if (validData.length > 0) {
          const combinedColleges = validData.flatMap(d =>
            d.colleges.map((college: any) => ({
              ...college,
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
      })
      .catch(e => {
         console.error("Failed to load local data for cutoff search", e);
         setRawData(null);
      });
  }, [counselling, year, round]);

  const allCollegesOptions = useMemo(() => {
    if (!rawData) return [];
    return rawData.colleges.filter(c => {
      return collegeType === 'ALL' || c.collegeType === collegeType || c.name.includes(collegeType);
    }).map(c => ({ label: c.name, value: c.name })).sort((a,b) => a.label.localeCompare(b.label));
  }, [rawData, collegeType]);

  const branchOptions = useMemo(() => {
     if (!rawData) return [];
     const branches = new Set<string>();
     rawData.colleges.forEach(c => {
        if (collegeName === 'ALL' || c.name === collegeName) {
           c.entries.forEach(e => branches.add(e.program));
        }
     });
     return Array.from(branches).sort().map(b => ({ label: b, value: b }));
  }, [rawData, collegeName]);

  const quotaOptions = useMemo(() => {
    if (!rawData) return [];
    const quotasSet = new Set<string>();
    rawData.colleges.forEach(c => c.entries.forEach(e => quotasSet.add(e.quota)));
    return Array.from(quotasSet).sort().map(q => ({ label: q, value: q }));
  }, [rawData]);

  const categoryOptions = useMemo(() => {
    if (!rawData) return [];
    const catsSet = new Set<string>();
    rawData.colleges.forEach(c => c.entries.forEach(e => catsSet.add(e.seatType)));
    return Array.from(catsSet).sort().map(c => ({ label: c, value: c }));
  }, [rawData]);

  const genderOptions = useMemo(() => {
    if (!rawData) return [];
    const gendersSet = new Set<string>();
    rawData.colleges.forEach(c => c.entries.forEach(e => gendersSet.add(e.gender)));
    return Array.from(gendersSet).sort().map(g => ({ label: g, value: g }));
  }, [rawData]);

  const hasFilters = deferredCollegeType !== 'ALL' || deferredCollegeName !== 'ALL' || deferredBranch.length > 0 || 
      (deferredQuota !== 'ALL' && deferredQuota !== '--Select--') || 
      (deferredCategory !== 'ALL' && deferredCategory !== '--Select--') || 
      (deferredGender !== 'ALL' && deferredGender !== '--Select--');

  const tableData = useMemo(() => {
    if (!rawData) return null;
    if (!hasFilters) return [];
    
    let flatData: any[] = [];
    
    rawData.colleges.forEach(c => {
        if (deferredCollegeType !== 'ALL' && c.collegeType !== deferredCollegeType && !c.name.includes(deferredCollegeType)) return;

        if (deferredCollegeName !== 'ALL' && c.name !== deferredCollegeName) return;

        c.entries.forEach(e => {
            if (deferredBranch.length > 0 && !deferredBranch.includes(e.program)) return;
            if (deferredQuota !== 'ALL' && deferredQuota !== '--Select--') {
              const matchQuota = (deferredQuota === 'AI' || deferredQuota === 'OS') 
                ? (e.quota === 'AI' || e.quota === 'OS')
                : (e.quota === deferredQuota);
              if (!matchQuota) return;
            }
            if (deferredCategory !== 'ALL' && deferredCategory !== '--Select--' && e.seatType !== deferredCategory) return;
            if (deferredGender !== 'ALL' && deferredGender !== '--Select--' && e.gender !== deferredGender) return;

            const inst = instituteData?.find(i => isSameInstituteName(i.institute_name, c.name));
            
            flatData.push({
               institute: c.name,
               logoUrl: inst?.media?.logo_url || getInitialsSvg(c.name),
               program: e.program,
               quota: e.quota,
               seatType: e.seatType,
               gender: e.gender,
               opening: e.openingRank,
               closing: e.closingRank
            });
        });
    });

    return flatData.sort((a,b) => {
       if (deferredSortBy === 'cutoff_asc') return a.closing - b.closing;
       if (deferredSortBy === 'cutoff_desc') return b.closing - a.closing;
       if (deferredSortBy === 'institute_asc') {
           const c = a.institute.localeCompare(b.institute);
           if (c !== 0) return c;
           return a.program.localeCompare(b.program);
       }
       if (deferredSortBy === 'institute_desc') {
           const c = b.institute.localeCompare(a.institute);
           if (c !== 0) return c;
           return b.program.localeCompare(a.program);
       }
       
       if (a.institute !== b.institute) return a.institute.localeCompare(b.institute);
       if (a.program !== b.program) return a.program.localeCompare(b.program);
       if (a.quota !== b.quota) return a.quota.localeCompare(b.quota);
       if (a.seatType !== b.seatType) return a.seatType.localeCompare(b.seatType);
       return a.opening - b.opening;
    });

  }, [rawData, deferredCollegeType, deferredCollegeName, deferredBranch, deferredQuota, deferredCategory, deferredGender, deferredSortBy]);

  const processOptionWithAll = (opts: any[]) => [{label: 'ALL', value: 'ALL'}, ...opts];

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
      <header className="h-20 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between px-gutter flex-shrink-0 gap-4">
        <div className="flex items-center gap-4 flex-shrink-0">
          <h2 className="font-bold text-lg text-on-surface">Cutoff Search</h2>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto w-full p-4 md:p-8">
      <div className="max-w-7xl mx-auto w-full">
      <div className="bg-surface-container-lowest border-b border-outline-variant px-gutter py-4 flex flex-col gap-4 sticky top-0 z-40 flex-shrink-0 shadow-sm relative">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-x-4 gap-y-5">
             <div className="lg:col-span-2">
                 <FieldWrapper label="Counselling">
                     <CustomDropdown label="Counselling" variant="josaa" hideLabel fullWidth value={counselling} onChange={setCounselling} options={[{ value: 'JoSAA', label: 'JoSAA' }, { value: 'CSAB', label: 'CSAB', disabled: true }]} />
                 </FieldWrapper>
             </div>
             <div className="lg:col-span-2">
                 <FieldWrapper label="Year">
                     <CustomDropdown label="Year" variant="josaa" hideLabel fullWidth value={year} onChange={setYear} options={[{ value: '2025', label: '2025' }, { value: '2024', label: '2024' }]} />
                 </FieldWrapper>
             </div>
             <div className="lg:col-span-2">
                 <FieldWrapper label="Round No">
                     <CustomDropdown label="Round No" variant="josaa" hideLabel fullWidth value={round} onChange={setRound} options={[1,2,3,4,5,6].map(r => ({ value: String(r), label: String(r) }))} />
                 </FieldWrapper>
             </div>
             <div className="lg:col-span-3">
                 <FieldWrapper label="Institute Type">
                     <CustomDropdown label="Institute Type" variant="josaa" hideLabel fullWidth multi={false} value={collegeType} onChange={setCollegeType} options={[{ value: 'ALL', label: 'ALL' }, { value: 'IIT', label: 'IIT' }, { value: 'NIT', label: 'NIT' }, { value: 'IIIT', label: 'IIIT' }, { value: 'GFTI', label: 'GFTI' }]} />
                 </FieldWrapper>
             </div>
             <div className="lg:col-span-3">
                 <FieldWrapper label="Institute Name">
                     <CustomDropdown label="Institute Name" variant="josaa" hideLabel fullWidth multi={false} searchable={true} value={collegeName} onChange={setCollegeName} options={processOptionWithAll(allCollegesOptions)} />
                 </FieldWrapper>
             </div>
             <div className="lg:col-span-6">
                 <FieldWrapper label="Academic Program">
                     <CustomDropdown label="Academic Program" variant="josaa" hideLabel fullWidth multi={true} searchable={true} value={branch} onChange={setBranch} options={branchOptions} className="w-full" />
                 </FieldWrapper>
             </div>
             <div className="lg:col-span-2">
                 <FieldWrapper label="Seat Type / Category">
                     <CustomDropdown label="Seat Type / Category" variant="josaa" hideLabel fullWidth value={category} onChange={setCategory} options={processOptionWithAll(categoryOptions)} />
                 </FieldWrapper>
             </div>
             <div className="lg:col-span-2">
                 <FieldWrapper label="Quota">
                     <CustomDropdown label="Quota" variant="josaa" hideLabel fullWidth value={quota} onChange={setQuota} options={processOptionWithAll(quotaOptions)} />
                 </FieldWrapper>
             </div>
             <div className="lg:col-span-2">
                 <FieldWrapper label="Gender">
                     <CustomDropdown label="Gender" variant="josaa" hideLabel fullWidth value={gender} onChange={setGender} options={processOptionWithAll(genderOptions)} />
                 </FieldWrapper>
             </div>
         </div>
         <hr className="mt-6 border-t border-[#f2e1e1]" />
         <div className="flex justify-end pt-2">
             <button className="bg-[#b00a2b] hover:bg-[#8f0823] text-white px-5 py-2.5 rounded-md font-bold text-[13.5px] flex items-center gap-2 transition-colors">
                 Submit Search
                 <Search className="size-4" />
             </button>
         </div>
      </div>

        {/* Info Text */}
        <div className="mt-8 text-center space-y-3 px-4 text-[13px] bg-surface-container-lowest py-5 rounded-lg border border-outline-variant/30 hidden lg:block">
            <p className="text-[#0d6efd] font-medium leading-relaxed max-w-5xl mx-auto">
              Opening/Closing Ranks for Open Seats represent CRL. Opening/Closing Ranks for EWS, OBC-NCL, SC and ST Seats represent respective Category Ranks. Opening/Closing Ranks for PwD Seats represent PwD Ranks within Respective Categories.
            </p>
            <p className="text-[#dc3545] font-bold">
              If the Closing/Opening rank has a suffix 'P', it indicates that the corresponding rank is from Preparatory Rank List.
            </p>
        </div>

        {/* Results Table */}
        {tableData && tableData.length > 0 && (
          <div className="mt-8 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4 px-2">
               <h3 className="font-bold text-on-surface text-lg">Results <span className="text-on-surface-variant text-sm font-medium ml-1">({tableData.length} records)</span></h3>
               <div className="flex items-center gap-3">
                 <label className="text-[13px] font-bold text-on-surface-variant uppercase tracking-wider">Sort By:</label>
                 <select 
                   value={sortBy} 
                   onChange={(e) => setSortBy(e.target.value)} 
                   className="bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-1.5 text-[13.5px] font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface shadow-sm cursor-pointer transition-colors hover:border-[#f4d4d4]"
                 >
                   <option value="institute_asc">Institute (A-Z)</option>
                   <option value="institute_desc">Institute (Z-A)</option>
                   <option value="cutoff_asc">Closing Rank (Low to High)</option>
                   <option value="cutoff_desc">Closing Rank (High to Low)</option>
                 </select>
               </div>
            </div>
            
            <div className="border border-outline-variant bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
              <div className="overflow-x-auto min-h-full">
              <table className="w-full text-left border-collapse min-w-[900px] h-full">
                <thead className="bg-[#fbeaea] sticky top-0 z-10 shadow-[0_1px_0_var(--color-outline-variant)]">
                   <tr>
                     <th className="px-5 py-3.5 text-[12px] font-extrabold text-[#1e3a5f] uppercase tracking-wider border-b border-[#f4d4d4] w-[28%]">Institute</th>
                     <th className="px-5 py-3.5 text-[12px] font-extrabold text-[#1e3a5f] uppercase tracking-wider border-b border-[#f4d4d4] w-[35%]">Academic Program Name</th>
                     <th className="px-4 py-3.5 text-[12px] font-extrabold text-[#1e3a5f] uppercase tracking-wider border-b border-[#f4d4d4]">Quota</th>
                     <th className="px-4 py-3.5 text-[12px] font-extrabold text-[#1e3a5f] uppercase tracking-wider border-b border-[#f4d4d4]">Seat Type</th>
                     <th className="px-4 py-3.5 text-[12px] font-extrabold text-[#1e3a5f] uppercase tracking-wider border-b border-[#f4d4d4]">Gender</th>
                     <th className="px-4 py-3.5 text-[12px] font-extrabold text-[#1e3a5f] uppercase tracking-wider border-b border-[#f4d4d4] text-right whitespace-nowrap">Opening Rank</th>
                     <th className="px-4 py-3.5 text-[12px] font-extrabold text-[#1e3a5f] uppercase tracking-wider border-b border-[#f4d4d4] text-right whitespace-nowrap">Closing Rank</th>
                     <th className="w-10 px-3 py-3.5 border-b border-[#f4d4d4]"></th>
                   </tr>
                </thead>
                <tbody className="">
                   {tableData.map((row, idx) => {
                       const itemId = `${row.institute}-${row.program}-${row.quota}-${row.seatType}-${row.gender}`;
                       const saved = isShortlisted(itemId);
                       return (
                     <tr key={idx} className="border-b border-outline-variant/40 hover:bg-surface-container-low/80 transition-colors last:border-0 group">
                       <td className="px-5 py-2.5 text-[13.5px] font-bold text-on-surface">
                         <div className="flex items-center gap-3">
                           <div className="size-8 rounded bg-white flex items-center justify-center p-1 border border-outline-variant/60 shadow-sm shrink-0 group-hover:border-primary/40 transition-colors">
                              <img 
                                alt={`${row.institute} Logo`} 
                                className="max-w-full max-h-full object-contain" 
                                src={row.logoUrl} 
                                onError={(e) => { e.currentTarget.src = getInitialsSvg(row.institute); }}
                                referrerPolicy="no-referrer" 
                              />
                           </div>
                           <span className="leading-snug">{row.institute}</span>
                         </div>
                       </td>
                       <td className="px-5 py-2.5 text-[13px] text-on-surface font-medium leading-snug">{row.program}</td>
                       <td className="px-4 py-2.5 text-[12.5px] font-medium text-on-surface-variant whitespace-nowrap">{row.quota}</td>
                       <td className="px-4 py-2.5 text-[12.5px] font-medium text-on-surface-variant whitespace-nowrap">{row.seatType}</td>
                       <td className="px-4 py-2.5 text-[12.5px] font-medium text-on-surface-variant max-w-[140px] truncate" title={row.gender}>{row.gender}</td>
                       <td className="px-4 py-2.5 text-[13px] font-medium text-on-surface-variant text-right tabular-nums">{row.opening}</td>
                       <td className="px-4 py-2.5 text-[13px] font-bold text-on-surface-variant text-right tabular-nums">{row.closing}</td>
                       <td className="px-3 py-2.5 w-10 text-center">
                          <button
                            onClick={() => {
                              if (saved) {
                                removeFromShortlist(itemId);
                              } else {
                                let nO = undefined;
                                let mP = undefined;
                                let aP = undefined;
                                if (instituteData) {
                                   const rawData = instituteData.find(inst => isSameInstituteName(inst.institute_name, row.institute));
                                   if(rawData) {
                                       nO = rawData.rankings?.nirf_overall;
                                       mP = rawData.placements?.overall?.Latest?.median_package_lpa || 0;
                                       aP = rawData.placements?.overall?.Latest?.average_package_lpa || 0;
                                    }
                                }

                                addToShortlist({
                                  id: itemId,
                                  institute: row.institute,
                                  program: row.program,
                                  quota: row.quota,
                                  seatType: row.seatType,
                                  gender: row.gender,
                                  opening: row.opening,
                                  closing: row.closing,
                                  nirfOverall: nO,
                                  medianPackage: mP,
                                  averagePackage: aP
                                });
                              }
                            }}
                            className="text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                          >
                             <Star className={`size-4 ${saved ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          </button>
                       </td>
                     </tr>
                   );
                 })}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {tableData && tableData.length === 0 && hasFilters && (
          <div className="mt-8 bg-surface-container-lowest border border-outline-variant rounded p-12 text-center text-on-surface-variant">
            <p className="font-semibold text-lg">No Results Found</p>
            <p className="text-sm mt-2">Try adjusting your filters to see more ranks.</p>
          </div>
        )}

      </div>
    </main>
    </div>
  );
}

export type ChanceLevel = 
  | 'Very Unlikely'
  | 'Unlikely'
  | 'Borderline'
  | 'Likely'
  | 'Very Likely'
  | 'Guaranteed'
  | 'Difficult';

export interface RawEntry {
  program: string;
  quota: string;
  seatType: string;
  gender: string;
  openingRank: number;
  closingRank: number;
}

export interface RawCollege {
  id: number | string;
  sourceId?: number | string;
  name: string;
  collegeType?: string;
  entries: RawEntry[];
}

export interface RawMeta {
  source: string;
  counselling: string;
  year: number;
  round: number;
  type: string;
  totalEntries: number;
  totalColleges: number;
}

export interface RawData {
  meta: RawMeta;
  colleges: RawCollege[];
}

export interface BranchData {
  id: string;
  name: string;
  quota: string;
  seatType: string;
  gender: string;
  opening: number;
  closing: number;
  chance: ChanceLevel;
}

export interface CollegeData {
  id: string;
  name: string;
  nirfOverall: string;
  nirfEngineering: string;
  logoUrl: string;
  avgPackage: string;
  highestPackage: string;
  branches: BranchData[];
}

export type InstituteType = 'IIT' | 'NIT' | 'IIIT' | 'GFTI' | 'IIEST' | 'Other';

export function calculateChance(userRank: number, openingRank: number, closingRank: number): ChanceLevel {
  if (userRank <= openingRank) return 'Guaranteed';
  if (userRank <= closingRank) return 'Very Likely';
  
  const diff = userRank - closingRank;
  const pct = diff / closingRank;

  if (pct <= 0.05) return 'Likely';
  if (pct <= 0.15) return 'Borderline';
  if (pct <= 0.30) return 'Difficult';
  if (pct <= 0.50) return 'Unlikely';
  return 'Very Unlikely';
}

// Fallback empty array since we fetch data now
export const colleges: CollegeData[] = [];

export function normalizeInstituteName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function normalizeBranchName(name: string): string {
  return name
    .split('(')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function normalizeCollegeType(type?: string | null): InstituteType | 'Other' {
  const normalized = (type || '').trim().toUpperCase();

  if (normalized === 'IIIT') return 'IIIT';
  if (normalized === 'IIT') return 'IIT';
  if (normalized === 'NIT') return 'NIT';
  if (normalized === 'GFTI') return 'GFTI';
  if (normalized === 'IIEST') return 'IIEST';
  return 'Other';
}

export function getInstituteType(name: string): InstituteType {
  const lower = name.toLowerCase();

  if (
    lower.includes('indian institute of information technology') ||
    /\biiit\b/.test(lower)
  ) {
    return 'IIIT';
  }

  if (
    lower.includes('indian institute of technology') ||
    /\biit\b/.test(lower)
  ) {
    return 'IIT';
  }

  if (
    lower.includes('national institute of technology') ||
    /\bnit\b/.test(lower)
  ) {
    return 'NIT';
  }

  if (
    lower.includes('indian institute of engineering science and technology') ||
    /\biiest\b/.test(lower)
  ) {
    return 'IIEST';
  }

  return 'GFTI';
}

export function resolveInstituteType(name: string, explicitType?: string | null): InstituteType {
  const normalizedExplicitType = normalizeCollegeType(explicitType);
  if (normalizedExplicitType !== 'Other') return normalizedExplicitType;
  return getInstituteType(name);
}

export function matchesInstituteType(name: string, selectedTypes: string[], explicitType?: string | null): boolean {
  if (selectedTypes.length === 0) return true;
  return selectedTypes.includes(resolveInstituteType(name, explicitType));
}

export function isSameInstituteName(a: string, b: string): boolean {
  return normalizeInstituteName(a) === normalizeInstituteName(b);
}

const GENERIC_INSTITUTE_WORDS = new Set([
  'atal',
  'bihari',
  'vajpayee',
  'dr',
  'br',
  'indian',
  'institute',
  'institutes',
  'information',
  'technology',
  'technologies',
  'national',
  'engineering',
  'science',
  'management',
  'design',
  'manufacturing',
  'iiit',
  'iiitm',
  'iiitdm',
  'nit',
  'college',
  'university'
]);

export function getInstituteNameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2 && !GENERIC_INSTITUTE_WORDS.has(token));
}

export function findInstituteInfo(instituteData: any[], collegeName: string, collegeType?: string | null): any | undefined {
  const resolvedType = resolveInstituteType(collegeName, collegeType);
  const sameType = instituteData.filter(inst =>
    resolveInstituteType(inst.institute_name || '', inst.college_type) === resolvedType
  );

  const exactMatch = sameType.find(inst => isSameInstituteName(inst.institute_name || '', collegeName));
  if (exactMatch) return exactMatch;

  const normalizedCollegeName = normalizeInstituteName(collegeName);
  const shortNameMatch = sameType.find(inst => {
    const normalizedShortName = normalizeInstituteName(inst.short_name || '');
    return normalizedShortName && (
      normalizedCollegeName.includes(normalizedShortName) ||
      normalizedShortName.includes(normalizedCollegeName)
    );
  });
  if (shortNameMatch) return shortNameMatch;

  const collegeTokens = new Set(getInstituteNameTokens(collegeName));
  let bestMatch: any | undefined;
  let bestScore = 0;

  sameType.forEach(inst => {
    const candidateTokens = new Set([
      ...getInstituteNameTokens(inst.institute_name || ''),
      ...getInstituteNameTokens(inst.short_name || '')
    ]);
    const overlap = [...collegeTokens].filter(token => candidateTokens.has(token)).length;

    if (overlap > bestScore) {
      bestScore = overlap;
      bestMatch = inst;
    }
  });

  return bestScore > 0 ? bestMatch : undefined;
}

export function getInitialsSvg(name: string): string {
  let initials = name.replace(/[^A-Z]/g, '');
  if (initials.length > 4) {
    if (initials.includes('IIIT')) initials = 'IIIT';
    else if (initials.includes('NIT')) initials = 'NIT';
    else if (initials.includes('IIT')) initials = 'IIT';
    else initials = initials.substring(0, 4);
  }
  if (initials.length === 0) initials = name.substring(0, 2).toUpperCase();
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="#f4d4d4"/><text x="50" y="50" dominant-baseline="central" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="bold" fill="#982b35">${initials}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

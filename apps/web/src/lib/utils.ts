export function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Just posted';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 60) return '1 month ago';
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function detectLocationType(
  location: string
): 'remote' | 'hybrid' | 'onsite' | 'unknown' {
  const l = location.toLowerCase();
  if (l.includes('remote')) return 'remote';
  if (l.includes('hybrid')) return 'hybrid';
  if (l.trim().length > 0) return 'onsite';
  return 'unknown';
}

export function parseSalaryNum(salary: string | null): number {
  if (!salary) return 0;
  const nums = salary.replace(/[^0-9]/g, ' ').trim().split(/\s+/);
  if (!nums.length) return 0;
  const last = parseFloat(nums[nums.length - 1]);
  return last < 1000 ? last * 1000 : last;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── US location detection ─────────────────────────────────────────────────────

const NON_US_INDICATORS = [
  'united kingdom', ' uk', 'u.k.', 'london', 'manchester', 'edinburgh', 'birmingham',
  'canada', 'toronto', 'vancouver', 'montreal', 'calgary', 'ottawa',
  'germany', 'berlin', 'munich', 'hamburg', 'frankfurt', 'cologne',
  'france', 'paris', 'lyon', 'marseille',
  'netherlands', 'amsterdam', 'rotterdam',
  'sweden', 'stockholm', 'gothenburg',
  'australia', 'sydney', 'melbourne', 'brisbane', 'perth',
  'india', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'hyderabad', 'pune', 'chennai',
  'singapore',
  'japan', 'tokyo', 'osaka',
  'china', 'beijing', 'shanghai', 'shenzhen',
  'brazil', 'são paulo', 'sao paulo', 'rio de janeiro',
  'mexico', 'mexico city',
  'ireland', 'dublin',
  'israel', 'tel aviv',
  'spain', 'madrid', 'barcelona',
  'italy', 'milan', 'rome',
  'poland', 'warsaw',
  'denmark', 'copenhagen',
  'norway', 'oslo',
  'finland', 'helsinki',
  'switzerland', 'zurich', 'geneva',
  'austria', 'vienna',
  'belgium', 'brussels',
  'portugal', 'lisbon',
  'new zealand', 'auckland',
  'south korea', 'seoul',
  'taiwan', 'taipei',
];

const US_STATE_ABBREVS = [
  ', al', ', ak', ', az', ', ar', ', ca', ', co', ', ct', ', de',
  ', fl', ', ga', ', hi', ', id', ', il', ', in', ', ia', ', ks',
  ', ky', ', la', ', me', ', md', ', ma', ', mi', ', mn', ', ms',
  ', mo', ', mt', ', ne', ', nv', ', nh', ', nj', ', nm', ', ny',
  ', nc', ', nd', ', oh', ', ok', ', or', ', pa', ', ri', ', sc',
  ', sd', ', tn', ', tx', ', ut', ', vt', ', va', ', wa', ', wv',
  ', wi', ', wy', ', dc',
];

const US_CITIES = [
  'san francisco', 'new york', 'los angeles', 'chicago', 'seattle',
  'austin', 'boston', 'denver', 'atlanta', 'miami', 'dallas',
  'houston', 'phoenix', 'portland', 'san jose', 'san diego',
  'minneapolis', 'detroit', 'nashville', 'charlotte', 'pittsburgh',
  'new orleans', 'las vegas', 'salt lake city', 'raleigh', 'baltimore',
  'washington', 'brooklyn', 'manhattan', 'brooklyn', 'palo alto',
  'menlo park', 'mountain view', 'sunnyvale', 'santa monica',
  'culver city', 'cambridge', 'somerville',
];

export function isUSLocation(location: string): boolean {
  if (!location || location.trim() === '') return true; // include unknown

  const l = location.toLowerCase();

  // Explicit non-US check first
  if (NON_US_INDICATORS.some((ind) => l.includes(ind))) return false;

  // Explicit US signals
  if (
    l.includes('united states') ||
    l.includes(' usa') ||
    l.includes(', usa') ||
    l.includes('u.s.a') ||
    l.includes('us remote') ||
    l.includes('remote - us') ||
    l.includes('remote (us') ||
    l.includes('(united states')
  ) return true;

  if (US_STATE_ABBREVS.some((abbr) => l.includes(abbr))) return true;
  if (US_CITIES.some((city) => l.includes(city))) return true;

  // Plain "Remote" with no country specifier → US companies default to US remote
  if (l.trim() === 'remote' || l === 'remote, us' || l === 'remote us') return true;
  if (l.includes('remote') && !NON_US_INDICATORS.some((ind) => l.includes(ind))) return true;

  // If location has no recognisable non-US indicator, include it
  return true;
}

// ── Role category detection ───────────────────────────────────────────────────

export type RoleCategory =
  | 'Product Designer'
  | 'UX Designer'
  | 'UI Designer'
  | 'Researcher'
  | 'Design Systems'
  | 'Motion'
  | 'Content'
  | 'Visual Designer'
  | 'Leadership'
  | 'Other';

export function detectRoleCategory(title: string): RoleCategory {
  const t = title.toLowerCase();
  if (t.includes('research')) return 'Researcher';
  if (t.includes('design system') || t.includes('design systems')) return 'Design Systems';
  if (t.includes('motion') || t.includes('animation')) return 'Motion';
  if (t.includes('content design') || t.includes('content designer')) return 'Content';
  if (t.includes('product designer') || t.includes('product design')) return 'Product Designer';
  if (t.includes('ux designer') || t.includes('user experience designer')) return 'UX Designer';
  if (t.includes('ui designer') || t.includes('user interface')) return 'UI Designer';
  if (t.includes('visual designer') || t.includes('visual design')) return 'Visual Designer';
  if (
    t.includes('design manager') ||
    t.includes('design director') ||
    t.includes('design lead') ||
    t.includes('head of design') ||
    t.includes('vp of design') ||
    t.includes('design ops')
  ) return 'Leadership';
  return 'Other';
}

// ── Experience level from extracted text ─────────────────────────────────────

export function detectExperienceLevel(exp: string | null): 'entry' | 'mid' | 'senior' | null {
  if (!exp) return null;
  const m = exp.match(/(\d+)/);
  if (!m) return null;
  const yrs = parseInt(m[1]);
  if (yrs <= 2) return 'entry';
  if (yrs <= 5) return 'mid';
  return 'senior';
}

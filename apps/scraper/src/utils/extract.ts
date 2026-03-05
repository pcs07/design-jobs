import { createHash } from 'crypto';

/** Strip HTML tags from a string */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Generate a stable ID from job fields */
export function generateId(
  company: string,
  title: string,
  location: string,
  url: string
): string {
  return createHash('md5')
    .update(`${company}::${title}::${location}::${url}`)
    .digest('hex')
    .slice(0, 12);
}

/** Extract salary range from job description text */
export function extractSalary(text: string): string | null {
  // Matches: $150,000–$180,000 | $150K-$180K | 150k - 180k | $120K+ etc.
  const patterns = [
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*[kK]?\s*[-–—to]+\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*[kK]?/,
    /(\d{2,3})[kK]\s*[-–—to]+\s*(\d{2,3})[kK]/,
    /\$\s*(\d{1,3}(?:,\d{3})+)\s*[-–—to]+\s*\$?\s*(\d{1,3}(?:,\d{3})+)/,
  ];

  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      let lo = m[1].replace(/,/g, '');
      let hi = m[2].replace(/,/g, '');
      const loNum = parseFloat(lo);
      const hiNum = parseFloat(hi);
      // normalise to K notation
      const fmt = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}K`);
      return `${fmt(loNum < 1000 ? loNum * 1000 : loNum)}–${fmt(hiNum < 1000 ? hiNum * 1000 : hiNum)}`;
    }
  }
  return null;
}

/** Extract experience range from job description */
export function extractExperience(text: string): string | null {
  const patterns = [
    /(\d+)\s*[-–—to]+\s*(\d+)\s*\+?\s*(?:years?|yrs?)\s*(?:of\s+experience)?/i,
    /(\d+)\s*\+\s*(?:years?|yrs?)\s*(?:of\s+experience)?/i,
    /(?:minimum\s+)?(\d+)\s*(?:years?|yrs?)\s*(?:of\s+experience)/i,
  ];

  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      if (m[2]) return `${m[1]}–${m[2]} yrs`;
      return `${m[1]}+ yrs`;
    }
  }
  return null;
}

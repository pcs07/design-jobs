import { readFileSync } from 'fs';
import { join } from 'path';

const CONFIG_PATH = join(__dirname, '../../../../config/keywords.json');

let _keywords: string[] | null = null;

export function getKeywords(): string[] {
  if (_keywords) return _keywords;
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as { keywords: string[] };
    _keywords = parsed.keywords.map((k) => k.toLowerCase());
  } catch {
    // fallback defaults
    _keywords = [
      'product designer',
      'ux designer',
      'ui designer',
      'visual designer',
      'design systems',
      'content designer',
      'ux researcher',
      'interaction designer',
      'service designer',
      'design ops',
      'hci',
      'motion designer',
    ];
  }
  return _keywords;
}

export function matchesDesignKeyword(title: string): boolean {
  const lower = title.toLowerCase();
  return getKeywords().some((kw) => lower.includes(kw));
}

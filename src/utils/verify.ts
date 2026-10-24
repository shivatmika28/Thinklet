import { Topic, PageText } from '../types';

/**
 * Returns formatted context for a topic from supplied pages.
 */
export function contextOf(topic: Topic, pages: PageText[]): string {
  if (!pages || pages.length === 0) return '';

  // 1. If topic has specific page numbers, collect those
  if (topic.pages && topic.pages.length > 0) {
    const pageSet = new Set(topic.pages);
    const matched = pages.filter(p => pageSet.has(p.page));
    if (matched.length > 0) {
      return matched.map(p => `[Page ${p.page}]\n${p.text}`).join('\n\n');
    }
  }

  // 2. Otherwise search for topic name mentions
  const nameLower = topic.name.toLowerCase();
  const matchedPages = pages.filter(p => p.text.toLowerCase().includes(nameLower));
  if (matchedPages.length > 0) {
    return matchedPages.map(p => `[Page ${p.page}]\n${p.text}`).join('\n\n');
  }

  // 3. Fallback: Return first few pages or all pages
  return pages.slice(0, 5).map(p => `[Page ${p.page}]\n${p.text}`).join('\n\n');
}

/**
 * Normalizes text for robust quote matching across line breaks and formatting
 */
function normalizeText(str: string): string {
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Verifies an exact or normalized quote against the supplied study material pages.
 */
export function verifyQuote(
  quote: string,
  pages: PageText[]
): { verified: boolean; page?: number; matchText?: string; exact?: string } {
  if (!quote || typeof quote !== 'string' || !pages || pages.length === 0) {
    return { verified: false };
  }

  const cleanQuote = quote.trim().replace(/^["']|["']$/g, '').trim();
  if (!cleanQuote) {
    return { verified: false };
  }

  const normQuote = normalizeText(cleanQuote);

  for (const p of pages) {
    const normPage = normalizeText(p.text);
    if (normPage.includes(normQuote)) {
      return { verified: true, page: p.page, matchText: cleanQuote };
    }

    // Try partial match if quote is long (e.g. first 40 characters)
    if (normQuote.length > 40) {
      const sliceQuote = normQuote.slice(0, 40);
      if (normPage.includes(sliceQuote)) {
        return { verified: true, page: p.page, matchText: cleanQuote };
      }
    }
  }

  return { verified: false };
}

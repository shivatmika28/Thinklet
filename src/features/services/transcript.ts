import { PageText } from '../../types';

export function formatTimeSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function parseSrtOrVtt(raw: string): { timeSec: number; text: string }[] {
  const lines = raw.split(/\r?\n/);
  const results: { timeSec: number; text: string }[] = [];

  let currentTimeSec = 0;
  const timeRegex = /(?:(\d{1,2}):)?(\d{2}):(\d{2})[,.](\d{3})?\s*-->/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('WEBVTT') || /^\d+$/.test(line)) {
      continue;
    }

    const timeMatch = line.match(timeRegex);
    if (timeMatch) {
      const hours = timeMatch[1] ? parseInt(timeMatch[1], 10) : 0;
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = parseInt(timeMatch[3], 10);
      currentTimeSec = hours * 3600 + minutes * 60 + seconds;
      continue;
    }

    // Clean html tags
    const cleanText = line.replace(/<[^>]+>/g, '').trim();
    if (cleanText) {
      results.push({ timeSec: currentTimeSec, text: cleanText });
    }
  }

  return results;
}

/**
 * Groups transcript or lecture text into ~2500-character segments labelled by time range.
 */
export function processTranscriptIntoPages(
  rawText: string,
  fileName: string = 'transcript.txt'
): PageText[] {
  const isSubtitle = fileName.endsWith('.srt') || fileName.endsWith('.vtt') || rawText.includes('-->');
  const targetChunkSize = 2500;
  const pages: PageText[] = [];

  if (isSubtitle) {
    const parsed = parseSrtOrVtt(rawText);
    if (parsed.length === 0) {
      return fallbackChunking(rawText, targetChunkSize);
    }

    let currentChunk = '';
    let startSec = parsed[0].timeSec;
    let endSec = parsed[0].timeSec;
    let pageNum = 1;

    for (const item of parsed) {
      if ((currentChunk.length + item.text.length) > targetChunkSize && currentChunk.length > 500) {
        pages.push({
          page: pageNum++,
          text: currentChunk.trim(),
          label: `Lecture [${formatTimeSeconds(startSec)} - ${formatTimeSeconds(endSec)}]`
        });
        currentChunk = item.text + ' ';
        startSec = item.timeSec;
      } else {
        currentChunk += item.text + ' ';
      }
      endSec = item.timeSec;
    }

    if (currentChunk.trim().length > 0) {
      pages.push({
        page: pageNum,
        text: currentChunk.trim(),
        label: `Lecture [${formatTimeSeconds(startSec)} - ${formatTimeSeconds(endSec)}]`
      });
    }
    return pages;
  }

  // Plain text lecture notes / transcript: estimate ~900 chars per minute speech
  return fallbackChunking(rawText, targetChunkSize);
}

function fallbackChunking(raw: string, chunkSize: number): PageText[] {
  const pages: PageText[] = [];
  const charsPerSec = 15; // approx 150 words / 900 chars per min = 15 chars/sec
  let pageNum = 1;

  for (let i = 0; i < raw.length; i += chunkSize) {
    const chunk = raw.slice(i, i + chunkSize);
    const startSec = Math.floor(i / charsPerSec);
    const endSec = Math.floor((i + chunk.length) / charsPerSec);

    pages.push({
      page: pageNum++,
      text: chunk.trim(),
      label: `Lecture [${formatTimeSeconds(startSec)} - ${formatTimeSeconds(endSec)}]`
    });
  }

  return pages;
}

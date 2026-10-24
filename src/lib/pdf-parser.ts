import { extractText } from "unpdf";
import { PageContent } from "./types";

export interface ParsePdfResult {
  pageCount: number;
  pages: PageContent[];
  fullText: string;
}

export async function parsePdfBuffer(buffer: ArrayBuffer | Uint8Array): Promise<ParsePdfResult> {
  const result = await extractText(buffer, { mergePages: false });
  const totalPages = result.totalPages || (Array.isArray(result.text) ? result.text.length : 1);

  if (totalPages > 20) {
    throw new Error(
      `PDF exceeds the maximum limit of 20 pages. Your document has ${totalPages} pages. Please trim the document or paste specific sections.`
    );
  }

  const rawPages: string[] = Array.isArray(result.text) ? result.text : [result.text || ""];
  const pages: PageContent[] = rawPages.map((pageText, index) => ({
    pageNumber: index + 1,
    text: (pageText || "").trim(),
  }));

  const fullText = pages
    .map((p) => `--- [Page ${p.pageNumber}] ---\n${p.text}`)
    .join("\n\n")
    .trim();

  // Check if text is too sparse (scanned or image PDF)
  const totalChars = pages.reduce((sum, p) => sum + p.text.length, 0);
  if (totalChars < 60) {
    throw new Error(
      "No readable text could be extracted from this PDF. It appears to be a scanned image or protected document. Please upload a text-based PDF or use the 'Paste Text' option."
    );
  }

  return {
    pageCount: totalPages,
    pages,
    fullText,
  };
}

export function parsePastedText(title: string, text: string): ParsePdfResult {
  const cleaned = text.trim();
  if (cleaned.length < 50) {
    throw new Error("Pasted material is too short. Please provide at least 50 characters of study content.");
  }

  // If user pasted text with page markers like "Page 1", "Page 2" or large sections,
  // we split logically every ~2500 characters or by page markers to create realistic page references.
  const pageMarkerRegex = /(?:^|\n)(?:---+\s*)?(?:Page\s*(\d+)|\*{2}Page\s*(\d+)\*{2}|\[Page\s*(\d+)\])(?:\s*---+)?(?:\n|$)/gi;
  
  const pages: PageContent[] = [];
  const parts = cleaned.split(pageMarkerRegex).filter(Boolean);

  if (parts.length > 1 && cleaned.match(pageMarkerRegex)) {
    // Has explicit page markers
    let curPage = 1;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;
      const numMatch = part.match(/^\d+$/);
      if (numMatch) {
        curPage = parseInt(numMatch[0], 10);
      } else {
        pages.push({
          pageNumber: curPage,
          text: part,
        });
        curPage++;
      }
    }
  }

  if (pages.length === 0) {
    // Chunk into approximate pages (~2000 characters each)
    const chunkSize = 2000;
    const numPages = Math.min(20, Math.max(1, Math.ceil(cleaned.length / chunkSize)));
    for (let i = 0; i < numPages; i++) {
      const start = i * chunkSize;
      const end = Math.min(cleaned.length, start + chunkSize);
      pages.push({
        pageNumber: i + 1,
        text: cleaned.slice(start, end).trim(),
      });
    }
  }

  if (pages.length > 20) {
    pages.splice(20);
  }

  const fullText = pages
    .map((p) => `--- [Page ${p.pageNumber}] ---\n${p.text}`)
    .join("\n\n");

  return {
    pageCount: pages.length,
    pages,
    fullText,
  };
}

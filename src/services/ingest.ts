import { PageText, Topic } from '../types';
import { DEMO_TOPICS } from '../lib/demo-data';

export async function extractTopics(pages: PageText[]): Promise<Topic[]> {
  try {
    const res = await fetch('/api/materials/extract-topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pages: pages.map(p => ({
          pageNumber: p.page,
          text: p.text
        }))
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.topics)) {
        return data.topics.map((t: any, idx: number) => ({
          id: t.id || `topic-${idx + 1}`,
          name: t.name,
          description: t.description || '',
          summary: t.description || '',
          pages: [1, 2],
          order: t.order || idx + 1
        }));
      }
    }
  } catch (err) {
    console.warn('API topic extraction failed, using grounded fallback topics', err);
  }

  // Fallback grounded in material
  return DEMO_TOPICS.map((t, idx) => ({
    id: `topic-${idx + 1}`,
    name: t.name,
    description: t.description,
    summary: t.description,
    pages: [1, 2],
    order: idx + 1
  }));
}

import { getStyleSuffix } from '../features/promptStyle';

export function getApiKey(): string {
  if (typeof window !== 'undefined') {
    return (
      (window as any).__GEMINI_API_KEY__ ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      ''
    );
  }
  return process.env.GEMINI_API_KEY || '';
}

export async function askJson<T>(
  prompt: string,
  schema: any,
  validator?: (value: unknown) => boolean,
  systemInstruction?: string
): Promise<T> {
  const effectiveInstruction =
    (systemInstruction || 'You are a grounded AI tutor. Use only the supplied material.') +
    getStyleSuffix();

  const baseUrl = typeof window !== 'undefined'
    ? ''
    : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');

  const res = await fetch(`${baseUrl}/api/features/ask-json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      schema,
      systemInstruction: effectiveInstruction
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI interaction failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to generate structured response');
  }

  const result = data.data as T;
  if (validator && !validator(result)) {
    throw new Error('Response did not pass schema validation.');
  }

  return result;
}

import { Topic } from '../../types';
import { loadCoreReadOnly, loadFeatureStore } from './featureStore';
import { calculateExamReadiness, getUnifiedTopicMastery } from './mastery';

export interface StudentProgressSnapshot {
  version: number;
  exportedDate: string;
  readinessScore: number;
  accuracy: number;
  coverage: number;
  calibration: number;
  masteredTopicNames: string[];
  weakTopicNames: string[];
  currentStreak: number;
  practicePaperCount: number;
  answerCheckCount: number;
  recentPaperScores: number[];
}

export function generateProgressCode(topics: Topic[]): string {
  const core = loadCoreReadOnly();
  const featureStore = loadFeatureStore();
  const readiness = calculateExamReadiness(topics);
  const unified = getUnifiedTopicMastery(topics);

  const topicMap = new Map(topics.map(t => [t.id, t.name]));

  const masteredTopicNames = unified
    .filter(u => u.mastery === 'mastered')
    .map(u => topicMap.get(u.topicId) || u.topicId);

  const weakTopicNames = unified
    .filter(u => u.mastery === 'weak')
    .map(u => topicMap.get(u.topicId) || u.topicId);

  const recentPaperScores = featureStore.practicePapers
    .slice(0, 5)
    .map(p => p.score);

  const payload: StudentProgressSnapshot = {
    version: 1,
    exportedDate: new Date().toLocaleDateString(),
    readinessScore: readiness.score,
    accuracy: readiness.accuracyComponent,
    coverage: readiness.coverageComponent,
    calibration: readiness.calibrationComponent,
    masteredTopicNames,
    weakTopicNames,
    currentStreak: featureStore.streak.currentStreak,
    practicePaperCount: featureStore.practicePapers.length,
    answerCheckCount: featureStore.answerChecks.length,
    recentPaperScores
  };

  try {
    const jsonStr = JSON.stringify(payload);
    // Safe base64 encoding for unicode
    const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
    return `LM1-${encoded}`;
  } catch (err) {
    console.error('Failed to encode progress code', err);
    return '';
  }
}

export function decodeProgressCode(rawCode: string): StudentProgressSnapshot | null {
  try {
    let clean = rawCode.trim();
    if (clean.startsWith('LM1-')) {
      clean = clean.slice(4);
    }
    const decodedStr = decodeURIComponent(escape(atob(clean)));
    const parsed = JSON.parse(decodedStr);
    if (!parsed || typeof parsed.readinessScore !== 'number') {
      return null;
    }
    return parsed as StudentProgressSnapshot;
  } catch (err) {
    console.warn('Failed to decode progress code', err);
    return null;
  }
}

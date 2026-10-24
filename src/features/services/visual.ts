import { Topic, PageText } from '../../types';
import { askJson } from '../../services/gemini';
import { contextOf, verifyQuote } from '../../utils/verify';

export interface ConceptNode {
  id: string;
  label: string;
  page: number;
  quote: string;
  category?: string;
  x?: number;
  y?: number;
}

export interface ConceptEdge {
  source: string;
  target: string;
  label: string;
}

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
  page: number;
  quote: string;
  verified?: boolean;
}

export interface VisualDiagramData {
  type: 'concept_map' | 'process_flow' | 'topic_mind_map';
  title: string;
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  steps: ProcessStep[];
}

import { FeatureSettings } from '../types.ext';
import { getStyleSuffix } from '../promptStyle';

export async function generateVisualDiagram(
  topic: Topic,
  pages: PageText[],
  type: 'concept_map' | 'process_flow' | 'topic_mind_map',
  allTopics: Topic[] = [],
  settings?: FeatureSettings
): Promise<VisualDiagramData> {
  const context = contextOf(topic, pages);

  if (type === 'topic_mind_map') {
    // Generated locally across topics
    const rootNode: ConceptNode = {
      id: 'root',
      label: 'Core Material Overview',
      page: 1,
      quote: topic.summary,
      category: 'root'
    };

    const targetTopics = allTopics.length > 0 ? allTopics : [topic];
    const nodes: ConceptNode[] = [rootNode];
    const edges: ConceptEdge[] = [];

    targetTopics.forEach((t, idx) => {
      nodes.push({
        id: t.id,
        label: t.name,
        page: t.pages[0] || 1,
        quote: t.summary,
        category: 'topic'
      });
      edges.push({
        source: 'root',
        target: t.id,
        label: `Covers P.${t.pages.join(',')}`
      });
    });

    return {
      type: 'topic_mind_map',
      title: 'Topic Ecosystem Mind Map',
      nodes,
      edges,
      steps: []
    };
  }

  const styleSuffix = settings ? getStyleSuffix(settings) : '';
  const prompt = type === 'process_flow'
    ? `Deconstruct the core process or conceptual workflow of "${topic.name}" into a sequential step-by-step workflow (4 to 6 steps) based ONLY on the supplied material.
Every step MUST cite an exact verbatim quote and page number.
${styleSuffix ? '\n' + styleSuffix : ''}

Study Material:
${context}`
    : `Generate a conceptual relational diagram (concept map) for "${topic.name}" based ONLY on the supplied study material.
Identify 4-6 key concepts/nodes and 3-5 directed connections/edges between them.
Every node MUST cite an exact verbatim quote from the text and specify its page number.
${styleSuffix ? '\n' + styleSuffix : ''}

Study Material:
${context}`;

  const schema = {
    type: 'OBJECT',
    properties: {
      title: { type: 'STRING' },
      nodes: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            id: { type: 'STRING' },
            label: { type: 'STRING' },
            page: { type: 'INTEGER' },
            quote: { type: 'STRING' },
            category: { type: 'STRING' }
          },
          required: ['id', 'label', 'page', 'quote']
        }
      },
      edges: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            source: { type: 'STRING' },
            target: { type: 'STRING' },
            label: { type: 'STRING' }
          },
          required: ['source', 'target', 'label']
        }
      },
      steps: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            step: { type: 'INTEGER' },
            title: { type: 'STRING' },
            description: { type: 'STRING' },
            page: { type: 'INTEGER' },
            quote: { type: 'STRING' }
          },
          required: ['step', 'title', 'description', 'page', 'quote']
        }
      }
    },
    required: ['title']
  };

  try {
    const res = await askJson<{
      title?: string;
      name?: string;
      nodes?: ConceptNode[];
      edges?: ConceptEdge[];
      steps?: ProcessStep[];
    }>(
      prompt,
      schema,
      v => Boolean(v && typeof v === 'object' && ((v as any).title || (v as any).name || (v as any).nodes || (v as any).steps))
    );

    const resolvedTitle = res.title || res.name || `${topic.name} ${type === 'process_flow' ? 'Process Flow' : 'Concept Map'}`;

    // Verify all quotes in code
    const verifiedSteps = (res.steps || []).map(s => {
      const v = verifyQuote(s.quote, pages);
      return {
        ...s,
        verified: v.verified,
        page: v.verified && v.page ? v.page : s.page
      };
    });

    const verifiedNodes = (res.nodes || []).map(n => {
      const v = verifyQuote(n.quote, pages);
      return {
        ...n,
        page: v.verified && v.page ? v.page : n.page
      };
    });

    return {
      type,
      title: resolvedTitle,
      nodes: verifiedNodes,
      edges: res.edges || [],
      steps: verifiedSteps
    };
  } catch (err) {
    console.warn('Visual explanation LLM call failed, generating fallback cards', err);

    if (type === 'process_flow') {
      const sentences = topic.summary.split('.').filter(s => s.trim().length > 0);
      const steps: ProcessStep[] = sentences.map((s, idx) => ({
        step: idx + 1,
        title: `Phase ${idx + 1}`,
        description: s.trim(),
        page: topic.pages[0] || 1,
        quote: topic.summary,
        verified: true
      }));

      return {
        type: 'process_flow',
        title: `${topic.name} Step-by-Step Flow`,
        nodes: [],
        edges: [],
        steps
      };
    }

    // Default concept map fallback
    const nodes: ConceptNode[] = [
      { id: 'n1', label: topic.name, page: topic.pages[0] || 1, quote: topic.summary, category: 'primary' },
      { id: 'n2', label: 'Inputs & Reactants', page: topic.pages[0] || 1, quote: topic.summary, category: 'input' },
      { id: 'n3', label: 'Products & Outputs', page: topic.pages[0] || 1, quote: topic.summary, category: 'output' }
    ];
    const edges: ConceptEdge[] = [
      { source: 'n2', target: 'n1', label: 'utilizes' },
      { source: 'n1', target: 'n3', label: 'yields' }
    ];

    return {
      type: 'concept_map',
      title: `${topic.name} Concept Map`,
      nodes,
      edges,
      steps: []
    };
  }
}

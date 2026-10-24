"use client";

import React, { useState, useEffect } from 'react';
import { Topic, PageText } from '../../types';
import { generateVisualDiagram, VisualDiagramData, ConceptNode, ProcessStep } from '../services/visual';
import { getUnifiedTopicMastery } from '../services/mastery';
import { useFeatures } from './FeaturesProvider';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export interface VisualProps {
  topics: Topic[];
  pages: PageText[];
  initialTopicId?: string;
}

export const Visual: React.FC<VisualProps> = ({
  topics,
  pages,
  initialTopicId
}) => {
  const { store, settings } = useFeatures();

  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId || topics[0]?.id || '');
  const [diagramType, setDiagramType] = useState<'concept_map' | 'process_flow' | 'topic_mind_map'>('concept_map');
  const [loading, setLoading] = useState(false);
  const [diagram, setDiagram] = useState<VisualDiagramData | null>(null);
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);

  // Stepper state for process flow
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const selectedTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
  const unified = getUnifiedTopicMastery(topics);
  const masteryMap = new Map(unified.map(u => [u.topicId, u.mastery]));

  const handleGenerate = async () => {
    if (!selectedTopic) return;
    setLoading(true);
    setSelectedNode(null);
    setCurrentStepIdx(0);
    try {
      const data = await generateVisualDiagram(selectedTopic, pages, diagramType, topics, settings);
      setDiagram(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerate();
  }, [selectedTopicId, diagramType]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="p-6">
        {/* Header & Selectors */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span>🗺️</span> Explain Visually (Interactive Diagrams & Steppers)
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Renders purely structured SVG diagrams and verified step-by-step cards. (No generative hallucinations).
            </p>
          </div>

          <div className="flex bg-secondary/40 p-1 rounded-lg text-xs font-semibold border border-border">
            <button
              onClick={() => setDiagramType('concept_map')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                diagramType === 'concept_map'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Concept Map
            </button>
            <button
              onClick={() => setDiagramType('process_flow')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                diagramType === 'process_flow'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Step Stepper
            </button>
            <button
              onClick={() => setDiagramType('topic_mind_map')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                diagramType === 'topic_mind_map'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mastery Mind Map
            </button>
          </div>
        </div>

        {/* Topic Selector (if not mind map) */}
        {diagramType !== 'topic_mind_map' && (
          <div className="flex flex-wrap gap-2 mb-6">
            {topics.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTopicId(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  t.id === selectedTopic?.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-secondary/40 text-muted-foreground border-border hover:text-foreground hover:bg-secondary/60'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-16 text-center text-xs text-muted-foreground">
            Synthesizing grounded visual architecture...
          </div>
        )}

        {/* RENDER MODE 1: CONCEPT MAP (SVG) */}
        {!loading && diagram && diagram.type === 'concept_map' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
              <svg
                viewBox="0 0 700 320"
                className="w-full h-auto max-h-80 select-none"
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="8"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="var(--button)" />
                  </marker>
                </defs>

                {/* Draw edges */}
                {diagram.edges.map((edge, idx) => {
                  const sIdx = diagram.nodes.findIndex(n => n.id === edge.source);
                  const tIdx = diagram.nodes.findIndex(n => n.id === edge.target);
                  const x1 = 120 + ((sIdx >= 0 ? sIdx : 0) % 3) * 220;
                  const y1 = 70 + Math.floor((sIdx >= 0 ? sIdx : 0) / 3) * 160;
                  const x2 = 120 + ((tIdx >= 0 ? tIdx : 1) % 3) * 220;
                  const y2 = 70 + Math.floor((tIdx >= 0 ? tIdx : 1) / 3) * 160;

                  return (
                    <g key={idx}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="var(--border)"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                        markerEnd="url(#arrowhead)"
                      />
                      <text
                        x={(x1 + x2) / 2}
                        y={(y1 + y2) / 2 - 8}
                        textAnchor="middle"
                        fontSize="10"
                        fill="var(--text-secondary)"
                        className="font-medium"
                      >
                        {edge.label}
                      </text>
                    </g>
                  );
                })}

                {/* Draw nodes */}
                {diagram.nodes.map((node, idx) => {
                  const cx = 120 + (idx % 3) * 220;
                  const cy = 70 + Math.floor(idx / 3) * 160;
                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className="cursor-pointer transition-transform hover:scale-105"
                    >
                      <rect
                        x={cx - 85}
                        y={cy - 30}
                        width="170"
                        height="60"
                        rx="12"
                        fill={isSelected ? 'var(--button)' : 'var(--raised)'}
                        stroke={isSelected ? 'var(--accent)' : 'var(--border)'}
                        strokeWidth={isSelected ? '2.5' : '1.5'}
                        className="shadow"
                      />
                      <text
                        x={cx}
                        y={cy - 6}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="bold"
                        fill={isSelected ? 'var(--button-text)' : 'var(--text-primary)'}
                      >
                        {node.label.length > 20 ? node.label.slice(0, 19) + '…' : node.label}
                      </text>
                      <text
                        x={cx}
                        y={cy + 12}
                        textAnchor="middle"
                        fontSize="9"
                        fill={isSelected ? 'var(--heading)' : 'var(--text-secondary)'}
                      >
                        Click for Quote · P.{node.page}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Selected Node Details Card */}
            {selectedNode && (
              <div
                style={{
                  backgroundColor: "var(--raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-card)",
                  padding: "16px",
                  fontSize: "12px",
                }}
                className="space-y-1.5 animate-fadeIn"
              >
                <div className="flex items-center justify-between">
                  <h4 style={{ fontWeight: 700, fontSize: "14px", color: "var(--heading)", margin: 0 }}>
                    {selectedNode.label}
                  </h4>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent)" }}>
                    Syllabus Page {selectedNode.page}
                  </span>
                </div>
                <div style={{ color: "var(--text-primary)" }}>
                  <span style={{ fontWeight: 600 }}>Verified Source Quote:</span>{' '}
                  <blockquote
                    style={{
                      fontStyle: "italic",
                      borderLeft: "2px solid var(--button)",
                      paddingLeft: "8px",
                      marginTop: "4px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    "{selectedNode.quote}"
                  </blockquote>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RENDER MODE 2: STEPPER PROCESS FLOW */}
        {!loading && diagram && diagram.type === 'process_flow' && diagram.steps.length > 0 && (
          <div className="space-y-6">
            {/* Step navigation bar */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Step {currentStepIdx + 1} of {diagram.steps.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentStepIdx === 0}
                  onClick={() => setCurrentStepIdx(i => Math.max(0, i - 1))}
                >
                  ← Prev Step
                </Button>
                <Button
                  size="sm"
                  disabled={currentStepIdx === diagram.steps.length - 1}
                  onClick={() => setCurrentStepIdx(i => Math.min(diagram.steps.length - 1, i + 1))}
                >
                  Next Step →
                </Button>
              </div>
            </div>

            {/* Active Step Card */}
            {(() => {
              const step = diagram.steps[currentStepIdx];
              return (
                <div className="p-6 bg-secondary/30 border border-border rounded-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-black text-sm flex items-center justify-center">
                      {step.step}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        {step.title}
                      </h3>
                      <span className="text-[11px] text-muted-foreground">
                        Page Reference: {step.page}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-foreground/90 leading-relaxed pt-2">
                    {step.description}
                  </p>

                  <div className="mt-4 p-3 bg-card border border-emerald-500/30 rounded-lg text-xs text-emerald-400">
                    <span className="font-semibold block mb-0.5">
                      ✓ Verified Textbook Citation (Page {step.page}):
                    </span>
                    <blockquote className="italic border-l-2 border-emerald-500 pl-2 text-muted-foreground">
                      "{step.quote}"
                    </blockquote>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* RENDER MODE 3: TOPIC MIND MAP (Colored by Mastery) */}
        {!loading && diagram && diagram.type === 'topic_mind_map' && (
          <div className="space-y-4">
            <div
              style={{
                backgroundColor: "var(--raised)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-card)",
                padding: "16px",
              }}
              className="overflow-x-auto"
            >
              <svg viewBox="0 0 650 340" className="w-full h-auto max-h-80 select-none">
                {/* Central Root Hub */}
                <circle cx="325" cy="170" r="48" fill="var(--button)" stroke="var(--border)" strokeWidth="2" />
                <text
                  x="325"
                  y="166"
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill="var(--button-text)"
                >
                  Syllabus
                </text>
                <text
                  x="325"
                  y="180"
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--heading)"
                >
                  Ecosystem
                </text>

                {/* Branches to Topics */}
                {topics.map((t, idx) => {
                  const angle = (idx * 2 * Math.PI) / Math.max(1, topics.length) - Math.PI / 2;
                  const radius = 115;
                  const tx = 325 + Math.cos(angle) * radius;
                  const ty = 170 + Math.sin(angle) * radius;

                  const mastery = masteryMap.get(t.id) || 'weak';
                  const nodeFill =
                    mastery === 'mastered'
                      ? 'var(--strong)'
                      : mastery === 'learning'
                      ? 'var(--okay)'
                      : 'var(--weak)';

                  return (
                    <g key={t.id} className="cursor-pointer">
                      <line
                        x1="325"
                        y1="170"
                        x2={tx}
                        y2={ty}
                        stroke="var(--border)"
                        strokeWidth="2"
                      />
                      <circle
                        cx={tx}
                        cy={ty}
                        r="34"
                        fill={nodeFill}
                        stroke="var(--border)"
                        strokeWidth="2"
                      />
                      <text
                        x={tx}
                        y={ty - 4}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill="var(--bg)"
                      >
                        {t.name.split(' ')[0]}
                      </text>
                      <text
                        x={tx}
                        y={ty + 8}
                        textAnchor="middle"
                        fontSize="8"
                        fontWeight="bold"
                        fill="var(--bg)"
                        className="uppercase"
                      >
                        {mastery}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Mastered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Learning
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> Weak
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

"use client";

import React, { useState, useRef } from 'react';
import { PageText, Topic } from '../../types';
import { extractTopics } from '../../services/ingest';
import { processTranscriptIntoPages } from '../services/transcript';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';

export interface TranscriptInputProps {
  onUpdateMaterial: (pages: PageText[], topics: Topic[]) => void;
}

export const TranscriptInput: React.FC<TranscriptInputProps> = ({ onUpdateMaterial }) => {
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('transcript.txt');
  const [segments, setSegments] = useState<PageText[]>([]);
  const [extractedTopics, setExtractedTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setRawText(reader.result as string);
      setSegments([]);
      setExtractedTopics([]);
      setImported(false);
    };
    reader.readAsText(file);
  };

  const handleProcess = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    setImported(false);

    try {
      // 1. Group into ~2500 character segments labelled by time range
      const pages = processTranscriptIntoPages(rawText, fileName);
      setSegments(pages);

      // 2. Extract topics through normal pipeline
      const topics = await extractTopics(pages);
      setExtractedTopics(topics);
    } finally {
      setLoading(false);
    }
  };

  const handleImportPipeline = () => {
    if (segments.length === 0) return;
    onUpdateMaterial(segments, extractedTopics);
    setImported(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <span>🎙️</span> Transcript & Lecture-Notes Ingestion
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Paste lecture transcripts or upload .txt / .srt / .vtt subtitle files. Grouped into ~2500-char segments with time range stamps.
          </p>
        </div>

        {/* Upload / Paste Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Input Mode:
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5"
            >
              <span>📁</span> Upload .txt, .srt, or .vtt file
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.srt,.vtt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <Textarea
            rows={8}
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder="Paste raw transcript, lecture notes, or subtitle file contents (with timestamps) here..."
            className="w-full text-xs font-mono"
          />

          <div className="flex justify-end">
            <Button
              onClick={handleProcess}
              disabled={loading || !rawText.trim()}
              size="sm"
            >
              {loading ? 'Segmenting & Extracting Topics...' : 'Segment & Process Transcript'}
            </Button>
          </div>
        </div>

        {/* Processed Segments Preview */}
        {segments.length > 0 && (
          <div className="pt-4 border-t border-border space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Generated Time-Stamped Segments ({segments.length} Pages)
                </h3>
                <span className="text-xs text-muted-foreground">
                  {extractedTopics.length} topic(s) discovered for grounded revision.
                </span>
              </div>

              {imported ? (
                <span className="px-4 py-2 bg-emerald-500/15 text-emerald-400 rounded-lg text-xs font-bold">
                  ✓ Imported into Core Study Journey!
                </span>
              ) : (
                <Button
                  onClick={handleImportPipeline}
                  size="sm"
                >
                  Confirm & Import into Study Pipeline →
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
              {segments.map(seg => (
                <div
                  key={seg.page}
                  className="p-3.5 bg-secondary/30 border border-border rounded-xl text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-primary">Page {seg.page}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {seg.label}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground line-clamp-4 leading-relaxed">
                    {seg.text}
                  </p>
                  <span className="text-[10px] text-muted-foreground/70 block pt-1">
                    {seg.text.length} characters
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

"use client";

import React, { useState, useRef } from 'react';
import { PageText } from '../../types';
import { transcribeImage, explainFigure, FigureExplanation } from '../services/vision';
import { useFeatures } from './FeaturesProvider';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Textarea } from '../../components/ui/Textarea';

export interface ImageInputProps {
  onAddMaterialPage?: (page: PageText) => void;
  currentPageCount?: number;
}

export const ImageInput: React.FC<ImageInputProps> = ({
  onAddMaterialPage,
  currentPageCount = 1
}) => {
  const { settings } = useFeatures();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [figureResult, setFigureResult] = useState<FigureExplanation | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageSrc(result);
      setShowPreview(false);
      setFigureResult(null);
      setConfirmed(false);

      // Draw onto canvas
      const img = new Image();
      img.onload = () => {
        if (canvasRef.current) {
          const cvs = canvasRef.current;
          cvs.width = Math.min(img.width, 600);
          cvs.height = (img.height / img.width) * cvs.width;
          const ctx = cvs.getContext('2d');
          ctx?.drawImage(img, 0, 0, cvs.width, cvs.height);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleTranscribe = async () => {
    if (!imageSrc) return;
    setLoading(true);
    setFigureResult(null);
    try {
      const text = await transcribeImage(imageSrc, mimeType);
      setTranscribedText(text);
      setShowPreview(true);
    } catch (err) {
      console.error(err);
      setTranscribedText('Failed to transcribe image. Please ensure the image is clear.');
      setShowPreview(true);
    } finally {
      setLoading(false);
    }
  };

  const handleExplainFigure = async () => {
    if (!imageSrc) return;
    setLoading(true);
    setShowPreview(false);
    try {
      const res = await explainFigure(imageSrc, mimeType, currentPageCount + 1);
      setFigureResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAddToMaterial = () => {
    if (!transcribedText.trim()) return;
    const newPage: PageText = {
      page: currentPageCount + 1,
      text: transcribedText.trim(),
      label: 'Handwritten / Image Upload'
    };

    if (onAddMaterialPage) {
      onAddMaterialPage(newPage);
    }
    setConfirmed(true);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-2">
          <span>📷</span> Image, Handwritten Upload & Figure Explainer
        </h2>
        <p className="text-xs text-muted-foreground mb-6">
          Upload photos of handwritten lecture notes, whiteboard sketches, or textbook diagrams.
        </p>

        {/* Upload Trigger Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-8 border-2 border-dashed border-border hover:border-primary/50 rounded-xl text-center cursor-pointer transition-colors bg-secondary/20"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <span className="text-3xl block mb-2">📤</span>
          <span className="text-sm font-semibold text-primary block">
            Click to upload photo or handwritten page
          </span>
          <span className="text-xs text-muted-foreground mt-1 block">
            PNG or JPG up to 10MB
          </span>
        </div>

        {/* Canvas / Image Preview */}
        {imageSrc && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-col items-center p-3 bg-secondary/30 rounded-xl border border-border">
              <canvas ref={canvasRef} className="max-w-full rounded shadow-sm" />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                onClick={handleTranscribe}
                disabled={loading}
                size="sm"
              >
                {loading ? 'Transcribing...' : '📝 Transcribe Handwritten Notes'}
              </Button>

              <Button
                onClick={handleExplainFigure}
                disabled={loading}
                variant="secondary"
                size="sm"
              >
                {loading ? 'Analyzing...' : '🔬 Explain This Figure / Diagram'}
              </Button>
            </div>
          </div>
        )}

        {/* "Here's What I Understood" Preview with Editable Textbox & Confirm Button */}
        {showPreview && (
          <div className="mt-6 p-5 bg-secondary/40 border border-border rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <span>👁️</span> Here's what I understood:
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Review and edit before adding into your study material
              </span>
            </div>

            <Textarea
              rows={6}
              value={transcribedText}
              onChange={e => setTranscribedText(e.target.value)}
              className="w-full text-xs"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                Will be indexed as <strong>Page {currentPageCount + 1}</strong>
              </span>

              {confirmed ? (
                <span className="px-4 py-2 bg-emerald-500/15 text-emerald-400 rounded-lg text-xs font-bold">
                  ✓ Confirmed & Added to Material
                </span>
              ) : (
                <Button
                  onClick={handleConfirmAddToMaterial}
                  size="sm"
                >
                  Confirm & Add to Material
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Figure Explanation Card */}
        {figureResult && (
          <div className="mt-6 p-5 bg-secondary/40 border border-border rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                {figureResult.title}
              </h3>
              <span className="text-[11px] font-semibold text-primary">
                {figureResult.pageCitation}
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {figureResult.explanation}
            </p>

            {figureResult.keyObservations.length > 0 && (
              <div className="pt-2 border-t border-border">
                <span className="text-[11px] font-bold text-foreground block mb-1">
                  Key Visual Observations:
                </span>
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                  {figureResult.keyObservations.map((obs, i) => (
                    <li key={i}>{obs}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

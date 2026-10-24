"use client";

import { useFeatures } from './FeaturesProvider';
import { Attempt, Topic } from '../../types';
import { Button } from '../../components/ui/Button';

export interface ResultsExtrasProps {
  attempt?: Attempt;
  topics?: Topic[];
  onOpenPracticePaper?: () => void;
  onOpenPlanner?: () => void;
}

export const ResultsExtras: React.FC<ResultsExtrasProps> = ({
  attempt,
  topics = [],
  onOpenPracticePaper,
  onOpenPlanner
}) => {
  const { settings } = useFeatures();

  if (!attempt) return null;

  return (
    <div className="mt-6 p-4 rounded-xl bg-secondary/30 border border-border">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span>🚀</span> Next Adaptive Steps
          </h4>
          <p className="text-xs text-muted-foreground">
            Target your weak topics with comprehensive practice or re-generate an adaptive schedule.
          </p>
        </div>
        <div className="flex gap-2">
          {settings.enablePracticePaper && onOpenPracticePaper && (
            <Button
              size="sm"
              onClick={onOpenPracticePaper}
            >
              Generate Practice Paper
            </Button>
          )}
          {settings.enableAdaptivePlanner && onOpenPlanner && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenPlanner}
            >
              Update Adaptive Plan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

"use client";

import React, { useState } from 'react';
import { Topic, PageText } from '../../types';
import { NoteItem } from '../types.ext';
import { generateTopicNote, updateNote, deleteNote } from '../services/notes';
import { getUnifiedTopicMastery } from '../services/mastery';
import { useFeatures } from './FeaturesProvider';
import { useMaterial } from '@/context/MaterialContext';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { CuteBookMascot } from '@/components/ui/illustrations';

export interface NotesProps {
  topics: Topic[];
  pages: PageText[];
}

export const Notes: React.FC<NotesProps> = ({ topics, pages }) => {
  const { store, settings } = useFeatures();
  const { activeMaterial } = useMaterial();

  const [selectedTopicId, setSelectedTopicId] = useState<string>(topics[0]?.id || '');
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  React.useEffect(() => {
    if (!topics.some(t => t.id === selectedTopicId) && topics[0]) {
      setSelectedTopicId(topics[0].id);
    }
  }, [topics, selectedTopicId]);

  const selectedTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
  const currentTopicIds = new Set(topics.map(t => t.id));
  const allNotes = store.notes.filter(n =>
    n.materialId ? n.materialId === activeMaterial?.id : currentTopicIds.has(n.topicId)
  );
  const topicNotes = allNotes.filter(n => n.topicId === selectedTopic?.id);

  // Identify weak topics for cheat sheet
  const unified = getUnifiedTopicMastery(topics);
  const weakTopics = topics.filter(t => unified.find(u => u.topicId === t.id)?.mastery === 'weak');
  const cheatSheetTopics = weakTopics.length > 0 ? weakTopics : topics;

  const handleGenerate = async (type: 'key_points' | 'definitions' | 'formulas' | 'mnemonic') => {
    if (!selectedTopic) return;
    setLoadingType(type);
    try {
      await generateTopicNote({
        topic: selectedTopic,
        pages,
        type,
        materialId: activeMaterial?.id,
        settings
      });
    } finally {
      setLoadingType(null);
    }
  };

  const handleStartEdit = (note: NoteItem) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleSaveEdit = (noteId: string) => {
    updateNote(noteId, editTitle, editContent);
    setEditingNoteId(null);
  };

  const handleDelete = (noteId: string) => {
    deleteNote(noteId);
    if (editingNoteId === noteId) setEditingNoteId(null);
  };

  const handlePrintCheatSheet = () => {
    window.print();
  };

  const noteTypeBadges: Record<string, string> = {
    key_points: 'bg-[#98473E]/10 text-[#98473E] dark:bg-[#98473E]/20 dark:text-[#E8D8C6]',
    definitions: 'bg-[#B49082]/15 text-[#30251F] dark:bg-[#B49082]/25 dark:text-[#F7EFE5]',
    formulas: 'bg-[#7F9274]/15 text-[#30251F] dark:bg-[#7F9274]/25 dark:text-[#F7EFE5]',
    mnemonic: 'bg-[#A37C40]/15 text-[#30251F] dark:bg-[#A37C40]/25 dark:text-[#F7EFE5]'
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Printable Cheat Sheet (Visible on Screen if Toggled, or when Printing) */}
      <div id="cheat-sheet-print" className={showCheatSheet ? 'block' : 'hidden print:block'}>
        <div className="bg-white text-black p-6 border-2 border-slate-900 rounded-xl mb-6 shadow print:border-none print:shadow-none print:p-0">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
            <div>
              <h2 className="text-xl font-black uppercase tracking-wider">
                Thinklet Weak Topics High-Yield Cheat Sheet
              </h2>
              <p className="text-xs text-slate-600">
                Condensed definitions, equations, and active recall mnemonics.
              </p>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handlePrintCheatSheet}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow"
              >
                🖨️ Print Now
              </button>
              <button
                onClick={() => setShowCheatSheet(false)}
                className="px-3 py-2 bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-300"
              >
                Close View
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {cheatSheetTopics.map(t => {
              const notesForTopic = allNotes.filter(n => n.topicId === t.id);
              return (
                <div key={t.id} className="border border-slate-400 p-3 rounded-lg bg-slate-50/50">
                  <div className="flex items-center justify-between font-bold text-sm mb-1 text-indigo-950">
                    <span>{t.name}</span>
                    <span className="text-[10px] text-slate-500">Pages {t.pages.join(', ')}</span>
                  </div>
                  <p className="text-slate-700 italic mb-2">{t.summary}</p>

                  {notesForTopic.length > 0 ? (
                    <div className="space-y-2">
                      {notesForTopic.map(n => (
                        <div key={n.id} className="pt-1 border-t border-slate-200">
                          <span className="font-bold uppercase text-[10px] text-slate-500">
                            {n.type.replace('_', ' ')}:
                          </span>
                          <p className="text-slate-800 whitespace-pre-wrap">{n.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500">
                      Target for priority review and mnemonic generation.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Screen Notes View */}
      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-xs print:hidden">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span>📚</span> Smart Notes & Cheat Sheet Library
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              AI-compiled key points, definitions, formulas, and mnemonics — organized by topic and fully editable.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCheatSheet(!showCheatSheet)}
            className="text-xs font-semibold"
          >
            <span>🖨️</span> {showCheatSheet ? 'Hide Cheat Sheet' : 'Weak Topics Cheat Sheet'}
          </Button>
        </div>

        {/* Topic Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {topics.map(t => {
            const count = allNotes.filter(n => n.topicId === t.id).length;
            const isSelected = t.id === selectedTopic?.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTopicId(t.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                }`}
              >
                <span>{t.name}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* AI Note Action Buttons */}
        {selectedTopic && (
          <div className="p-4 rounded-lg bg-secondary/30 border border-border mb-6">
            <span className="block text-xs font-semibold text-foreground mb-2">
              Generate Grounded Smart Notes for "{selectedTopic.name}":
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleGenerate('key_points')}
                disabled={Boolean(loadingType)}
                className="px-3 py-2 bg-[#98473E]/10 dark:bg-[#98473E]/20 text-[#98473E] dark:text-[#E8D8C6] border border-[#98473E]/20 dark:border-[#98473E]/40 rounded-lg text-xs font-semibold hover:bg-[#98473E]/20 disabled:opacity-50 transition-colors"
              >
                {loadingType === 'key_points' ? 'Compiling...' : '⚡ Key Points'}
              </button>
              <button
                onClick={() => handleGenerate('definitions')}
                disabled={Boolean(loadingType)}
                className="px-3 py-2 bg-[#B49082]/15 dark:bg-[#B49082]/25 text-[#30251F] dark:text-[#F7EFE5] border border-[#B49082]/30 dark:border-[#B49082]/50 rounded-lg text-xs font-semibold hover:bg-[#B49082]/25 disabled:opacity-50 transition-colors"
              >
                {loadingType === 'definitions' ? 'Compiling...' : '📖 Definitions'}
              </button>
              <button
                onClick={() => handleGenerate('formulas')}
                disabled={Boolean(loadingType)}
                className="px-3 py-2 bg-[#7F9274]/15 dark:bg-[#7F9274]/25 text-[#30251F] dark:text-[#F7EFE5] border border-[#7F9274]/30 dark:border-[#7F9274]/50 rounded-lg text-xs font-semibold hover:bg-[#7F9274]/25 disabled:opacity-50 transition-colors"
              >
                {loadingType === 'formulas' ? 'Compiling...' : '🧪 Formulas & Reactions'}
              </button>
              <button
                onClick={() => handleGenerate('mnemonic')}
                disabled={Boolean(loadingType)}
                className="px-3 py-2 bg-[#A37C40]/15 dark:bg-[#A37C40]/25 text-[#30251F] dark:text-[#F7EFE5] border border-[#A37C40]/30 dark:border-[#A37C40]/50 rounded-lg text-xs font-semibold hover:bg-[#A37C40]/25 disabled:opacity-50 transition-colors"
              >
                {loadingType === 'mnemonic' ? 'Creating...' : '🧠 Mnemonic Device'}
              </button>
            </div>
          </div>
        )}

        {/* Saved Notes List */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Saved Notes for {selectedTopic?.name} ({topicNotes.length})
          </h3>

          {topicNotes.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-300 dark:border-slate-800 rounded-xl space-y-3">
              <div className="flex justify-center">
                <CuteBookMascot size="lg" className="animate-gentle-bounce" />
              </div>
              <p className="text-sm font-bold text-foreground">No notes saved for this topic yet</p>
              <p className="max-w-md mx-auto text-muted-foreground text-xs">
                Click any of the generation buttons above to synthesize grounded study notes with verbatim citations.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topicNotes.map(n => {
                const isEditing = editingNoteId === n.id;
                return (
                  <div
                    key={n.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all thinklet-card-hover"
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <Input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="w-full text-sm font-semibold"
                        />
                        <Textarea
                          rows={4}
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          className="w-full text-xs"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(n.id)}
                            className="px-4 py-1.5 bg-[#98473E] text-white rounded-lg text-xs font-semibold hover:bg-[#853C34] transition-colors cursor-pointer"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${noteTypeBadges[n.type]}`}>
                              {n.type.replace('_', ' ')}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {n.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStartEdit(n)}
                              className="text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                            >
                              Edit ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(n.id)}
                              className="text-xs text-slate-400 hover:text-rose-600"
                            >
                              Delete 🗑️
                            </button>
                          </div>
                        </div>

                        <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {n.content}
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Referenced on pages: {n.pageReferences.join(', ')}</span>
                          <span>Last updated: {new Date(n.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

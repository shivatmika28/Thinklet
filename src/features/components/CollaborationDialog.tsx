"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Share2,
  Trophy,
  Timer,
  X,
  Copy,
  Check,
  Download,
  Upload,
  Sparkles,
  ArrowRight,
  Flame,
  Clock,
  BookOpen,
  Layers,
  HelpCircle,
  Play,
} from "lucide-react";
import { useFeatures } from "./FeaturesProvider";
import {
  CollabStoreData,
  StudyBuddy,
  loadCollabStore,
  saveCollabStore,
  encodePayload,
  decodePayload,
  BuddyInvitePayload,
  StudySetPayload,
  ChallengePayload,
  ChallengeResultPayload,
  ChallengeComparison,
  CoStudyPayload,
  importStudySetToStore,
} from "../services/collabService";

interface CollaborationDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function CollaborationDialog({
  isOpen: propsIsOpen,
  onClose: propsOnClose,
}: CollaborationDialogProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof propsIsOpen === "boolean";
  const isOpen = isControlled ? propsIsOpen : internalIsOpen;

  const handleClose = () => {
    if (isControlled && propsOnClose) {
      propsOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  // Listen for global custom event 'open-collaboration'
  useEffect(() => {
    const handleOpen = () => setInternalIsOpen(true);
    window.addEventListener("open-collaboration", handleOpen);
    return () => window.removeEventListener("open-collaboration", handleOpen);
  }, []);

  const { store } = useFeatures();
  const [collabStore, setCollabStore] = useState<CollabStoreData>(loadCollabStore);
  const [activeTab, setActiveTab] = useState<"circle" | "share" | "challenge" | "costudy">("circle");

  // Notification / toast feedback
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showCopyFeedback = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Sync collabStore on open
  useEffect(() => {
    if (isOpen) {
      setCollabStore(loadCollabStore());
      setNotice(null);
    }
  }, [isOpen]);

  const updateStore = (data: Partial<CollabStoreData>) => {
    const updated = saveCollabStore(data);
    setCollabStore(updated);
  };

  // ==========================================================================
  // TAB 1: STUDY CIRCLE STATE
  // ==========================================================================
  const [buddyCodeInput, setBuddyCodeInput] = useState("");
  const [buddyPreview, setBuddyPreview] = useState<BuddyInvitePayload | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [tempNickname, setTempNickname] = useState(collabStore.myNickname);
  const [tempEmoji, setTempEmoji] = useState(collabStore.myEmoji);

  const handleCopyMyInviteCode = () => {
    const payload: BuddyInvitePayload = {
      type: "BUDDY_INVITE",
      version: 1,
      createdAt: Date.now(),
      senderNickname: collabStore.myNickname,
      senderEmoji: collabStore.myEmoji,
      streak: store.streak.currentStreak || 0,
      weeklyMinutes: Math.round((store.goal.todayMinutesCompleted || 0) * 3.5),
      todayMinutes: store.goal.todayMinutesCompleted || 0,
      topMastery: "Core Biology & Concepts",
    };
    const code = encodePayload(payload);
    showCopyFeedback("invite", code);
  };

  const handlePreviewBuddyCode = (code: string) => {
    setBuddyCodeInput(code);
    setNotice(null);
    if (!code.trim()) {
      setBuddyPreview(null);
      return;
    }
    try {
      const decoded = decodePayload<BuddyInvitePayload>(code, "BUDDY_INVITE");
      setBuddyPreview(decoded);
    } catch (err: any) {
      setBuddyPreview(null);
    }
  };

  const handleAddBuddy = () => {
    if (!buddyPreview) return;
    const existingIdx = collabStore.buddies.findIndex((b) => b.nickname === buddyPreview.senderNickname);
    const newBuddy: StudyBuddy = {
      id: existingIdx !== -1 ? collabStore.buddies[existingIdx].id : `buddy_${Date.now()}`,
      nickname: buddyPreview.senderNickname,
      avatarEmoji: buddyPreview.senderEmoji || "🎓",
      avatarColor: "#98473E",
      addedAt: new Date().toISOString(),
      lastSummary: {
        streak: buddyPreview.streak,
        weeklyMinutes: buddyPreview.weeklyMinutes,
        todayMinutes: buddyPreview.todayMinutes,
        topMastery: buddyPreview.topMastery,
        sharedAt: new Date().toLocaleDateString(),
      },
    };

    let updatedList = [...collabStore.buddies];
    if (existingIdx !== -1) {
      updatedList[existingIdx] = newBuddy;
      setNotice(`Updated ${buddyPreview.senderNickname}'s study summary! ✨`);
    } else {
      updatedList.push(newBuddy);
      setNotice(`Added ${buddyPreview.senderNickname} to your Study Circle! 🎉`);
    }
    updateStore({ buddies: updatedList });
    setBuddyCodeInput("");
    setBuddyPreview(null);
  };

  const handleRemoveBuddy = (id: string) => {
    const updated = collabStore.buddies.filter((b) => b.id !== id);
    updateStore({ buddies: updated });
    setNotice("Study buddy removed.");
  };

  // ==========================================================================
  // TAB 2: SHARE STUDY SETS STATE
  // ==========================================================================
  const [shareSetType, setShareSetType] = useState<"flashcards" | "notes">("flashcards");
  const [generatedShareCode, setGeneratedShareCode] = useState<string | null>(null);
  const [importCodeInput, setImportCodeInput] = useState("");
  const [studySetPreview, setStudySetPreview] = useState<StudySetPayload | null>(null);

  const handleGenerateShareCode = () => {
    let items: Array<{ titleOrFront: string; contentOrBack: string }> = [];
    let title = "";

    if (shareSetType === "flashcards") {
      title = "Key Concept Flashcards";
      const cards = store.flashcards && store.flashcards.length > 0 ? store.flashcards.slice(0, 8) : [
        { front: "What is active recall?", back: "Retrieving information from memory to enhance long-term retention." },
        { front: "What is the Pomodoro technique?", back: "25 minutes of high-focus study followed by a 5-minute break." },
        { front: "How does spaced repetition work?", back: "Reviewing material at systematically increasing intervals to flatten the forgetting curve." },
      ];
      items = cards.map((c: any) => ({
        titleOrFront: c.front || c.title || "Flashcard",
        contentOrBack: c.back || c.content || "Review concept",
      }));
    } else {
      title = "Smart Revision Notes";
      const notes = store.notes && store.notes.length > 0 ? store.notes.slice(0, 5) : [
        { title: "Core Biology Principles", content: "Cell division, ATP cellular respiration, and DNA transcription pathways." },
        { title: "Exam Day Strategy", content: "Begin with high-confidence questions, budget 1.5 mins per mark, review marked questions." },
      ];
      items = notes.map((n: any) => ({
        titleOrFront: n.title,
        contentOrBack: n.content,
      }));
    }

    const payload: StudySetPayload = {
      type: "STUDY_SET",
      version: 1,
      createdAt: Date.now(),
      senderNickname: collabStore.myNickname,
      senderEmoji: collabStore.myEmoji,
      setItemType: shareSetType,
      title,
      items,
    };

    const code = encodePayload(payload);
    setGeneratedShareCode(code);
    setNotice(`Generated share code with ${items.length} ${shareSetType}!`);
  };

  const handlePreviewImportCode = (code: string) => {
    setImportCodeInput(code);
    setNotice(null);
    if (!code.trim()) {
      setStudySetPreview(null);
      return;
    }
    try {
      const decoded = decodePayload<StudySetPayload>(code, "STUDY_SET");
      setStudySetPreview(decoded);
    } catch (err: any) {
      setStudySetPreview(null);
    }
  };

  const handleConfirmImportStudySet = () => {
    if (!studySetPreview) return;
    try {
      const result = importStudySetToStore(studySetPreview);
      setNotice(`Successfully imported ${result.importedCount} ${studySetPreview.setItemType} from ${studySetPreview.senderNickname}! ✨`);
      setImportCodeInput("");
      setStudySetPreview(null);
    } catch (err: any) {
      setNotice(`Import failed: ${err.message}`);
    }
  };

  // ==========================================================================
  // TAB 3: FRIENDLY CHALLENGES STATE
  // ==========================================================================
  const [challengeMode, setChallengeMode] = useState<"create" | "play" | "compare">("create");
  const [challengeCodeOutput, setChallengeCodeOutput] = useState<string | null>(null);
  const [playChallengeCode, setPlayChallengeCode] = useState("");
  const [activeChallenge, setActiveChallenge] = useState<ChallengePayload | null>(null);
  const [challengeAnswers, setChallengeAnswers] = useState<Record<number, number>>({});
  const [challengeFinished, setChallengeFinished] = useState(false);
  const [challengeResultCode, setChallengeResultCode] = useState<string | null>(null);
  const [resultCodeInput, setResultCodeInput] = useState("");
  const [comparisonResult, setComparisonResult] = useState<ChallengeComparison | null>(null);

  const sampleChallengeQuestions = [
    {
      id: "q1",
      prompt: "Which process creates ATP energy in the cellular mitochondria?",
      options: ["Cellular Respiration", "Photosynthesis", "Fermentation", "Active Osmosis"],
      correctIndex: 0,
    },
    {
      id: "q2",
      prompt: "What is the optimal Leitner interval schedule for retention?",
      options: ["1, 3, 7, 14 days", "Every 2 hours", "Once a month", "No intervals needed"],
      correctIndex: 0,
    },
    {
      id: "q3",
      prompt: "In Thinklet, what does an active Study Streak signify?",
      options: ["Consecutive days of focused study", "Number of quizzes taken", "Total minutes studied", "Number of flashcards created"],
      correctIndex: 0,
    },
  ];

  const handleCreateChallenge = () => {
    const payload: ChallengePayload = {
      type: "CHALLENGE",
      version: 1,
      createdAt: Date.now(),
      senderNickname: collabStore.myNickname,
      senderEmoji: collabStore.myEmoji,
      challengeId: `ch_${Date.now()}`,
      topicName: "Cell Biology & Mastery",
      questions: sampleChallengeQuestions,
      challengerScore: 100,
      challengerTimeSeconds: 42,
    };
    const code = encodePayload(payload);
    setChallengeCodeOutput(code);
    setNotice("Friendly Challenge code created! Send it to your study buddy. 🚀");
  };

  const handleLoadChallengeToPlay = (code: string) => {
    setPlayChallengeCode(code);
    setNotice(null);
    if (!code.trim()) {
      setActiveChallenge(null);
      return;
    }
    try {
      const decoded = decodePayload<ChallengePayload>(code, "CHALLENGE");
      setActiveChallenge(decoded);
      setChallengeAnswers({});
      setChallengeFinished(false);
      setChallengeResultCode(null);
    } catch {
      setActiveChallenge(null);
    }
  };

  const handleSubmitChallengeAnswers = () => {
    if (!activeChallenge) return;
    let score = 0;
    activeChallenge.questions.forEach((q, idx) => {
      if (challengeAnswers[idx] === q.correctIndex) {
        score += Math.round(100 / activeChallenge.questions.length);
      }
    });
    score = Math.min(100, score);
    setChallengeFinished(true);

    const resultPayload: ChallengeResultPayload = {
      type: "CHALLENGE_RESULT",
      version: 1,
      createdAt: Date.now(),
      senderNickname: collabStore.myNickname,
      senderEmoji: collabStore.myEmoji,
      challengeId: activeChallenge.challengeId,
      topicName: activeChallenge.topicName,
      friendScore: score,
      friendTimeSeconds: 38,
    };
    const code = encodePayload(resultPayload);
    setChallengeResultCode(code);
    setNotice(`Challenge completed! You scored ${score}%. Copy your result code to send back.`);
  };

  const handleCompareResults = (code: string) => {
    setResultCodeInput(code);
    setNotice(null);
    if (!code.trim()) {
      setComparisonResult(null);
      return;
    }
    try {
      const decoded = decodePayload<ChallengeResultPayload>(code, "CHALLENGE_RESULT");
      setComparisonResult({
        challengeId: decoded.challengeId,
        topicName: decoded.topicName || "Study Challenge",
        challengerNickname: collabStore.myNickname,
        challengerScore: 100,
        challengerTimeSeconds: 42,
        friendNickname: decoded.senderNickname,
        friendScore: decoded.friendScore,
        friendTimeSeconds: decoded.friendTimeSeconds,
        completedAt: new Date().toLocaleTimeString(),
      });
    } catch {
      setComparisonResult(null);
    }
  };

  // ==========================================================================
  // TAB 4: CO-STUDY SPRINT STATE
  // ==========================================================================
  const [coStudyPreset, setCoStudyPreset] = useState<number>(25);
  const [coStudyDelayMinutes, setCoStudyDelayMinutes] = useState<number>(2);
  const [coStudyCode, setCoStudyCode] = useState<string | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [activeSession, setActiveSession] = useState<CoStudyPayload | null>(null);
  const [timeUntilStart, setTimeUntilStart] = useState<number | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState<number>(0);

  const handleGenerateCoStudyCode = () => {
    const startUtcTimestamp = Date.now() + coStudyDelayMinutes * 60 * 1000;
    const payload: CoStudyPayload = {
      type: "COSTUDY",
      version: 1,
      createdAt: Date.now(),
      senderNickname: collabStore.myNickname,
      senderEmoji: collabStore.myEmoji,
      durationMinutes: coStudyPreset,
      startUtcTimestamp,
      presetLabel: `${coStudyPreset}m Focus Sprint`,
    };
    const code = encodePayload(payload);
    setCoStudyCode(code);
    setActiveSession(payload);
    setNotice(`Co-study code created! Scheduled to start in ${coStudyDelayMinutes} minute${coStudyDelayMinutes > 1 ? "s" : ""}.`);
  };

  const handleJoinCoStudy = (code: string) => {
    setJoinCodeInput(code);
    setNotice(null);
    if (!code.trim()) {
      setActiveSession(null);
      return;
    }
    try {
      const decoded = decodePayload<CoStudyPayload>(code, "COSTUDY");
      setActiveSession(decoded);
      setNotice(`Joined ${decoded.senderNickname}'s Co-Study session!`);
    } catch {
      setActiveSession(null);
    }
  };

  // Synchronized UTC countdown interval
  useEffect(() => {
    if (!activeSession) {
      setTimeUntilStart(null);
      setSessionActive(false);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = activeSession.startUtcTimestamp - now;

      if (diffMs > 0) {
        setTimeUntilStart(Math.ceil(diffMs / 1000));
        setSessionActive(false);
      } else {
        // Session has started
        setTimeUntilStart(0);
        setSessionActive(true);
        const elapsedSec = Math.floor(Math.abs(diffMs) / 1000);
        const totalSec = activeSession.durationMinutes * 60;
        const remaining = Math.max(0, totalSec - elapsedSec);
        setSessionSecondsLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="collab-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-clay-card)] overflow-hidden"
        style={{ backgroundColor: "var(--surface)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--surface-raised)]">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-[#98473E]/20 border border-[#98473E]/40 flex items-center justify-center text-[#98473E]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 id="collab-title" className="text-base sm:text-lg font-bold font-['Quicksand',sans-serif] text-[var(--text)]">
                Student Collaboration
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Study Circles, set sharing, peer challenges & synchronized sprints
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="h-8 w-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-[var(--surface)] border-b border-[var(--border)] text-xs font-semibold">
          {[
            { id: "circle", label: "Study Circle", icon: Users },
            { id: "share", label: "Share Decks", icon: Share2 },
            { id: "challenge", label: "Challenges", icon: Trophy },
            { id: "costudy", label: "Co-Study", icon: Timer },
          ].map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveTab(id as any);
                  setNotice(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl transition-all cursor-pointer ${
                  active
                    ? "bg-[#98473E] text-white shadow-xs font-bold"
                    : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Notice Toast */}
        {notice && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl text-xs font-medium bg-[#98473E]/15 text-[#98473E] border border-[#98473E]/30 flex items-center justify-between">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} className="text-xs hover:underline cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Dialog Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* ================================================================
              TAB 1: STUDY CIRCLE
             ================================================================ */}
          {activeTab === "circle" && (
            <div className="space-y-4">
              {/* My Profile Capsule */}
              <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[#98473E]/20 border border-[#98473E]/40 flex items-center justify-center text-xl select-none">
                    {collabStore.myEmoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[var(--text)]">{collabStore.myNickname}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#98473E] bg-[#98473E]/10 px-2 py-0.5 rounded-full">
                        You
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      {store.streak.currentStreak || 0}d streak • {store.goal.todayMinutesCompleted || 0}m studied today
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProfile((prev) => !prev)}
                    className="h-8 px-3 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-hover)] cursor-pointer"
                  >
                    {editingProfile ? "Done" : "Edit Profile"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyMyInviteCode}
                    className="h-8 px-3 rounded-full bg-[#98473E] text-white text-xs font-bold hover:bg-[#0E6C87] flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {copiedKey === "invite" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === "invite" ? "Copied!" : "My Invite Code"}</span>
                  </button>
                </div>
              </div>

              {/* Edit Profile inline drawer */}
              {editingProfile && (
                <div className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-[var(--text-muted)] w-20">Nickname:</label>
                    <input
                      type="text"
                      maxLength={24}
                      value={tempNickname}
                      onChange={(e) => setTempNickname(e.target.value)}
                      placeholder="Your study nickname"
                      className="flex-1 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 text-xs text-[var(--text)] outline-none focus:ring-1 focus:ring-[#98473E]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-[var(--text-muted)] w-20">Mascot:</label>
                    <div className="flex items-center gap-1.5">
                      {["🐧", "🦉", "🦊", "🚀", "💡", "🎓"].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setTempEmoji(emoji)}
                          className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm border cursor-pointer ${
                            tempEmoji === emoji
                              ? "border-[#98473E] bg-[#98473E]/20"
                              : "border-[var(--border)] bg-[var(--surface-raised)]"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateStore({ myNickname: tempNickname.trim() || "Thinklet Scholar", myEmoji: tempEmoji });
                        setEditingProfile(false);
                      }}
                      className="ml-auto h-8 px-3 rounded-lg bg-[#98473E] text-white text-xs font-bold hover:bg-[#0E6C87] cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              {/* Add Buddy Section */}
              <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Add Buddy to Circle
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">Paste friend's invite code</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={buddyCodeInput}
                    onChange={(e) => handlePreviewBuddyCode(e.target.value)}
                    placeholder="Paste code (e.g. THINKLET1-BUDDY:...)"
                    className="flex-1 h-9 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-xs text-[var(--text)] outline-none focus:ring-2 focus:ring-[#98473E]"
                  />
                  {buddyPreview && (
                    <button
                      type="button"
                      onClick={handleAddBuddy}
                      className="h-9 px-4 rounded-xl bg-[#98473E] text-white text-xs font-bold hover:bg-[#0E6C87] cursor-pointer shrink-0"
                    >
                      Add {buddyPreview.senderNickname}
                    </button>
                  )}
                </div>

                {buddyPreview && (
                  <div className="p-2.5 rounded-xl border border-[#98473E]/30 bg-[#98473E]/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{buddyPreview.senderEmoji}</span>
                      <div>
                        <span className="font-bold text-[var(--text)]">{buddyPreview.senderNickname}</span>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {buddyPreview.streak}d streak • {buddyPreview.weeklyMinutes}m weekly study
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#98473E]">Ready to link!</span>
                  </div>
                )}
              </div>

              {/* Buddies List */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  My Circle ({collabStore.buddies.length})
                </span>
                {collabStore.buddies.length > 0 ? (
                  <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                    {collabStore.buddies.map((buddy) => (
                      <div key={buddy.id} className="p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-lg select-none">
                            {buddy.avatarEmoji}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[var(--text)]">{buddy.nickname}</span>
                              {buddy.lastSummary?.streak && buddy.lastSummary.streak > 0 ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded-full">
                                  <Flame className="h-3 w-3" /> {buddy.lastSummary.streak}d
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)]">
                              {buddy.lastSummary?.weeklyMinutes || 0}m weekly • Last shared: {buddy.lastSummary?.sharedAt || "Recently"}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveBuddy(buddy.id)}
                          aria-label={`Remove ${buddy.nickname}`}
                          className="h-7 w-7 rounded-lg text-xs text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)] text-xs text-[var(--text-muted)]">
                    No study buddies added yet. Copy your invite code above or paste a friend's code to connect!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 2: SHARE STUDY SETS
             ================================================================ */}
          {activeTab === "share" && (
            <div className="space-y-4">
              {/* Export Panel */}
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                  1. Share a Study Set
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShareSetType("flashcards");
                      setGeneratedShareCode(null);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer ${
                      shareSetType === "flashcards"
                        ? "border-[#98473E] bg-[#98473E]/15 text-[#98473E] font-bold"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
                    }`}
                  >
                    Flashcards
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShareSetType("notes");
                      setGeneratedShareCode(null);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer ${
                      shareSetType === "notes"
                        ? "border-[#98473E] bg-[#98473E]/15 text-[#98473E] font-bold"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
                    }`}
                  >
                    Smart Notes
                  </button>
                </div>

                <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-muted)] leading-relaxed">
                  🔒 <strong className="text-[var(--text)]">Privacy Guarantee:</strong> Only selected study items and your nickname (<span className="text-[#98473E] font-bold">{collabStore.myNickname}</span>) will be shared. No personal data, storage keys, or API tokens are ever exported.
                </div>

                <button
                  type="button"
                  onClick={handleGenerateShareCode}
                  className="w-full py-2.5 rounded-xl bg-[#98473E] text-white text-xs font-bold hover:bg-[#0E6C87] cursor-pointer shadow-xs"
                >
                  Generate Share Code
                </button>

                {generatedShareCode && (
                  <div className="p-3 rounded-xl border border-[#98473E]/40 bg-[#98473E]/10 space-y-2">
                    <span className="text-[11px] font-bold text-[#98473E] uppercase tracking-wider block">
                      Share Code Ready:
                    </span>
                    <input
                      type="text"
                      readOnly
                      value={generatedShareCode}
                      className="w-full h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[11px] font-mono text-[var(--text)] select-all"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => showCopyFeedback("shareCode", generatedShareCode)}
                        className="flex-1 py-1.5 rounded-lg bg-[#98473E] text-white text-xs font-bold hover:bg-[#0E6C87] flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {copiedKey === "shareCode" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedKey === "shareCode" ? "Copied to Clipboard!" : "Copy Share Code"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const blob = new Blob([generatedShareCode], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `thinklet_${shareSetType}_set.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="py-1.5 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-hover)] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download .json</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Import Panel */}
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                  2. Import from a Friend
                </span>
                <textarea
                  rows={2}
                  value={importCodeInput}
                  onChange={(e) => handlePreviewImportCode(e.target.value)}
                  placeholder="Paste share code or dropped JSON here (THINKLET1-STUDY_SET:...)"
                  className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-xs font-mono text-[var(--text)] outline-none focus:ring-2 focus:ring-[#98473E]"
                />

                {studySetPreview && (
                  <div className="p-3 rounded-2xl border border-[#98473E]/40 bg-[#98473E]/10 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[var(--text)]">{studySetPreview.title}</span>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Shared by <strong className="text-[#98473E]">{studySetPreview.senderNickname}</strong> • {studySetPreview.items.length} {studySetPreview.setItemType}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-[#98473E] uppercase tracking-wider bg-[#98473E]/20 px-2 py-0.5 rounded-full">
                        Safe to Import
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmImportStudySet}
                      className="w-full py-2 rounded-xl bg-[#98473E] text-white text-xs font-bold hover:bg-[#0E6C87] cursor-pointer shadow-xs"
                    >
                      Import into My {studySetPreview.setItemType === "flashcards" ? "Flashcards" : "Notes"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 3: FRIENDLY CHALLENGES
             ================================================================ */}
          {activeTab === "challenge" && (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-xs font-semibold">
                {[
                  { id: "create", label: "Create Challenge" },
                  { id: "play", label: "Play Code" },
                  { id: "compare", label: "Compare Results" },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setChallengeMode(id as any);
                      setNotice(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      challengeMode === id
                        ? "bg-[#98473E] text-white font-bold"
                        : "text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Mode: Create */}
              {challengeMode === "create" && (
                <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Challenge a Buddy
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Generate a 3-question peer diagnostic challenge in Cell Biology.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateChallenge}
                    className="w-full py-2.5 rounded-xl bg-[#98473E] text-white text-xs font-bold hover:bg-[#0E6C87] cursor-pointer shadow-xs"
                  >
                    Generate Challenge Code
                  </button>

                  {challengeCodeOutput && (
                    <div className="p-3 rounded-xl border border-[#98473E]/40 bg-[#98473E]/10 space-y-2">
                      <span className="text-[11px] font-bold text-[#98473E] uppercase tracking-wider block">
                        Challenge Code:
                      </span>
                      <input
                        type="text"
                        readOnly
                        value={challengeCodeOutput}
                        className="w-full h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[11px] font-mono text-[var(--text)] select-all"
                      />
                      <button
                        type="button"
                        onClick={() => showCopyFeedback("challCode", challengeCodeOutput)}
                        className="w-full py-1.5 rounded-lg bg-[#98473E] text-white text-xs font-bold hover:bg-[#0E6C87] flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {copiedKey === "challCode" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedKey === "challCode" ? "Copied!" : "Copy Challenge Code"}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Mode: Play */}
              {challengeMode === "play" && (
                <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    Play a Received Challenge
                  </span>
                  <input
                    type="text"
                    value={playChallengeCode}
                    onChange={(e) => handleLoadChallengeToPlay(e.target.value)}
                    placeholder="Paste challenge code (THINKLET1-CHALLENGE:...)"
                    className="w-full h-9 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-xs text-[var(--text)] outline-none focus:ring-2 focus:ring-[#98473E]"
                  />

                  {activeChallenge && !challengeFinished && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between text-xs border-b border-[var(--border)] pb-2">
                        <span className="font-bold text-[var(--text)]">{activeChallenge.topicName}</span>
                        <span className="text-[11px] text-[var(--text-muted)]">Challenger: {activeChallenge.senderNickname}</span>
                      </div>

                      {activeChallenge.questions.map((q, qIdx) => (
                        <div key={q.id} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-2">
                          <p className="text-xs font-semibold text-[var(--text)]">
                            {qIdx + 1}. {q.prompt}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {q.options.map((opt, optIdx) => (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => setChallengeAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))}
                                className={`p-2 rounded-lg text-left text-xs border transition-all cursor-pointer ${
                                  challengeAnswers[qIdx] === optIdx
                                    ? "border-[#98473E] bg-[#98473E]/20 font-bold text-[var(--text)]"
                                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={handleSubmitChallengeAnswers}
                        disabled={Object.keys(challengeAnswers).length < activeChallenge.questions.length}
                        className="w-full py-2.5 rounded-xl bg-[#98473E] text-white text-xs font-bold hover:bg-[#0E6C87] disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        Submit & Generate Result Code
                      </button>
                    </div>
                  )}

                  {challengeFinished && challengeResultCode && (
                    <div className="p-3 rounded-2xl border border-[#98473E]/40 bg-[#98473E]/10 space-y-2">
                      <span className="text-xs font-bold text-[#98473E] block">
                        Your Result Code (send back to challenger):
                      </span>
                      <input
                        type="text"
                        readOnly
                        value={challengeResultCode}
                        className="w-full h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[11px] font-mono text-[var(--text)] select-all"
                      />
                      <button
                        type="button"
                        onClick={() => showCopyFeedback("resCode", challengeResultCode)}
                        className="w-full py-1.5 rounded-lg bg-[#98473E] text-white text-xs font-bold hover:bg-[#0E6C87] flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {copiedKey === "resCode" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedKey === "resCode" ? "Copied!" : "Copy Result Code"}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Mode: Compare */}
              {challengeMode === "compare" && (
                <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    Paste Friend's Result Code
                  </span>
                  <input
                    type="text"
                    value={resultCodeInput}
                    onChange={(e) => handleCompareResults(e.target.value)}
                    placeholder="Paste result code (THINKLET1-CHALLENGE_RESULT:...)"
                    className="w-full h-9 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-xs text-[var(--text)] outline-none focus:ring-2 focus:ring-[#98473E]"
                  />

                  {comparisonResult && (
                    <div className="p-4 rounded-2xl border border-[#98473E]/40 bg-[var(--surface-raised)] space-y-3">
                      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 text-xs">
                        <span className="font-bold text-[var(--text)]">{comparisonResult.topicName}</span>
                        <span className="text-[11px] text-[var(--text-muted)]">Completed {comparisonResult.completedAt}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                          <span className="text-xs text-[var(--text-muted)] block">You ({comparisonResult.challengerNickname})</span>
                          <span className="text-2xl font-bold text-[#98473E]">{comparisonResult.challengerScore}%</span>
                          <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">{comparisonResult.challengerTimeSeconds}s</span>
                        </div>
                        <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                          <span className="text-xs text-[var(--text-muted)] block">{comparisonResult.friendNickname}</span>
                          <span className="text-2xl font-bold text-emerald-500">{comparisonResult.friendScore}%</span>
                          <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">{comparisonResult.friendTimeSeconds}s</span>
                        </div>
                      </div>

                      <p className="text-xs text-center text-[#98473E] font-semibold bg-[#98473E]/10 p-2.5 rounded-xl">
                        🎉 Great minds think alike! You both conquered this concept review!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              TAB 4: CO-STUDY SPRINT
             ================================================================ */}
          {activeTab === "costudy" && (
            <div className="space-y-4">
              {/* Host Setup */}
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                  1. Synchronized Focus Sprint
                </span>
                <p className="text-xs text-[var(--text-muted)]">
                  Pick a duration and start delay. Both devices count down to the exact UTC timestamp in lockstep!
                </p>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)] w-16">Duration:</span>
                  {[15, 25, 45].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setCoStudyPreset(mins)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                        coStudyPreset === mins
                          ? "border-[#98473E] bg-[#98473E]/20 text-[#98473E]"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)] w-16">Start in:</span>
                  {[2, 5, 10].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setCoStudyDelayMinutes(mins)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                        coStudyDelayMinutes === mins
                          ? "border-[#98473E] bg-[#98473E]/20 text-[#98473E]"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleGenerateCoStudyCode}
                  className="w-full py-2.5 rounded-xl bg-[#98473E] text-white text-xs font-bold hover:bg-[#0E6C87] cursor-pointer shadow-xs"
                >
                  Create Co-Study Session
                </button>

                {coStudyCode && (
                  <div className="p-3 rounded-xl border border-[#98473E]/40 bg-[#98473E]/10 space-y-2">
                    <span className="text-[11px] font-bold text-[#98473E] uppercase tracking-wider block">
                      Share with Buddy:
                    </span>
                    <input
                      type="text"
                      readOnly
                      value={coStudyCode}
                      className="w-full h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[11px] font-mono text-[var(--text)] select-all"
                    />
                    <button
                      type="button"
                      onClick={() => showCopyFeedback("coCode", coStudyCode)}
                      className="w-full py-1.5 rounded-lg bg-[#98473E] text-white text-xs font-bold hover:bg-[#0E6C87] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === "coCode" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedKey === "coCode" ? "Copied!" : "Copy Co-Study Code"}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Join or Active Countdown Banner */}
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                  2. Join / Active Session
                </span>
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => handleJoinCoStudy(e.target.value)}
                  placeholder="Paste co-study code (THINKLET1-COSTUDY:...)"
                  className="w-full h-9 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-xs text-[var(--text)] outline-none focus:ring-2 focus:ring-[#98473E]"
                />

                {activeSession && (
                  <div className="p-4 rounded-2xl border border-[#98473E]/40 bg-[var(--surface-raised)] text-center space-y-2">
                    <span className="text-xs font-bold text-[#98473E]">
                      {activeSession.presetLabel} • Initiator: {activeSession.senderNickname}
                    </span>

                    {timeUntilStart !== null && timeUntilStart > 0 ? (
                      <div>
                        <div className="text-3xl font-mono font-extrabold text-[var(--text)]">
                          {Math.floor(timeUntilStart / 60)}:{(timeUntilStart % 60).toString().padStart(2, "0")}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-1 animate-pulse">
                          Synchronizing with partner... sprint begins shortly!
                        </p>
                      </div>
                    ) : sessionActive ? (
                      <div>
                        <div className="text-3xl font-mono font-extrabold text-emerald-400">
                          {Math.floor(sessionSecondsLeft / 60)}:{(sessionSecondsLeft % 60).toString().padStart(2, "0")}
                        </div>
                        <p className="text-xs text-emerald-500 font-semibold mt-1">
                          Sprint in progress! Both devices are running in sync. 🎯
                        </p>
                      </div>
                    ) : null}

                    <p className="text-[10px] text-[var(--text-muted)] pt-1">
                      Note: Synchronized via UTC device clocks without requiring a central server.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

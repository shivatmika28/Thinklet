"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { StudyMaterialSummary } from "@/lib/types";
import { PageText, Topic } from "@/types";
import { DEMO_PAGES, DEMO_TOPICS } from "@/lib/demo-data";
import { load as loadCoreStorage, save as saveCoreStorage } from "@/services/storage";

interface MaterialContextType {
  materials: StudyMaterialSummary[];
  activeMaterialId: string | null;
  activeMaterial: StudyMaterialSummary | null;
  currentPages: PageText[];
  currentTopics: Topic[];
  isLoading: boolean;
  setActiveMaterialId: (id: string) => void;
  refreshMaterials: () => Promise<void>;
  loadDemoMaterial: () => Promise<string | null>;
  updateCurrentMaterial: (pages: PageText[], topics: Topic[]) => void;
}

const MaterialContext = createContext<MaterialContextType | undefined>(undefined);

const INITIAL_PAGES: PageText[] = DEMO_PAGES.map((p) => ({
  page: p.pageNumber,
  text: p.text,
  label: `Page ${p.pageNumber}`,
}));

const INITIAL_TOPICS: Topic[] = DEMO_TOPICS.map((t, idx) => ({
  id: `topic-${idx + 1}`,
  name: t.name,
  description: t.description,
  summary: t.description,
  pages: [1, 2],
  order: idx + 1,
}));

export function MaterialProvider({ children }: { children: React.ReactNode }) {
  const [materials, setMaterials] = useState<StudyMaterialSummary[]>([]);
  const [activeMaterialId, setActiveMaterialIdState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("learnmate_active_material_id");
    }
    return null;
  });
  const [currentPages, setCurrentPages] = useState<PageText[]>(INITIAL_PAGES);
  const [currentTopics, setCurrentTopics] = useState<Topic[]>(INITIAL_TOPICS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync core storage on initialization
  useEffect(() => {
    try {
      const core = loadCoreStorage();
      if (core.pages && core.pages.length > 0) {
        setCurrentPages(core.pages);
      }
      if (core.topics && core.topics.length > 0) {
        setCurrentTopics(core.topics);
      }
    } catch {
      // Use initial demo state
    }
  }, []);

  const refreshMaterials = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/materials");
      const data = await res.json();
      if (data.success && Array.isArray(data.materials)) {
        setMaterials(data.materials);
        if (data.materials.length > 0) {
          const savedId = typeof window !== "undefined" ? localStorage.getItem("learnmate_active_material_id") : null;
          setActiveMaterialIdState((current) => {
            if (current && data.materials.some((m: StudyMaterialSummary) => m.id === current)) {
              return current;
            }
            if (savedId && data.materials.some((m: StudyMaterialSummary) => m.id === savedId)) {
              return savedId;
            }
            return data.materials[0].id;
          });
        } else {
          setActiveMaterialIdState(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("learnmate_active_material_id");
          }
        }
      }
    } catch (err) {
      console.error("Failed to load materials:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMaterials();
  }, [refreshMaterials]);

  // When active material changes, fetch its full pages and topics
  useEffect(() => {
    if (!activeMaterialId) return;

    if (typeof window !== "undefined") {
      localStorage.setItem("learnmate_active_material_id", activeMaterialId);
    }

    fetch(`/api/materials/${activeMaterialId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.material) {
          const rawPages: Array<{ pageNumber: number; text: string }> = data.material.pages || [];
          const rawTopics: Array<{ id: string; name: string; description?: string; order?: number }> =
            data.material.topics || [];

          const mappedPages: PageText[] =
            rawPages.length > 0
              ? rawPages.map((p) => ({
                  page: p.pageNumber,
                  text: p.text,
                  label: `Page ${p.pageNumber}`,
                }))
              : INITIAL_PAGES;

          const mappedTopics: Topic[] =
            rawTopics.length > 0
              ? rawTopics.map((t, idx) => ({
                  id: t.id || `topic-${idx + 1}`,
                  name: t.name,
                  summary: t.description || t.name,
                  description: t.description || "",
                  pages: [1, 2],
                  order: t.order || idx + 1,
                }))
              : INITIAL_TOPICS;

          // Map quiz attempts to core Attempt structure
          const rawAttempts: any[] = data.material.quizAttempts || [];
          const mappedAttempts = rawAttempts.map((a: any, idx: number) => {
            const topicMastery: Record<string, "mastered" | "learning" | "weak"> = {};
            const answersMap: Record<string, any> = {};

            if (Array.isArray(a.answers) && a.answers.length > 0) {
              a.answers.forEach((ans: any, aIdx: number) => {
                const topicName = ans.question?.topicName;
                const matchedTopic = mappedTopics.find(
                  (t) => t.name.toLowerCase() === (topicName || "").toLowerCase()
                );
                const tId = matchedTopic ? matchedTopic.id : `topic-${aIdx + 1}`;
                if (!topicMastery[tId]) {
                  topicMastery[tId] = ans.isCorrect ? "mastered" : "weak";
                }
                answersMap[`q-${aIdx}`] = {
                  selected: ans.selectedOption,
                  confidence: "sure",
                  isCorrect: ans.isCorrect,
                };
              });
            }

            // Fill default mastery for any topic not directly tested in this attempt
            mappedTopics.forEach((t) => {
              if (!topicMastery[t.id]) {
                topicMastery[t.id] = (a.percentage >= 80 ? "mastered" : a.percentage >= 50 ? "learning" : "weak");
              }
            });

            return {
              id: a.id || `att-${idx}`,
              timestamp: a.createdAt ? new Date(a.createdAt).getTime() : Date.now(),
              score: a.score ?? 0,
              totalQuestions: a.totalQuestions ?? 5,
              topicMastery,
              answers: answersMap,
            };
          });

          setCurrentPages(mappedPages);
          setCurrentTopics(mappedTopics);

          // Synchronize to core storage for feature services
          try {
            const currentCore = loadCoreStorage();
            saveCoreStorage({
              ...currentCore,
              pages: mappedPages,
              topics: mappedTopics,
              attempts: mappedAttempts.length > 0 ? mappedAttempts : currentCore.attempts,
            });
          } catch (e) {
            console.warn("Storage sync warning", e);
          }
        }
      })
      .catch((err) => console.error("Failed to load active material details:", err));
  }, [activeMaterialId]);

  const setActiveMaterialId = (id: string) => {
    setActiveMaterialIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("learnmate_active_material_id", id);
    }
  };

  const updateCurrentMaterial = (pages: PageText[], topics: Topic[]) => {
    setCurrentPages(pages);
    setCurrentTopics(topics);
    try {
      const currentCore = loadCoreStorage();
      saveCoreStorage({
        ...currentCore,
        pages,
        topics,
      });
    } catch (e) {
      console.warn("Storage sync warning", e);
    }
  };

  const loadDemoMaterial = async (): Promise<string | null> => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/materials/demo", { method: "POST" });
      const data = await res.json();
      if (data.success && data.material) {
        await refreshMaterials();
        setActiveMaterialId(data.material.id);
        return data.material.id;
      }
      return null;
    } catch (err) {
      console.error("Failed to seed demo material:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const activeMaterial = materials.find((m) => m.id === activeMaterialId) || materials[0] || null;

  return (
    <MaterialContext.Provider
      value={{
        materials,
        activeMaterialId,
        activeMaterial,
        currentPages,
        currentTopics,
        isLoading,
        setActiveMaterialId,
        refreshMaterials,
        loadDemoMaterial,
        updateCurrentMaterial,
      }}
    >
      {children}
    </MaterialContext.Provider>
  );
}

export function useMaterial() {
  const context = useContext(MaterialContext);
  if (!context) {
    throw new Error("useMaterial must be used within a MaterialProvider");
  }
  return context;
}

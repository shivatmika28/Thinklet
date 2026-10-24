import React from "react";
import {
  Pencil,
  BookText,
  Calendar,
  FileQuestion,
  Layers,
  GraduationCap,
  Sparkles,
  Workflow,
  FileText,
  CheckSquare,
} from "lucide-react";

export interface StudyPageItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties; "aria-hidden"?: boolean | "true" | "false" }>;
}

export interface StudySection {
  id: string;
  name: "Practice" | "Notes Assistant" | "Planner";
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties; "aria-hidden"?: boolean | "true" | "false" }>;
  children: StudyPageItem[];
}

/**
 * Shared data structure for right-side circular navigation.
 * Items, icons, and routes can be easily customized or extended here.
 */
export const STUDY_SECTIONS: StudySection[] = [
  {
    id: "practice",
    name: "Practice",
    icon: Pencil,
    children: [
      { name: "Practice Quiz", href: "/quiz", icon: FileQuestion },
      { name: "Flashcards", href: "/flashcards", icon: Layers },
      { name: "Practice Papers", href: "/paper", icon: GraduationCap },
    ],
  },
  {
    id: "notes-assistant",
    name: "Notes Assistant",
    icon: BookText,
    children: [
      { name: "Answer Checker", href: "/checker", icon: Sparkles },
      { name: "Concept Maps", href: "/visual", icon: Workflow },
      { name: "Smart Notes", href: "/notes", icon: FileText },
    ],
  },
  {
    id: "planner",
    name: "Planner",
    icon: Calendar,
    children: [
      { name: "Revision Plan", href: "/revision", icon: CheckSquare },
      { name: "Study Planner", href: "/planner", icon: Calendar },
    ],
  },
];

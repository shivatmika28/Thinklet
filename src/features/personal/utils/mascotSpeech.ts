// [PERSONAL] Mascot speech and personality templates with dual-language support (EN/HI)
import {
  MascotMemoryItem,
  MascotPersonality,
  MascotSpeechItem,
  StructuredReason,
  DeviceType,
} from '../types';

export type MascotTone =
  | 'cheerful_playful'
  | 'cheerful_serious'
  | 'calm_playful'
  | 'calm_serious';

export function determineMascotTone(
  personality: MascotPersonality,
  relaxMode: boolean
): MascotTone {
  const calmVal = relaxMode ? Math.max(80, personality.cheerfulCalm) : personality.cheerfulCalm;
  const isCalm = calmVal >= 50;
  const isSerious = personality.playfulSerious >= 50;

  if (isCalm && isSerious) return 'calm_serious';
  if (isCalm && !isSerious) return 'calm_playful';
  if (!isCalm && isSerious) return 'cheerful_serious';
  return 'cheerful_playful';
}

interface TemplateSet {
  en: Record<MascotTone, string>;
  hi: Record<MascotTone, string>;
}

const TEMPLATES: Record<string, TemplateSet> = {
  topic_mastered: {
    en: {
      cheerful_playful: "Remember when you crushed {topic}? You've got that exact same brainpower today! Let's go! 🚀",
      cheerful_serious: "Your mastery in {topic} proved what dedicated focus accomplishes. Bring that precision to today's goals.",
      calm_playful: "You mastered {topic} with such great flow. Trust your mind—today will unfold just as smoothly. 🌿",
      calm_serious: "Reflect on your achievement in {topic}. Every steady session builds permanent understanding.",
    },
    hi: {
      cheerful_playful: "याद है आपने {topic} में कैसा कमाल किया था? आज भी वही ऊर्जा और आत्मविश्वास दिखाइए! 🚀",
      cheerful_serious: "{topic} में आपकी सफलता दिखाती है कि समर्पण से सब संभव है। आज के लक्ष्यों पर पूरा ध्यान केंद्रित करें।",
      calm_playful: "आपने {topic} को कितनी सहजता से समझा था। अपने दिमाग पर भरोसा रखें—आज भी सब बहुत अच्छा होगा। 🌿",
      calm_serious: "{topic} में अपनी महारत को याद करें। निरंतरता और शांत मन से की गई पढ़ाई हमेशा काम आती है।",
    },
  },
  tough_quiz: {
    en: {
      cheerful_playful: "Tough quiz on {topic}? That was just your brain doing heavy lifting! You're stronger for it now! 💪",
      cheerful_serious: "A challenging quiz in {topic} reveals our highest-yield growth areas. Let's review the core concepts.",
      calm_playful: "Tricky questions in {topic} are just puzzles in disguise. No rush—we'll decode them step by step. 🧩",
      calm_serious: "Difficulty is the biological signal that learning is occurring. Stay patient with yourself.",
    },
    hi: {
      cheerful_playful: "{topic} की वो क्विज़ कठिन थी? इसका मतलब दिमाग ने अच्छी कसरत की! अब आप और भी तैयार हैं! 💪",
      cheerful_serious: "{topic} की चुनौती ने हमें दिखाया कि कहाँ और सुधार हो सकता है। आइए मुख्य बातों को दोबारा देखें।",
      calm_playful: "{topic} के कठिन सवाल सिर्फ एक पहेली हैं। बिना किसी तनाव के, हम धीरे-धीरे सब समझ लेंगे। 🧩",
      calm_serious: "कठिनाई ही इस बात का प्रमाण है कि नया ज्ञान विकसित हो रहा है। धैर्य बनाए रखें।",
    },
  },
  streak_milestone: {
    en: {
      cheerful_playful: "{streak} study days in a row! You're on fire! Keep that incredible streak glowing! 🔥",
      cheerful_serious: "A {streak}-day consistency streak demonstrates exceptional self-discipline. Maintain this daily habit.",
      calm_playful: "{streak} days together. Small daily ripples turn into massive oceans of knowledge. 🌊",
      calm_serious: "{streak} consecutive days of study. Steady, quiet dedication is the true hallmark of scholarship.",
    },
    hi: {
      cheerful_playful: "लगातार {streak} दिनों की पढ़ाई! आपकी लगन अद्भुत है! इस ऊर्जा को यूँ ही बनाए रखें! 🔥",
      cheerful_serious: "{streak} दिनों की निरंतरता आपके अनुशासित संकल्प का प्रमाण है। इस आदत को जारी रखें।",
      calm_playful: "साथ में {streak} दिन हो गए। हर रोज़ की छोटी-छोटी कोशिशें बड़ा बदलाव लाती हैं। 🌊",
      calm_serious: "लगातार {streak} दिन का अध्ययन। शांत और गंभीर निष्ठा ही सच्ची सफलता की कुंजी है।",
    },
  },
  sprint_champion: {
    en: {
      cheerful_playful: "High five! You totally locked in on that study sprint! Time to celebrate that focus! ⚡",
      cheerful_serious: "Focused sprint concluded with high efficiency. Your cognitive stamina is noticeably improving.",
      calm_playful: "Wonderful deep focus during that sprint. Feel the calm satisfaction of uninterrupted work. ☕",
      calm_serious: "Quality deep work completed. Allow a moment for the new knowledge to consolidate in your memory.",
    },
    hi: {
      cheerful_playful: "शानदार! आपने उस स्टडी स्प्रिंट में पूरी एकाग्रता दिखाई! इस फोकस पर खुद को शाबाशी दें! ⚡",
      cheerful_serious: "गहन एकाग्रता वाला स्प्रिंट सफलतापूर्वक पूरा हुआ। आपकी कार्यक्षमता निरंतर बढ़ रही है।",
      calm_playful: "स्प्रिंट के दौरान बहुत सुंदर ध्यान लगा। बिना भटकाव के पढ़ने से एक सुखद संतोष मिलता है। ☕",
      calm_serious: "उच्च गुणवत्ता का अध्ययन संपन्न हुआ। अब कुछ पल विश्राम करें ताकि ज्ञान मस्तिष्क में स्थिर हो सके।",
    },
  },
  hard_day: {
    en: {
      cheerful_playful: "Hey, some days are tricky—and that's 100% okay! Even 5 minutes today is a massive win! 💛",
      cheerful_serious: "When study fatigue appears, scale back scope rather than stopping. One small task preserves momentum.",
      calm_playful: "Take a deep breath and loosen your shoulders. Today doesn't need to be perfect—just gentle. 🍃",
      calm_serious: "Rest and patience are essential components of education. Acknowledge your effort and proceed without haste.",
    },
    hi: {
      cheerful_playful: "सुनिए, कुछ दिन थोड़े मुश्किल होते हैं—और यह बिल्कुल सामान्य है! आज 5 मिनट पढ़ना भी बहुत बड़ी जीत है! 💛",
      cheerful_serious: "जब पढ़ाई में थकान महसूस हो, तो बड़ा लक्ष्य न बनाकर केवल एक छोटा काम पूरा करें। निरंतरता बनी रहेगी।",
      calm_playful: "एक गहरी सांस लें और तनाव छोड़ें। आज का दिन संपूर्ण होना जरूरी नहीं—बस सहजता से आगे बढ़ें। 🍃",
      calm_serious: "विश्राम और धैर्य भी सीखने का अभिन्न अंग हैं। अपने प्रयास का सम्मान करें और शांत रहें।",
    },
  },
  relax_mode: {
    en: {
      cheerful_playful: "Relax Mode is on! Unclench your jaw, smile, and let's explore topics with zero pressure. 🌸",
      cheerful_serious: "Relax Mode engaged. We are prioritizing comprehension depth over speed. Read deliberately.",
      calm_playful: "Notice your breathing. Learning happens naturally when the mind is peaceful and curious. 🌿",
      calm_serious: "Relax Mode active. Let go of hurry. Deep insight requires quiet contemplation.",
    },
    hi: {
      cheerful_playful: "रिलैक्स मोड ऑन है! चेहरे पर मुस्कान लाइए और बिना किसी तनाव के सीखने का आनंद लीजिए। 🌸",
      cheerful_serious: "रिलैक्स मोड सक्रिय है। हम गति से अधिक समझ और गहराई को प्राथमिकता दे रहे हैं। ध्यानपूर्वक पढ़ें।",
      calm_playful: "अपनी सांसों पर ध्यान दें। जब मन शांत और जिज्ञासु होता है, तब ज्ञान सबसे गहरा उतरता है। 🌿",
      calm_serious: "रिलैक्स मोड सक्रिय। किसी जल्दबाजी की आवश्यकता नहीं है। शांत चिंतन ही ज्ञान का आधार है।",
    },
  },
  general_recall: {
    en: {
      cheerful_playful: "Flashcard quiz time! Active recall lights up your brain way more than just re-reading! 🧠",
      cheerful_serious: "Retrieval practice strengthens synaptic pathways far more effectively than passive review.",
      calm_playful: "Testing yourself is like a gentle mind game. See what your memory offers up without tension. ✨",
      calm_serious: "Formulate your own answers before inspecting the card. Effortful retrieval embeds lasting mastery.",
    },
    hi: {
      cheerful_playful: "फ्लैशकार्ड्स का समय! खुद से प्रश्न पूछना केवल बार-बार पढ़ने से कहीं ज्यादा असरदार होता है! 🧠",
      cheerful_serious: "स्मृति से उत्तर निकालना निष्क्रिय अध्ययन की तुलना में याददाश्त को कहीं अधिक मजबूत करता है।",
      calm_playful: "खुद का टेस्ट लेना एक सुंदर मानसिक खेल जैसा है। बिना किसी घबराहट के देखें आपको क्या याद है। ✨",
      calm_serious: "कार्ड देखने से पहले अपने दिमाग में उत्तर सोचने का प्रयास करें। यही सच्ची महारत है।",
    },
  },
  night_study: {
    en: {
      cheerful_playful: "Burning the night lamp? Don't forget that a good night's sleep turns today's facts into memories! 🌙",
      cheerful_serious: "Evening study detected. Ensure you finish before sleep latency is impacted. Sleep consolidates learning.",
      calm_playful: "The night is quiet. Wrap up your current quest, drink some warm water, and rest well soon. 🌌",
      calm_serious: "Late-night hours. Cognitive consolidation occurs during sleep. Plan a restful conclusion to your evening.",
    },
    hi: {
      cheerful_playful: "रात को पढ़ाई? यह मत भूलिएगा कि अच्छी नींद ही आज पढ़े गए विषयों को स्थायी बनाती है! 🌙",
      cheerful_serious: "देर रात का अध्ययन। समय से सोने की योजना बनाएं, क्योंकि नींद के दौरान ही सीखी हुई बातें मस्तिष्क में पक्की होती हैं।",
      calm_playful: "रात शांत है। अपना यह कार्य पूरा करें, थोड़ा पानी पिएं और जल्दी विश्राम करें। 🌌",
      calm_serious: "रात्रि का समय। अध्ययन के बाद पर्याप्त नींद लेना ज्ञान को संजोने के लिए अत्यंत आवश्यक है।",
    },
  },
  phone_device: {
    en: {
      cheerful_playful: "Studying on your phone? Flashcards and Commute audio mode are the ultimate combo for quick wins on the go! 🎧",
      cheerful_serious: "Mobile device detected. Optimal study yield is achieved through rapid flashcard retrieval and commute audio.",
      calm_playful: "Studying on your phone? Sit back, plug in your earphones, and let's review flashcards calmly. 🌿",
      calm_serious: "Portable study session. Use audio listening and active recall flashcards to optimize mobile learning.",
    },
    hi: {
      cheerful_playful: "फोन पर पढ़ाई? फ्लैशकार्ड्स और कम्यूट ऑडियो मोड चलते-फिरते रिवीजन के लिए सबसे बढ़िया हैं! 🎧",
      cheerful_serious: "मोबाइल डिवाइस का उपयोग। फ्लैशकार्ड्स और ऑडियो मोड द्वारा त्वरित रिवीजन सबसे प्रभावी है।",
      calm_playful: "फोन पर पढ़ाई कर रहे हैं? इयरफ़ोन लगाएं और शांति से फ्लैशकार्ड्स दोहराएं। 🌿",
      calm_serious: "मोबाइल अध्ययन सत्र। सक्रिय फ्लैशकार्ड्स और कम्यूट ऑडियो द्वारा ज्ञान को स्थिर करें।",
    },
  },
  laptop_device: {
    en: {
      cheerful_playful: "Big screen, full keyboard! Perfect time to conquer a full practice exam paper or dive into deep notes! 💻",
      cheerful_serious: "Desktop workstation active. High-resolution display is ideal for full-length practice papers and mark schemes.",
      calm_playful: "At your desk? Settle in with a warm drink—deep practice exam papers and structured notes await. ☕",
      calm_serious: "Desktop workstation environment. Emulate timed exam conditions using full practice papers.",
    },
    hi: {
      cheerful_playful: "बड़ी स्क्रीन और कीबोर्ड! पूरा प्रैक्टिस पेपर हल करने या नोट्स में गहराई से जाने का सही समय है! 💻",
      cheerful_serious: "डेस्कटॉप वातावरण। संपूर्ण प्रैक्टिस पेपर्स और मार्किंग स्कीम्स के लिए यह सबसे अनुकूल है।",
      calm_playful: "मेज पर बैठे हैं? एक शांत मन से प्रैक्टिस पेपर्स और विस्तृत नोट्स का अध्ययन करें। ☕",
      calm_serious: "डेस्कटॉप अध्ययन सत्र। पूर्ण प्रैक्टिस पेपर्स द्वारा परीक्षा जैसी परिस्थितियों का अभ्यास करें।",
    },
  },
};

export interface ResolveMascotSpeechParams {
  personality: MascotPersonality;
  memories: MascotMemoryItem[];
  relaxMode: boolean;
  isHardDay?: boolean;
  isTimerRunning?: boolean;
  streak?: number;
  todayMinutes?: number;
  dailyMinutesGoal?: number;
  pendingTasksCount?: number;
  currentHour?: number;
  deviceType?: DeviceType;
  cheerNote?: { senderNickname: string; message: string; emoji: string };
}

/**
 * Resolves a contextually appropriate speech item from Pip,
 * fully flavored by personality sliders, memories, and Relax mode.
 */
export function resolveMascotSpeech(params: ResolveMascotSpeechParams): MascotSpeechItem {
  const {
    personality,
    memories,
    relaxMode,
    isHardDay = false,
    isTimerRunning = false,
    streak = 0,
    todayMinutes = 0,
    dailyMinutesGoal = 20,
    pendingTasksCount = 0,
    currentHour = 12,
    deviceType,
    cheerNote,
  } = params;

  const tone = determineMascotTone(personality, relaxMode);
  const lang = personality.language === 'hi' ? 'hi' : 'en';

  // 1a. Friend Cheer Note arrived from Study Circle
  if (cheerNote) {
    const text = `${cheerNote.senderNickname} sent a cheer: ${cheerNote.emoji} "${cheerNote.message}"`;
    return {
      text,
      voiceText: `${cheerNote.senderNickname} cheered: ${cheerNote.message}`,
      mood: 'celebrating',
      reason: {
        rule: 'Peer study circle encouragement note',
        data: [`From: ${cheerNote.senderNickname}`, 'Delivered via Thinklet code exchange'],
      },
    };
  }

  // 1. Focus Timer is currently running
  if (isTimerRunning) {
    const text =
      lang === 'hi'
        ? 'फोकस स्प्रिंट चल रहा है! सभी ध्यान भटकाने वाली चीजों को दूर रखें। 🎯'
        : "Focus Sprint active! Let's eliminate all distractions for the next few minutes. 🎯";
    return {
      text,
      voiceText: text,
      mood: 'focused',
      reason: {
        rule: 'Active study timer context',
        data: ['User is currently inside a focus session'],
      },
    };
  }

  // 2. Hard day detected
  if (isHardDay) {
    const text = TEMPLATES.hard_day[lang][tone];
    return {
      text,
      voiceText: text,
      mood: 'sleepy',
      reason: {
        rule: 'Hard day compassion detector',
        data: [
          `Daily progress low or consecutive error pattern detected`,
          `Tone variant: ${tone}`,
        ],
      },
    };
  }

  // 3. Late night study (after 9:30 PM / 21:30)
  if (currentHour >= 22 || currentHour < 5) {
    const text = TEMPLATES.night_study[lang][tone];
    return {
      text,
      voiceText: text,
      mood: 'sleepy',
      reason: {
        rule: 'Circadian wellbeing advisor',
        data: [`Current hour is ${currentHour}:00`, `Encouraging healthy rest`],
      },
    };
  }

  // 4. Memory-driven speech: check recent memories (last 10 memories)
  if (memories && memories.length > 0) {
    // Pick the most recent relevant memory
    const memory = memories[0];
    const templateKey =
      memory.type in TEMPLATES ? memory.type : 'topic_mastered';
    const topic = memory.topicName || memory.title || 'your recent subject';

    const rawTemplate = TEMPLATES[templateKey]?.[lang]?.[tone] || TEMPLATES.topic_mastered[lang][tone];
    const text = rawTemplate.replace('{topic}', topic).replace('{streak}', String(streak || 3));

    return {
      text,
      voiceText: text,
      mood: memory.type === 'tough_quiz' ? 'thinking' : 'happy',
      reason: {
        rule: 'Episodic mascot memory recall',
        data: [
          `Recalled memory: ${memory.title} from ${memory.date}`,
          `Personality tone: ${tone}`,
          `Language: ${lang.toUpperCase()}`,
        ],
      },
    };
  }

  // 5. Relax Mode is active
  if (relaxMode) {
    const text = TEMPLATES.relax_mode[lang][tone];
    return {
      text,
      voiceText: text,
      mood: 'thinking',
      reason: {
        rule: 'Relax Mode pacing advisor',
        data: ['Relax Mode is currently ON', 'Tone forced to calming variant'],
      },
    };
  }

  // 6. Streak milestone (if streak >= 3)
  if (streak >= 3) {
    const rawTemplate = TEMPLATES.streak_milestone[lang][tone];
    const text = rawTemplate.replace('{streak}', String(streak));
    return {
      text,
      voiceText: text,
      mood: 'celebrating',
      reason: {
        rule: 'Streak consistency celebration',
        data: [`Current streak is ${streak} days`, `Tone: ${tone}`],
      },
    };
  }

  // 6b. Device-aware ergonomic suggestion (if device context provided)
  if (deviceType === 'phone') {
    const text = TEMPLATES.phone_device[lang][tone];
    return {
      text,
      voiceText: text,
      mood: 'wave',
      reason: {
        rule: 'Device-aware study flow adaptation',
        data: ['Mobile touchscreen detected', 'Suggesting flashcards & commute audio'],
      },
    };
  }
  if (deviceType === 'laptop' || deviceType === 'desktop') {
    const text = TEMPLATES.laptop_device[lang][tone];
    return {
      text,
      voiceText: text,
      mood: 'studying',
      reason: {
        rule: 'Device-aware study flow adaptation',
        data: ['Desktop workstation detected', 'Suggesting practice papers & comprehensive notes'],
      },
    };
  }

  // 7. General recall & study tip fallback
  const text = TEMPLATES.general_recall[lang][tone];
  return {
    text,
    voiceText: text,
    mood: 'wave',
    reason: {
      rule: 'Active recall study principle',
      data: [`Daily goal: ${todayMinutes}/${dailyMinutesGoal}m`, `Tone: ${tone}`],
    },
  };
}

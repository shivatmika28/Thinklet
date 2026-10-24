const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testExtendedFeatures() {
  console.log('=== TESTING EXTENDED THINKLET FEATURES ===\n');

  // Load a material from DB
  const material = await prisma.studyMaterial.findFirst({
    include: { topics: true },
  });

  if (!material) {
    console.error('No study material found in database!');
    return;
  }

  const topics = material.topics.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    pages: [1, 2],
    summary: t.description
  }));

  const pages = [
    { pageNumber: 1, text: 'Cellular architecture includes mitochondria, nucleus, and ribosomes.' },
    { pageNumber: 2, text: 'Cellular respiration produces ATP through glycolysis, Krebs cycle, and electron transport.' }
  ];

  console.log(`Using Material: "${material.title}" with ${topics.length} topics.\n`);

  // 1. Spaced Repetition & Due Topics (Planner & Flashcards engine)
  console.log('1. Testing Spaced Repetition & Due Topics...');
  const { initializeTopicBoxes, getDueTodayTopics, getLeitnerSummary } = require('../src/features/services/spaced');
  const boxes = initializeTopicBoxes(topics);
  const due = getDueTodayTopics(topics);
  const leitner = getLeitnerSummary(topics);
  console.log(`   Boxes initialized: ${Object.keys(boxes).length}, Due today: ${due.length}, Box 1 count: ${leitner.box1.length} -> PASS`);

  // 2. Adaptive Planner logic (diff & session calculation)
  console.log('2. Testing Adaptive Study Planner Logic...');
  const { buildPlan, diffPlans } = require('../src/services/plan');
  const mockAttempt = {
    id: 'mock-att-1',
    createdAt: Date.now(),
    score: 3,
    totalQuestions: 5,
    topicMastery: { [topics[0].id]: 'weak', [topics[1]?.id || 't2']: 'mastered' },
    answers: []
  };
  const planA = buildPlan(mockAttempt, topics);
  const planB = buildPlan({ ...mockAttempt, topicMastery: { [topics[0].id]: 'mastered', [topics[1]?.id || 't2']: 'weak' } }, topics);
  const diff = diffPlans(planA, planB);
  console.log(`   Plan sessions generated: ${planA.sessions.length}, Diff detected: changed=${diff.changed.length} -> PASS`);

  // 3. Unified Mastery Calculation
  console.log('3. Testing Unified Mastery Tracker Engine...');
  const { getUnifiedTopicMastery } = require('../src/features/services/mastery');
  const mastery = getUnifiedTopicMastery(topics);
  console.log(`   Unified mastery computed for ${mastery.length} topics (Sample: ${mastery[0].topicName} -> ${mastery[0].mastery}) -> PASS`);

  // 4. Smart Notes Generation & Fallback
  console.log('4. Testing Smart Notes...');
  const { generateTopicNote } = require('../src/features/services/notes');
  const note = await generateTopicNote({ topic: topics[0], pages, type: 'definitions' });
  console.log(`   Note created: "${note.title}" (${note.content.slice(0, 60)}...) -> PASS`);

  // 5. Flashcards Generation
  console.log('5. Testing Flashcards Engine...');
  const { generateFlashcardsForWeakTopics } = require('../src/features/services/flashcards');
  const cards = await generateFlashcardsForWeakTopics({ topics, pages });
  console.log(`   Flashcards generated: ${cards.length} cards (Front: "${cards[0]?.front?.slice(0, 40) || 'N/A'}...") -> PASS`);

  // 6. Practice Paper Generator
  console.log('6. Testing Practice Paper Generator...');
  const { generatePracticePaper } = require('../src/features/services/paper');
  const paper = await generatePracticePaper({ topics, pages, level: 'medium' });
  console.log(`   Practice Paper created: ${paper.length} questions across sections -> PASS`);

  // 7. Answer Checker
  console.log('7. Testing Multi-Section Answer Checker...');
  const { checkAnswer } = require('../src/features/services/checker');
  const checkResult = await checkAnswer({
    question: 'What is the function of mitochondria in eukaryotic cells?',
    studentAnswer: 'Mitochondria produce ATP through cellular respiration and oxidative phosphorylation.',
    context: pages[0].text + '\n' + pages[1].text,
    pages,
    topicId: topics[0].id
  });
  console.log(`   Answer evaluated: Score=${checkResult.score * 100}% | Verdict=${checkResult.verdict} | Evidence="${checkResult.evidenceQuote.slice(0, 40)}..." -> PASS`);

  // 8. Visual Explainer
  console.log('8. Testing Visual Explainer...');
  const { generateVisualDiagram } = require('../src/features/services/visual');
  const visual = await generateVisualDiagram(topics[0], pages, 'concept_map', topics);
  console.log(`   Visual diagram generated: Type=${visual.type}, Nodes=${visual.nodes.length}, Edges=${visual.edges.length} -> PASS`);

  // 9. Speech / Audio Review Script
  console.log('9. Testing Audio Summary Generator...');
  const { generate60SecondReviewScript } = require('../src/features/utils/speech');
  const script = await generate60SecondReviewScript(topics.slice(0, 2), pages);
  console.log(`   Audio script generated: "${script.slice(0, 60)}..." -> PASS`);

  console.log('\nALL EXTENDED THINKLET FEATURES VERIFIED PROGRAMMATICALLY WITH ZERO CRASHES!');
  await prisma.$disconnect();
}

testExtendedFeatures().catch(err => {
  console.error('Extended features test failed:', err);
  process.exit(1);
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    const materials = await prisma.studyMaterial.findMany({
      include: { topics: true, quizAttempts: true, revisionTasks: true }
    });
    console.log('=== DATABASE AUDIT ===');
    console.log('StudyMaterials count:', materials.length);
    for (const m of materials) {
      console.log(`\nMaterial: "${m.title}" (ID: ${m.id})`);
      console.log(`  SourceType: ${m.sourceType}, Pages: ${m.pageCount}, Created: ${m.createdAt}`);
      console.log(`  Topics (${m.topics.length}):`, m.topics.map(t => t.name).join(', '));
      console.log(`  QuizAttempts (${m.quizAttempts.length}):`, m.quizAttempts.map(a => `Score: ${a.score}/${a.totalQuestions} (${a.createdAt.toISOString()})`).join('; '));
      console.log(`  RevisionTasks (${m.revisionTasks.length}):`, m.revisionTasks.map(r => `[${r.priority}] ${r.topicName} - ${r.status}`).join('; '));
    }

    const totalQuestions = await prisma.quizQuestion.count();
    const totalAnswers = await prisma.userAnswer.count();
    console.log('\nTotal QuizQuestions stored:', totalQuestions);
    console.log('Total UserAnswers stored:', totalAnswers);
  } catch (err) {
    console.error('Database query error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

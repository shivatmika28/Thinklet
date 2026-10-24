const { PrismaClient } = require('@prisma/client');
const http = require('http');
const prisma = new PrismaClient();

async function testAttempt() {
  const a = await prisma.quizAttempt.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!a) {
    console.log('No attempts in DB');
    return;
  }
  console.log('Fetching attempt ID:', a.id, 'Material ID:', a.materialId);
  http.get('http://localhost:3000/api/attempts/' + a.id, res => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => {
      console.log('HTTP Status:', res.statusCode);
      try {
        const parsed = JSON.parse(raw);
        console.log('Success:', parsed.success);
        console.log('Attempt Score:', parsed.attempt.score, '/', parsed.attempt.totalQuestions, '(', parsed.attempt.percentage, '%)');
        console.log('Previous Score:', parsed.attempt.previousScore);
        console.log('Topic Accuracies:', parsed.attempt.topicAccuracies);
        console.log('Answers count:', parsed.attempt.answers.length);
      } catch (e) {
        console.log('Raw output:', raw.slice(0, 300));
      }
    });
  });
  await prisma.$disconnect();
}

testAttempt();

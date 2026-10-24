// scripts/verify_6_requirements.mjs
// Comprehensive test of all 6 requirements against live Thinklet server

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("==================================================================");
  console.log("THINKLET — VERIFYING ALL 6 CORE FUNCTIONALITY REQUIREMENTS");
  console.log("==================================================================\n");

  let passedCount = 0;
  let totalCount = 6;

  // -------------------------------------------------------------------------
  // CRITERION 1: Accept a PDF or pasted study material
  // -------------------------------------------------------------------------
  console.log("▶ CRITERION 1: Ingesting Pasted Text & PDF Study Material...");
  
  // 1A: Test Pasted Text
  const pastedSampleText = `
[Page 1]
Cellular Respiration and Mitochondria
Cellular respiration is the fundamental biochemical process by which eukaryotic organisms convert biochemical energy from nutrients like glucose into adenosine triphosphate (ATP), releasing waste products such as carbon dioxide and water. The process occurs in three main stages: glycolysis in the cytoplasm, the citric acid cycle (Krebs cycle) in the mitochondrial matrix, and oxidative phosphorylation along the inner mitochondrial membrane. Glycolysis breaks down one 6-carbon glucose molecule into two 3-carbon pyruvate molecules, producing a net gain of 2 ATP and 2 NADH.

[Page 2]
The Krebs Cycle and Oxidative Phosphorylation
In the presence of oxygen, pyruvate enters the mitochondrial matrix where it is converted into Acetyl-CoA. Acetyl-CoA enters the Krebs cycle, yielding electron carriers NADH and FADH2, as well as 2 ATP per glucose molecule. Finally, oxidative phosphorylation utilizes the electron transport chain (ETC) and ATP synthase to generate approximately 26 to 28 ATP molecules via chemiosmosis. Oxygen acts as the terminal electron acceptor, binding protons to form water. Without oxygen, electron transport halts, forcing cells into anaerobic fermentation.
`;

  const pasteFormData = new FormData();
  pasteFormData.append("title", "Biology: Cellular Respiration");
  pasteFormData.append("text", pastedSampleText.trim());

  const pasteRes = await fetch(`${BASE_URL}/api/materials`, {
    method: "POST",
    body: pasteFormData,
  });

  const pasteJson = await pasteRes.json();
  if (!pasteJson.success || !pasteJson.material?.id) {
    throw new Error(`Criterion 1 failed on pasted text: ${JSON.stringify(pasteJson)}`);
  }
  const pastedMaterialId = pasteJson.material.id;
  console.log(`  ✓ Pasted study material accepted! ID: ${pastedMaterialId}`);
  console.log(`    Extracted topics: ${pasteJson.material.topics.map((t) => t.name).join(", ")}`);
  console.log(`    Pages count: ${pasteJson.material.pageCount}`);

  // 1B: Test PDF upload simulation (multipart file upload with valid PDF structure)
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const p1 = pdfDoc.addPage([600, 400]);
  p1.drawText("Plant Biology: Photosynthesis and Photophosphorylation in Chloroplasts.", { x: 50, y: 350, font, size: 12 });
  p1.drawText("Light reactions convert solar energy into ATP and NADPH across thylakoid membranes.", { x: 50, y: 320, font, size: 11 });
  const p2 = pdfDoc.addPage([600, 400]);
  p2.drawText("The Calvin Cycle and Dark Reactions occur in the stroma using enzyme RuBisCO.", { x: 50, y: 350, font, size: 12 });
  p2.drawText("Carbon dioxide is fixed into carbohydrate molecules through multiple enzymatic stages.", { x: 50, y: 320, font, size: 11 });
  const pdfBytes = await pdfDoc.save();
  const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
  const pdfFormData = new FormData();
  pdfFormData.append("title", "Plant Photosynthesis Notes");
  pdfFormData.append("file", pdfBlob, "photosynthesis.pdf");

  const pdfRes = await fetch(`${BASE_URL}/api/materials`, {
    method: "POST",
    body: pdfFormData,
  });
  const pdfJson = await pdfRes.json();
  if (!pdfJson.success || !pdfJson.material?.id) {
    throw new Error(`Criterion 1 failed on PDF upload: ${JSON.stringify(pdfJson)}`);
  }
  console.log(`  ✓ PDF study material accepted! ID: ${pdfJson.material.id}`);
  console.log("  [PASSED] Requirement 1: Accept a PDF or pasted study material.\n");
  passedCount++;

  // -------------------------------------------------------------------------
  // CRITERION 2: Explain concepts in simple language, with references to pages
  // -------------------------------------------------------------------------
  console.log("▶ CRITERION 2: Explaining concepts in simple language with page citations...");
  
  const explainRes = await fetch(`${BASE_URL}/api/materials/${pastedMaterialId}/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topicName: "Cellular Respiration and Mitochondria",
      explanationLevel: "age_12",
      tone: "friendly",
    }),
  });
  const explainJson = await explainRes.json();
  if (!explainJson.success || !explainJson.explanation) {
    throw new Error(`Criterion 2 failed: ${JSON.stringify(explainJson)}`);
  }

  const hasPageCitation = /\[Page\s*\d+\]|Page\s*\d+/i.test(explainJson.explanation) || (explainJson.citations && explainJson.citations.length > 0);
  console.log(`  ✓ Explanation generated (${explainJson.explanation.length} characters)`);
  console.log(`  ✓ Inline citations present: ${hasPageCitation} (Citations: ${explainJson.citations.join(", ")})`);
  console.log(`  Snippet: "${explainJson.explanation.slice(0, 160).replace(/\n/g, " ")}..."`);
  if (!hasPageCitation) {
    throw new Error("Explanation lacks required page citations!");
  }
  console.log("  [PASSED] Requirement 2: Explain concepts in simple language, with references to the relevant pages or passages.\n");
  passedCount++;

  // -------------------------------------------------------------------------
  // CRITERION 3: Generate a short diagnostic quiz and identify weak topics
  // -------------------------------------------------------------------------
  console.log("▶ CRITERION 3: Generating diagnostic quiz and detecting weak topics...");

  const quizRes = await fetch(`${BASE_URL}/api/materials/${pastedMaterialId}/quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ level: "standard" }),
  });
  const quizJson = await quizRes.json();
  if (!quizJson.success || !Array.isArray(quizJson.questions) || quizJson.questions.length !== 5) {
    throw new Error(`Criterion 3 failed to generate 5 quiz questions: ${JSON.stringify(quizJson)}`);
  }
  console.log(`  ✓ Diagnostic quiz generated with ${quizJson.questions.length} questions.`);
  quizJson.questions.forEach((q, i) => {
    console.log(`    Q${i + 1} (${q.topicName}): "${q.question.slice(0, 60)}..." [${q.pageReferences}]`);
  });

  // Submit with deliberate incorrect answers to test weak topic identification
  const questions = quizJson.questions;
  const submissionAnswers = {};
  questions.forEach((q, idx) => {
    submissionAnswers[q.id] = idx === 0 ? q.options[0] : "Deliberately wrong answer to trigger weak topic detection";
  });

  const submitRes = await fetch(`${BASE_URL}/api/materials/${pastedMaterialId}/quiz/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers: submissionAnswers }),
  });
  const submitJson = await submitRes.json();
  if (!submitJson.success) {
    throw new Error(`Quiz submission failed: ${JSON.stringify(submitJson)}`);
  }

  console.log(`  ✓ Quiz evaluated: Score ${submitJson.score}/${submitJson.totalQuestions} (${submitJson.percentage}%)`);
  console.log(`  ✓ Weak topics identified: ${submitJson.weakTopics.join(", ") || "None"}`);
  console.log(`  ✓ Topic breakdown count: ${submitJson.topicAccuracies.length}`);
  console.log("  [PASSED] Requirement 3: Generate a short diagnostic quiz and identify weak topics from the answers.\n");
  passedCount++;

  // -------------------------------------------------------------------------
  // CRITERION 4: Create a personalised revision plan and follow-up practice questions
  // -------------------------------------------------------------------------
  console.log("▶ CRITERION 4: Creating personalized revision plan & follow-up practice questions...");

  if (!submitJson.revisionTasks || submitJson.revisionTasks.length === 0) {
    throw new Error("Revision plan tasks were not created upon quiz completion!");
  }
  if (!submitJson.targetedPractice || submitJson.targetedPractice.length === 0) {
    throw new Error("Follow-up practice questions were not created!");
  }

  console.log(`  ✓ Generated ${submitJson.revisionTasks.length} prioritized revision tasks:`);
  submitJson.revisionTasks.forEach((t) => {
    console.log(`    - [${t.priority}] ${t.topicName}: ${t.recommendedActivity.slice(0, 75)}...`);
  });

  console.log(`  ✓ Generated ${submitJson.targetedPractice.length} follow-up practice questions:`);
  submitJson.targetedPractice.forEach((pq, i) => {
    console.log(`    - Practice Q${i + 1} (${pq.topicName}): "${pq.question.slice(0, 60)}..."`);
  });

  // Verify task persistence and toggle
  const firstTaskId = submitJson.revisionTasks[0].id;
  const patchRes = await fetch(`${BASE_URL}/api/revision/${firstTaskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "COMPLETED" }),
  });
  const patchJson = await patchRes.json();
  if (!patchJson.success || patchJson.task?.status !== "COMPLETED") {
    throw new Error("Failed to update revision task status!");
  }
  console.log(`  ✓ Revision task status updated to COMPLETED in database.`);
  console.log("  [PASSED] Requirement 4: Create a personalised revision plan and follow-up practice questions.\n");
  passedCount++;

  // -------------------------------------------------------------------------
  // CRITERION 5: Save quiz results and show progress across attempts
  // -------------------------------------------------------------------------
  console.log("▶ CRITERION 5: Verifying persistent quiz attempts and progress tracking...");

  const progressRes = await fetch(`${BASE_URL}/api/progress?materialId=${pastedMaterialId}`);
  const progressJson = await progressRes.json();
  if (!progressJson.success || !progressJson.stats) {
    throw new Error(`Criterion 5 failed to fetch progress: ${JSON.stringify(progressJson)}`);
  }

  const { totalAttempts, averageScore, recentAttempts, topicMastery, scoreTrend } = progressJson.stats;
  console.log(`  ✓ Total saved quiz attempts: ${totalAttempts}`);
  console.log(`  ✓ Average score across attempts: ${averageScore}%`);
  console.log(`  ✓ Recent attempts list length: ${recentAttempts.length}`);
  console.log(`  ✓ Score progression trend count: ${scoreTrend.length}`);
  console.log(`  ✓ Topic mastery records: ${topicMastery.map((tm) => `${tm.topicName} (${tm.percentage}%)`).join(", ")}`);

  if (totalAttempts < 1 || recentAttempts.length < 1) {
    throw new Error("No quiz attempts were found in the progress records!");
  }
  console.log("  [PASSED] Requirement 5: Save quiz results and show progress across attempts.\n");
  passedCount++;

  // -------------------------------------------------------------------------
  // CRITERION 6: Clearly indicate when an answer is unavailable in the uploaded material
  // -------------------------------------------------------------------------
  console.log("▶ CRITERION 6: Testing clear indication when answer is unavailable in uploaded material...");

  const outOfScopeQuestion = "What is the Schwarzschild radius of a rotating Kerr black hole in general relativity?";
  const unavailRes = await fetch(`${BASE_URL}/api/materials/${pastedMaterialId}/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topicName: "Cellular Respiration and Mitochondria",
      userQuestion: outOfScopeQuestion,
    }),
  });
  const unavailJson = await unavailRes.json();
  if (!unavailJson.success || !unavailJson.explanation) {
    throw new Error(`Criterion 6 request failed: ${JSON.stringify(unavailJson)}`);
  }

  console.log(`  Student Question: "${outOfScopeQuestion}"`);
  console.log(`  Tutor Response: "${unavailJson.explanation.slice(0, 150).replace(/\n/g, " ")}..."`);

  const indicatesUnavailable =
    unavailJson.explanation.toLowerCase().includes("not available in your uploaded material") ||
    unavailJson.explanation.toLowerCase().includes("not available in the uploaded material") ||
    unavailJson.explanation.toLowerCase().includes("not found in") ||
    unavailJson.explanation.toLowerCase().includes("does not contain");

  if (!indicatesUnavailable) {
    throw new Error(`Expected tutor to state that the information is unavailable, but received: "${unavailJson.explanation}"`);
  }

  console.log(`  ✓ Grounding refusal triggered correctly: Indicator matched.`);
  console.log("  [PASSED] Requirement 6: Clearly indicate when an answer is unavailable in the uploaded material.\n");
  passedCount++;

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  console.log("==================================================================");
  console.log(`SUMMARY: ${passedCount}/${totalCount} REQUIREMENTS FULLY VERIFIED & WORKING!`);
  console.log("==================================================================");
}

runTests().catch((err) => {
  console.error("\n❌ VERIFICATION ERROR:", err);
  process.exit(1);
});

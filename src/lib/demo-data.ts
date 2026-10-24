import { PageContent } from "./types";

export const DEMO_MATERIAL_TITLE = "Cellular Biology & Genetics: Core Principles [DEMO]";

export const DEMO_PAGES: PageContent[] = [
  {
    pageNumber: 1,
    text: `Chapter 1: Cellular Architecture & Organelles

The cell is the fundamental structural and functional unit of all living organisms. Eukaryotic cells are distinguished by membrane-bound organelles that partition biochemical reactions.

Key Organelles and Functions:
1. Mitochondria: Known as the powerhouse of the cell, mitochondria generate adenosine triphosphate (ATP) through oxidative phosphorylation. They contain their own circular double-stranded DNA (mtDNA) and replicate independently within the cell.
2. Ribosomes: Composed of ribosomal RNA (rRNA) and proteins, ribosomes are the molecular machines responsible for translating mRNA into polypeptide chains. They exist either free in the cytosol or bound to the rough endoplasmic reticulum.
3. Rough Endoplasmic Reticulum (RER): Studded with ribosomes, the RER folds, modifies, and packages newly synthesized proteins intended for secretion or insertion into cellular membranes.
4. Smooth Endoplasmic Reticulum (SER): Synthesizes lipids, phospholipids, and steroid hormones, while detoxifying metabolic byproducts and drugs, particularly in hepatocytes.
5. Golgi Apparatus: Acts as the sorting and dispatch station, chemically tagging proteins with carbohydrate moieties (glycosylation) before packaging them into vesicles.

Membrane Transport:
The plasma membrane is a selectively permeable phospholipid bilayer described by the fluid mosaic model. Passive transport (simple diffusion and facilitated diffusion) moves solutes down their concentration gradient without cellular energy expenditure. In contrast, active transport requires ATP to pump ions against their electrochemical gradient, such as the sodium-potassium pump (Na+/K+-ATPase), which moves 3 Na+ ions out of the cell and 2 K+ ions into the cell per ATP molecule hydrolyzed.`,
  },
  {
    pageNumber: 2,
    text: `Chapter 2: DNA Replication & Molecular Genetics

Deoxyribonucleic acid (DNA) stores hereditary information in the sequence of four nitrogenous bases: Adenine (A), Thymine (T), Guanine (G), and Cytosine (C). According to Watson-Crick base-pairing rules, Adenine pairs with Thymine via two hydrogen bonds, and Guanine pairs with Cytosine via three hydrogen bonds.

DNA Replication Machinery:
DNA replication is semi-conservative, meaning each daughter molecule contains one original parent strand and one newly synthesized strand.
- DNA Helicase: Unwinds and unzips the double helix at the replication fork by breaking hydrogen bonds between base pairs.
- Single-Stranded Binding Proteins (SSBs): Stabilize unwound single-stranded DNA to prevent reannealing.
- RNA Primase: Synthesizes short complementary RNA primers necessary for DNA polymerases to initiate synthesis.
- DNA Polymerase III: Elongates the nascent strand exclusively in the 5' to 3' direction. Because parental strands are antiparallel, the leading strand is synthesized continuously toward the replication fork, whereas the lagging strand is synthesized discontinuously away from the fork in short segments called Okazaki fragments.
- DNA Ligase: Catalyzes the formation of phosphodiester bonds, sealing nicks between Okazaki fragments.

Transcription and Translation:
Transcription occurs in the nucleus where RNA Polymerase II transcribes a gene's template strand into precursor messenger RNA (pre-mRNA). Pre-mRNA undergoes 5' capping, 3' polyadenylation, and splicing by spliceosomes to remove non-coding introns and join coding exons. Translation occurs in ribosomes, reading codons in triplets. AUG serves as the universal start codon encoding Methionine.`,
  },
  {
    pageNumber: 3,
    text: `Chapter 3: Mendelian Inheritance & Genetic Variation

Gregor Mendel's experiments on Pisum sativum (garden peas) established foundational principles of classical genetics.

Mendel's Laws:
1. Law of Segregation: During gamete formation, the two alleles for each gene segregate so that each gamete carries only one allele.
2. Law of Independent Assortment: Genes located on different non-homologous chromosomes assort independently into gametes during meiosis I.

Key Genetic Terminology:
- Genotype: The genetic constitution of an individual (e.g., homozygous dominant AA, heterozygous Aa, homozygous recessive aa).
- Phenotype: The observable physical or physiological traits determined by genotype and environmental interactions.
- Punnett Square: A diagrammatic grid predicting maternal and paternal gametic combinations and genotype ratios. A monohybrid cross between two heterozygotes (Aa x Aa) yields a 1:2:1 genotype ratio (1 AA : 2 Aa : 1 aa) and a 3:1 dominant-to-recessive phenotype ratio.

Non-Mendelian Patterns:
- Incomplete Dominance: Heterozygotes display an intermediate phenotype (e.g., crossing red and white snapdragons produces pink offspring).
- Codominance: Both alleles are simultaneously expressed without blending, exemplified by human ABO blood group system where IA and IB are codominant.
- Sex-Linked Inheritance: Genes residing on sex chromosomes (primarily the X chromosome) exhibit unique transmission patterns. Recessive X-linked disorders (e.g., hemophilia, red-green color blindness) affect males disproportionately because males are hemizygous (XY).`,
  },
  {
    pageNumber: 4,
    text: `Chapter 4: Cellular Respiration & Bioenergetics

Cellular respiration is the biochemical pathway through which eukaryotic cells catabolize glucose into carbon dioxide, water, and usable energy in the form of ATP. The overall net balanced chemical equation is:
C6H12O6 + 6 O2 -> 6 CO2 + 6 H2O + ~30-32 ATP.

The Four Main Stages:
1. Glycolysis: Occurs anaerobically in the cytoplasm. One 6-carbon glucose molecule is broken down into two 3-carbon pyruvate molecules, yielding a net gain of 2 ATP (substrate-level phosphorylation) and 2 NADH.
2. Pyruvate Oxidation: Pyruvate is transported into the mitochondrial matrix, where pyruvate dehydrogenase converts it into Acetyl-CoA, releasing 1 CO2 and generating 1 NADH per pyruvate (total 2 CO2 and 2 NADH per glucose).
3. The Citric Acid Cycle (Krebs Cycle): Occurs in the mitochondrial matrix. Acetyl-CoA combines with oxaloacetate (4C) to form citrate (6C). Through cyclical oxidation reactions, two turns of the cycle yield 4 CO2, 6 NADH, 2 FADH2, and 2 ATP (or GTP).
4. Oxidative Phosphorylation: Takes place across the inner mitochondrial membrane (cristae). High-energy electrons from NADH and FADH2 pass through complexes I-IV of the Electron Transport Chain (ETC). As electrons cascade down to oxygen (the terminal electron acceptor, forming H2O), protons (H+) are pumped into the intermembrane space, creating a steep electrochemical proton gradient. Protons flow back into the matrix through ATP Synthase (chemiosmosis), generating ~26-28 ATP.`,
  },
];

export const DEMO_TOPICS = [
  {
    name: "Cellular Architecture & Organelles",
    description: "Structure and functions of eukaryotic organelles including mitochondria, ribosomes, ER, and membrane transport.",
    order: 1,
  },
  {
    name: "DNA Replication & Molecular Genetics",
    description: "Semi-conservative replication enzymes, replication fork dynamics, transcription, splicing, and translation.",
    order: 2,
  },
  {
    name: "Mendelian Inheritance & Genetic Variation",
    description: "Mendel's laws of segregation, Punnett squares, non-Mendelian inheritance, and sex-linked traits.",
    order: 3,
  },
  {
    name: "Cellular Respiration & Bioenergetics",
    description: "Glycolysis, pyruvate oxidation, Krebs cycle, electron transport chain, and chemiosmosis for ATP synthesis.",
    order: 4,
  },
];

export const DEMO_QUIZ_QUESTIONS = [
  {
    question: "Which organelle is responsible for synthesizing lipids, steroid hormones, and detoxifying drugs in hepatocytes?",
    options: [
      "Rough Endoplasmic Reticulum",
      "Smooth Endoplasmic Reticulum",
      "Golgi Apparatus",
      "Mitochondria",
    ],
    correctAnswer: "Smooth Endoplasmic Reticulum",
    explanation: "According to [Page 1], the Smooth Endoplasmic Reticulum (SER) synthesizes lipids, phospholipids, and steroid hormones while detoxifying metabolic byproducts and drugs.",
    topicName: "Cellular Architecture & Organelles",
    pageReferences: "Page 1",
  },
  {
    question: "During DNA replication, which enzyme synthesizes the initial short complementary RNA sequences required for DNA polymerases to begin elongation?",
    options: [
      "DNA Helicase",
      "DNA Ligase",
      "RNA Primase",
      "DNA Polymerase III",
    ],
    correctAnswer: "RNA Primase",
    explanation: "As documented on [Page 2], RNA Primase synthesizes short complementary RNA primers necessary for DNA polymerases to initiate synthesis.",
    topicName: "DNA Replication & Molecular Genetics",
    pageReferences: "Page 2",
  },
  {
    question: "In a classic Mendelian monohybrid cross between two heterozygous parents (Aa x Aa), what is the expected phenotypic ratio of dominant to recessive traits?",
    options: [
      "1:2:1",
      "9:3:3:1",
      "3:1",
      "1:1",
    ],
    correctAnswer: "3:1",
    explanation: "On [Page 3], a monohybrid cross between two heterozygotes (Aa x Aa) yields a 1:2:1 genotype ratio (1 AA : 2 Aa : 1 aa) and a 3:1 dominant-to-recessive phenotype ratio.",
    topicName: "Mendelian Inheritance & Genetic Variation",
    pageReferences: "Page 3",
  },
  {
    question: "During oxidative phosphorylation in the inner mitochondrial membrane, what is the final terminal electron acceptor in the electron transport chain?",
    options: [
      "Carbon Dioxide (CO2)",
      "Oxygen (O2)",
      "NAD+",
      "Pyruvate",
    ],
    correctAnswer: "Oxygen (O2)",
    explanation: "As explained on [Page 4], electrons cascade down to oxygen (the terminal electron acceptor), which combines with protons to form H2O.",
    topicName: "Cellular Respiration & Bioenergetics",
    pageReferences: "Page 4",
  },
  {
    question: "How many sodium (Na+) and potassium (K+) ions are moved across the plasma membrane by the Na+/K+-ATPase pump per molecule of ATP hydrolyzed?",
    options: [
      "2 Na+ out, 3 K+ in",
      "3 Na+ out, 2 K+ in",
      "3 Na+ in, 2 K+ out",
      "1 Na+ out, 1 K+ in",
    ],
    correctAnswer: "3 Na+ out, 2 K+ in",
    explanation: "According to [Page 1], the sodium-potassium pump (Na+/K+-ATPase) moves 3 Na+ ions out of the cell and 2 K+ ions into the cell per ATP molecule hydrolyzed.",
    topicName: "Cellular Architecture & Organelles",
    pageReferences: "Page 1",
  },
];

export const DEMO_TARGETED_PRACTICE = [
  {
    question: "Why is the lagging strand synthesized discontinuously in Okazaki fragments during DNA replication?",
    options: [
      "DNA Helicase moves backward on the lagging strand",
      "DNA Polymerase can only synthesize in the 5' to 3' direction while the parental strand unwinds in the opposite orientation",
      "RNA Primase cannot bind to the lagging strand",
      "Lagging strands lack single-stranded binding proteins",
    ],
    correctAnswer: "DNA Polymerase can only synthesize in the 5' to 3' direction while the parental strand unwinds in the opposite orientation",
    explanation: "According to [Page 2], DNA Polymerase III elongates nascent strands exclusively in the 5' to 3' direction, requiring the lagging strand to be synthesized discontinuously away from the replication fork in Okazaki fragments.",
    topicName: "DNA Replication & Molecular Genetics",
    pageReferences: "Page 2",
  },
  {
    question: "Why do X-linked recessive genetic disorders disproportionately affect biological males compared to females?",
    options: [
      "Males carry two defective X chromosomes",
      "Males are hemizygous (XY) and possess only a single X chromosome",
      "Y chromosomes actively inhibit dominant alleles",
      "X-linked traits cannot be transcribed in females",
    ],
    correctAnswer: "Males are hemizygous (XY) and possess only a single X chromosome",
    explanation: "As stated on [Page 3], recessive X-linked disorders affect males disproportionately because males are hemizygous (XY) and do not have a second X chromosome to mask recessive mutations.",
    topicName: "Mendelian Inheritance & Genetic Variation",
    pageReferences: "Page 3",
  },
  {
    question: "In cellular respiration, what biochemical process directly harnesses the proton gradient across the inner mitochondrial membrane to produce ATP?",
    options: [
      "Substrate-level phosphorylation in glycolysis",
      "Pyruvate decarboxylation",
      "Chemiosmosis via ATP Synthase",
      "Citrate synthesis in the Krebs cycle",
    ],
    correctAnswer: "Chemiosmosis via ATP Synthase",
    explanation: "As outlined on [Page 4], protons flow back into the mitochondrial matrix through ATP Synthase in a process known as chemiosmosis, generating ~26-28 ATP.",
    topicName: "Cellular Respiration & Bioenergetics",
    pageReferences: "Page 4",
  },
];

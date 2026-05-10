export interface StudyHelpSection {
  readonly heading: string
  readonly paragraphs: readonly string[]
}

/** Long-form study notes shown in the global “Study tips” dialog (scrollable). */
export const STUDY_HELP_SECTIONS: readonly StudyHelpSection[] = [
  {
    heading: 'How to use this site',
    paragraphs: [
      'Use Writing to practise Task 1 or Task 2 with a timer and word count. Draw a random prompt from your backoffice library, write your answer, then submit for AI feedback. Treat feedback as a tutor-style guide, not an official IELTS score.',
      'Task 1 prompts may include a chart or diagram: tap the image to open a full-screen view where you can pinch-zoom and pan. Use blank lines between paragraphs so the per-paragraph word count under the box stays meaningful.',
      'History stores attempts when Firebase is configured and you are signed in. Backoffice is for adding and reviewing prompts.',
    ],
  },
  {
    heading: 'IELTS Writing — timing',
    paragraphs: [
      'In the real exam you have 60 minutes for both tasks. Many candidates use about 20 minutes for Task 1 and 40 minutes for Task 2 because Task 2 carries twice the marks.',
      'Practise planning in 2–5 minutes: underline key instructions, decide your position (Task 2) or the main trends (Task 1), and sketch a simple paragraph order before you write.',
      'Leave 2–3 minutes at the end to fix clear grammar mistakes and check that you answered every part of the question.',
    ],
  },
  {
    heading: 'Task 2 — argument essays',
    paragraphs: [
      'Read the question twice. Identify the topic, the focus (e.g. agree/disagree, problem/solution, advantages/disadvantages), and any limiting words (e.g. “only”, “main reason”).',
      'Aim for four paragraphs: introduction (2–3 sentences), two body paragraphs with one clear idea each and support (explanation or example), and a short conclusion that restates your position without copying the introduction word-for-word.',
      'Use a range of linking devices (however, therefore, although, for instance) but avoid mechanical lists. Coherence matters more than fancy vocabulary.',
    ],
  },
  {
    heading: 'Task 1 — describing visuals',
    paragraphs: [
      'Summarise main trends and comparisons; do not list every number. Start with an overview (overall pattern) in the introduction or in a short paragraph after it.',
      'Group data logically (e.g. highest/lowest, similar trends over time). Use approximate language where appropriate (about, roughly, just over) when you do not need exact figures.',
      'Keep the tone factual and objective. Avoid giving opinions or reasons that are not shown in the task.',
    ],
  },
  {
    heading: 'Lexical resource (vocabulary)',
    paragraphs: [
      'Prioritise accuracy and collocation over rare words. Misused “advanced” words lower your score more than simple correct language.',
      'Build a small set of topic phrases you can reuse across essays (environment, education, technology, health) and practise paraphrasing the question in the introduction.',
      'Avoid repeating the same noun or adjective in adjacent sentences; use synonyms or pronouns where the reference stays clear.',
    ],
  },
  {
    heading: 'Grammar and sentence variety',
    paragraphs: [
      'Mix simple and complex sentences. Too many very long sentences often contain agreement or punctuation errors; too many short sentences can sound choppy.',
      'Check subject–verb agreement, articles (a/the), and tense consistency when you narrate past examples.',
      'If you are unsure of a complex structure, choose a simpler one that you can produce accurately.',
    ],
  },
  {
    heading: 'Coherence and cohesion',
    paragraphs: [
      'One main idea per paragraph, introduced early and developed with explanation or example. Use paragraph breaks so the examiner can follow your logic quickly.',
      'Referencing words (this trend, such policies, these measures) should have a clear antecedent. If in doubt, repeat a key noun once for clarity.',
      'Signpost sparingly: Firstly / In contrast / As a result help the reader, but overuse feels mechanical.',
    ],
  },
  {
    heading: 'Word count and formality',
    paragraphs: [
      'Task 1: aim for at least 150 words; Task 2: at least 250. Writing far below the minimum attracts a penalty; far above leaves less time to polish.',
      'Use a neutral or semi-formal register. Contractions (don’t, it’s) are often acceptable in IELTS Writing, but avoid slang and overly chatty openings.',
      'Do not memorise whole essays. Examiners penalise off-topic memorised chunks; practise adapting ideas to the exact question.',
    ],
  },
  {
    heading: 'Using AI feedback wisely',
    paragraphs: [
      'Read the band estimate as informal guidance. Official IELTS scoring considers multiple criteria and human judgement.',
      'When the model suggests a “model answer”, compare structure and ideas, then rewrite in your own words to consolidate learning.',
      'If feedback contradicts your teacher or textbook, trust classroom guidance for exam strategy and use AI as extra practice only.',
    ],
  },
  {
    heading: 'Revision habits',
    paragraphs: [
      'Keep a log of mistakes you repeat (articles, prepositions, word order) and fix one pattern per week rather than trying to change everything at once.',
      'Re-do the same prompt type after a few days without looking at your old answer, then compare drafts to see progress.',
      'Mix timed practice (exam conditions) with slow, careful writing where you focus on accuracy and collocations.',
    ],
  },
]

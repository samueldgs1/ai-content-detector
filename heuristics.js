// AIRadar Heuristics Engine
// Detects AI-generated text using pattern analysis — no API key needed.

const AIHeuristics = (() => {

  // Words/phrases heavily overused by LLMs
  const AI_PHRASES = [
    'delve into', 'delve deeper', 'let\'s delve',
    'it\'s important to note', 'it is important to note',
    'i\'d be happy to', 'i would be happy to',
    'certainly!', 'certainly,', 'absolutely!', 'absolutely,',
    'as an ai', 'as a large language model', 'i\'m just an ai',
    'in conclusion,', 'to summarize,', 'in summary,',
    'it\'s worth noting', 'it is worth noting',
    'furthermore,', 'moreover,', 'additionally,',
    'in the realm of', 'in the world of', 'in today\'s world',
    'navigating the', 'leverage', 'game-changer', 'game changer',
    'revolutionize', 'cutting-edge', 'at the forefront',
    'comprehensive guide', 'dive deep', 'dive into',
    'rest assured', 'look no further', 'without further ado',
    'tapestry', 'multifaceted', 'nuanced approach',
    'fostering', 'underscore', 'robust', 'holistic',
    'evolving landscape', 'rapidly evolving', 'ever-evolving',
    'unlock the potential', 'harness the power',
    'shed light on', 'pave the way', 'in terms of',
  ];

  // Structural patterns of AI text
  function scoreStructure(text) {
    let score = 0;
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length === 0) return 0;

    // AI tends to write very uniform sentence lengths
    const lengths = sentences.map(s => s.trim().length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((a, b) => a + Math.abs(b - avg), 0) / lengths.length;
    if (variance < 20 && sentences.length > 4) score += 15; // low burstiness

    // AI loves starting sentences with transition words
    const transitionStarts = sentences.filter(s =>
      /^\s*(However|Furthermore|Moreover|Additionally|Therefore|Thus|Hence|Consequently|Nevertheless|Nonetheless|In addition|As a result|For instance|For example)/i.test(s)
    ).length;
    score += Math.min(transitionStarts * 8, 30);

    // AI rarely uses contractions in formal text
    const contractions = (text.match(/\b(don't|doesn't|isn't|aren't|wasn't|weren't|haven't|hadn't|won't|wouldn't|can't|couldn't|I'm|I've|I'd|I'll)\b/gi) || []).length;
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 100 && contractions / wordCount < 0.005) score += 10;

    // Excessive use of em-dashes (AI loves these)
    const emDashes = (text.match(/—/g) || []).length;
    if (emDashes > 3) score += 10;

    return score;
  }

  function scorePhrases(text) {
    const lower = text.toLowerCase();
    let score = 0;
    let matched = [];

    AI_PHRASES.forEach(phrase => {
      if (lower.includes(phrase)) {
        score += 12;
        matched.push(phrase);
      }
    });

    return { score: Math.min(score, 60), matched };
  }

  function scoreLength(text) {
    // AI tends to produce very thorough, padded responses
    const words = text.split(/\s+/).length;
    if (words > 500) return 5;
    if (words > 1000) return 10;
    return 0;
  }

  // Main scoring function — returns 0-100
  function analyze(text) {
    if (!text || text.trim().length < 80) return { score: 0, signals: [], matched: [] };

    const { score: phraseScore, matched } = scorePhrases(text);
    const structScore = scoreStructure(text);
    const lenScore = scoreLength(text);

    const total = Math.min(phraseScore + structScore + lenScore, 100);

    const signals = [];
    if (phraseScore > 0) signals.push(`${matched.length} AI phrase(s) detected`);
    if (structScore > 15) signals.push('Uniform sentence structure');
    if (structScore > 25) signals.push('Excessive transition words');

    return { score: total, signals, matched };
  }

  function label(score) {
    if (score >= 70) return { verdict: 'Likely AI', color: '#ef4444', emoji: '🤖' };
    if (score >= 40) return { verdict: 'Possibly AI', color: '#f59e0b', emoji: '⚠️' };
    if (score >= 20) return { verdict: 'Uncertain', color: '#6366f1', emoji: '🔍' };
    return { verdict: 'Likely Human', color: '#22c55e', emoji: '✅' };
  }

  return { analyze, label };
})();

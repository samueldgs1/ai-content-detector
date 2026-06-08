// Sift - heuristics engine
// scores text blocks for AI-generated patterns

const AIHeuristics = (() => {

  const FLAGGED_PHRASES = [
    'delve into', 'delve deeper', "let's delve",
    "it's important to note", 'it is important to note',
    "i'd be happy to", 'i would be happy to',
    'certainly!', 'certainly,', 'absolutely!', 'absolutely,',
    'as an ai', 'as a large language model', "i'm just an ai",
    'in conclusion,', 'to summarize,', 'in summary,',
    "it's worth noting", 'it is worth noting',
    'furthermore,', 'moreover,', 'additionally,',
    'in the realm of', 'in the world of', "in today's world",
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

  function scoreStructure(text) {
    let score = 0;
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length === 0) return 0;

    const lengths = sentences.map(s => s.trim().length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((a, b) => a + Math.abs(b - avg), 0) / lengths.length;
    if (variance < 20 && sentences.length > 4) score += 15;

    const transitionStarts = sentences.filter(s =>
      /^\s*(However|Furthermore|Moreover|Additionally|Therefore|Thus|Hence|Consequently|Nevertheless|Nonetheless|In addition|As a result|For instance|For example)/i.test(s)
    ).length;
    score += Math.min(transitionStarts * 8, 30);

    const contractions = (text.match(/\b(don't|doesn't|isn't|aren't|wasn't|weren't|haven't|hadn't|won't|wouldn't|can't|couldn't|I'm|I've|I'd|I'll)\b/gi) || []).length;
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 100 && contractions / wordCount < 0.005) score += 10;

    const emDashes = (text.match(/—/g) || []).length;
    if (emDashes > 3) score += 10;

    return score;
  }

  function scorePhrases(text) {
    const lower = text.toLowerCase();
    let score = 0;
    let matched = [];

    FLAGGED_PHRASES.forEach(phrase => {
      if (lower.includes(phrase)) {
        score += 12;
        matched.push(phrase);
      }
    });

    return { score: Math.min(score, 60), matched };
  }

  function scoreLength(text) {
    const words = text.split(/\s+/).length;
    if (words > 1000) return 10;
    if (words > 500) return 5;
    return 0;
  }

  function analyze(text) {
    if (!text || text.trim().length < 80) return { score: 0, signals: [], matched: [] };

    const { score: phraseScore, matched } = scorePhrases(text);
    const structScore = scoreStructure(text);
    const lenScore = scoreLength(text);
    const total = Math.min(phraseScore + structScore + lenScore, 100);

    const signals = [];
    if (matched.length > 0) signals.push(`${matched.length} flagged phrase(s)`);
    if (structScore > 15) signals.push('Uniform sentence length');
    if (structScore > 25) signals.push('Heavy use of transition words');

    return { score: total, signals, matched };
  }

  function label(score) {
    if (score >= 70) return { verdict: 'Likely generated', color: '#ef4444' };
    if (score >= 40) return { verdict: 'Possibly generated', color: '#f59e0b' };
    if (score >= 20) return { verdict: 'Uncertain', color: '#6366f1' };
    return { verdict: 'Looks human', color: '#22c55e' };
  }

  return { analyze, label };
})();

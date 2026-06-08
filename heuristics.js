// Sift - heuristics engine
// Detects AI-generated text using pattern analysis, perplexity approximation,
// burstiness scoring, and vocabulary richness — no API key needed.

const AIHeuristics = (() => {

  // Phrases heavily overused by LLMs
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
    'it is worth', 'plays a crucial role', 'plays a vital role',
    'crucial role', 'vital role', 'key takeaway',
    'it goes without saying', 'needless to say',
    'at the end of the day', 'when it comes to',
  ];

  // Very common "safe" words AI relies on heavily
  // High usage of these relative to total = lower vocabulary richness
  const BLAND_WORDS = new Set([
    'the','be','to','of','and','a','in','that','have','it','for','not',
    'on','with','he','as','you','do','at','this','but','his','by','from',
    'they','we','say','her','she','or','an','will','my','one','all','would',
    'there','their','what','so','up','out','if','about','who','get','which',
    'go','me','when','make','can','like','time','no','just','him','know',
    'take','people','into','year','your','good','some','could','them','see',
    'other','than','then','now','look','only','come','its','over','think',
    'also','back','after','use','two','how','our','work','first','well',
    'way','even','new','want','because','any','these','give','day','most',
    'us','great','between','need','large','often','important','provide',
    'through','different','should','each','many','those','show','such',
    'help','including','however','both','where','much','before','right',
    'too','mean','old','any','same','tell','boy','follow','came','show',
  ]);

  // ── 1. Phrase detection ─────────────────────────────────────────────────
  function scorePhrases(text) {
    const lower = text.toLowerCase();
    let score = 0;
    const matched = [];
    FLAGGED_PHRASES.forEach(phrase => {
      if (lower.includes(phrase)) { score += 10; matched.push(phrase); }
    });
    return { score: Math.min(score, 50), matched };
  }

  // ── 2. Burstiness (sentence length variance) ────────────────────────────
  // Human writing has HIGH variance — short and long sentences mixed.
  // AI output has LOW variance — suspiciously uniform sentence lengths.
  function scoreBurstiness(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length < 4) return 0;

    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);

    // Low std dev = uniform = likely AI
    // stdDev < 3 is very suspicious, < 6 is mildly suspicious
    if (stdDev < 3) return 25;
    if (stdDev < 5) return 15;
    if (stdDev < 7) return 8;
    return 0;
  }

  // ── 3. Vocabulary richness (Type-Token Ratio) ───────────────────────────
  // AI repeats the same vocabulary. Humans use more varied words.
  function scoreVocabRichness(text) {
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    if (words.length < 50) return 0;

    const unique = new Set(words);
    const ttr = unique.size / words.length; // 0-1, higher = richer vocab

    // Count how many words are bland/generic
    const blandCount = words.filter(w => BLAND_WORDS.has(w)).length;
    const blandRatio = blandCount / words.length;

    let score = 0;
    // Low TTR = repetitive = AI-like
    if (ttr < 0.35) score += 20;
    else if (ttr < 0.45) score += 10;
    else if (ttr < 0.55) score += 5;

    // High bland ratio = safe/generic word choices = AI-like
    if (blandRatio > 0.65) score += 10;
    else if (blandRatio > 0.55) score += 5;

    return Math.min(score, 25);
  }

  // ── 4. Approximate perplexity via bigram predictability ─────────────────
  // AI text tends to use highly predictable word pairings.
  // We approximate this with a list of "cliché bigrams" LLMs overuse.
  const CLICHE_BIGRAMS = new Set([
    'is important', 'are important', 'is crucial', 'are crucial',
    'is essential', 'are essential', 'is key', 'plays a',
    'in order', 'as well', 'such as', 'for example',
    'in addition', 'as a', 'it is', 'this is',
    'can be', 'may be', 'will be', 'has been',
    'have been', 'is also', 'are also', 'not only',
    'but also', 'as well as', 'due to', 'in terms',
    'based on', 'according to', 'refers to', 'known as',
    'defined as', 'considered as', 'seen as', 'used to',
    'able to', 'allows us', 'enables us', 'helps us',
    'provides a', 'offers a', 'creates a', 'ensures a',
    'plays an', 'serves as', 'acts as', 'works as',
  ]);

  function scorePerplexity(text) {
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    if (words.length < 30) return 0;

    let clicheHits = 0;
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = words[i] + ' ' + words[i + 1];
      if (CLICHE_BIGRAMS.has(bigram)) clicheHits++;
    }

    const clicheRate = clicheHits / (words.length - 1);

    if (clicheRate > 0.12) return 20;
    if (clicheRate > 0.08) return 12;
    if (clicheRate > 0.05) return 6;
    return 0;
  }

  // ── 5. Structural patterns ──────────────────────────────────────────────
  function scoreStructure(text) {
    let score = 0;
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    // Transition word overuse
    const transitions = sentences.filter(s =>
      /^\s*(However|Furthermore|Moreover|Additionally|Therefore|Thus|Hence|Consequently|Nevertheless|In addition|As a result|For instance|For example|Notably|Importantly|Significantly|Interestingly)/i.test(s)
    ).length;
    score += Math.min(transitions * 6, 20);

    // Lack of contractions in running text
    const words = text.split(/\s+/).length;
    const contractions = (text.match(/\b(don't|doesn't|isn't|aren't|wasn't|weren't|haven't|hadn't|won't|wouldn't|can't|couldn't|I'm|I've|I'd|I'll|that's|it's|there's|here's|let's|who's)\b/gi) || []).length;
    if (words > 100 && contractions / words < 0.004) score += 8;

    // Em-dash overuse
    const emDashes = (text.match(/—/g) || []).length;
    if (emDashes > 3) score += 8;

    // Lists/colons (AI loves structured bullet-style prose)
    const colons = (text.match(/:/g) || []).length;
    if (colons > 4) score += 5;

    return Math.min(score, 25);
  }

  // ── Main scorer ─────────────────────────────────────────────────────────
  function analyze(text) {
    if (!text || text.trim().length < 80) return { score: 0, signals: [], matched: [] };

    const { score: phraseScore, matched } = scorePhrases(text);
    const burstScore   = scoreBurstiness(text);
    const vocabScore   = scoreVocabRichness(text);
    const perpScore    = scorePerplexity(text);
    const structScore  = scoreStructure(text);

    const total = Math.min(phraseScore + burstScore + vocabScore + perpScore + structScore, 100);

    const signals = [];
    if (matched.length > 0)  signals.push(`${matched.length} flagged phrase(s)`);
    if (burstScore > 10)     signals.push('Uniform sentence length (low burstiness)');
    if (vocabScore > 10)     signals.push('Low vocabulary diversity');
    if (perpScore > 10)      signals.push('Predictable word patterns');
    if (structScore > 10)    signals.push('Heavy use of transition words');

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

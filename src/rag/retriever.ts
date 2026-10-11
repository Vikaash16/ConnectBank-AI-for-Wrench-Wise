/**
 * Layer 7 - Local Banking Policy Knowledge Retriever
 * BM25-inspired keyword & semantic tag search with excerpt extraction and relevance ranking.
 */

import { BANKING_POLICIES, PolicyDocument } from './knowledgeBase.ts';
import { PolicyCitation } from '../types/banking.ts';

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

export function searchPolicies(query: string, topK = 3): { doc: PolicyDocument; score: number; excerpt: string }[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return [];
  }

  const results: { doc: PolicyDocument; score: number; excerpt: string }[] = [];

  for (const doc of BANKING_POLICIES) {
    let score = 0;
    const titleTokens = tokenize(doc.title);
    const summaryTokens = tokenize(doc.summary);
    const contentTokens = tokenize(doc.content);
    const tagTokens = doc.tags.map(t => t.toLowerCase());

    queryTokens.forEach(qToken => {
      // Direct tag match: high weight
      if (tagTokens.some(tag => tag.includes(qToken))) {
        score += 3.5;
      }
      // Title match: high weight
      if (titleTokens.includes(qToken)) {
        score += 2.5;
      }
      // Summary match: medium weight
      if (summaryTokens.includes(qToken)) {
        score += 1.5;
      }
      // Content occurrence
      const countInContent = contentTokens.filter(t => t === qToken).length;
      if (countInContent > 0) {
        score += Math.min(2.0, countInContent * 0.4);
      }
    });

    if (score > 0.5) {
      // Generate excerpt around the most relevant match
      const sentences = doc.content.split(/\.\s+/);
      let bestSentence = doc.summary;
      let maxSentenceHits = 0;

      for (const sent of sentences) {
        const sentTokens = tokenize(sent);
        const hits = queryTokens.filter(t => sentTokens.includes(t)).length;
        if (hits > maxSentenceHits) {
          maxSentenceHits = hits;
          bestSentence = sent;
        }
      }

      const excerpt = bestSentence.length > 240 ? bestSentence.slice(0, 237) + '...' : bestSentence;

      // Normalize score between 0.5 and 0.99
      const normalizedScore = Math.min(0.99, Number((score / (score + 5)).toFixed(2)));
      results.push({ doc, score: normalizedScore, excerpt });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}

export function retrieveRelevantPolicies(query: string, topK = 2): PolicyCitation[] {
  const matches = searchPolicies(query, topK);
  return matches.map(m => ({
    docId: m.doc.id,
    title: m.doc.title,
    category: m.doc.category,
    excerpt: m.excerpt,
    relevanceScore: m.score,
  }));
}

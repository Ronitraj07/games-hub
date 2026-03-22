/**
 * Ending System for Detective game
 * Calculates investigation quality and determines appropriate ending
 */

export interface InvestigationMetrics {
  // Accuracy
  correctSuspectAccused: boolean;
  suspectAccuracy: number; // 0-100%

  // Evidence collection
  totalEvidenceFound: number;
  keyCluesTotalCount: number;
  keyCluesFound: number;
  evidenceQualityScore: number; // 0-100

  // NPC interaction depth
  totalNPCsInteracted: number;
  uniqueDialogueTopics: number;
  conversationQuality: number; // 0-100 based on follow-ups

  // Puzzle solving
  puzzlesSolved: number;
  totalPuzzles: number;
  puzzleInsightScore: number; // 0-100

  // Time efficiency
  timeSpentMinutes: number;
  estimatedTimeMinutes: number;
  timeEfficiency: number; // 0-100

  // Investigation phases
  explorationPhaseComplete: boolean;
  interrogationPhaseComplete: boolean;
  synthesisPhaseComplete: boolean;

  // Composite score
  totalScore: number;
}

export interface EndingOutcome {
  id: string;
  title: string;
  quality: 'perfect' | 'good' | 'satisfactory' | 'lucky' | 'wrong_close' | 'wrong_far';
  description: string;
  scoreMultiplier: number; // 0.1x - 1.5x
  achievements?: string[];
  feedback: string;
  revealedPoints: string[];
  retryHint: string;
}

export const ENDING_THRESHOLDS = {
  PERFECT: {
    name: 'perfect',
    minEvidence: 0.8,
    minDialogue: 0.8,
    minPuzzles: 1.0,
    requireCorrectSuspect: true,
    scoreMultiplier: 1.5,
    title: 'Perfect Investigation',
  },
  GOOD: {
    name: 'good',
    minEvidence: 0.75,
    minDialogue: 0.6,
    minPuzzles: 0.8,
    requireCorrectSuspect: true,
    scoreMultiplier: 1.2,
    title: 'Excellent Deduction',
  },
  SATISFACTORY: {
    name: 'satisfactory',
    minEvidence: 0.5,
    minDialogue: 0.4,
    minPuzzles: 0.5,
    requireCorrectSuspect: true,
    scoreMultiplier: 1.0,
    title: 'Solved the Case',
  },
  LUCKY: {
    name: 'lucky',
    minEvidence: 0.0,
    minDialogue: 0.0,
    minPuzzles: 0.0,
    requireCorrectSuspect: true,
    scoreMultiplier: 0.5,
    title: 'Lucky Guess',
  },
  WRONG_CLOSE: {
    name: 'wrong_close',
    minEvidence: 0.5,
    minDialogue: 0.0,
    minPuzzles: 0.0,
    requireCorrectSuspect: false,
    scoreMultiplier: 0.3,
    title: 'Close Call',
  },
  WRONG_FAR: {
    name: 'wrong_far',
    minEvidence: 0.0,
    minDialogue: 0.0,
    minPuzzles: 0.0,
    requireCorrectSuspect: false,
    scoreMultiplier: 0.1,
    title: 'Wide of the Mark',
  },
};

export class EndingEngine {
  /**
   * Calculate investigation quality metrics
   */
  calculateMetrics(
    suspectId: string,
    correctSuspectId: string,
    evidenceFound: string[],
    keyEvidence: string[],
    npcInteractions: Map<string, number>, // npcId -> topicsDiscussed
    puzzlesSolved: string[],
    totalPuzzles: number,
    timeSpentMinutes: number,
    estimatedTimeMinutes: number
  ): InvestigationMetrics {
    const isCorrect = suspectId === correctSuspectId;

    // Accuracy
    const suspectAccuracy = isCorrect ? 100 : Math.max(0, 50 - Math.abs(evidenceFound.length * 5));

    // Evidence quality
    const keyCluesFound = keyEvidence.filter(ke => evidenceFound.includes(ke)).length;
    const evidenceQualityScore = Math.min(
      100,
      (keyCluesFound / (keyEvidence.length || 1)) * 100
    );

    // NPC interaction
    const totalNPCsInteracted = npcInteractions.size;
    const uniqueDialogueTopics = Array.from(npcInteractions.values()).reduce((a, b) => a + b, 0);
    const conversationQuality = Math.min(100, (uniqueDialogueTopics / 20) * 100); // Assume 20 is thorough

    // Puzzle solving
    const puzzleInsightScore = totalPuzzles > 0
      ? (puzzlesSolved.length / totalPuzzles) * 100
      : 100;

    // Time efficiency (bonus for quick completion, penalty for slow)
    const timeEfficiency = Math.max(0, Math.min(100,
      estimatedTimeMinutes > 0
        ? 100 - Math.abs(((timeSpentMinutes - estimatedTimeMinutes) / estimatedTimeMinutes) * 20)
        : 100
    ));

    // Composite score (weighted average)
    const compositeScore = (
      (evidenceQualityScore * 0.3) +
      (conversationQuality * 0.25) +
      (puzzleInsightScore * 0.2) +
      (timeEfficiency * 0.25)
    ) / 100;

    const totalScore = compositeScore * (isCorrect ? 1.5 : 0.5);

    return {
      correctSuspectAccused: isCorrect,
      suspectAccuracy,
      totalEvidenceFound: evidenceFound.length,
      keyCluesTotalCount: keyEvidence.length,
      keyCluesFound,
      evidenceQualityScore,
      totalNPCsInteracted,
      uniqueDialogueTopics,
      conversationQuality,
      puzzlesSolved: puzzlesSolved.length,
      totalPuzzles,
      puzzleInsightScore,
      timeSpentMinutes,
      estimatedTimeMinutes,
      timeEfficiency,
      explorationPhaseComplete: evidenceFound.length > 0,
      interrogationPhaseComplete: uniqueDialogueTopics > 5,
      synthesisPhaseComplete: isCorrect,
      totalScore,
    };
  }

  /**
   * Determine ending based on investigation metrics
   */
  determineEnding(metrics: InvestigationMetrics): EndingOutcome {
    const evidencePercent = metrics.keyCluesFound / (metrics.keyCluesTotalCount || 1);
    const dialoguePercent = Math.min(1, metrics.conversationQuality / 100);
    const puzzlePercent = metrics.totalPuzzles > 0
      ? metrics.puzzlesSolved / metrics.totalPuzzles
      : 1;

    // Check ending conditions in priority order
    if (metrics.correctSuspectAccused) {
      if (
        evidencePercent >= 0.8 &&
        dialoguePercent >= 0.8 &&
        puzzlePercent >= 1.0
      ) {
        return this.createEnding(metrics, ENDING_THRESHOLDS.PERFECT);
      } else if (
        evidencePercent >= 0.75 &&
        dialoguePercent >= 0.6 &&
        puzzlePercent >= 0.8
      ) {
        return this.createEnding(metrics, ENDING_THRESHOLDS.GOOD);
      } else if (
        evidencePercent >= 0.5 &&
        dialoguePercent >= 0.4 &&
        puzzlePercent >= 0.5
      ) {
        return this.createEnding(metrics, ENDING_THRESHOLDS.SATISFACTORY);
      } else {
        return this.createEnding(metrics, ENDING_THRESHOLDS.LUCKY);
      }
    } else {
      if (evidencePercent >= 0.5) {
        return this.createEnding(metrics, ENDING_THRESHOLDS.WRONG_CLOSE);
      } else {
        return this.createEnding(metrics, ENDING_THRESHOLDS.WRONG_FAR);
      }
    }
  }

  /**
   * Create ending outcome with generated content
   */
  private createEnding(metrics: InvestigationMetrics, threshold: typeof ENDING_THRESHOLDS.PERFECT): EndingOutcome {
    const revealedPoints = this.generateRevealedPoints(metrics);
    const feedback = this.generateFeedback(metrics, threshold);
    const retryHint = this.getRetryHint(metrics, threshold);
    const achievements = this.getAchievements(metrics, threshold);

    const descriptions: Record<string, string> = {
      perfect: `Your thorough investigation uncovered every detail of the case. The suspect's guilt is undeniable.`,
      good: `An excellent investigation with solid evidence and clear deduction. The case is closed.`,
      satisfactory: `You found enough evidence to solve the case, though some details remain unclear.`,
      lucky: `You correctly identified the suspect, though your investigation was incomplete.`,
      wrong_close: `A compelling case, but the real culprit remains free.`,
      wrong_far: `Your investigation led you in the wrong direction entirely.`,
    };

    return {
      id: `ending_${threshold.name}`,
      title: threshold.title,
      quality: threshold.name as any,
      description: descriptions[threshold.name],
      scoreMultiplier: threshold.scoreMultiplier,
      achievements,
      feedback,
      revealedPoints,
      retryHint,
    };
  }

  private generateRevealedPoints(metrics: InvestigationMetrics): string[] {
    return [
      `Evidence collected: ${metrics.totalEvidenceFound}/${metrics.keyCluesTotalCount}`,
      `NPCs interrogated: ${metrics.totalNPCsInteracted}`,
      `Puzzles solved: ${metrics.puzzlesSolved}/${metrics.totalPuzzles}`,
      `Investigation quality: ${Math.round(metrics.totalScore * 100)}%`,
    ];
  }

  private generateFeedback(metrics: InvestigationMetrics, threshold: typeof ENDING_THRESHOLDS.PERFECT): string {
    if (metrics.correctSuspectAccused) {
      if (threshold.name === 'perfect') {
        return '🏆 Perfect detective work! You left no stone unturned.';
      } else if (threshold.name === 'good') {
        return '⭐ Excellent investigation! You solved the case convincingly.';
      } else if (threshold.name === 'satisfactory') {
        return '✅ Case solved successfully, though some clues were missed.';
      } else {
        return '🎯 You got the suspect right, but your investigation was weak!';
      }
    } else {
      if (threshold.name === 'wrong_close') {
        return '❌ Close, but you accused the wrong person.';
      } else {
        return '❌ Your investigation led you completely astray.';
      }
    }
  }

  private getRetryHint(metrics: InvestigationMetrics, threshold: typeof ENDING_THRESHOLDS.PERFECT): string {
    if (metrics.totalEvidenceFound < metrics.keyCluesTotalCount * 0.5) {
      return 'Try exploring more areas to find additional clues.';
    } else if (metrics.totalNPCsInteracted < 3) {
      return 'Spend more time interrogating suspects to develop your theory.';
    } else if (metrics.puzzlesSolved < metrics.totalPuzzles) {
      return 'Solve all the puzzles you find for crucial insights.';
    }
    return 'Review all evidence carefully before making your final accusation.';
  }

  private getAchievements(metrics: InvestigationMetrics, threshold: typeof ENDING_THRESHOLDS.PERFECT): string[] {
    const achievements: string[] = [];

    if (threshold.scoreMultiplier >= 1.2) {
      achievements.push('🔍 Master Detective');
    }
    if (metrics.puzzlesSolved === metrics.totalPuzzles) {
      achievements.push('🧩 Puzzle Master');
    }
    if (metrics.totalNPCsInteracted >= 5) {
      achievements.push('💬 Conversationalist');
    }
    if (metrics.timeSpentMinutes <= metrics.estimatedTimeMinutes * 0.75) {
      achievements.push('⚡ Speed Solver');
    }

    return achievements;
  }
}

export class EndingCalculator {
  /**
   * Calculate final score with multiplier
   */
  calculateFinalScore(metrics: InvestigationMetrics, multiplier: number): number {
    const baseScore =
      (metrics.totalEvidenceFound * 10) +
      (metrics.uniqueDialogueTopics * 5) +
      (metrics.puzzlesSolved * 15) +
      (metrics.totalScore > 0.8 ? 50 : 0); // Speedrun bonus

    return Math.round(baseScore * multiplier);
  }

  /**
   * Generate summary with ASCII visualization
   */
  generateEndingSummary(metrics: InvestigationMetrics, outcome: EndingOutcome): string {
    const width = 40;
    let summary = '';

    // Title
    summary += `${'='.repeat(width)}\n`;
    summary += `${outcome.title}\n`;
    summary += `${'='.repeat(width)}\n\n`;

    // Metrics breakdown
    summary += `📊 INVESTIGATION METRICS\n`;
    summary += `Suspect Accuracy:     ${this.bar(metrics.suspectAccuracy, width - 25)}\n`;
    summary += `Evidence Quality:     ${this.bar(metrics.evidenceQualityScore, width - 25)}\n`;
    summary += `Dialogue Depth:       ${this.bar(metrics.conversationQuality, width - 25)}\n`;
    summary += `Puzzle Insight:       ${this.bar(metrics.puzzleInsightScore, width - 25)}\n`;
    summary += `Time Efficiency:      ${this.bar(metrics.timeEfficiency, width - 25)}\n\n`;

    // Revealed points
    summary += `🔍 INVESTIGATION SUMMARY\n`;
    outcome.revealedPoints.forEach(point => {
      summary += `• ${point}\n`;
    });
    summary += '\n';

    // Feedback
    summary += `${outcome.feedback}\n\n`;

    // Retry hint
    if (outcome.retryHint) {
      summary += `💡 HINT FOR NEXT TIME\n${outcome.retryHint}\n`;
    }

    return summary;
  }

  private bar(percent: number, width: number): string {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `${bar} ${Math.round(percent)}%`;
  }
}

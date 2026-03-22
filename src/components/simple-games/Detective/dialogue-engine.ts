/**
 * Dialogue Engine for Detective game
 * Provides context-aware dialogue responses based on game state
 */

export interface DialogueChoice {
  id: string;
  text: string;
  requiredEvidence?: string[];
  requiredPuzzles?: string[];
  requiresDialogueProgress?: boolean;
  suspicionDelta?: number; // ±5 to ±15
}

export interface DialogueNode {
  id: string;
  npcId: string;
  topicId: string; // 'alibi', 'motive', 'location', 'relationship'
  initialText: string;
  followUpTexts?: string[];

  // Dynamic responses based on evidence/puzzle state
  contextualResponses?: {
    onEvidenceFound?: Record<string, string>;
    onPuzzleSolved?: Record<string, string>;
  };

  choices?: DialogueChoice[];
  affectsEnding?: {
    suspicionKey: string;
    suspicionChange: number;
  };
}

export interface DialogueState {
  npcId: string;
  topicId: string;
  currentNodeId: string;
  visitCount: number;
  discoveredEvidence: string[];
  solvedPuzzles: string[];
  suspicionDelta: number;
  isComplete: boolean;
}

export class DialogueEngine {
  private dialogueNodes: Map<string, Map<string, DialogueNode>> = new Map(); // npcId -> topicId -> nodes

  /**
   * Register dialogue nodes for an NPC topic
   */
  registerDialogueNodes(npcId: string, topicId: string, nodes: DialogueNode[]): void {
    if (!this.dialogueNodes.has(npcId)) {
      this.dialogueNodes.set(npcId, new Map());
    }
    const npcTopics = this.dialogueNodes.get(npcId)!;
    nodes.forEach(node => {
      npcTopics.set(node.id, node);
    });
  }

  /**
   * Initialize a new dialogue with an NPC
   */
  initializeDialogue(
    npcId: string,
    topicId: string,
    discoveredEvidence: string[] = [],
    solvedPuzzles: string[] = []
  ): DialogueState {
    const firstNode = this.getFirstNodeForTopic(npcId, topicId);

    return {
      npcId,
      topicId,
      currentNodeId: firstNode?.id || '',
      visitCount: 1,
      discoveredEvidence,
      solvedPuzzles,
      suspicionDelta: 0,
      isComplete: !firstNode,
    };
  }

  /**
   * Get the current dialogue node
   */
  getCurrentNode(state: DialogueState): DialogueNode | null {
    const npcTopics = this.dialogueNodes.get(state.npcId);
    if (!npcTopics) return null;

    return npcTopics.get(state.currentNodeId) || null;
  }

  /**
   * Get current dialogue text with dynamic content resolution
   */
  getDialogueText(state: DialogueState): string {
    const node = this.getCurrentNode(state);
    if (!node) return '';

    // Priority: evidence-triggered > puzzle-triggered > repeat dialogue > initial

    // Check evidence-triggered responses
    if (node.contextualResponses?.onEvidenceFound) {
      for (const evidence of state.discoveredEvidence) {
        if (node.contextualResponses.onEvidenceFound[evidence]) {
          return node.contextualResponses.onEvidenceFound[evidence];
        }
      }
    }

    // Check puzzle-triggered responses
    if (node.contextualResponses?.onPuzzleSolved) {
      for (const puzzle of state.solvedPuzzles) {
        if (node.contextualResponses.onPuzzleSolved[puzzle]) {
          return node.contextualResponses.onPuzzleSolved[puzzle];
        }
      }
    }

    // Repeat dialogue if revisiting
    if (state.visitCount > 1 && node.followUpTexts && node.followUpTexts.length > 0) {
      const index = Math.min(state.visitCount - 2, node.followUpTexts.length - 1);
      return node.followUpTexts[index];
    }

    // Default to initial text
    return node.initialText;
  }

  /**
   * Check if a dialogue choice is available
   */
  isChoiceAvailable(state: DialogueState, choiceId: string): boolean {
    const node = this.getCurrentNode(state);
    if (!node || !node.choices) return false;

    const choice = node.choices.find(c => c.id === choiceId);
    if (!choice) return false;

    // Check evidence requirements
    if (choice.requiredEvidence) {
      const hasAllEvidence = choice.requiredEvidence.every(e =>
        state.discoveredEvidence.includes(e)
      );
      if (!hasAllEvidence) return false;
    }

    // Check puzzle requirements
    if (choice.requiredPuzzles) {
      const hasAllPuzzles = choice.requiredPuzzles.every(p =>
        state.solvedPuzzles.includes(p)
      );
      if (!hasAllPuzzles) return false;
    }

    return true;
  }

  /**
   * Get available dialogue choices for current state
   */
  getAvailableChoices(state: DialogueState): DialogueChoice[] {
    const node = this.getCurrentNode(state);
    if (!node || !node.choices) return [];

    return node.choices.filter(choice => this.isChoiceAvailable(state, choice.id));
  }

  /**
   * Advance dialogue to next node
   */
  advanceDialogue(state: DialogueState, choiceId: string): DialogueState {
    const node = this.getCurrentNode(state);
    if (!node || !node.choices) return state;

    const choice = node.choices.find(c => c.id === choiceId);
    if (!choice) return state;

    const updatedState = { ...state };

    // Apply suspicion delta if present
    if (choice.suspicionDelta) {
      updatedState.suspicionDelta += choice.suspicionDelta;
    }

    // Move to next node (simplified - in real game would navigate dialogue tree)
    updatedState.isComplete = true;

    return updatedState;
  }

  /**
   * Switch to a different dialogue topic with the same NPC
   */
  changeTopic(state: DialogueState, newTopicId: string): DialogueState {
    return this.initializeDialogue(
      state.npcId,
      newTopicId,
      state.discoveredEvidence,
      state.solvedPuzzles
    );
  }

  /**
   * Revisit the same topic (increments visit count)
   */
  revisitTopic(state: DialogueState): DialogueState {
    const node = this.getCurrentNode(state);
    if (!node) return state;

    return {
      ...state,
      visitCount: state.visitCount + 1,
      currentNodeId: node.id,
    };
  }

  // Helper methods

  private getFirstNodeForTopic(npcId: string, topicId: string): DialogueNode | null {
    const npcTopics = this.dialogueNodes.get(npcId);
    if (!npcTopics) return null;

    // Find node with this topic (typically id pattern: {npcId}_{topicId}_1)
    for (const [, node] of npcTopics) {
      if (node.topicId === topicId) {
        return node;
      }
    }
    return null;
  }
}

// Template factory functions for common dialogue types

export function createAlibiNode(
  npcId: string,
  alibiText: string,
  contextualResponses?: Record<string, string>
): DialogueNode {
  return {
    id: `${npcId}_alibi_1`,
    npcId,
    topicId: 'alibi',
    initialText: alibiText,
    followUpTexts: [
      "I already told you, I have nothing else to say.",
      "Look, are we done here?",
    ],
    contextualResponses: contextualResponses ? {
      onEvidenceFound: contextualResponses,
    } : undefined,
    choices: [
      {
        id: 'accept_alibi',
        text: 'Thank you for your cooperation.',
        suspicionDelta: -2,
      },
      {
        id: 'press_alibi',
        text: 'Are you sure about that?',
        suspicionDelta: 3,
      },
    ],
  };
}

export function createMotiveNode(
  npcId: string,
  motiveText: string,
  suspectHasMotion: boolean
): DialogueNode {
  return {
    id: `${npcId}_motive_1`,
    npcId,
    topicId: 'motive',
    initialText: motiveText,
    choices: [
      {
        id: 'acknowledge_motive',
        text: 'I understand.',
        suspicionDelta: suspectHasMotion ? 5 : -3,
      },
      {
        id: 'doubt_motive',
        text: 'That\'s not a good motive for this crime.',
        suspicionDelta: suspectHasMotion ? 2 : -5,
      },
    ],
  };
}

export function createWitnessNode(
  npcId: string,
  witnessText: string,
  unlocksTopics?: string[]
): DialogueNode {
  return {
    id: `${npcId}_witness_1`,
    npcId,
    topicId: 'witness',
    initialText: witnessText,
    choices: [
      {
        id: 'thank_witness',
        text: 'Thank you for that information.',
        suspicionDelta: -2,
      },
    ],
  };
}

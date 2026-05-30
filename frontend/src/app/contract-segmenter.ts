import { Clause } from "./core/clause";
import { Contract } from "./core/contract";

interface ContractSegment {
  text: string;
  isHighlighted: boolean;
  styleClass?: string;
  clause?: Clause;
}

/**
 * Parses a flat text string into a structured array of highlighted and plain text segments
 * based on targeted character boundaries.
 */
export function parseContractSegments(contract: Contract | null, transformStyle: (code: string | undefined) => string): ContractSegment[] {
  if (!contract) return [];

  const fullText = contract.text;
  const clauses = contract.clauses || [];
  const sortedClauses = [...clauses].sort((a, b) => a.startIndex - b.startIndex);

  const segments: ContractSegment[] = [];
  let lastIndex = 0;

  for (const clause of sortedClauses) {
    if (clause.startIndex > lastIndex) {
      segments.push({
        text: fullText.substring(lastIndex, clause.startIndex),
        isHighlighted: false
      });
    }

    if (clause.endIndex > clause.startIndex) {
      segments.push({
        text: fullText.substring(clause.startIndex, clause.endIndex),
        isHighlighted: true,
        styleClass: transformStyle(clause.clauseType?.code),
        clause
      });
      lastIndex = clause.endIndex;
    }
  }

  if (lastIndex < fullText.length) {
    segments.push({
      text: fullText.substring(lastIndex),
      isHighlighted: false
    });
  }

  return segments;
}
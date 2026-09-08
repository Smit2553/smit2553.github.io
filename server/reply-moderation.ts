import LeoProfanity from "leo-profanity";

export interface ReplyModeration {
  flagged: boolean;
  reasons: string[];
}

const suspiciousPhrasePattern = /\b(?:viagra|casino|crypto(?:currency)?|nft|telegram|whatsapp|seo|backlinks?|marketing|forex|betting|loan|escort)\b/i;
const urlPattern = /https?:\/\/|www\./gi;
const repeatedCharacterPattern = /(.)\1{7,}/i;
const whitespacePattern = /\s+/g;

function countMatches(value: string, pattern: RegExp): number {
  return value.match(pattern)?.length ?? 0;
}

function getUppercaseRatio(value: string): number {
  const letters = value.replace(/[^a-z]/gi, "");

  if (letters.length === 0) {
    return 0;
  }

  const uppercaseLetters = letters.replace(/[^A-Z]/g, "");
  return uppercaseLetters.length / letters.length;
}

export function moderateReply(authorName: string, authorEmail: string | null, body: string): ReplyModeration {
  const reasons = new Set<string>();
  const combinedText = `${authorName} ${authorEmail ?? ""} ${body}`.replace(whitespacePattern, " ").trim();
  const urlCount = countMatches(body, urlPattern);
  const profanityMatches = LeoProfanity.badWordsUsed(combinedText);

  if (profanityMatches.length > 0) {
    reasons.add("Possible profanity");
  }

  if (suspiciousPhrasePattern.test(combinedText)) {
    reasons.add("Suspicious promotional keywords");
  }

  if (urlCount >= 2) {
    reasons.add("Multiple links");
  } else if (urlCount === 1 && body.length < 80) {
    reasons.add("Short link-heavy reply");
  }

  if (repeatedCharacterPattern.test(body)) {
    reasons.add("Repeated character spam");
  }

  if (body.length >= 24 && getUppercaseRatio(body) >= 0.7) {
    reasons.add("Mostly uppercase text");
  }

  return {
    flagged: reasons.size > 0,
    reasons: [...reasons],
  };
}

export function getReplySpamBlockReason(moderation: ReplyModeration, body: string): string | null {
  const hasPromotionalKeywords = moderation.reasons.includes("Suspicious promotional keywords");
  const hasHeavyLinks = moderation.reasons.includes("Multiple links") || moderation.reasons.includes("Short link-heavy reply");
  const hasRepeatedCharacterSpam = moderation.reasons.includes("Repeated character spam");
  const normalizedBodyLength = body.trim().length;

  if (hasPromotionalKeywords && hasHeavyLinks) {
    return "Reply looks like link spam.";
  }

  if (hasRepeatedCharacterSpam && normalizedBodyLength < 280) {
    return "Reply looks like automated spam.";
  }

  if (moderation.reasons.length >= 3 && normalizedBodyLength < 500) {
    return "Reply looks like spam.";
  }

  return null;
}

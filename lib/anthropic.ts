import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const WEAVE_MATCH_MODEL = "claude-sonnet-4-6";

import "server-only";
import OpenAI from "openai";

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const WEAVE_MATCH_MODEL = "gpt-4o-mini";

import { apiFetch } from "@/lib/api-client";
import type { CharacterIntake, MatchResult, Scenario } from "@/types/api";

/** Ask the LLM matchmaker for the best existing character (null = none fits). */
export function matchCharacter(intake: CharacterIntake): Promise<MatchResult> {
  return apiFetch<MatchResult>("/characters/match", {
    method: "POST",
    body: JSON.stringify(intake),
  });
}

/** Generate a personal character from the intake and save it for this user. */
export function generateCharacter(intake: CharacterIntake): Promise<Scenario> {
  return apiFetch<Scenario>("/characters/generate", {
    method: "POST",
    body: JSON.stringify(intake),
  });
}

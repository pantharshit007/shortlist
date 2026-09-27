import { APICallError } from "ai";
import type { AiProvider } from "./models.js";
import { AppError } from "../errors.js";

export const providerNames: Record<AiProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  openrouter: "OpenRouter",
};

// Turns a provider failure on a user's own key into a message they can act on.
// Never includes the provider's raw message, which can echo parts of the key.
// `saving` is the check when a key is added; `using` is a saved key failing on a later request.
export function userKeyError(provider: AiProvider, err: unknown, when: "saving" | "using" = "using") {
  const name = providerNames[provider];
  const status = APICallError.isInstance(err) ? err.statusCode : undefined;
  if (status === 401 || status === 403) {
    return new AppError(
      422,
      "AI_KEY_REJECTED",
      when === "saving"
        ? `${name} rejected this key. Check you copied all of it and that it's still active.`
        : `${name} rejected your API key. Check it in Settings, or remove it to use ours.`,
    );
  }
  if (status === 404) {
    return new AppError(
      422,
      "AI_KEY_MODEL_UNAVAILABLE",
      when === "saving"
        ? `This ${name} key can't use that model. Check the model name, or leave it empty.`
        : `Your ${name} account can't use that model. Pick another model in Settings.`,
    );
  }
  if (status === 402 || status === 429) {
    return new AppError(
      422,
      "AI_KEY_LIMITED",
      `${name} says your key is out of credit or rate limited. Add credit or try again shortly.`,
    );
  }
  return new AppError(502, "AI_KEY_FAILED", `${name} couldn't complete this request with your key. Try again.`);
}

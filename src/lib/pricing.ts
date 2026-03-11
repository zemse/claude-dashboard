import type { ModelPreset, PricingConfig, TokenUsage } from "./types";

export const MODEL_PRESETS: ModelPreset[] = [
  {
    name: "Claude Sonnet 4",
    pricing: { input: 3.0, output: 15.0, cacheRead: 0.3, cacheWrite: 3.75 },
  },
  {
    name: "Claude Opus 4",
    pricing: { input: 15.0, output: 75.0, cacheRead: 1.5, cacheWrite: 18.75 },
  },
  {
    name: "Claude Haiku 3.5",
    pricing: { input: 0.8, output: 4.0, cacheRead: 0.08, cacheWrite: 1.0 },
  },
];

export const DEFAULT_PRICING: PricingConfig = MODEL_PRESETS[0].pricing;

export function calculateCost(
  usage: TokenUsage,
  pricing: PricingConfig
): number {
  const inputCost = (usage.input_tokens / 1_000_000) * pricing.input;
  const outputCost = (usage.output_tokens / 1_000_000) * pricing.output;
  const cacheReadCost =
    (usage.cache_read_input_tokens / 1_000_000) * pricing.cacheRead;
  const cacheWriteCost =
    (usage.cache_creation_input_tokens / 1_000_000) * pricing.cacheWrite;
  return inputCost + outputCost + cacheReadCost + cacheWriteCost;
}

export function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

export function formatTokens(count: number): string {
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B`;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

import { toFloat } from "diginext-utils/dist/object";

import { aiModels } from "../ai/models";

export function calculateAiCost(model: string, prompt_tokens: number, completion_tokens: number) {
  if (!prompt_tokens || !completion_tokens) return 0;

  // get AI model
  const aiModel = aiModels.find((_model) => _model.id === model);
  if (!aiModel) return 0;

  // calculate and return
  return (
    completion_tokens * toFloat(aiModel.pricing.completion) +
    prompt_tokens * toFloat(aiModel.pricing.prompt)
  );
}

export function calculateAiCostByUsage(
  model: string,
  usage: { prompt_tokens: number; completion_tokens: number }
) {
  const { prompt_tokens, completion_tokens } = usage;
  return calculateAiCost(model, prompt_tokens, completion_tokens);
}

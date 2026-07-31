// @ts-nocheck
import assert from "node:assert/strict";
import {
  persistedTurnControls,
  persistSendModelIntent,
  resolveSendModelMetadata,
  turnRetryModel,
} from "./chat-send-models.ts";

const sessionState = {
  familiarId: "nyx",
  harness: "claude",
  runtime: null,
  effectiveModel: "anthropic/claude-opus-4-6",
  source: "session",
  applicationState: "saved",
  reason: "Saved for this chat.",
};

assert.equal(
  turnRetryModel({
    requestedModel: undefined,
    confirmedModel: undefined,
    routedModel: undefined,
  }),
  undefined,
  "a dynamic CLI default stays unpinned",
);
assert.equal(
  turnRetryModel({
    requestedModel: "anthropic/claude-opus-4-6",
    confirmedModel: undefined,
    routedModel: undefined,
  }),
  "anthropic/claude-opus-4-6",
  "an explicit turn choice remains retryable",
);
assert.equal(
  turnRetryModel({
    requestedModel: "provider/alias",
    confirmedModel: "provider/resolved-model",
    routedModel: "provider/alias",
  }),
  "provider/resolved-model",
  "runtime confirmation is the strongest retry identity",
);
assert.deepEqual(
  persistedTurnControls(
    { reasoningEffort: "medium", responseSpeed: "careful" },
    undefined,
  ),
  {
    reasoningEffort: "medium",
    responseSpeed: "careful",
  },
  "persisted controls never invent a model for a dynamic default",
);

const conversation = {
  sessionId: "session-1",
  familiarId: "nyx",
  harness: "claude",
  createdAt: "2026-07-26T00:00:00.000Z",
  updatedAt: "2026-07-26T00:00:00.000Z",
  turns: [],
  modelIntent: {
    model: "anthropic/claude-sonnet-4-5",
    source: "session",
  },
};
assert.equal(
  persistSendModelIntent(
    conversation,
    {
      familiarId: "nyx",
      modelOverride: "anthropic/claude-opus-4-6",
      modelOverrideScope: "session",
    },
    sessionState,
    { model: "anthropic/claude-sonnet-4-5", source: "session" },
  ),
  true,
);
assert.equal(conversation.modelIntent.model, "anthropic/claude-opus-4-6");

conversation.modelIntent = {
  model: "anthropic/claude-haiku-4-5",
  source: "session",
};
assert.equal(
  persistSendModelIntent(
    conversation,
    {
      familiarId: "nyx",
      modelOverride: "anthropic/claude-opus-4-6",
      modelOverrideScope: "session",
    },
    sessionState,
    { model: "anthropic/claude-sonnet-4-5", source: "session" },
  ),
  false,
  "an end-of-stream save cannot overwrite a newer mid-stream model PATCH",
);
assert.equal(conversation.modelIntent.model, "anthropic/claude-haiku-4-5");

const runtimeConversation = {
  sessionId: "session-2",
  familiarId: "grok",
  harness: "grok",
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-07-30T00:00:00.000Z",
  turns: [],
  modelIntent: {
    model: "xai/grok-code-fast-1",
    source: "session",
  },
};
const runtimeBinding = { harness: "grok", model: "xai/grok-code-fast-1" };
const runtimeConfig = {
  defaults: { harness: "codex", model: "openai/gpt-5.6-sol" },
  familiars: { grok: { harness: "grok", model: "xai/grok-code-fast-1" } },
};
const runtimeDefault = resolveSendModelMetadata({
  body: { familiarId: "grok", modelOverride: null, modelOverrideScope: "session" },
  config: runtimeConfig,
  binding: runtimeBinding,
  existingConversation: runtimeConversation,
  modelForwardingEnabled: true,
});
assert.equal(runtimeDefault.desiredModel, "");
assert.equal(runtimeDefault.modelState.source, "runtime-default");
assert.equal(
  persistSendModelIntent(
    runtimeConversation,
    { familiarId: "grok", modelOverride: null, modelOverrideScope: "session" },
    runtimeDefault.modelState,
    { model: "xai/grok-code-fast-1", source: "session" },
  ),
  true,
  "an immediate clear rides the send and persists as a durable runtime-default intent",
);
assert.deepEqual(runtimeConversation.modelIntent, {
  model: null,
  source: "runtime-default",
  applicationState: "saved",
  reason: "Using the runtime's configured default model for this chat.",
});

console.log("chat-send-models.test.ts: ok");

import { Editor, MarkdownView, Notice } from "obsidian";
import { z } from "zod";

/**
 * The origin for the Obsidian app.
 */
export const SPACED_ORIGIN = "https://pc.zsheng.app";

export type MessageEventWithSource = MessageEvent & {
    source: MessageEventSource;
};

export function isMessageEventFromSpaced(
    event: MessageEvent
): event is MessageEventWithSource {
    if (event.origin !== SPACED_ORIGIN) {
        console.warn("Received message from unknown origin:", event.origin);
        return false;
    }

    const canPostMessage = event.source && "postMessage" in event.source;
    if (!canPostMessage) {
        console.warn("Unable to post message to parent");
        return false;
    }

    return true;
}

export const OBSIDIAN_ACTION = {
    GET_CURRENT_CARD: "get-current-card",
    INSERT_CARDS: "insert-cards",
    UPDATE_FRONT: "update-front",
    UPDATE_BACK: "update-back",
} as const;

const OBSIDIAN_ACTION_TYPES = [
    OBSIDIAN_ACTION.GET_CURRENT_CARD,
    OBSIDIAN_ACTION.INSERT_CARDS,
    OBSIDIAN_ACTION.UPDATE_FRONT,
    OBSIDIAN_ACTION.UPDATE_BACK,
] as const;

export type ObsidianActionType = (typeof OBSIDIAN_ACTION_TYPES)[number];

export function isObsidianActionType(
    action: unknown
): action is ObsidianActionType {
    return OBSIDIAN_ACTION_TYPES.includes(action as ObsidianActionType);
}

export const obsidianActionSchema = z.object({
    action: z.enum(OBSIDIAN_ACTION_TYPES),
    data: z.unknown(),
});

export const obsidianActionResponseSchema = z.object({
    success: z.boolean(),
    action: z.enum(OBSIDIAN_ACTION_TYPES),
    data: z.unknown().optional(),
});
export type ObsidianActionResponse = z.infer<
    typeof obsidianActionResponseSchema
>;

export function isObsidianActionResponse(
    response: unknown
): response is ObsidianActionResponse {
    return obsidianActionResponseSchema.safeParse(response).success;
}

export function isSuccessResponse(
    response: unknown
): response is ObsidianActionResponse & { success: true; data: unknown } {
    if (!isObsidianActionResponse(response)) {
        return false;
    }
    return response.success;
}

export function handleGetCurrentCard(data: unknown, editor: Editor) {
    const schema = z.object({
        card_contents: z.object({
            question: z.string(),
            answer: z.string(),
        }),
    });
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
        new Notice("Received invalid card contents.");
        return;
    }

    const { card_contents: card } = parsed.data;
    const input = `${card.question}\n\n${card.answer}`;

    editor.replaceRange(input, editor.getCursor());
    new Notice("Card contents inserted into editor.");
}

export function handleInsertCards(_data: unknown) {
    new Notice("Received cards");
}

export function handleUpdateCard(_data: unknown) {
    new Notice("Card updated");
}

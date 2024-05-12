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

const OBSIDIAN_ACTION_TYPES = ["get-current-card", "insert-cards"] as const;
export type ObsidianActionType = (typeof OBSIDIAN_ACTION_TYPES)[number];

export const obsidianActionSchema = z.object({
    action: z.enum(OBSIDIAN_ACTION_TYPES),
    data: z.unknown(),
});

export type ObsidianAction = z.infer<typeof obsidianActionSchema>;
export type ObsidianActionResponse = {
    success: boolean;
    data?: unknown;
};

export function isSuccessResponse(
    response: unknown
): response is ObsidianActionResponse & { success: true; data: unknown } {
    return !!(response as ObsidianActionResponse)?.success;
}

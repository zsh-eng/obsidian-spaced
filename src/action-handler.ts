import { Editor, Notice } from "obsidian";
import { z } from "zod";

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

export function handleUpdateContext(_data: unknown) {
    new Notice("Context updated");
}

export function handleGetCardsBySourceId(data: unknown) {
    console.log(data);
}

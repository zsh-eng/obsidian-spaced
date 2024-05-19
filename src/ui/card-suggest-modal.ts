import { App, FuzzySuggestModal, MarkdownView, Notice } from "obsidian";
import { Flashcard } from "src/action-handler";

export class FlashcardSuggestModal extends FuzzySuggestModal<Flashcard> {
    private flashcards: Flashcard[];

    constructor(app: App, flashcards: Flashcard[]) {
        super(app);
        this.flashcards = flashcards;
    }

    getItems(): Flashcard[] {
        return this.flashcards;
    }

    getItemText(item: Flashcard): string {
        return `${item.question} | ${item.answer}`;
    }

    onChooseItem(flashcard: Flashcard, evt: MouseEvent | KeyboardEvent): void {
        const editor =
            this.app.workspace.getActiveViewOfType(MarkdownView).editor;
        if (!editor) {
            return;
        }

        const input = `${flashcard.question}\n\n${flashcard.answer}`;
        editor.replaceRange(input, editor.getCursor());
        new Notice("Card contents inserted into editor.");
    }
}

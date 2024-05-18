import {
    MarkdownView,
    Notice,
    Platform,
    Plugin,
    WorkspaceLeaf,
} from "obsidian";
import {
    OBSIDIAN_ACTION,
    SPACED_ORIGIN,
    handleGetCurrentCard,
    handleInsertCards,
    handleUpdateCard,
    isMessageEventFromSpaced,
    isObsidianActionType,
    isSuccessResponse,
} from "src/action";
import { SpacedSettingTab } from "./settings-tab";
import { SpacedView } from "./view";

export interface FrameMetadata {
    url: string;
    displayName: string;
    icon: string;
    hideOnMobile: boolean;
    addRibbonIcon: boolean;
    openInCenter: boolean;
    zoomLevel: number;
    forceIframe: boolean;
    customCss: string;
    customJs: string;
}

export interface SpacedSettings {
    frames: FrameMetadata[];
    padding: number;
}

const spacedFrame: FrameMetadata = {
    url: SPACED_ORIGIN,
    displayName: "Spaced",
    icon: "book",
    hideOnMobile: true,
    addRibbonIcon: true,
    openInCenter: true,
    zoomLevel: 1,
    forceIframe: false,
    customCss: "",
    customJs: "",
};

export const defaultSettings: SpacedSettings = {
    frames: [spacedFrame],
    padding: 5,
};

export default class SpacedPlugin extends Plugin {
    settings: SpacedSettings = defaultSettings;

    async listener(event: MessageEvent) {
        // Ignore messages from other origins as other plugins might use the same event listener
        if (!isMessageEventFromSpaced(event)) {
            return;
        }

        const res = event.data;
        if (!isSuccessResponse(res)) {
            new Notice("Received an unsuccessful response from the webapp.");
        }

        const data = res.data;

        const editor =
            this.app.workspace.getActiveViewOfType(MarkdownView).editor;

        const action = res.action;
        if (!isObsidianActionType(action)) {
            new Notice("Unknown action received from the webapp.");
            return;
        }

        switch (action) {
            case OBSIDIAN_ACTION.GET_CURRENT_CARD:
                handleGetCurrentCard(data, editor);
                break;
            case OBSIDIAN_ACTION.INSERT_CARDS:
                handleInsertCards(data);
                break;
            case OBSIDIAN_ACTION.UPDATE_FRONT:
                handleUpdateCard(data);
                break;
            case OBSIDIAN_ACTION.UPDATE_BACK:
                handleUpdateCard(data);
                break;
            default:
                const _exhaustiveCheck: never = action;
        }
    }

    async onload(): Promise<void> {
        await this.loadSettings();

        window.addEventListener("message", this.listener);

        const frame = spacedFrame;
        let name = `custom-frames-spaced`;
        try {
            console.log(`Registering frame ${name} for URL ${frame.url}`);

            this.registerView(
                name,
                (l) => new SpacedView(l, this.settings, frame, name)
            );

            this.addCommand({
                id: `open-spaced`,
                name: `Open webapp in Obsidian`,
                callback: () => this.openLeaf(name, frame.openInCenter, false),
            });

            this.addCommand({
                id: OBSIDIAN_ACTION.GET_CURRENT_CARD,
                name: "Insert contents of the current card into the editor",
                callback: () => {
                    const spacedView = this.getSpacedView();
                    if (!spacedView) {
                        return;
                    }

                    spacedView.postMessage({
                        action: OBSIDIAN_ACTION.GET_CURRENT_CARD,
                    });
                },
            });

            this.addCommand({
                id: OBSIDIAN_ACTION.INSERT_CARDS,
                name: "Add cards from the current file into bulk creation form",

                callback: async () => {
                    const spacedView = this.getSpacedView();
                    if (!spacedView) {
                        return;
                    }

                    const file = this.app.workspace.getActiveFile();
                    const { vault } = this.app;
                    const contents = await vault.read(file);
                    spacedView.postMessage({
                        action: OBSIDIAN_ACTION.INSERT_CARDS,
                        data: contents,
                    });
                },
            });

            this.addCommand({
                id: OBSIDIAN_ACTION.UPDATE_FRONT,
                name: "Update the front of the current card",
                editorCallback: (editor) => {
                    const spacedView = this.getSpacedView();
                    if (!spacedView) {
                        return;
                    }

                    const selection = editor.getSelection();
                    if (!selection) {
                        new Notice("No text selected.");
                        return;
                    }

                    spacedView.postMessage({
                        action: OBSIDIAN_ACTION.UPDATE_FRONT,
                        data: selection,
                    });
                },
            });

            this.addCommand({
                id: OBSIDIAN_ACTION.UPDATE_BACK,
                name: "Update the back of the current card",
                editorCallback: (editor) => {
                    const spacedView = this.getSpacedView();
                    if (!spacedView) {
                        return;
                    }

                    const selection = editor.getSelection();
                    if (!selection) {
                        new Notice("No text selected.");
                        return;
                    }

                    spacedView.postMessage({
                        action: OBSIDIAN_ACTION.UPDATE_BACK,
                        data: selection,
                    });
                },
            });

            if (frame.addRibbonIcon)
                this.addRibbonIcon(
                    frame.icon,
                    `Open ${frame.displayName}`,
                    (e) =>
                        this.openLeaf(
                            name,
                            frame.openInCenter,
                            Platform.isMacOS ? e.metaKey : e.ctrlKey
                        )
                );
        } catch {
            console.error(
                `Couldn't register frame ${name}, is there already one with the same name?`
            );
        }

        this.addSettingTab(new SpacedSettingTab(this.app, this));
    }

    async onunload(): Promise<void> {
        window.removeEventListener("message", this.listener);
    }

    async loadSettings() {
        this.settings = Object.assign(
            {},
            defaultSettings,
            await this.loadData()
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    private async openLeaf(
        name: string,
        center: boolean,
        split: boolean
    ): Promise<void> {
        let leaf: WorkspaceLeaf;
        if (center) {
            leaf = this.app.workspace.getLeaf(split);
            await leaf.setViewState({ type: name, active: true });
        } else {
            if (!this.app.workspace.getLeavesOfType(name).length)
                await this.app.workspace
                    .getRightLeaf(false)
                    .setViewState({ type: name, active: true });
            leaf = this.app.workspace.getLeavesOfType(name)[0];
            this.app.workspace.revealLeaf(leaf);
        }
        if (leaf.view instanceof SpacedView) leaf.view.focus();
    }

    private getSpacedView(): SpacedView | undefined {
        const spacedView = this.app.workspace.getLeavesOfType(
            "custom-frames-spaced"
        )?.[0]?.view;

        if (!(spacedView instanceof SpacedView)) {
            new Notice("Please open spaced first.");
            return;
        }

        return spacedView;
    }
}

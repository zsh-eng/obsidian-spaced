import {
    MarkdownView,
    Notice,
    Platform,
    Plugin,
    WorkspaceLeaf,
} from "obsidian";
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
    url: "https://pc.zsheng.app",
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
        const editor =
            this.app.workspace.getActiveViewOfType(MarkdownView).editor;
        const contents = `${event.data?.card_contents?.question}\n\n${event.data?.card_contents?.answer}`;

        editor.replaceRange(contents, editor.getCursor());
        new Notice("Card contents inserted into editor.");
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
                id: "insert-current-card",
                name: "Insert the contents of the current card into the editor",
                callback: () => {
                    const spacedView =
                        this.app.workspace.getLeavesOfType(name)?.[0]?.view;
                    if (!(spacedView instanceof SpacedView)) {
                        new Notice("Please open spaced first.");
                        return;
                    }

                    spacedView.postMessage({
                        action: "get-current-card",
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
}

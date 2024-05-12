import { ItemView, MarkdownView, Menu, WorkspaceLeaf } from "obsidian";
import { CustomFrame } from "./frame";
import { FrameMetadata, SpacedSettings } from "./main";
import { ObsidianAction } from "src/action";

export class SpacedView extends ItemView {
    private static readonly actions: Action[] = [
        {
            name: "Return to original page",
            icon: "home",
            action: (v) => v.frame.return(),
        },
        {
            name: "Open dev tools",
            icon: "binary",
            action: (v) => v.frame.toggleDevTools(),
        },
        {
            name: "Copy link",
            icon: "link",
            action: (v) =>
                navigator.clipboard.writeText(v.frame.getCurrentUrl()),
        },
        {
            name: "Open in browser",
            icon: "globe",
            action: (v) => open(v.frame.getCurrentUrl()),
        },
        {
            name: "Refresh",
            icon: "refresh-cw",
            action: (v) => v.frame.refresh(),
        },
        {
            name: "Go back",
            icon: "arrow-left",
            action: (v) => v.frame.goBack(),
        },
        {
            name: "Go forward",
            icon: "arrow-right",
            action: (v) => v.frame.goForward(),
        },
    ];

    private readonly data: FrameMetadata;
    private readonly name: string;
    private frame: CustomFrame;

    constructor(
        leaf: WorkspaceLeaf,
        settings: SpacedSettings,
        data: FrameMetadata,
        name: string
    ) {
        super(leaf);
        this.data = data;
        this.name = name;
        this.frame = new CustomFrame(settings, data);
        this.navigation = data.openInCenter;

        for (let action of SpacedView.actions)
            this.addAction(action.icon, action.name, () => action.action(this));
    }

    onload(): void {
        this.contentEl.empty();
        this.contentEl.addClass("custom-frames-view");
        this.frame.create(this.contentEl);
    }

    onPaneMenu(menu: Menu, source: string): void {
        super.onPaneMenu(menu, source);
        for (let action of SpacedView.actions) {
            menu.addItem((i) => {
                i.setTitle(action.name);
                i.setIcon(action.icon);
                i.onClick(() => action.action(this));
            });
        }
    }

    getViewType(): string {
        return this.name;
    }

    getDisplayText(): string {
        return this.data.displayName;
    }

    getIcon(): string {
        return this.data.icon;
    }

    focus(): void {
        this.frame.focus();
    }

    postMessage(action: ObsidianAction) {
        this.frame.postMessage(action);
    }
}

interface Action {
    name: string;
    icon: string;
    action: (view: SpacedView) => any;
}

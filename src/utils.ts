import { FileManager, Notice, TFile } from "obsidian";

/**
 * Checks if the frontmatter object has a `spacedId` property.
 * @param frontmatter
 * @returns
 */
export function frontmatterHasFileId(
    frontmatter: unknown
): frontmatter is { spacedId: string } {
    if (!frontmatter || typeof frontmatter !== "object") {
        return false;
    }

    return "spacedId" in frontmatter;
}

/**
 * Extracts the `spacedId` property from the frontmatter object.
 * @param frontmatter
 * @returns The `spacedId` property if it exists, otherwise `undefined`.
 */
export function getFileIdFromFrontmatter(
    frontmatter: unknown
): string | undefined {
    if (!frontmatterHasFileId(frontmatter)) {
        return;
    }

    return frontmatter.spacedId;
}

export async function addFileIdToFrontmatter(
    fileManager: FileManager,
    file: TFile
): Promise<string> {
    let spacedId: string;
    await fileManager.processFrontMatter(file, (frontmatter) => {
        if (frontmatterHasFileId(frontmatter)) {
            spacedId = frontmatter.spacedId;
            return;
        }

        spacedId = crypto.randomUUID();
        frontmatter.spacedId = spacedId;
        new Notice(`Added unique id to frontmatter.`);
    });

    return spacedId;
}

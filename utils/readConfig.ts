export async function readConfig(
    filePath: string | undefined,
): Promise<string> {
    if (!filePath) {
        throw new Error("File path is not provided.");
    }
    try {
        const data = await Deno.readTextFile(filePath);
        return data;
    } catch (error) {
        console.error(`Error reading file from path: ${filePath}`, error);
        throw error;
    }
}

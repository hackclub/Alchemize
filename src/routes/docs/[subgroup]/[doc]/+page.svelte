<script lang="ts">
import { marked } from "marked";
import "../../docsMd.css";
import docsIndex from "../../docs-index.json";

interface DocItem {
    name: string;
    path: string;
    filePath?: string;
}

interface DocsIndex {
    [group: string]: DocItem[];
}

let { params } = $props();
let subgroup = $derived(params.subgroup as string);
let doc = $derived(params.doc as string);
let indexSearch = $derived("/docs/" + subgroup + "/" + doc);

let docPath = $state<string | null>(null);
let docTitle = $state<string | null>(null);
let docFilePath = $state<string | null>(null);
let markdownContent = $state<string>("");

const markdownFiles: Record<string, any> = import.meta.glob("../../**/*.md", {
    eager: true,
    query: "?raw",
});

$effect(() => {
    let found = false;
    for (let group in docsIndex as DocsIndex) {
        for (let item of (docsIndex as DocsIndex)[group]) {
            if (item.path === indexSearch) {
                docPath = item.path;
                docFilePath = item.filePath ?? null;
                docTitle = item.name;
                found = true;
                break;
            }
        }
        if (found) break;
    }
});

$effect(() => {
    if (!docFilePath) {
        markdownContent = "";
        return;
    }

    const cleanedPath = docFilePath.startsWith("/") ? docFilePath.slice(1) : docFilePath;
    const targetKey = Object.keys(markdownFiles).find(key => key.endsWith(cleanedPath));
    
    if (targetKey && markdownFiles[targetKey]) {
        const fileModule = markdownFiles[targetKey];
        const rawText = fileModule.default || fileModule;
        
        if (typeof rawText === "string") {
            markdownContent = rawText;
        } else {
            markdownContent = `Invalid file format for: ${docFilePath}`;
        }
    } else {
        markdownContent = `Doc not found: ${docFilePath}`;
    }
});

let html = $derived.by(() => marked.parse(markdownContent));
</script>

<svelte:head>
    <title>{docTitle ?? "Docs"} - Alchemize Docs</title>
</svelte:head>

<div class="md">
    {#if html}
        {@html html}
    {:else}
        <p>Loading doc...</p>
    {/if}
</div>
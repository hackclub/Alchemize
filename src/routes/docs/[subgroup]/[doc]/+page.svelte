<script lang="ts">
import {marked} from "marked";
import "../../docsMd.css"
    import docsIndex from "../../docs-index.json";

    interface DocItem {
        name: string;
        path: string;
        filePath?: string;
    }

    interface DocsIndex {
        [group: string]: DocItem[];
    }

    // Eagerly load all markdown files as raw strings
    const markdownFiles = import.meta.glob("../../markdown/**/*.md", {
        eager: true,
        as: "raw"
    });

    let { params } = $props();
    let subgroup = $derived(params.subgroup as string);
    let doc = $derived(params.doc as string);
    let indexSearch = $derived("/docs/" + subgroup + "/" + doc);

    let docPath = $state<string | null>(null);
    let docTitle = $state<string | null>(null);
    let docFilePath = $state<string | null>(null);
    let markdownContent = $state<string>("");

    $effect(() => {
        for (let group in docsIndex as DocsIndex) {
            for (let item of (docsIndex as DocsIndex)[group]) {
                if (item.path === indexSearch) {
                    docPath = item.path;
                    docFilePath = item.filePath ?? null;
                    docTitle = item.name;
                    break;
                }
            }
        }
    });

    $effect(() => {
        if (!docFilePath) {
            markdownContent = "";
            return;
        }

        // docs-index.json uses /markdown/... but glob keys are relative to this file
        const key = "../.." + docFilePath;
        const content = markdownFiles[key];

        if (typeof content === "string") {
            markdownContent = content;
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

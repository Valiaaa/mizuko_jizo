import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..'
);
const sourceRoot = path.join(projectRoot, 'src');
const entryFile = path.join(sourceRoot, 'index.html');
const outputFile = path.join(projectRoot, 'index.html');
const includePattern = /<!--\s*@include\s+(.+?)\s*-->/g;

async function compileHtml(filePath, ancestry = []) {
    const resolvedFile = path.resolve(filePath);

    if (
        resolvedFile !== sourceRoot &&
        !resolvedFile.startsWith(`${sourceRoot}${path.sep}`)
    ) {
        throw new Error(
            `Include must stay inside src/: ${resolvedFile}`
        );
    }

    if (ancestry.includes(resolvedFile)) {
        const cycle = [...ancestry, resolvedFile]
            .map((file) => path.relative(projectRoot, file))
            .join(' -> ');
        throw new Error(`Circular include detected: ${cycle}`);
    }

    const source = await readFile(resolvedFile, 'utf8');
    const matches = [...source.matchAll(includePattern)];

    if (!matches.length) {
        return source;
    }

    let compiled = '';
    let cursor = 0;

    for (const match of matches) {
        compiled += source.slice(cursor, match.index);

        const includeFile = path.resolve(
            path.dirname(resolvedFile),
            match[1].trim()
        );
        const fragment = await compileHtml(includeFile, [
            ...ancestry,
            resolvedFile
        ]);
        const lineStart = source.lastIndexOf('\n', match.index - 1) + 1;
        const indentation = source.slice(lineStart, match.index);
        const fragmentLines = fragment.replace(/\r/g, '').split('\n');

        while (fragmentLines.length && !fragmentLines[0].trim()) {
            fragmentLines.shift();
        }

        while (
            fragmentLines.length &&
            !fragmentLines[fragmentLines.length - 1].trim()
        ) {
            fragmentLines.pop();
        }

        const commonIndent = Math.min(
            ...fragmentLines
                .filter((line) => line.trim())
                .map((line) => line.match(/^[ \t]*/)[0].length)
        );
        const indentedFragment = fragmentLines
            .map((line, index) => {
                if (!line.trim()) {
                    return '';
                }

                const lineContent = line.slice(commonIndent);

                return index === 0 ?
                    lineContent :
                    indentation + lineContent;
            })
            .join('\n');

        compiled += indentedFragment;
        cursor = match.index + match[0].length;
    }

    return compiled + source.slice(cursor);
}

const html = await compileHtml(entryFile);
const banner =
    '<!-- Generated from src/index.html. Run npm run build after editing source partials. -->\n';

await writeFile(outputFile, banner + html, 'utf8');
console.log(
    `Built ${path.relative(projectRoot, outputFile)} from ` +
    `${path.relative(projectRoot, entryFile)}`
);

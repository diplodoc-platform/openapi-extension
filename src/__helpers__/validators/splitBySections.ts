import {OpenapiMD, OpenapiMDSections} from '../typings';
import {clear} from './clear';

function isTitle(line: string): boolean {
    return line.startsWith('# ') || line.startsWith('## ');
}

function extractTitle(line: string): string {
    if (line[1] === '#') {
        return line.slice(3);
    }

    return line.slice(2);
}

export function splitBySections(md: OpenapiMD): OpenapiMDSections {
    const lines = clear(md).split('\n');
    const sections: OpenapiMDSections = {};
    let pending: string | undefined;

    console.log(lines);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (isTitle(line)) {
            pending = extractTitle(line);
        }

        if (pending) {
            if (pending in sections) {
                sections[pending].push(line);

                continue;
            }

            sections[pending] = [line];
        }
    }

    return sections;
}

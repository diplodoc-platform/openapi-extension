import {vi} from 'vitest';

function virtualFS() {
    /** virtual fs record with 1 depth */
    let pages: Record<string, string> = {};

    const fs = {
        mkdir() {},
        readFile: vi.fn((path) => {
            return pages[path];
        }),
        writeFile: vi.fn((path, content) => {
            pages[path] = content;
        }),
        match(target: string) {
            const paths = Object.keys(pages);
            const closest = paths.find((path) => path.includes(target));

            if (!closest) {
                throw new Error(
                    `There is not page with path: ${target}.\nPages: ${Object.keys(pages).join(
                        '\n',
                    )}`,
                );
            }

            const page = pages[closest];

            return page;
        },
        reset() {
            pages = {};
        },
        get pages() {
            return pages;
        },
    };

    return fs;
}

export {virtualFS};
export default {virtualFS};

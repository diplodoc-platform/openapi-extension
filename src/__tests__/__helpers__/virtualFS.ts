import {OpenapiMDSections} from './typings';
import {splitBySections} from './md/splitBySections';
import {BasicFS} from '../../includer';

type VirtualFS = {
    sections(path: string): OpenapiMDSections;
    match(path: string): string;
    reset(): void;
    get pages(): Record<string, string>;
} & BasicFS;

function virtualFS(): VirtualFS {
    /** virtual fs record with 1 depth */
    let pages: Record<string, string> = {};

    const fs: VirtualFS = {
        mkdir() {},
        readFile: jest.fn((path) => {
            return pages[path];
        }),
        writeFile: jest.fn((path, content) => {
            pages[path] = content;
        }),
        match(target) {
            const paths = Object.keys(pages);
            const closest = paths.find((path) => path.includes(target));

            if (!closest) {
                throw new Error(`There is not page with path: ${target}.\nPages: ${Object.keys(pages).join('\n')}`);
            }

            const page = pages[closest];

            return page;
        },
        sections(target) {
            const page = fs.match(target);

            return splitBySections(page);
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


const fs = virtualFS();

export {fs};
export default {fs};

import {OpenapiMDSections} from './typings';
import {splitBySections} from './md/splitBySections';

export type BasicFS = {
    mkdir(targer: string, options: any): void;
    writeFile(path: string, content: string): void;
    readFile(path: string): string;
    sections(path: string): OpenapiMDSections;
    reset(): void;
    get pages(): Record<string, string>;
};

function virtualFS(): BasicFS {
    /** virtual fs record with 1 depth */
    let pages: Record<string, string> = {};

    const fs: BasicFS = {
        mkdir() {},
        readFile: jest.fn((path) => {
            return pages[path];
        }),
        writeFile: jest.fn((path, content) => {
            pages[path] = content;
        }),
        sections(target) {
            const paths = Object.keys(pages);
            const closest = paths.find((path) => path.includes(target));

            if (!closest) {
                throw new Error(`There is not page with path: ${target}.\nPages: ${Object.keys(pages).join('\n')}`);
            }

            const page = pages[closest];

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

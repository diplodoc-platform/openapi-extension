type VirtualFS = {
    mkdir(targer: string, options: any): void;
    writeFile(path: string, content: string): void;
    readFile(path: string): string;
    match(path: string): string;
    reset(): void;
    get pages(): Record<string, string>;
};

function virtualFS(): VirtualFS {
    /** virtual fs record with 1 depth */
    let pages: Record<string, string> = {};

    const fs: VirtualFS = {
        mkdir() {},
        readFile: jest.fn((path) => {
            console.log(path);
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

            return pages[closest];
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

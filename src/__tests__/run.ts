import {fs} from './__helpers__/virtualFS';
import {includerFunction as includer} from '../includer';
import path from 'node:path';


export function runPreset(input: string): Promise<void> {
    return includer({
        index: 0,
        readBasePath: '',
        writeBasePath: '',
        vars: {},
        passedParams: {
            input: path.join(input, 'spec.yaml'),
        },
        tocPath: 'toc',
        item: {
            name: input,
            href: '',
            include: {
                path: 'openapi',
                repo: '__tests__',
            },
            items: [],
        },
    }, fs);
}

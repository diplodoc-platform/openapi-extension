import {includerFunction as includer} from '../../includer';


const PRESETS = ['basic'] as const;

type Preset = typeof PRESETS[number];

export function runPreset(preset: Preset): Promise<void> {
    return includer({
        index: 0,
        readBasePath: '',
        writeBasePath: '',
        vars: {},
        passedParams: {
            input: `src/__tests__/mocks/${preset}.yaml`,
        },
        tocPath: 'toc',
        item: {
            name: preset,
            href: '',
            include: {
                path: 'openapi',
                repo: '__tests__',
            },
            items: [],
        },
    });
}

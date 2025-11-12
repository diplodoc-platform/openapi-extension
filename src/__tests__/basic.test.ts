import {describe, expect, it} from 'vitest';

import {DocumentBuilder, run} from './__helpers__/run';

const name = 'basic';
describe('basic openapi project', () => {
    it('renders description', async () => {
        const spec = new DocumentBuilder(name)
            .response(200, {
                description: 'Base 200 response',
                schema: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                        },
                        foo: {
                            type: 'string',
                        },
                    },
                },
            })
            .response(404, {
                description: 'Base 200 response',
                schema: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                        },
                        bar: {
                            type: 'string',
                        },
                    },
                },
            })
            .build();

        const fs = await run(spec);

        const page = fs.match(name);

        expect(page).toMatchSnapshot();
    });
});

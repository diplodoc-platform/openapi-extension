import {DocumentBuilder, run} from './__helpers__/run';

const name = 'tags';
describe('tags rendering', () => {
    it('renders tag and toc', async () => {
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
            .tag({
                name: 'basic',
                description: 'basic tag',
            })
            .tag({
                name: 'navtitle',
                'x-navtitle': 'Alternate title',
            })
            .tag({
                name: 'weird',
                description: 'weird tag with normal slug',
                'x-slug': 'normal',
                'x-navtitle': 'Normal title',
            })
            .build();

        const fs = await run(spec);

        const toc = fs.match('toc.yaml');

        expect(toc).toMatchSnapshot('toc');

        const tag = fs.match('basic/index.md');

        expect(tag).toMatchSnapshot('basic');

        const tag2 = fs.match('normal/index.md');

        expect(tag2).toMatchSnapshot('weird');
    });
});

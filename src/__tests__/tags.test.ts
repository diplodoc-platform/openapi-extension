import {DocumentBuilder, run} from './__helpers__/run';

describe('tags rendering', () => {
    const response = {
        description: 'Base 200 response',
        schema: {
            type: 'object',
            properties: {
                id: {
                    type: 'number',
                },
                title: {
                    type: 'string',
                },
            },
        },
    } as const;

    it('renders basic tag', async() => {
        const spec = new DocumentBuilder('name')
            .response(200, response)
            .tag({
                name: 'basic',
                description: 'basic tag',
            })
            .build();

        const fs = await run(spec);

        expect(fs.match('toc.yaml')).toMatchSnapshot('toc');
        expect(fs.match('basic/index.md')).toMatchSnapshot('index.md');
        expect(fs.match('basic/name.md')).toMatchSnapshot('name.md');
    });

    it('uses custom title from operation', async() => {
        const spec = new DocumentBuilder('name')
            .response(200, response)
            .tag({
                name: 'TagName',
            })
            .navTitle('Title from x-navtitle in operation')
            .build();

        const fs = await run(spec);

        expect(fs.match('toc.yaml')).toMatchSnapshot('toc');
        expect(fs.match('TagName/index.md')).toMatchSnapshot('index.md');
    });

    it('uses custom title from tag override title from operation', async() => {
        const spec = new DocumentBuilder('name')
            .response(200, response)
            .tag({
                name: 'TagName',
                'x-navtitle': 'Title from tag'
            })
            .navTitle('Title from x-navtitle in operation')
            .build();

        const fs = await run(spec);

        expect(fs.match('toc.yaml')).toMatchSnapshot('toc');
        expect(fs.match('TagName/index.md')).toMatchSnapshot('index.md');
    });

    it('uses custom name from tag', async() => {
        const spec = new DocumentBuilder('name')
            .response(200, response)
            .tag({
                name: 'TagName',
                'x-slug': 'slug'
            })
            .build();

        const fs = await run(spec);

        expect(fs.match('toc.yaml')).toMatchSnapshot('toc');
        expect(fs.match('slug/index.md')).toMatchSnapshot('index.md');
    });

    it('uses custom name from tag and title from operation', async() => {
        const spec = new DocumentBuilder('name')
            .response(200, response)
            .tag({
                name: 'TagName',
                'x-slug': 'slug',
            })
            .navTitle('Title from x-navtitle in operation')
            .build();

        const fs = await run(spec);

        expect(fs.match('toc.yaml')).toMatchSnapshot('toc');
        expect(fs.match('slug/index.md')).toMatchSnapshot('index.md');
    });
});

import {DocumentBuilder, run} from '../__helpers__/run';

const name = 'example';
describe('openapi project with examples', () => {
    it('renders example field', async () => {
        const spec = new DocumentBuilder(name)
            .request({
                schema: {
                    example: {
                        name: 'Example',
                    },
                    type: 'object',
                },
            })
            .response(200, {
                description: 'Base 200 response',
                schema: {
                    type: 'object',
                },
            })
            .build();

        const fs = await run(spec);

        const page = fs.match(name);

        expect(page).toMatchSnapshot();
    });

    it('renders example from ref', async () => {
        const spec = new DocumentBuilder(name)
            .response(200, {
                description: 'Base 200 response',
                schema: {
                    type: 'object',
                    properties: {
                        title: DocumentBuilder.ref('Cat', 'Test description'),
                    },
                },
            })
            .component('Cat', {
                type: 'object',
                additionalProperties: {
                    type: 'string',
                },
                example: {
                    en_US: 'Nestle milk chocolate-caramel',
                    ru_RU: 'Nestle молочный шоколад-карамель',
                    es_ES: 'Nestlé chocolate con leche y caramelo',
                },
            })
            .build();

        const fs = await run(spec);

        const page = fs.match(name);

        expect(page).toMatchSnapshot();
    });

    it('renders example from oneOf', async () => {
        const spec = new DocumentBuilder(name)
            .request({
                schema: {
                    type: 'object',
                    oneOf: [DocumentBuilder.ref('Cat')],
                },
            })
            .response(200, {
                description: 'Base 200 response',
                schema: {
                    type: 'object',
                },
            })
            .component('Cat', {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                    },
                },
            })
            .build();

        const fs = await run(spec);

        const page = fs.match(name);

        expect(page).toMatchSnapshot();
    });

    it('renders example from allOf', async () => {
        const spec = new DocumentBuilder(name)
            .request({
                schema: {
                    type: 'object',
                    allOf: [DocumentBuilder.ref('Cat')],
                },
            })
            .response(200, {
                description: 'Base 200 response',
                schema: {
                    type: 'object',
                },
            })
            .component('Cat', {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                    },
                },
            })
            .build();

        const fs = await run(spec);

        const page = fs.match(name);

        expect(page).toMatchSnapshot();
    });
});

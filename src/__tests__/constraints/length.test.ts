import {DocumentBuilder, run} from '../__helpers__/run';

const name = 'length';
describe('length', () => {
    it('renders correct length limits', async () => {
        const spec = new DocumentBuilder(name)
            .component('Pet', {
                allOf: [DocumentBuilder.ref('Cat', 'From allOf in Pet')],
                description: 'From pet',
            })
            .component('Cat', {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                    },
                    foo: {
                        type: 'string',
                        minLength: 3,
                    },
                },
                description: 'Cat class',
            })
            .component('Dog', {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Pet name',
                        maxLength: 100,
                    },
                    bar: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 99,
                    },
                },
                description: 'Dog class',
            })
            .response(200, {
                schema: {
                    properties: {
                        pet: {
                            allOf: [DocumentBuilder.ref('Pet', 'From response')],
                        },
                        petWithoutDescription: {
                            allOf: [DocumentBuilder.ref('Cat')],
                        },
                        refToSchemaWithDescription: {
                            allOf: [DocumentBuilder.ref('Dog')],
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

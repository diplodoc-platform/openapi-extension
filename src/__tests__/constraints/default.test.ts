import {DocumentBuilder, run} from '../__helpers__/run';

const mockDocumentName = 'DefaultValueConstraints';

describe('Default value constraints', () => {
    it('should process default constraints specified for parameters', async () => {
        const spec = new DocumentBuilder(mockDocumentName)
            .parameter({
                in: 'query',
                name: 'limit',
                description: 'Amount of search results to show',
                schema: {
                    type: 'number',
                    format: 'int32',
                    default: 10,
                },
            })
            .response(204, {})
            .build();

        const fs = await run(spec);

        const page = fs.match(mockDocumentName);

        expect(page).toMatchSnapshot();
    });

    it('should process default constraints specified in schema objects', async () => {
        const spec = new DocumentBuilder(mockDocumentName)
            .component('CreateUserRequestDto', {
                type: 'object',
                properties: {
                    role: {
                        description: 'Role for the user being created',
                        type: 'string',
                        enum: ['basic', 'admin'],
                        default: 'basic',
                    },
                    name: {
                        type: 'string',
                        default: 'Anonymous',
                    },
                    tags: {
                        type: 'array',
                        items: {
                            type: 'string',
                            default: 'blah',
                        },
                    },
                    age: {
                        type: 'number',
                        default: 7,
                    },
                },
            })
            .request({
                schema: DocumentBuilder.ref('CreateUserRequestDto'),
            })
            .response(204, {})
            .build();

        const fs = await run(spec);

        const page = fs.match(mockDocumentName);

        expect(page).toMatchSnapshot();
    });
});

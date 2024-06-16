import {DocumentBuilder, run} from './__helpers__/run';

const mockDocumentName = 'ParameterOrder';

describe('Endpoint parameters in tables', () => {
    it('are ordered lexicographically by default', async () => {
        const spec = new DocumentBuilder(mockDocumentName)
            .parameter({
                in: 'query',
                name: 'name',
                description: 'Name for the requested star',
                schema: {
                    type: 'string',
                },
            })
            .parameter({
                in: 'query',
                name: 'id',
                description: 'Internal ID for the requested star',
                schema: {
                    type: 'string',
                    format: 'uuid',
                },
            })
            .parameter({
                in: 'query',
                name: 'catalogueCCDM',
                description: 'CCDM designation for the requested star',
                schema: {
                    type: 'string',
                },
            })
            .response(204, {})
            .build();

        const fs = await run(spec);

        const page = fs.match(mockDocumentName);

        expect(page).toMatchSnapshot();
    });

    it('are hoisted to the top of the table if marked as required by the spec', async () => {
        const spec = new DocumentBuilder(mockDocumentName)
            .parameter({
                in: 'query',
                name: 'name',
                description: 'Name for the requested star',
                schema: {
                    type: 'string',
                },
            })
            .parameter({
                in: 'query',
                name: 'id',
                required: true,
                description: 'Internal ID for the requested star',
                schema: {
                    type: 'string',
                    format: 'uuid',
                },
            })
            .parameter({
                in: 'query',
                name: 'catalogueCCDM',
                description: 'CCDM designation for the requested star',
                schema: {
                    type: 'string',
                },
            })
            .response(204, {})
            .build();

        const fs = await run(spec);

        const page = fs.match(mockDocumentName);

        expect(page).toMatchSnapshot();
    });
});

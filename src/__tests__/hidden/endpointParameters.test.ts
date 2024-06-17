import {DocumentBuilder, run} from '../__helpers__/run';

const mockDocumentName = 'HiddenEndpointParameters';

describe('Endpoint parameter tables', () => {
    it('should not include parameters marked with `x-hidden` in the spec', async () => {
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
                'x-hidden': true,
            })
            .parameter({
                in: 'query',
                name: 'catalogueCCDM',
                description: 'CCDM designation for the requested star',
                schema: {
                    type: 'string',
                },
                'x-hidden': true,
            })
            .response(204, {})
            .build();

        const fs = await run(spec);

        const page = fs.match(mockDocumentName);

        expect(page).toMatchSnapshot();
    });

    it('should be omitted if all of their respective parameters are marked with `x-hidden`', async () => {
        const spec = new DocumentBuilder(mockDocumentName)
            .parameter({
                in: 'query',
                name: 'name',
                description: 'Name for the requested star',
                schema: {
                    type: 'string',
                },
                'x-hidden': true,
            })
            .parameter({
                in: 'query',
                name: 'id',
                description: 'Internal ID for the requested star',
                schema: {
                    type: 'string',
                    format: 'uuid',
                },
                'x-hidden': true,
            })
            .parameter({
                in: 'query',
                name: 'catalogueCCDM',
                description: 'CCDM designation for the requested star',
                schema: {
                    type: 'string',
                },
                'x-hidden': true,
            })
            // "Query parameters" table should not be rendered; however, not all cookie params are optional
            // so we expect this one to be rendered.
            .parameter({
                in: 'cookie',
                name: 'accessToken',
                description: 'Access token',
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

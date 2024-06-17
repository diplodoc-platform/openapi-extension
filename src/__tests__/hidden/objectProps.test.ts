import {DocumentBuilder, run} from '../__helpers__/run';

const mockDocumentName = 'HiddenObjectProperties';

describe('Properties in object schemas marked with `x-hidden`', () => {
    it('should not be rendered in the resulting markdown', async () => {
        const spec = new DocumentBuilder(mockDocumentName)
            .component('StarDto', {
                type: 'object',
                properties: {
                    id: {
                        description: 'Internal ID for this star',
                        type: 'string',
                        format: 'uuid',
                        'x-hidden': true,
                    },
                    luminosityClass: {
                        description: 'Morgan-Keenan luminosity class for this star',
                        type: 'string',
                    },
                    name: {
                        description: 'Name of this star',
                        type: 'string',
                    },
                    catalogueDesignationCCDM: {
                        description: 'CCDM catalogue designation for this star',
                        type: 'string',
                        'x-hidden': true,
                    },
                },
            })
            .request({
                schema: DocumentBuilder.ref('StarDto'),
            })
            .response(204, {})
            .build();

        const fs = await run(spec);

        const page = fs.match(mockDocumentName);

        expect(page).toMatchSnapshot();
    });
});

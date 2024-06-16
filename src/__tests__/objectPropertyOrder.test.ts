import {DocumentBuilder, run} from './__helpers__/run';

const mockDocumentName = 'ObjectPropertyOrder';

describe('Property rows in tables describing object schemas', () => {
    it('are ordered lexicographically by default', async () => {
        const spec = new DocumentBuilder(mockDocumentName)
            .component('StarDto', {
                type: 'object',
                properties: {
                    id: {
                        description: 'Internal ID for this star',
                        type: 'string',
                        format: 'uuid',
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

    it('are hoisted to the top of the table if marked as required by the spec', async () => {
        const spec = new DocumentBuilder(mockDocumentName)
            .component('StarDto', {
                type: 'object',
                properties: {
                    id: {
                        description: 'Internal ID for this star',
                        type: 'string',
                        format: 'uuid',
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
                    },
                },
                required: ['id', 'name', 'luminosityClass'],
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

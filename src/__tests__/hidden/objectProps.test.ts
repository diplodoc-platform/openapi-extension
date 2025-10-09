import {DocumentBuilder, run} from '../__helpers__/run';
import {OpenAPIV3} from 'openapi-types';
import SchemaObject = OpenAPIV3.SchemaObject;

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

    describe('with xHiddenBehavior option', () => {
        const visibleField: SchemaObject = {
            description: 'Always visible field',
            type: 'string',
        };
        const hiddenField: SchemaObject = {
            description: 'Always hidden field',
            type: 'string',
            'x-hidden': true,
        };
        const requestField: SchemaObject = {
            description: 'Field visible only for request',
            type: 'string',
            writeOnly: true,
            'x-hidden': true,
        };
        const responseField: SchemaObject = {
            description: 'Field visible only for response',
            type: 'string',
            readOnly: true,
            'x-hidden': true,
        };

        it('should not be rendered if positionedXHidden skipped', async () => {
            const spec = new DocumentBuilder(mockDocumentName)
                .component('visibleField', visibleField)
                .component('hiddenField', hiddenField)
                .component('requestField', requestField)
                .component('responseField', responseField)
                .component('StarDto', {
                    type: 'object',
                    properties: {
                        visibleField: DocumentBuilder.ref('visibleField'),
                        hiddenField: DocumentBuilder.ref('hiddenField'),
                        requestField: DocumentBuilder.ref('requestField'),
                        responseField: DocumentBuilder.ref('responseField'),
                    },
                })
                .request({
                    schema: DocumentBuilder.ref('StarDto'),
                })
                .response(204, {
                    schema: DocumentBuilder.ref('StarDto'),
                })
                .build();

            const fs = await run(spec, {positionedXHidden: false});

            const page = fs.match(mockDocumentName);

            expect(page).toMatchSnapshot();
        });

        it('should be rendered if readOnly/writeOnly set', async () => {
            const spec = new DocumentBuilder(mockDocumentName)
                .component('visibleField', visibleField)
                .component('hiddenField', hiddenField)
                .component('requestField', requestField)
                .component('responseField', responseField)
                .component('StarDto', {
                    type: 'object',
                    properties: {
                        visibleField: DocumentBuilder.ref('visibleField'),
                        hiddenField: DocumentBuilder.ref('hiddenField'),
                        requestField: DocumentBuilder.ref('requestField'),
                        responseField: DocumentBuilder.ref('responseField'),
                    },
                })
                .request({
                    schema: DocumentBuilder.ref('StarDto'),
                })
                .response(204, {
                    schema: DocumentBuilder.ref('StarDto'),
                })
                .build();

            const fs = await run(spec, {positionedXHidden: true});

            const page = fs.match(mockDocumentName);

            expect(page).toMatchSnapshot();
        });
    });
});

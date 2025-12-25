import {describe, expect, it} from 'vitest';

import {DocumentBuilder, run} from './__helpers__/run';

const name = 'basic';
describe('basic openapi project', () => {
    it('renders description', async () => {
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
            .response(404, {
                description: 'Base 200 response',
                schema: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                        },
                        bar: {
                            type: 'string',
                        },
                    },
                },
            })
            .build();

        const fs = await run(spec);

        const page = fs.match(name);

        expect(page).toMatchSnapshot();
    });

    it('renders allOf block in response schema', async () => {
        const spec = new DocumentBuilder(name)
            .component('SupplyRequestType', {
                type: 'string',
                enum: ['SUPPLY', 'WITHDRAW', 'UTILIZATION'],
            })
            .component('GetSupplyRequestsDTO', {
                type: 'object',
                properties: {
                    requests: {
                        type: 'array',
                        items: {
                            type: 'object',
                        },
                    },
                },
            })
            .response(200, {
                description: 'OK',
                schema: {
                    type: 'object',
                    allOf: [
                        DocumentBuilder.ref('SupplyRequestType'),
                        {
                            properties: {
                                result: DocumentBuilder.ref('GetSupplyRequestsDTO'),
                            },
                        },
                    ],
                },
            })
            .build();

        const fs = await run(spec);

        const page = fs.match(name);

        // Check that type: object is rendered
        expect(page).toContain('**Type**: object');

        // Check that allOf block is rendered
        expect(page).toContain('{% cut "**All of 2 types**"');
        expect(page).toContain('SupplyRequestType');

        // Check that allOf block appears after type and before refs
        const typeIndex = page.indexOf('**Type**: object');
        const allOfIndex = page.indexOf('{% cut "**All of 2 types**"');
        const supplyRequestTypeEntityIndex = page.indexOf(
            '### SupplyRequestType {#entity-SupplyRequestType}',
        );

        expect(typeIndex).toBeGreaterThan(-1);
        expect(allOfIndex).toBeGreaterThan(typeIndex);
        expect(supplyRequestTypeEntityIndex).toBeGreaterThan(allOfIndex);
    });
});

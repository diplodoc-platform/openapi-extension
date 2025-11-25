import type {Run} from '../models';

import {describe, expect, it, vi} from 'vitest';
import dedent from 'ts-dedent';

import {$ref, RefsService} from './refs';

type RunMock = {
    input: string;
    vars: {for: () => object};
    read: ReturnType<typeof vi.fn>;
};

function createRun(files: Record<string, string>): RunMock {
    const read = vi.fn(async (filePath: string) => {
        const content = files[filePath];

        if (content === undefined) {
            throw new Error(`Unexpected read: ${filePath}`);
        }

        return content;
    });

    return {
        input: '/',
        vars: {for: () => ({})},
        read,
    };
}

function createService<T extends object>(
    spec: T,
    files: Record<string, string> = {},
    root = '/root/spec/main.yaml',
) {
    const mockRun = createRun(files);
    const service = new RefsService(mockRun as unknown as Run, spec, root);

    return {service, run: mockRun};
}

describe('RefsService.resolve', () => {
    it('loads external files and re-bases local $ref values', async () => {
        const spec = {
            components: {
                schemas: {
                    User: {
                        $ref: './common.yaml#/components/schemas/User',
                    },
                },
            },
        };

        const files = {
            '/root/spec/common.yaml': dedent`
                components:
                  schemas:
                    User:
                      type: object
                      properties:
                        id:
                          type: string
            `,
        };

        const {service, run} = createService(spec, files);

        await service.resolve(spec);

        expect(spec.components.schemas.User.$ref).toBe(
            '/root/spec/common.yaml#/components/schemas/User',
        );
        expect(run.read).toHaveBeenCalledTimes(1);
    });

    it('uses symbol-based $ref metadata to continue resolving nested nodes', async () => {
        const nestedSchema = {
            type: 'object',
            properties: {
                payload: {
                    [$ref]: './nested/external.yaml',
                    schema: {
                        $ref: '#/components/schemas/External',
                    },
                },
            },
        };

        const spec = {
            components: {
                schemas: {
                    Wrapper: nestedSchema,
                },
            },
        };

        const files = {
            '/root/spec/nested/external.yaml': dedent`
                components:
                  schemas:
                    External:
                      type: object
                      properties:
                        value:
                          type: string
            `,
        };

        const {service} = createService(spec, files);

        await service.resolve(spec);

        expect(spec.components.schemas.Wrapper.properties.payload.schema.$ref).toBe(
            '/root/spec/nested/external.yaml#/components/schemas/External',
        );
    });

    it('throws when referenced anchor does not exist in the target file', async () => {
        const spec = {
            components: {
                schemas: {
                    Broken: {
                        $ref: './defs.yaml#/components/schemas/Missing',
                    },
                },
            },
        };

        const files = {
            '/root/spec/defs.yaml': dedent`
                components:
                  schemas:
                    Present:
                      type: string
            `,
        };

        const {service} = createService(spec, files);

        await expect(service.resolve(spec)).rejects.toThrow(
            'Unknown ref target: /root/spec/defs.yaml#/components/schemas/Missing from /root/spec/main.yaml',
        );
    });
});

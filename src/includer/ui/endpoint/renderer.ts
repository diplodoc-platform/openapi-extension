import type {OpenAPIV3} from 'openapi-types';
import type {Context} from '../../index';
import type {Dereference, V3Endpoint, V3Schema} from '../../models';
import type {SandboxData} from './openapi/renderSandbox';
import type {JSONSchema, ResolvedRef, SchemaRenderOptions} from './schema/jsonSchema';
import type {RenderMode} from './';

import slugify from 'slugify';

import {block, entity, title} from '../common';

import {RenderContext} from './schema/jsonSchema';
import {renderSchema} from './schema';
import {renderBody} from './openapi/renderBody';
import {renderRequest} from './openapi/renderRequest';
import {renderParameters} from './openapi/renderParameters';
import {renderResponses} from './openapi/renderResponses';
import {renderSandbox} from './openapi/renderSandbox';
import {collectExamples, formatExample} from './schema/renderExamples';

/**
 * High-level orchestrator for endpoint documentation rendering.
 * Keeps the page-level context (OpenAPI refs, already rendered entities, etc.)
 * so we can avoid duplicating schema blocks and consistently reuse shared data
 * across requests/responses/examples.
 */
export class Renderer {
    private ctx: Context;

    private usedAnchors: Record<string, number> = {};

    private linkedRefs: Set<string> = new Set();

    private renderedRefs: Set<string> = new Set();

    private renderedBlocks: Set<string> = new Set();

    constructor(ctx: Context) {
        this.ctx = ctx;
    }

    table = (schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject, mode: RenderMode) => {
        if (this.ctx.refs.isReference(schema)) {
            const ref = this._resolveRef(schema.$ref);
            this.renderedRefs.add(schema.$ref + '-' + mode);

            schema = ref ? (ref.schema as OpenAPIV3.SchemaObject) : schema;
        }

        return this._renderSchema(schema as Dereference<OpenAPIV3.SchemaObject>, mode, {
            ref: this._resolveRef,
            renderSchema: (schema, options) => {
                return this._renderSchema(schema as OpenAPIV3.SchemaObject, mode, {
                    ...(options || {}),
                    // suppressExamples: true,
                    expandType: false,
                    blocks: ['...'],
                });
            },
            expandType: true,
            blocks: ['type'],
        });
    };

    refs = (mode: 'read' | 'write') => {
        const results = [];

        let refs = this._pendingRefs(mode);
        while (refs.length) {
            for (const refId of refs) {
                const ref = this._resolveRef(refId);

                if (!ref) {
                    continue;
                }

                const {schema, href, label} = ref;

                let anchor = href;
                if (this.usedAnchors[href]) {
                    anchor += this.usedAnchors[href]++;
                } else {
                    this.usedAnchors[href] = 1;
                }

                const result = this._renderSchema(schema as OpenAPIV3.SchemaObject, mode, {
                    expandType: true,
                    blocks: ['title', 'deprecated', 'description', '...'],
                    renderSchema: (schema, options) => {
                        return this._renderSchema(schema, mode, {
                            ...options,
                            expandType: false,
                            blocks: ['...'],
                        });
                    },
                });

                this.renderedRefs.add(refId + '-' + mode);

                if (this.renderedBlocks.has(result)) {
                    continue;
                }
                this.renderedBlocks.add(result);

                results.push(entity(block([title(3)(label, anchor), result])));
            }

            refs = this._pendingRefs(mode);
        }

        return results;
    };

    request = (data: V3Endpoint) => {
        return renderRequest(this, data);
    };

    parameters = (params: Dereference<OpenAPIV3.ParameterObject>[]) => {
        return renderParameters(this, params);
    };

    body = (data: V3Schema | undefined, mode: RenderMode) => {
        return renderBody(this, data, mode);
    };

    example = (schema: OpenAPIV3.SchemaObject, mode: RenderMode, format = true) => {
        const context = new RenderContext({
            ref: this._resolveRef,
            renderSchema: () => '',
            isRoot: true,
            [mode + 'Only']: true,
        });
        const examples = collectExamples(context, schema as JSONSchema);

        return (format ? formatExample(examples[0]) : examples[0]) || '';
    };

    responses = (data: V3Endpoint) => {
        return renderResponses(this, data);
    };

    sandbox = (data: SandboxData) => {
        return renderSandbox(this, data);
    };

    mergeSchema = (
        schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
    ): OpenAPIV3.SchemaObject => {
        const [merged, defs] = this.ctx.refs.merge(schema);

        if (Object.keys(defs).length) {
            Object.assign(merged, {$defs: defs});
        }

        return merged as OpenAPIV3.SchemaObject;
    };

    private _renderSchema(
        schema: OpenAPIV3.SchemaObject | JSONSchema,
        mode: RenderMode,
        options: SchemaRenderOptions = {},
    ) {
        return renderSchema(schema as JSONSchema, {
            ref: this._resolveRef,
            suppressTitle: true,
            suppressVerboseAdditional: true,
            [mode + 'Only']: true,
            ...options,
        });
    }

    private _pendingRefs(mode: 'read' | 'write') {
        return [...this.linkedRefs].filter((ref) => !this.renderedRefs.has(ref + '-' + mode));
    }

    private _resolveRef = (refId: string, visited = new Set()): ResolvedRef | undefined => {
        if (visited.has(refId)) {
            return undefined;
        }

        const schema = this.ctx.refs.get(refId) as JSONSchema | undefined;
        if (!schema) {
            return;
        }

        visited.add(refId);

        if (this.ctx.refs.isEmptyReference(schema)) {
            return this._resolveRef(schema.$ref, visited);
        }

        this.linkedRefs.add(refId);

        const label = refId.split('/').pop() as string;
        const href = '#entity-' + slugify(label);

        return {label, href, schema};
    };
}

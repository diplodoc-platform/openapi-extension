import type {OpenAPIV3} from 'openapi-types';
import type {Context} from '../../index';
import type {Dereference, V3Endpoint, V3Response, V3Schema} from '../../models';
import type {SandboxData} from './openapi/renderSandbox';
import type {JSONSchema, ResolvedRef, SchemaRenderOptions} from './schema/jsonSchema';

import {createHash} from 'crypto';

import {block, entity, title} from '../common';

import {RenderContext} from './schema/jsonSchema';
import {renderSchema} from './schema/renderSchema';
import {renderObjectType} from './schema/renderType';
import {renderBody} from './openapi/renderBody';
import {renderRequest} from './openapi/renderRequest';
import {renderParameters} from './openapi/renderParameters';
import {renderResponse, renderResponses} from './openapi/renderResponses';
import {renderSandbox} from './openapi/renderSandbox';

export class Renderer {
    private ctx: Context;

    private linkedRefs: Set<string> = new Set();

    private renderedRefs: Set<string> = new Set();

    private get pendingRefs() {
        return [...this.linkedRefs].filter((ref) => !this.renderedRefs.has(ref));
    }

    constructor(ctx: Context) {
        this.ctx = ctx;
    }

    schema = (schema: OpenAPIV3.SchemaObject, options: SchemaRenderOptions = {}) => {
        return renderSchema(schema as JSONSchema, {
            ref: this.resolveRef,
            suppressTitle: true,
            suppressVerboseAdditional: true,
            ...options,
        });
    };

    table = (schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject) => {
        const context = new RenderContext({
            ref: this.resolveRef,
            renderSchema: (schema, options) => {
                options = Object.assign(options || {}, {
                    suppressExamples: true,
                    suppressTitle: true,
                });

                return this.schema(schema as OpenAPIV3.SchemaObject, options);
            },
            isRoot: true,
        });

        if (isReference(schema)) {
            const ref = this.resolveRef(schema.$ref, true);
            schema = ref ? (ref.schema as OpenAPIV3.SchemaObject) : schema;
        }

        return renderObjectType(schema as JSONSchema, context);
    };

    refs = () => {
        const results = [];

        while (this.pendingRefs.length) {
            for (const refId of this.pendingRefs) {
                const schema = this.ctx.refs.get(refId);

                if (!schema || isEmptyReference(schema)) {
                    continue;
                }

                const name = schema.title || refId.split('/').pop() || refId;
                const ref = this._resolveRef(refId) as ResolvedRef;

                results.push(
                    entity(
                        block([
                            title(3)(name, ref.href),
                            this.schema(schema, {
                                expandType: true,
                                suppressTitle: true,
                            }),
                        ]),
                    ),
                );

                this.renderedRefs.add(refId);
            }
        }

        return results;
    };

    request = (data: V3Endpoint) => {
        return renderRequest(this, data);
    };

    parameters = (params: Dereference<OpenAPIV3.ParameterObject>[]) => {
        return renderParameters(this, params);
    };

    body = (data: V3Schema | undefined) => {
        return renderBody(this, data);
    };

    responses = (data: V3Endpoint) => {
        return renderResponses(this, data);
    };

    response = (data: V3Response) => {
        return renderResponse(this, data);
    };

    sandbox = (data: SandboxData) => {
        return renderSandbox(data);
    };

    resolveRef = (refId: string, silent = false): ResolvedRef | undefined => {
        if (silent) {
            this.renderedRefs.add(refId);
        }

        return this._resolveRef(refId);
    };

    private _resolveRef = (refId: string, visited = new Set()): ResolvedRef | undefined => {
        if (visited.has(refId)) {
            return undefined;
        }

        const schema = this.ctx.refs.get(refId) as JSONSchema | undefined;
        if (!schema) {
            return;
        }

        visited.add(refId);

        if (isEmptyReference(schema)) {
            return this._resolveRef(schema.$ref, visited);
        }

        this.linkedRefs.add(refId);

        const hash = createHash('sha256');
        hash.write(refId);

        return {
            label: schema.title,
            href: '#' + hash.digest('base64url'),
            schema,
        };
    };
}

function isReference(schema: object | undefined): schema is OpenAPIV3.ReferenceObject {
    return Boolean(schema && '$ref' in schema);
}

function isEmptyReference(schema: object | undefined): schema is OpenAPIV3.ReferenceObject {
    return isReference(schema) && Object.keys(schema).length === 1;
}

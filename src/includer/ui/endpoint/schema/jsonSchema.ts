import type {SchemaI18nLabels, SchemaI18nOverrides} from './i18n';

import {mergeI18n} from './i18n';

export type PrimitiveType = 'string' | 'number' | 'integer' | 'boolean';

export interface JSONSchema {
    $ref?: string;
    type?: PrimitiveType | string | Array<PrimitiveType | string>;
    title?: string;
    description?: string;
    deprecated?: boolean;
    nullable?: boolean;
    readOnly?: boolean;
    writeOnly?: boolean;
    'x-hidden'?: boolean;
    properties?: Record<string, JSONSchema>;
    additionalProperties?: boolean | JSONSchema;
    patternProperties?: Record<string, JSONSchema>;
    oneOf?: JSONSchema[];
    allOf?: JSONSchema[];
    anyOf?: JSONSchema[];
    if?: JSONSchema;
    then?: JSONSchema;
    else?: JSONSchema;
    items?: JSONSchema | JSONSchema[];
    required?: string[];
    enum?: unknown[];
    const?: unknown;
    default?: unknown;
    example?: unknown;
    examples?: unknown[];
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: number;
    exclusiveMaximum?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    format?: string;
    minItems?: number;
    maxItems?: number;
    uniqueItems?: boolean;
    minProperties?: number;
    maxProperties?: number;
}

export interface ResolvedRef {
    label?: string;
    href: string;
    schema: JSONSchema;
}

export type RenderBlock =
    | 'title'
    | 'deprecated'
    | 'type'
    | 'combinators'
    | 'description'
    | 'values'
    | 'assertions'
    | 'examples'
    | '...';

/**
 * Configuration for `renderSchema`, allowing callers to control which blocks are rendered,
 * how nested contexts behave, and how localized labels are resolved.
 */
export interface SchemaRenderOptions {
    /** Resolves `$ref` identifiers to referenced schemas. */
    ref?: RefResolver;
    /** Markdown inserted before the rendered schema (e.g., headings or metadata). */
    before?: string;
    /** Markdown appended after the rendered schema. */
    after?: string;
    /** Render only fields that are `readOnly !== true` (typically request models). */
    readOnly?: boolean;
    /** Render only fields that are `writeOnly !== true` (typically response models). */
    writeOnly?: boolean;
    /** Skip the Examples block entirely. */
    suppressExamples?: boolean;
    /** Prevents `renderTitle` from emitting the title (used for nested objects/combinators). */
    suppressTitle?: boolean;
    /** Hides the deprecated warning banner for the current schema. */
    suppressDeprecatedWarning?: boolean;
    /** Removes the header row from property tables (useful for nested tables). */
    suppressTableHeaders?: boolean;
    /** Disables verbose `additionalProperties: true/false` rows; still renders schema objects. */
    suppressVerboseAdditional?: boolean;
    /** Marks the current context as root so table masking/unmasking can run once. */
    isRoot?: boolean;
    /**
     * Forces object schemas to render their properties table inline instead of inside a cut block.
     * When set to `'titled'`, a type label precedes the table output.
     */
    expandType?: boolean | 'titled';
    /**
     * Custom ordering strategy for object properties.
     * If omitted, required fields are sorted first, then remaining fields alphabetically.
     */
    orderProperties?: OrderPropertiesHandler;
    /**
     * Controls which rendering blocks to emit and in what order.
     * Supports `'...'` to inject remaining default blocks at a specific position.
     */
    blocks?: RenderBlock[];
    /** Overrides for localized labels (Type, Name, Examples, Assertions, etc.). */
    i18n?: SchemaI18nOverrides;

    renderSchema?: SchemaRenderer;
}

export type RefResolver = (refId: string) => ResolvedRef | undefined;

export type SchemaRenderer = (schema: JSONSchema, options?: SchemaRenderOptions) => string;

export interface OrderedProperty {
    name: string;
    schema: JSONSchema;
}

export type OrderPropertiesHandler = (schema: JSONSchema) => OrderedProperty[] | undefined;

export type RenderContextOptions = SchemaRenderOptions & {renderSchema: SchemaRenderer};

export class RenderContext {
    readOnly: boolean;

    writeOnly: boolean;

    suppressExamples: boolean;

    suppressTitle: boolean;

    suppressDeprecatedWarning: boolean;

    suppressTableHeaders: boolean;

    suppressVerboseAdditional: boolean;

    isRoot: boolean;

    expandType: boolean | 'titled';

    orderProperties?: OrderPropertiesHandler;

    renderSchema: SchemaRenderer;

    ref: RefResolver;

    i18n: SchemaI18nLabels;

    constructor(options: RenderContextOptions) {
        this.renderSchema = options.renderSchema;
        this.ref = options.ref ?? (() => undefined);
        this.readOnly = options.readOnly ?? false;
        this.writeOnly = options.writeOnly ?? false;
        this.suppressExamples = options.suppressExamples ?? false;
        this.suppressTitle = options.suppressTitle ?? false;
        this.suppressDeprecatedWarning = options.suppressDeprecatedWarning ?? false;
        this.suppressTableHeaders = options.suppressTableHeaders ?? false;
        this.suppressVerboseAdditional = options.suppressVerboseAdditional ?? false;
        this.isRoot = options.isRoot ?? false;
        this.expandType = options.expandType ?? false;
        this.orderProperties = options.orderProperties;
        this.i18n = mergeI18n(options.i18n);
    }

    clone(overrides: Partial<RenderContextOptions> = {}): RenderContext {
        return new RenderContext({
            renderSchema: this.renderSchema,
            ref: this.ref,
            readOnly: overrides?.readOnly ?? this.readOnly,
            writeOnly: overrides?.writeOnly ?? this.writeOnly,
            suppressExamples: overrides?.suppressExamples ?? this.suppressExamples,
            suppressTitle: overrides?.suppressTitle ?? this.suppressTitle,
            suppressDeprecatedWarning:
                overrides?.suppressDeprecatedWarning ?? this.suppressDeprecatedWarning,
            suppressTableHeaders: overrides?.suppressTableHeaders ?? this.suppressTableHeaders,
            suppressVerboseAdditional:
                overrides?.suppressVerboseAdditional ?? this.suppressVerboseAdditional,
            isRoot: overrides?.isRoot ?? false,
            expandType: overrides?.expandType ?? false,
            orderProperties: overrides?.orderProperties ?? this.orderProperties,
            i18n: this.i18n,
        });
    }

    toOptions(): SchemaRenderOptions {
        return {
            ref: this.ref,
            readOnly: this.readOnly,
            writeOnly: this.writeOnly,
            suppressExamples: this.suppressExamples,
            suppressTitle: this.suppressTitle,
            suppressDeprecatedWarning: this.suppressDeprecatedWarning,
            suppressTableHeaders: this.suppressTableHeaders,
            suppressVerboseAdditional: this.suppressVerboseAdditional,
            isRoot: false,
            expandType: this.expandType,
            orderProperties: this.orderProperties,
            i18n: this.i18n,
        };
    }
}

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

export interface SchemaI18nLabels {
    type: string;
    name: string;
    description: string;
    additional: string;
    pattern: string;
    examples: string;
    example: string;
    values: {
        default: string;
        const: string;
        enum: string;
    };
    assertions: {
        minValue: string;
        maxValue: string;
        exclusiveMin: string;
        exclusiveMax: string;
        minLength: string;
        maxLength: string;
        pattern: string;
        format: string;
        minItems: string;
        maxItems: string;
        uniqueItems: string;
        minProperties: string;
        maxProperties: string;
    };
    combinators: {
        oneOf: string;
        anyOf: string;
        allOf: string;
    };
    deprecated: {
        title: string;
        message: string;
    };
}

export interface SchemaI18nOverrides {
    type?: string;
    name?: string;
    description?: string;
    additional?: string;
    pattern?: string;
    examples?: string;
    example?: string;
    values?: Partial<SchemaI18nLabels['values']>;
    assertions?: Partial<SchemaI18nLabels['assertions']>;
    combinators?: Partial<SchemaI18nLabels['combinators']>;
    deprecated?: Partial<SchemaI18nLabels['deprecated']>;
}

const DEFAULT_I18N: SchemaI18nLabels = {
    type: 'Type',
    name: 'Name',
    description: 'Description',
    additional: '[additional]',
    pattern: 'Pattern',
    examples: 'Examples',
    example: 'Example',
    values: {
        default: 'Default',
        const: 'Const',
        enum: 'Enum',
    },
    assertions: {
        minValue: 'Min value',
        maxValue: 'Max value',
        exclusiveMin: 'Exclusive min',
        exclusiveMax: 'Exclusive max',
        minLength: 'Min length',
        maxLength: 'Max length',
        pattern: 'Pattern',
        format: 'Format',
        minItems: 'Min items',
        maxItems: 'Max items',
        uniqueItems: 'Unique items',
        minProperties: 'Min properties',
        maxProperties: 'Max properties',
    },
    combinators: {
        oneOf: 'One of',
        anyOf: 'Any of',
        allOf: 'All of',
    },
    deprecated: {
        title: 'Deprecated',
        message: 'This entity is deprecated and may be removed in future versions.',
    },
};

function mergeI18n(overrides?: SchemaI18nOverrides | SchemaI18nLabels): SchemaI18nLabels {
    const merged: SchemaI18nLabels = {
        ...DEFAULT_I18N,
        values: {...DEFAULT_I18N.values},
        assertions: {...DEFAULT_I18N.assertions},
        combinators: {...DEFAULT_I18N.combinators},
        deprecated: {...DEFAULT_I18N.deprecated},
    };

    if (!overrides) {
        return merged;
    }

    const {values, assertions, combinators, deprecated, ...topLevel} =
        overrides as Partial<SchemaI18nLabels>;

    Object.assign(merged, topLevel);

    if (values) {
        Object.assign(merged.values, values);
    }

    if (assertions) {
        Object.assign(merged.assertions, assertions);
    }

    if (combinators) {
        Object.assign(merged.combinators, combinators);
    }

    if (deprecated) {
        Object.assign(merged.deprecated, deprecated);
    }

    return merged;
}

export interface SchemaRenderOptions {
    ref?: RefResolver;
    before?: string;
    after?: string;
    readOnly?: boolean;
    writeOnly?: boolean;
    suppressExamples?: boolean;
    suppressTitle?: boolean;
    suppressDeprecatedWarning?: boolean;
    suppressTableHeaders?: boolean;
    suppressVerboseAdditional?: boolean;
    isRoot?: boolean;
    expandType?: boolean | 'titled';
    orderProperties?: OrderPropertiesHandler;
    i18n?: SchemaI18nOverrides;
}

export type RefResolver = (refId: string) => ResolvedRef | undefined;

export type SchemaRenderer = (schema: JSONSchema, options?: SchemaRenderOptions) => string;

export interface OrderedProperty {
    name: string;
    schema: JSONSchema;
}

export type OrderPropertiesHandler = (schema: JSONSchema) => OrderedProperty[] | undefined;

export interface SchemaRenderContext {
    ref: RefResolver;
    renderSchema: SchemaRenderer;
    readOnly?: boolean;
    writeOnly?: boolean;
    suppressExamples?: boolean;
    suppressTitle?: boolean;
    suppressDeprecatedWarning?: boolean;
    suppressTableHeaders?: boolean;
    suppressVerboseAdditional?: boolean;
    isRoot?: boolean;
    expandType?: boolean | 'titled';
    orderProperties?: OrderPropertiesHandler;
    i18n: SchemaI18nLabels;
}

export class RenderContext implements SchemaRenderContext {
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

    constructor(options: SchemaRenderOptions & {renderSchema: SchemaRenderer}) {
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

    clone(
        overrides?: Partial<
            Pick<
                RenderContext,
                | 'readOnly'
                | 'writeOnly'
                | 'suppressExamples'
                | 'suppressTitle'
                | 'suppressDeprecatedWarning'
                | 'suppressTableHeaders'
                | 'suppressVerboseAdditional'
            >
        > & {
            expandType?: boolean | 'titled';
            isRoot?: boolean;
            orderProperties?: OrderPropertiesHandler;
        },
    ): RenderContext {
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

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

export const DEFAULT_I18N: SchemaI18nLabels = {
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

export function mergeI18n(overrides?: SchemaI18nOverrides | SchemaI18nLabels): SchemaI18nLabels {
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

import {OpenJSONSchema} from '../models';

type Field = {
    key: keyof OpenJSONSchema;
    label: string;
    computed?: unknown;
    notWrapValueIntoCode?: boolean;
};

type Fields = (Field | ((value: OpenJSONSchema) => Field | undefined))[];

/* @todo add i18n */
const fields: Fields = [
    {
        key: 'default',
        label: 'Default',
    },
    {
        key: 'example',
        label: 'Example',
    },
    {
        key: 'minLength',
        label: 'Min length',
    },
    {
        key: 'maxLength',
        label: 'Max length',
    },
    {
        key: 'minItems',
        label: 'Min items',
    },
    {
        key: 'maxItems',
        label: 'Max items',
    },
    {
        key: 'pattern',
        label: 'Pattern',
    },
    (value) => ({
        key: 'uniqueItems',
        label: 'Unique items',
        computed: String(value.uniqueItems),
    }),
    (value) => {
        return {
            key: 'minimum',
            label: `Min value${value.exclusiveMinimum ? ' (exclusive)' : ''}`,
        };
    },
    (value) => {
        return {
            key: 'maximum',
            label: `Max value${value.exclusiveMaximum ? ' (exclusive)' : ''}`,
        };
    },
    (value: OpenJSONSchema) => {
        const enumValues = value.enum?.map((s) => `\`${s}\``).join(', ');

        if (!enumValues) {
            return undefined;
        }

        return {
            computed: enumValues as Field['key'],
            notWrapValueIntoCode: true,
            key: 'enum',
            label: 'Enum',
        };
    },
];

function prepareComplexDescription(baseDescription: string, value: OpenJSONSchema): string {
    return fields.reduce((acc, curr) => {
        const field = typeof curr === 'function' ? curr(value) : curr;

        if (typeof field === 'undefined' || typeof value[field.key] === 'undefined') {
            return acc;
        }

        const {key, label, computed, notWrapValueIntoCode} = field;

        return concatConstraint(acc, computed || value[key], label + ':', notWrapValueIntoCode);
    }, baseDescription);
}

function concatConstraint(
    description: string,
    constraint: unknown,
    constraintLabel: string,
    notWrapValueIntoCode = false,
) {
    if (typeof constraint === 'undefined') {
        return description;
    }

    constraint = prepareConstraintValue(constraint, notWrapValueIntoCode);
    description = description.replace(/\n$/, '');

    return `${description}\n\n*${constraintLabel}*{.openapi-description-annotation} ${constraint}\n`;
}

function prepareConstraintValue(value: unknown, notWrapValueIntoCode: boolean) {
    return notWrapValueIntoCode ? value : `\`${value}\``;
}

export {fields, prepareComplexDescription};
export default {fields, prepareComplexDescription};

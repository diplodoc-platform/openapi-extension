import sortBy from 'lodash/sortBy';

const primitiveTypes = new Set(['string', 'number', 'integer', 'boolean', 'null']);

export function isPrimitiveType(
    schema: {type?: unknown} | null | undefined,
): schema is {type: 'string' | 'number' | 'integer' | 'boolean' | 'null'} {
    return Boolean(schema && typeof schema.type === 'string' && primitiveTypes.has(schema.type));
}

const hoistRequired = <T extends {required?: boolean}>(propList: readonly T[]): T[] =>
    [...propList].sort((lhs: T, rhs: T): number => {
        const [{required: isLhsRequired}, {required: isRhsRequired}] = [lhs, rhs];

        return Number(Boolean(isRhsRequired)) - Number(Boolean(isLhsRequired));
    });

export const getOrderedPropList = <T extends {name: string; required?: boolean}>(
    propList: readonly T[],
    {shouldApplyLexSort = true} = {},
): T[] => {
    const preprocessed = shouldApplyLexSort
        ? sortBy(propList, (listElement) => listElement.name)
        : propList;

    return hoistRequired(preprocessed);
};

import sortBy from 'lodash/sortBy';

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

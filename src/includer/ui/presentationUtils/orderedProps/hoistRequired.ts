type IsRequiredGetter<T> = (element: T) => boolean;

const makeSortComparator =
    <T>(isRequiredGetter: IsRequiredGetter<T>) =>
    (lhs: T, rhs: T): number => {
        const [isLhsRequired, isRhsRequired] = [lhs, rhs].map(isRequiredGetter).map(Boolean);

        // In this scenario, we define an element's "magnitude" as 1 if it's required,
        // 0 otherwise. Normal math comparison then can be applied.
        // However, the sort order should be reversed, since bigger (required)
        // elements should come first in the resulting list, hence we use |rhs| - |lhs|
        return Number(isRhsRequired) - Number(isLhsRequired);
    };

/**
 * Hoist required parameters or object properties, preserving the original order otherwise.
 * @param {ReadonlyArray<T>} propList A list of params/properties that need to be ordered.
 * @param {IsRequiredGetter<T>} isRequiredGetter A function which will be called on each element of
 * `propList` to determine whether a property is required or not.
 * @returns {ReadonlyArray<T>} Ordered prop/param list.
 */
export const hoistRequiredParamsOrProps = <T>(
    propList: readonly T[],
    isRequiredGetter: IsRequiredGetter<T>,
): readonly T[] => [...propList].sort(makeSortComparator(isRequiredGetter));

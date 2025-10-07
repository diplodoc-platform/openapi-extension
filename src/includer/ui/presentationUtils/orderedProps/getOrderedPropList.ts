import sortBy from 'lodash/sortBy';

import {hoistRequired} from './hoistRequired';

type IterateeReturn = {
    name: string;
    isRequired: boolean;
};

type Iteratee<T> = (listElement: T) => IterateeReturn;

type GetOrderedListArguments<T> = {
    /**
     * List of parameters/object schema props to process and order.
     */
    propList: readonly T[];
    /**
     * A getter function to resolve whether a param/prop is required, as well as its name.
     */
    iteratee: Iteratee<T>;
    /**
     * Whether or not to apply lexicographic sort before hoisting the required properties.
     */
    shouldApplyLexSort?: boolean;
};

/**
 * Get a well-ordered list of parameters/object schema props (i.e., required params/props hoisted to
 * the start of the list, lexicographic sort applied as necessary).
 * @param {GetOrderedListArguments<T>} param0 Arguments for the operation.
 * @returns {ReadonlyArray<T>} The resulting well-ordered list.
 */
export const getOrderedPropList = <T>({
    propList,
    iteratee,
    shouldApplyLexSort = true,
}: GetOrderedListArguments<T>): T[] => {
    const preprocessed = shouldApplyLexSort
        ? sortBy(propList, (listElement) => iteratee(listElement).name)
        : propList;

    return hoistRequired(preprocessed, (listElement) => iteratee(listElement).isRequired);
};

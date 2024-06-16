import sortBy from 'lodash/sortBy';
import {hoistRequiredParamsOrProps} from './hoistRequired';

type IterateeReturn = {
    paramOrPropName: string;
    isRequired: boolean;
};

type Iteratee<T> = (listElement: T) => IterateeReturn;

type GetOrderedParamOrPropListArguments<T> = {
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
    shouldApplyLexSort: boolean;
};

/**
 * Get a well-ordered list of parameters/object schema props (i.e., required params/props hoisted to
 * the start of the list, lexicographic sort applied as necessary).
 * @param {GetOrderedParamOrPropListArguments<T>} param0 Arguments for the operation.
 * @returns {ReadonlyArray<T>} The resulting well-ordered list.
 */
export const getOrderedParamOrPropList = <T>({
    propList,
    iteratee,
    shouldApplyLexSort,
}: GetOrderedParamOrPropListArguments<T>): readonly T[] => {
    const preprocessed = shouldApplyLexSort
        ? sortBy(propList, (listElement) => iteratee(listElement).paramOrPropName)
        : propList;

    return hoistRequiredParamsOrProps(
        preprocessed,
        (listElement) => iteratee(listElement).isRequired,
    );
};

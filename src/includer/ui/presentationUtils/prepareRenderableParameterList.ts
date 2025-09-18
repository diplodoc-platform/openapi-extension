import type {V3Parameter} from '../../models';

import {getOrderedPropList} from './orderedProps/getOrderedPropList';

const shouldRenderParameter = (parameter: V3Parameter) => !parameter['x-hidden'];

/**
 * Get ordered & filtered parameter list, mostly ready for table rendering.
 * Excludes parameters that should be hidden, applies lexicographic sort & hoists required ones to the top
 * of the list.
 * @param {ReadonlyArray<Parameter>} rawParamsFromSingleSource Raw parameter list of a single parameter source
 * (path, query, etc.)
 * @returns {ReadonlyArray<Parameter>} Well-ordered parameter list with hidden ones filtered out.
 */
export const prepareRenderableParameterList = (
    rawParamsFromSingleSource: readonly V3Parameter[],
): readonly V3Parameter[] => {
    const filteredParams = rawParamsFromSingleSource.filter(shouldRenderParameter);

    return getOrderedPropList({
        propList: filteredParams,
        iteratee: ({name, required}) => ({
            name,
            // required can actually be `undefined` in runtime
            isRequired: Boolean(required),
        }),
    });
};

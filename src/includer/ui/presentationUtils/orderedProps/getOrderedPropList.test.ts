import {getOrderedParamOrPropList} from './getOrderedPropList';

const mockIteratee = (s: string) => ({
    paramOrPropName: s.replace(/\*$/, ''),
    isRequired: s.endsWith('*'),
});

describe('getOrderedPropList helper function', () => {
    it('preserves lexicographic order even after hoisting the required entries', () => {
        const mockElements = ['traits', 'weight*', 'id*', 'species', 'xenoClass*'];

        const ordered = getOrderedParamOrPropList({
            propList: mockElements,
            iteratee: mockIteratee,
            shouldApplyLexSort: true,
        });

        expect(ordered).toEqual(['id*', 'weight*', 'xenoClass*', 'species', 'traits']);
    });
});

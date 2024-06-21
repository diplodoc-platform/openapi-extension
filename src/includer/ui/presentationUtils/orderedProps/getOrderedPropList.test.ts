import {getOrderedPropList} from './getOrderedPropList';

const mockIteratee = (s: string) => ({
    name: s.replace(/\*$/, ''),
    isRequired: s.endsWith('*'),
});

describe('getOrderedPropList helper function', () => {
    it('preserves lexicographic order even after hoisting the required entries', () => {
        const mockElements = ['traits', 'weight*', 'id*', 'species', 'xenoClass*'];

        const ordered = getOrderedPropList({
            propList: mockElements,
            iteratee: mockIteratee,
            shouldApplyLexSort: true,
        });

        expect(ordered).toEqual(['id*', 'weight*', 'xenoClass*', 'species', 'traits']);
    });
});

import {hoistRequiredParamsOrProps} from './hoistRequired';

const mockIsRequiredGetter = (s: string) => s.endsWith('*');

describe('hoistRequired helper function', () => {
    it('preserves original order when all original properties are optional', () => {
        const mockElements = ['idLte', 'idGte', 'nameLte', 'nameGte', 'limit'];

        const ordered = hoistRequiredParamsOrProps(mockElements, mockIsRequiredGetter);

        expect(ordered).toEqual(mockElements);
    });

    it('preserves original order when all original properties are required', () => {
        const mockElements = ['id*', 'fullName*', 'salary*', 'dept*'];

        const ordered = hoistRequiredParamsOrProps(mockElements, mockIsRequiredGetter);

        expect(ordered).toEqual(mockElements);
    });

    it('does actually hoist required properties to the top of the list', () => {
        const mockElements = ['catName*', 'hasThoughts', 'isLazy', 'breed*', 'likesCatnip*'];

        const ordered = hoistRequiredParamsOrProps(mockElements, mockIsRequiredGetter);

        expect(ordered).toEqual(['catName*', 'breed*', 'likesCatnip*', 'hasThoughts', 'isLazy']);
    });
});

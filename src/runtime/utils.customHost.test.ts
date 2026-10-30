import {afterEach, describe, expect, it, vi} from 'vitest';

import {getCustomHost, getCustomHostStorageKey, storeCustomHost} from './utils';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('custom host storage', () => {
    it('builds a key scoped to the page, operation, and active documentation context', () => {
        vi.stubGlobal('window', {
            location: {
                pathname: '/docs/guide',
                search: '?revision=url-revision&lang=ru',
            },
            __DATA__: {
                query: {version: 'v1', tag: ['stable']},
                router: {as: '/docs/guide?revision=router-revision&version=v2'},
            },
        } as unknown as Window);

        const key = getCustomHostStorageKey({
            projectName: 'project',
            method: 'get',
            path: 'items/{id}',
        });

        expect(key).toContain(encodeURIComponent('revision=url-revision'));
        expect(key).toContain(encodeURIComponent('version=v2'));
        expect(key).toContain(encodeURIComponent('tag=stable'));
        expect(key).toContain(encodeURIComponent('lang=ru'));
        expect(key).toContain(encodeURIComponent('items/{id}'));
    });

    it('uses the initial query when the URL and router do not provide a value', () => {
        vi.stubGlobal('window', {
            location: {pathname: '/docs/guide', search: ''},
            __DATA__: {query: {revision: ['r1'], version: 42, tag: 'stable', lang: null}},
        } as unknown as Window);

        const key = getCustomHostStorageKey({projectName: 'project', method: 'get', path: 'items'});

        expect(key).toContain(encodeURIComponent('revision=r1'));
        expect(key).toContain(encodeURIComponent('version='));
        expect(key).toContain(encodeURIComponent('tag=stable'));
        expect(key).toContain(encodeURIComponent('lang='));
    });

    it('reads a saved host and falls back to the default when there is no saved value', () => {
        const getItem = vi.fn((key: string) => (key === 'saved' ? 'https://saved.example' : null));
        vi.stubGlobal('window', {localStorage: {getItem}} as unknown as Window);

        expect(getCustomHost('saved', 'https://default.example')).toBe('https://saved.example');
        expect(getCustomHost('missing', 'https://default.example')).toBe('https://default.example');
    });

    it('falls back to the default when reading storage throws', () => {
        vi.stubGlobal('window', {
            localStorage: {
                getItem: () => {
                    throw new Error('Storage is unavailable');
                },
            },
        } as unknown as Window);

        expect(getCustomHost('host', 'https://default.example')).toBe('https://default.example');
    });

    it('stores a host and ignores storage errors', () => {
        const setItem = vi.fn();
        vi.stubGlobal('window', {localStorage: {setItem}} as unknown as Window);

        expect(storeCustomHost('host', 'https://custom.example')).toBeUndefined();
        expect(setItem).toHaveBeenCalledWith('host', 'https://custom.example');

        vi.stubGlobal('window', {
            localStorage: {
                setItem: () => {
                    throw new Error('Storage is unavailable');
                },
            },
        } as unknown as Window);

        expect(() => storeCustomHost('host', 'https://custom.example')).not.toThrow();
    });
});

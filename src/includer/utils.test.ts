import {describe, expect, it} from 'vitest';

import {companionFilename, trimSlashes} from './utils';

describe('companionFilename', () => {
    it('derives the name from a simple yaml spec', () => {
        expect(companionFilename('petstore.yaml')).toBe('petstore.openapi.json');
    });

    it('uses only the base name, dropping the directory', () => {
        expect(companionFilename('api/v1/petstore.yml')).toBe('petstore.openapi.json');
    });

    it('supports json source specs', () => {
        expect(companionFilename('spec.json')).toBe('spec.openapi.json');
    });

    it('only strips the last extension for dotted names', () => {
        expect(companionFilename('my.service.v2.yaml')).toBe('my.service.v2.openapi.json');
    });
});

describe('trimSlashes', () => {
    it('trims leading and trailing slashes', () => {
        expect(trimSlashes('/pets/')).toBe('pets');
    });

    it('collapses repeated edge slashes', () => {
        expect(trimSlashes('///pets///')).toBe('pets');
    });

    it('keeps inner slashes intact', () => {
        expect(trimSlashes('/pets/{id}/')).toBe('pets/{id}');
    });
});

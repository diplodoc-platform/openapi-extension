import {describe, expect, it} from 'vitest';

import {LeadingPageMode} from '../includer/constants';

import {run} from './__helpers__/run';

const spec = `
openapi: 3.0.0
info:
  title: Preset conditions
  version: v1
tags:
  - name: pets
  - name: public
  - name: empty
paths:
  /pets:
    get:
      tags: [pets]
      operationId: listPets
      responses:
        '200':
          description: OK
  /health:
    get:
      operationId: health
      responses:
        '200':
          description: OK
`;

describe('noindex preset conditions', () => {
    it.each([
        {name: 'array', vars: {operations: ['listPets']}, expected: true},
        {name: 'empty array', vars: {operations: []}, expected: false},
        {name: 'missing variable', vars: {}, expected: false},
        {name: 'nonmatching array', vars: {operations: ['other']}, expected: false},
    ])('evaluates an endpoint condition with $name', async ({vars, expected}) => {
        const fs = await run(
            spec,
            {noindex: {endpoint: 'vars.operations contains operationId'}},
            vars,
        );

        expect(fs.match('listPets.md').includes('noIndex: true')).toBe(expected);
        expect(fs.match('health.md')).not.toContain('noIndex: true');
        expect(fs.pages['pets/index.md']).not.toContain('noIndex: true');
    });

    it('evaluates a tag condition with nested variables and booleans', async () => {
        const fs = await run(
            spec,
            {noindex: {tag: 'vars.indexing.enabled and vars.indexing.tags contains name'}},
            {indexing: {enabled: true, tags: ['pets']}},
        );

        expect(fs.match('listPets.md')).toContain('noIndex: true');
        expect(fs.match('health.md')).not.toContain('noIndex: true');
        expect(fs.pages['pets/index.md']).toMatch(/^---\nnoIndex: true\n---/);
    });

    it.each([LeadingPageMode.Leaf, LeadingPageMode.Section])(
        'excludes the matching tag landing page in %s mode',
        async (mode) => {
            const fs = await run(spec, {
                noindex: {tag: "id == 'pets'"},
                leadingPage: {mode},
                tags: {pets: {alias: 'animals'}},
            });

            expect(fs.pages['animals/index.md']).toMatch(/^---\nnoIndex: true\n---/);
            expect(fs.pages['animals/listPets.md']).toContain('noIndex: true');
            expect(fs.pages['public/index.md']).not.toContain('noIndex: true');
            expect(fs.pages['index.md']).not.toContain('noIndex: true');
            expect(fs.pages['health.md']).not.toContain('noIndex: true');
        },
    );

    it('excludes a matching tag landing page even without endpoints', async () => {
        const fs = await run(spec, {noindex: {tag: "id == 'empty'"}});

        expect(fs.pages['empty/index.md']).toMatch(/^---\nnoIndex: true\n---/);
        expect(fs.pages['pets/index.md']).not.toContain('noIndex: true');
    });

    it('preserves the tag flag when filtering content', async () => {
        const fs = await run(spec, {
            noindex: {tag: "id == 'pets'"},
            filter: {endpoint: "operationId == 'listPets'"},
        });

        expect(fs.pages['pets/index.md']).toMatch(/^---\nnoIndex: true\n---/);
    });

    it('does not exclude landing pages when the tag condition is false', async () => {
        const fs = await run(spec, {noindex: {tag: 'vars.tags contains id'}}, {tags: []});

        expect(fs.pages['pets/index.md']).not.toContain('noIndex: true');
        expect(fs.pages['pets/listPets.md']).not.toContain('noIndex: true');
    });
});

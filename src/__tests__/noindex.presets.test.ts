import {describe, expect, it} from 'vitest';

import {run} from './__helpers__/run';

const spec = `
openapi: 3.0.0
info:
  title: Preset conditions
  version: v1
tags:
  - name: pets
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
    });

    it('evaluates a tag condition with nested variables and booleans', async () => {
        const fs = await run(
            spec,
            {noindex: {tag: 'vars.indexing.enabled and vars.indexing.tags contains name'}},
            {indexing: {enabled: true, tags: ['pets']}},
        );

        expect(fs.match('listPets.md')).toContain('noIndex: true');
        expect(fs.match('health.md')).not.toContain('noIndex: true');
    });
});

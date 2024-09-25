import {DocumentBuilder, run} from './__helpers__/run';

const name = 'recursiveReferences';

describe('Recursive references in schemas', () => {
    it('resulting in a cycle between two components are able to be handled by the includer', async () => {
        const spec = new DocumentBuilder(name)
            .component('RecurseTop', {
                type: 'object',
                properties: {
                    A: DocumentBuilder.ref('RecurseMiddle'),
                },
            })
            .component('RecurseMiddle', {
                type: 'object',
                properties: {
                    B: DocumentBuilder.ref('RecurseTop'),
                },
            })
            .response(200, {
                schema: DocumentBuilder.ref('RecurseTop'),
            })
            .build();

        const fs = await run(spec);

        const page = fs.match(name);

        expect(page).toMatchSnapshot();
    });

    it('resulting in a trivial self-referential cycle are able to be handled by the includer', async () => {
        const spec = new DocumentBuilder(name)
            .component('RecurseTop', {
                type: 'object',
                properties: {
                    A: DocumentBuilder.ref('RecurseTop'),
                },
            })
            .response(200, {
                schema: DocumentBuilder.ref('RecurseTop'),
            })
            .build();

        const fs = await run(spec);

        const page = fs.match(name);

        expect(page).toMatchSnapshot();
    });

    test('where the cycle itself is not trivially referenced are able to be handled by the includer', async () => {
        const spec = new DocumentBuilder(name)
            .component('RecurseTop', {
                type: 'object',
                properties: {
                    A: DocumentBuilder.ref('RecurseTop'),
                },
            })
            .response(200, {
                schema: {
                    allOf: [DocumentBuilder.ref('RecurseTop', 'Description override')],
                },
            })
            .build();

        const fs = await run(spec);

        const page = fs.match(name);

        expect(page).toMatchSnapshot();
    });
});

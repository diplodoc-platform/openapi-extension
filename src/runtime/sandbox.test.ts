import type {ReactNode} from 'react';

import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {ThemeProvider} from '@gravity-ui/uikit';

import {Sandbox} from './sandbox';
import {BodyJson} from './components/BodyJson';
import {Params} from './components/Params';

vi.mock('./components', async () => {
    const {createElement} = await import('react');

    return {
        BodyFormData: () => null,
        BodyJson: () => null,
        Column: ({children}: {children?: ReactNode}) => createElement('div', null, children),
        Params: () => null,
        Result: () => null,
        Security: () => null,
    };
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('Sandbox custom host field', () => {
    it('renders the configured host field when custom host is enabled', () => {
        vi.stubGlobal('window', {
            location: {pathname: '/docs/guide', search: ''},
            __DATA__: {},
            localStorage: {getItem: () => null},
        } as unknown as Window);

        const markup = render(
            createElement(Sandbox, {
                path: 'items',
                host: 'https://api.example',
                customHost: true,
                method: 'get',
                projectName: 'project',
                security: [],
            }),
        );

        expect(markup).toContain('Host');
        expect(markup).toContain('https://api.example');
        expect(markup).toContain('name="host"');
    });
});

describe('Sandbox field validation', () => {
    it('renders required parameter errors and clears the invalid state', () => {
        const field = new Params({
            title: 'Path parameters',
            params: [{name: 'id', in: 'path', required: true}],
        });
        field.state = {values: {id: ''}, errors: {id: 'Required'}};

        const invalid = render(field.render());

        expect(invalid).toContain('aria-invalid="true"');
        expect(invalid).toContain('Required');

        field.state = {values: {id: '123'}, errors: undefined};

        expect(render(field.render())).not.toContain('aria-invalid="true"');
    });

    it('renders a required JSON body error', () => {
        const field = new BodyJson({value: '{}', bodyType: 'application/json'});
        field.state = {value: '', error: 'Required'};

        const markup = render(field.render());

        expect(markup).toContain('aria-invalid="true"');
        expect(markup).toContain('Required');
    });
});

function render(children: ReactNode) {
    return renderToStaticMarkup(createElement(ThemeProvider, {children}));
}

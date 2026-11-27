// @vitest-environment jsdom

import type {OpenAPIV3} from 'openapi-types';
import type {Root} from 'react-dom/client';
import type {V3SecurityOAuthInline} from '../../includer/models';

import {act, createElement} from 'react';
import {createRoot} from 'react-dom/client';
import {ThemeProvider} from '@gravity-ui/uikit';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {Security} from './Security';

const apiKey = {
    type: 'apiKey',
    in: 'header',
    name: 'X-Api-Key',
} satisfies OpenAPIV3.SecuritySchemeObject;

const inlineOAuth = {
    type: 'oauth2',
    description: 'An inline access token',
    flows: {},
    'x-inline': true,
} satisfies V3SecurityOAuthInline;

const implicitOAuth = {
    type: 'oauth2',
    flows: {
        implicit: {
            scopes: {read: 'Read items'},
            authorizationUrl: 'https://example.test/oauth',
        },
    },
} satisfies OpenAPIV3.SecuritySchemeObject;

const observers: TestResizeObserver[] = [];

class TestResizeObserver implements ResizeObserver {
    readonly observe = vi.fn<(element: Element) => void>();
    readonly unobserve = vi.fn();
    readonly disconnect = vi.fn();
    private readonly callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
        observers.push(this);
    }

    resize(target: Element, height: number) {
        const entry = {
            target,
            contentRect: new DOMRectReadOnly(0, 0, 400, height),
            borderBoxSize: [],
            contentBoxSize: [],
            devicePixelContentBoxSize: [],
        };
        this.callback([entry], this);
    }
}

let root: Root;
let container: HTMLDivElement;
let reducedMotion: boolean;

beforeEach(() => {
    observers.length = 0;
    reducedMotion = false;
    vi.stubGlobal('ResizeObserver', TestResizeObserver);
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('matchMedia', (query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)' && reducedMotion,
        addEventListener: () => {},
        removeEventListener: () => {},
    }));
    sessionStorage.clear();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
});

afterEach(async () => {
    await act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
});

async function openDialog(security: OpenAPIV3.SecuritySchemeObject[]) {
    await act(() =>
        root.render(
            createElement(ThemeProvider, {
                children: createElement(Security, {security, projectName: 'sandbox'}),
            }),
        ),
    );
    await clickButton('Authorization');
}

async function clickButton(label: string) {
    const button = [...document.querySelectorAll('button')].find(
        (element) => element.textContent?.trim() === label,
    );
    if (!button) {
        throw new Error(`Expected the ${label} button`);
    }
    await act(() => button.click());
}

function getElement<T extends HTMLElement>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) {
        throw new Error(`Expected ${selector}`);
    }
    return element;
}

async function typeAuthorization(value: string) {
    const field = getElement<HTMLTextAreaElement>('textarea');
    await act(() => {
        field.focus();
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set?.call(
            field,
            value,
        );
        field.dispatchEvent(new Event('input', {bubbles: true}));
    });
}

describe('OpenAPI authorization on UIKit 8', () => {
    it('stores the API key from the authorization dialog', async () => {
        await openDialog([apiKey, inlineOAuth]);
        expect(document.body.textContent).toContain('Available authorizations');
        expect(document.body.textContent).toContain('X-Api-Key');

        await typeAuthorization('example-key');
        await clickButton('Save');

        expect(sessionStorage.getItem('sandbox_type')).toBe('apiKey');
        expect(sessionStorage.getItem('sandbox_value')).toBe('example-key');
    });

    it('switches to OAuth and stores its inline token', async () => {
        await openDialog([apiKey, inlineOAuth]);

        await act(() =>
            getElement<HTMLInputElement>('input[type="radio"][value="oauth2"]').click(),
        );
        expect(document.body.textContent).toContain('Authorization');

        await typeAuthorization('example-token');
        await clickButton('Save');

        expect(sessionStorage.getItem('sandbox_type')).toBe('oauth2');
        expect(sessionStorage.getItem('sandbox_value')).toBe('example-token');
    });

    it('dismisses the authorization dialog via its close button', async () => {
        await openDialog([apiKey]);

        await act(() => getElement<HTMLButtonElement>('.g-dialog-btn-close button').click());

        await vi.waitFor(() => expect(document.querySelector('.g-dialog-body')).toBeNull());
    });

    it('renders the implicit OAuth scopes and validates an empty client ID', async () => {
        await openDialog([implicitOAuth]);

        expect(document.body.textContent).toContain('https://example.test/oauth');
        expect(getElement<HTMLInputElement>('input[type="checkbox"]').value).toBe('read');
        await clickButton('Request');

        expect(getElement<HTMLTextAreaElement>('textarea').getAttribute('aria-invalid')).toBe(
            'true',
        );
        expect(document.body.textContent).toContain('Required field!');
    });

    it('logs out of an implicit OAuth session and restores the request form', async () => {
        sessionStorage.setItem('sandbox_type', 'oauth2');
        sessionStorage.setItem('sandbox_value', 'example-token');
        await openDialog([implicitOAuth]);

        expect(document.body.textContent).toContain('**********');
        await clickButton('Log out');

        expect(sessionStorage.getItem('sandbox_value')).toBe('');
        expect(getElement<HTMLTextAreaElement>('textarea').value).toBe('');
        expect(document.body.textContent).toContain('Request');
    });

    it('animates a resized dialog body and cancels animation on reduced motion or unmount', async () => {
        await openDialog([apiKey]);
        const body = getElement<HTMLDivElement>('.g-dialog-body');
        const content = getElement<HTMLDivElement>('.g-dialog-body > div');
        const observer = observers.find((item) =>
            item.observe.mock.calls.some(([target]) => target === content),
        );
        if (!observer) {
            throw new Error('Expected a resize observer for the dialog content');
        }

        body.style.cssText =
            'box-sizing: border-box; height: 142px; padding: 5px; border: 2px solid';
        const cancel = vi.fn();
        const animate = vi.fn(() => ({cancel, playState: 'running'}));
        body.animate = animate as unknown as typeof body.animate;

        observer.resize(content, 100);
        observer.resize(content, 100);
        expect(animate).not.toHaveBeenCalled();

        observer.resize(content, 150);
        expect(animate).toHaveBeenCalledWith(
            [
                {height: '114px', overflowY: 'clip'},
                {height: '164px', overflowY: 'clip'},
            ],
            {duration: 350, easing: 'ease-in-out'},
        );
        observer.resize(content, 180);
        expect(cancel).toHaveBeenCalledTimes(1);
        expect(animate).toHaveBeenLastCalledWith(
            [
                {height: '142px', overflowY: 'clip'},
                {height: '194px', overflowY: 'clip'},
            ],
            {duration: 350, easing: 'ease-in-out'},
        );

        reducedMotion = true;
        observer.resize(content, 200);
        expect(animate).toHaveBeenCalledTimes(2);
        expect(cancel).toHaveBeenCalledTimes(2);

        await act(() => root.render(null));
        expect(observer.disconnect).toHaveBeenCalledOnce();
        expect(cancel).toHaveBeenCalledTimes(3);
    });
});

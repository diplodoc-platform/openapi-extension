import type {SandboxProps} from '../includer/models';
import type {FormState} from './types';

import React, {useLayoutEffect, useRef, useState} from 'react';
import {Button} from '@gravity-ui/uikit';

import {Text, yfmSandbox} from '../plugin/constants';

import {BodyFormData, BodyJson, Column, Params, Result, Security} from './components';
import {collectErrors, collectValues, prepareRequest, setAuth} from './utils';
import './sandbox.scss';

export const Sandbox: React.FC<SandboxProps> = (props) => {
    const refs = {
        path: useRef(null),
        search: useRef(null),
        headers: useRef(null),
        bodyJson: useRef(null),
        bodyFormData: useRef(null),
    };
    const [request, setRequest] = useState<Promise<Response> | null>(null);

    useLayoutEffect(() => {
        const hash = window.location.hash;
        if (hash.includes('access_token=')) {
            const searchParams = new URLSearchParams(hash.slice(1));
            const tokenValue = searchParams.get('access_token');
            if (tokenValue) {
                document
                    .querySelector('.openapi')
                    ?.querySelector<HTMLDivElement>('.yfm-tab:nth-child(2)')
                    ?.click();
                const newUrl = new URL(window.location.toString());
                newUrl.hash = '';
                window.history.replaceState(null, document.title, newUrl);
                setAuth(props.projectName, {type: 'oauth2', value: tokenValue});
            }
        }
    }, []);

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (collectErrors(refs)) {
            return;
        }

        const values = collectValues(refs) as FormState;
        const {url, headers, body} = prepareRequest(
            (props.host ?? '') + '/' + props.path,
            values,
            props.projectName,
            props.bodyType,
            props.security,
        );

        setRequest(
            fetch(url, {
                method: props.method,
                headers,
                ...body,
            }),
        );
    };

    return (
        <form onSubmit={onSubmit} className={yfmSandbox()}>
            <Column>
                {props.security?.length && (
                    <Security security={props.security} projectName={props.projectName} />
                )}
                <Params
                    ref={refs.path}
                    title={Text.PATH_PARAMS_SECTION_TITLE}
                    params={props.pathParams}
                />
                <Params
                    ref={refs.search}
                    title={Text.QUERY_PARAMS_SECTION_TITLE}
                    params={props.searchParams}
                />
                <Params
                    ref={refs.headers}
                    title={Text.HEADER_PARAMS_SECTION_TITLE}
                    params={props.headers}
                />
                <BodyJson ref={refs.bodyJson} value={props.body} bodyType={props.bodyType} />
                <BodyFormData
                    ref={refs.bodyFormData}
                    schema={props.schema}
                    example={props.body}
                    bodyType={props.bodyType}
                />
                <div>
                    <Button size="l" view="action" type="submit">
                        {Text.BUTTON_SUBMIT}
                    </Button>
                </div>
                {request && <Result request={request} />}
            </Column>
        </form>
    );
};

import type {SandboxProps} from '../includer/models';
import type {FormState} from './types';

import React, {useRef, useState} from 'react';
import {Button} from '@gravity-ui/uikit';

import {Text, yfmSandbox} from '../plugin/constants';

import {BodyFormData, BodyJson, Column, Params, Result} from './components';
import {collectErrors, collectValues, prepareHeaders, prepareRequest} from './utils';
import './sandbox.scss';

export const Sandbox: React.FC<SandboxProps> = (props) => {
    const preparedHeaders = prepareHeaders(props);
    const refs = {
        path: useRef(null),
        search: useRef(null),
        headers: useRef(null),
        bodyJson: useRef(null),
        bodyFormData: useRef(null),
    };
    const [request, setRequest] = useState<Promise<Response> | null>(null);

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (collectErrors(refs)) {
            return;
        }

        const values = collectValues(refs) as FormState;
        const {url, headers, body} = prepareRequest(
            (props.host ?? '') + '/' + props.path,
            values,
            props.bodyType,
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
                    params={preparedHeaders}
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

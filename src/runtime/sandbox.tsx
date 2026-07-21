import type {SandboxProps} from '../includer/models';
import type {FormState} from './types';
import type {FC, SubmitEvent} from 'react';

import {useRef, useState} from 'react';
import {Button} from '@gravity-ui/uikit';

import {Text, yfmSandbox} from '../plugin/constants';

import {BodyFormData, BodyJson, Column, Params, Result, Security} from './components';
import {collectErrors, collectValues, prepareRequest} from './utils';
import './sandbox.scss';

export const Sandbox: FC<SandboxProps> = (props) => {
    const refs = {
        path: useRef<Params>(null),
        search: useRef<Params>(null),
        headers: useRef<Params>(null),
        bodyJson: useRef<BodyJson>(null),
        bodyFormData: useRef<BodyFormData>(null),
    };
    const [request, setRequest] = useState<Promise<Response> | null>(null);

    const onSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
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
                <Security security={props.security} projectName={props.projectName} />
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

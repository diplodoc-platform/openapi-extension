import type {SandboxProps} from '../includer/models';
import type {FormState} from './types';
import type {FC, FormEvent} from 'react';

import {useRef, useState} from 'react';
import {Button, TextInput, Text as UIKitText} from '@gravity-ui/uikit';

import {Text, yfmSandbox} from '../plugin/constants';

import {BodyFormData, BodyJson, Column, Params, Result, Security} from './components';
import {
    collectErrors,
    collectValues,
    getCustomHost,
    getCustomHostStorageKey,
    prepareRequest,
    storeCustomHost,
} from './utils';
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
    const defaultHost = props.host ?? '';
    const hostStorageKey = props.customHost ? getCustomHostStorageKey(props) : null;
    const [host, setHost] = useState(() =>
        hostStorageKey ? getCustomHost(hostStorageKey, defaultHost) : defaultHost,
    );

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (collectErrors(refs)) {
            return;
        }

        const values = collectValues(refs) as FormState;
        const requestHost = props.customHost ? host.trim() || defaultHost : defaultHost;

        if (props.customHost && hostStorageKey) {
            setHost(requestHost);
            storeCustomHost(hostStorageKey, requestHost);
        }

        const {url, headers, body} = prepareRequest(
            requestHost + '/' + props.path,
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
                {props.customHost && (
                    <Column gap={5}>
                        <UIKitText variant="body-2">{Text.HOST_FIELD}</UIKitText>
                        <TextInput value={host} name="host" onUpdate={setHost} />
                    </Column>
                )}
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

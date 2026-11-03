import type {V3SecurityOAuthImplicit} from '../../includer/models';

import {type FC, useState} from 'react';
import {Button, Checkbox, Col, Flex, Row, Text, TextArea} from '@gravity-ui/uikit';

import {yfmSandbox} from '../../plugin/constants';

type SecurityOAuthImplicitProps = V3SecurityOAuthImplicit & {
    close: () => void;
    initialValue: string;
    setAuth: (params: {value: string; type: 'oauth2'}) => void;
};

export const SecurityOAuthImplicit: FC<SecurityOAuthImplicitProps> = (props) => {
    const {
        flows: {
            implicit: {scopes, authorizationUrl},
        },
        initialValue,
        close,
        setAuth,
    } = props;
    const [clientId, setClientId] = useState<string>('');
    const [token, setToken] = useState<string>(initialValue);
    const [selectedScopes, setSelectedScopes] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<undefined | string>(undefined);

    const hasToken = Boolean(token);
    const scopesArray = Object.keys(scopes);
    const hasScopes = Boolean(scopesArray.length);
    const viewScopes = !hasToken && hasScopes;

    const redirectToCreateToken = () => {
        if (!clientId) {
            setError('Required field!');
            return;
        }
        const url = new URL(authorizationUrl);
        url.searchParams.set('response_type', 'token');
        url.searchParams.set('redirect_uri', window.location.href);
        url.searchParams.set('client_id', clientId);

        Object.entries(selectedScopes).forEach(([scope, isActive]) => {
            if (isActive) {
                url.searchParams.append('scope', scope);
            }
        });

        window.location.href = url.toString();
        close();
    };

    const removeToken = () => {
        setClientId('');
        setError(undefined);
        setSelectedScopes({});
        setToken('');
        setAuth({value: '', type: 'oauth2'});
    };
    return (
        <Flex direction="column" width="100%" gap="spacing-4">
            <Text variant="subheader-2">Authorization Url</Text>
            <Text variant="body-1" color="secondary">
                {authorizationUrl}
            </Text>

            <Flex direction="column" width="100%" gap="spacing-4">
                <Row className={yfmSandbox('security-row')}>
                    <Col size={2}>
                        <Text variant="subheader-1">Flow</Text>
                    </Col>
                    <Col size={10}>
                        <Text variant="body-1" color="secondary">
                            implicit
                        </Text>
                    </Col>
                </Row>
                <Row className={yfmSandbox('security-row')}>
                    <Col size={2} style={{marginTop: 6}}>
                        <Text variant="subheader-1">Client_id</Text>
                    </Col>
                    <Col size={10} style={{marginTop: hasToken ? 8 : 0}}>
                        {hasToken ? (
                            <Text variant="body-1">**********</Text>
                        ) : (
                            <TextArea
                                rows={1}
                                value={clientId}
                                onUpdate={(value) => {
                                    setClientId(value);
                                    setError(undefined);
                                }}
                                onFocus={() => {
                                    setClientId('');
                                }}
                                validationState={error ? 'invalid' : undefined}
                                errorMessage={error}
                            />
                        )}
                    </Col>
                </Row>
                <Row className={yfmSandbox('security-row')}>
                    <Col size={2}>{viewScopes && <Text variant="subheader-1">Scopes</Text>}</Col>
                    <Col size={10} style={{marginTop: 4}}>
                        {viewScopes && (
                            <Flex direction="column" gap="spacing-1">
                                {scopesArray.map((scope) => {
                                    return (
                                        <Checkbox
                                            key={scope}
                                            value={scope}
                                            onUpdate={(value) =>
                                                setSelectedScopes((prevState) => ({
                                                    ...prevState,
                                                    [scope]: value,
                                                }))
                                            }
                                        >
                                            {scope}
                                        </Checkbox>
                                    );
                                })}
                            </Flex>
                        )}
                    </Col>
                </Row>
            </Flex>

            <Flex justifyContent="end" marginBlockEnd="spacing-4" gap="spacing-4">
                <Button size="l" view="flat" onClick={close}>
                    Cancel
                </Button>
                {hasToken ? (
                    <Button size="l" view="action" onClick={removeToken}>
                        Log out
                    </Button>
                ) : (
                    <Button size="l" view="action" onClick={redirectToCreateToken}>
                        Request
                    </Button>
                )}
            </Flex>
        </Flex>
    );
};

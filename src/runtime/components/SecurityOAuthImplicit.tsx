import React, {useState} from 'react';
import {Button, Checkbox, Col, Flex, Row, Text, TextArea} from '@gravity-ui/uikit';

import {V3SecurityOAuthImplicit} from '../../includer/models';
import {getAuthByType, setAuth} from '../utils';

type SecurityOAuthImplicitProps = V3SecurityOAuthImplicit & {
    close: () => void;
    projectName: string;
};

export function SecurityOAuthImplicit({
    flows: {
        implicit: {scopes, authorizationUrl},
    },
    projectName,
    close,
}: SecurityOAuthImplicitProps) {
    const {value} = getAuthByType(projectName, 'oauth2');
    const [clientId, setClientId] = useState<string>('');
    const [token, setToken] = useState<string>(value ?? '');
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
        setAuth(projectName, {value: '', type: 'oauth2'});
    };
    return (
        <Flex direction="column" width="100%" gap={4}>
            <Text variant="subheader-2">Authorization Url</Text>
            <Text variant="body-1" color="secondary">
                {authorizationUrl}
            </Text>

            <Flex direction="column" width="100%" gap={4}>
                <Row space={1}>
                    <Col s={2}>
                        <Text variant="subheader-1">Flow</Text>
                    </Col>
                    <Col s={10}>
                        <Text variant="body-1" color="secondary">
                            implicit
                        </Text>
                    </Col>
                </Row>
                <Row space={1}>
                    <Col s={2} style={{marginTop: 6}}>
                        <Text variant="subheader-1">Client_id</Text>
                    </Col>
                    <Col s={10} style={{marginTop: hasToken ? 8 : 0}}>
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
                                error={error}
                            />
                        )}
                    </Col>
                </Row>
                <Row space={1}>
                    <Col s={2}>{viewScopes && <Text variant="subheader-1">Scopes</Text>}</Col>
                    <Col s={10} style={{marginTop: 4}}>
                        {viewScopes && (
                            <Flex direction="column" gap={1}>
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

            <Flex justifyContent="end" spacing={{mb: 4}} gap={4}>
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
}

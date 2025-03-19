import React from 'react';
import {Button, Checkbox, Col, Flex, Row, Text, TextArea} from '@gravity-ui/uikit';

import {V3SecurityOAuthImplicit} from '../../includer/models';
import {getAuthByType, setAuth} from '../utils';

type SecurityOAuthImplicitProps = V3SecurityOAuthImplicit & {
    close: () => void;
    projectName: string;
};

export class SecurityOAuthImplicit extends React.Component<
    SecurityOAuthImplicitProps,
    {clientId: string; token: string; scopes: Record<string, boolean>; error?: string}
> {
    setClientId: (value: string) => void;

    constructor(props: SecurityOAuthImplicitProps) {
        super(props);

        const {value} = getAuthByType(this.props.projectName, 'oauth2');

        this.state = {
            clientId: '',
            token: value ?? '',
            scopes: {},
            error: undefined,
        };

        this.setClientId = (clientId: string) => this.setState({clientId, error: undefined});
    }

    render() {
        const {
            flows: {
                implicit: {scopes, authorizationUrl},
            },
        } = this.props;
        const {clientId, error, token} = this.state;

        const hasToken = Boolean(token);
        const scopesArray = Object.keys(scopes);
        const hasScopes = Boolean(scopesArray.length);
        const viewScopes = !hasToken && hasScopes;

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
                                    onUpdate={this.setClientId}
                                    onFocus={() => {
                                        this.setClientId('');
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
                                                    this.setState((prevState) => ({
                                                        ...prevState,
                                                        scopes: {
                                                            ...prevState.scopes,
                                                            [scope]: value,
                                                        },
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
                    <Button size="l" view="flat" onClick={this.props.close}>
                        Cancel
                    </Button>
                    {hasToken ? (
                        <Button size="l" view="action" onClick={this.removeToken}>
                            Log out
                        </Button>
                    ) : (
                        <Button size="l" view="action" onClick={this.redirectToCreateToken}>
                            Request
                        </Button>
                    )}
                </Flex>
            </Flex>
        );
    }

    private redirectToCreateToken = () => {
        if (!this.state.clientId) {
            this.setState({error: 'Required field!'});
            return;
        }
        const url = new URL(this.props.flows.implicit.authorizationUrl);
        url.searchParams.set('response_type', 'token');
        url.searchParams.set('redirect_uri', window.location.href);
        url.searchParams.set('client_id', this.state.clientId);

        Object.entries(this.state.scopes).forEach(([scope, isActive]) => {
            if (isActive) {
                url.searchParams.append('scope', scope);
            }
        });

        window.location.href = url.toString();
        this.props.close();
    };

    private removeToken = () => {
        this.setState({
            clientId: '',
            error: undefined,
            scopes: {},
            token: '',
        });
        setAuth(this.props.projectName, {value: '', type: 'oauth2'});
    };
}

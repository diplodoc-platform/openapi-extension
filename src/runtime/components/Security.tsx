import type {OpenAPIV3} from 'openapi-types';
import type {V3SecurityType} from '../../includer/models';

import React, {useCallback, useMemo, useState} from 'react';
import {Box, Button, Dialog, RadioButton, Text} from '@gravity-ui/uikit';
import {CircleCheck} from '@gravity-ui/icons';

import {isV3SecurityApiKey, isV3SecurityOAuthImplicit, isV3SecurityOAuthInline} from '../utils';
import {useAuthSessionStorage} from '../hooks/useAuthSessionStorage';

import {Column, SecurityApiKey, SecurityOAuthImplicit, SecurityOAuthInline} from '.';

type SecurityProps = {
    security?: OpenAPIV3.SecuritySchemeObject[];
    projectName: string;
};

export const Security: React.FC<SecurityProps> = (props) => {
    const {security = []} = props;
    const {
        isOpen,
        close,
        open,

        activeSecurityTab,
        activeType,
        setActiveType,

        auth,
        setAuth,
        hasAnyAuthorization,
    } = useEnhance(props);

    if (!security || !security.length || !activeSecurityTab) {
        return null;
    }

    return (
        <Column gap={10}>
            <Button size="m" width="auto" style={{marginLeft: 'auto'}} view="normal" onClick={open}>
                {hasAnyAuthorization && <CircleCheck color="#3AB935" />} Authorization
            </Button>
            <Dialog open={isOpen} onClose={close} hasCloseButton>
                <Dialog.Header caption="Available authorizations" />
                <Dialog.Body>
                    <Column gap={0} minWidth={400}>
                        <Box>
                            <RadioButton
                                onChange={(event) => {
                                    setActiveType(event.currentTarget.value as V3SecurityType);
                                }}
                                value={activeType}
                                options={security.map((item) => ({
                                    value: item.type,
                                    content: item.type,
                                }))}
                                size="s"
                            />
                        </Box>
                        <Box spacing={{pt: '4'}}>
                            <SecurityTab
                                close={close}
                                security={activeSecurityTab}
                                initialValue={auth.type === activeType ? auth.value : ''}
                                setAuth={setAuth}
                            />
                        </Box>
                    </Column>
                </Dialog.Body>
            </Dialog>
        </Column>
    );
};

function useEnhance({projectName, security}: SecurityProps) {
    security = security || [];

    const initialType: V3SecurityType | undefined = security[0]?.type;
    const [isOpen, setOpen] = useState(false);
    const [auth, setAuth] = useAuthSessionStorage({
        projectName,
        initialType,
    });
    const hasAnyAuthorization = Boolean(auth.value);
    const [activeType, setActiveType] = useState(auth.type);
    const activeSecurityTab = useMemo(
        () => security?.find(({type}) => activeType === type) || undefined,
        [activeType],
    );

    const close = useCallback(() => {
        setOpen(false);
    }, [setOpen]);

    const open = useCallback(() => {
        setActiveType(auth.type || initialType);
        setOpen(true);
    }, [setOpen, initialType]);

    return {
        isOpen,
        close,
        open,

        activeSecurityTab,
        activeType,
        setActiveType,

        auth,
        setAuth,
        hasAnyAuthorization,
    };
}

function SecurityTab({
    security,
    close,
    initialValue,
    setAuth,
}: {
    security: OpenAPIV3.SecuritySchemeObject;
    close: () => void;
    initialValue: string;
    setAuth: (params: {type: OpenAPIV3.SecuritySchemeObject['type']; value: string}) => void;
}) {
    if (isV3SecurityApiKey(security)) {
        return (
            <SecurityApiKey
                {...security}
                close={close}
                initialValue={initialValue}
                setAuth={setAuth}
            />
        );
    }

    if (isV3SecurityOAuthInline(security)) {
        return (
            <SecurityOAuthInline
                {...security}
                close={close}
                initialValue={initialValue}
                setAuth={setAuth}
            />
        );
    }

    if (isV3SecurityOAuthImplicit(security)) {
        return (
            <SecurityOAuthImplicit
                {...security}
                close={close}
                initialValue={initialValue}
                setAuth={setAuth}
            />
        );
    }

    return <SecurityUnsupported type={security.type} />;
}

function SecurityUnsupported({type}: {type: string}) {
    return <Text>Unsupported type: {type}</Text>;
}

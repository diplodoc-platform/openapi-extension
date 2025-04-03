import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Box, Button, Dialog, RadioButton, Text} from '@gravity-ui/uikit';
import {CircleCheck} from '@gravity-ui/icons';

import {V3Security} from '../../includer/models';
import {
    getSelectedAuth,
    isV3SecurityApiKey,
    isV3SecurityOAuthImplicit,
    isV3SecurityOAuthInline,
} from '../utils';

import {Column, SecurityApiKey, SecurityOAuthImplicit, SecurityOAuthInline} from '.';

export const Security: React.FC<{
    security: V3Security[];
    projectName: string;
}> = ({security, projectName}) => {
    const [isOpen, setOpen] = useState(false);
    const [activeType, setActiveType] = useState(
        getSelectedAuth(projectName).type ?? security[0].type,
    );
    const [hasAnyAuthorization, setHasAnyAuthorization] = useState(
        Boolean(getSelectedAuth(projectName).value),
    );
    const activeSecurityTab = useMemo(
        () => security.find(({type}) => activeType === type),
        [activeType],
    );
    if (!activeSecurityTab) {
        throw new Error();
    }

    useEffect(() => {
        setActiveType(getSelectedAuth(projectName).type ?? security[0].type);
        setHasAnyAuthorization(Boolean(getSelectedAuth(projectName).value));
    }, [isOpen]);

    const close = useCallback(() => {
        setOpen(false);
    }, [setOpen]);

    const open = useCallback(() => {
        setOpen(true);
    }, [setOpen]);

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
                                    setActiveType(event.currentTarget.value);
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
                                projectName={projectName}
                                close={close}
                                security={activeSecurityTab}
                            />
                        </Box>
                    </Column>
                </Dialog.Body>
            </Dialog>
        </Column>
    );
};

function SecurityTab({
    security,
    close,
    projectName,
}: {
    security: V3Security;
    close: () => void;
    projectName: string;
}) {
    if (isV3SecurityApiKey(security)) {
        return <SecurityApiKey {...security} close={close} projectName={projectName} />;
    }

    if (isV3SecurityOAuthInline(security)) {
        return <SecurityOAuthInline {...security} close={close} projectName={projectName} />;
    }

    if (isV3SecurityOAuthImplicit(security)) {
        return <SecurityOAuthImplicit {...security} close={close} projectName={projectName} />;
    }

    return <SecurityUnsupported type={security.type} />;
}

function SecurityUnsupported({type}: {type: string}) {
    return <Text>Unsupported type: {type}</Text>;
}

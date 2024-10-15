
import React, {useCallback, useEffect, useState} from 'react';
import {Box, Button, Dialog, Tabs, Text} from '@gravity-ui/uikit';
import {Lock, LockOpen} from '@gravity-ui/icons';

import {V3Security} from "../../includer/models";
import {getTempValue, isV3SecurityApiKey, isV3SecurityOAuth2} from "../utils";

import {Column, SecurityApiKey, SecurityOAuth} from '.';

export const Security: React.FC<{
    security: V3Security[];
}> = ({security}) => {
    const [isOpen, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<`${number}`>('0');
    const [hasAnyAuthorization, setHasAnyAuthorization] = useState(security.some(({type}) => getTempValue(type)));
    const activeSecurityTab = security[activeTab];

    useEffect(() => {
        if (isOpen) {
            setActiveTab('0');
        } else {
            setHasAnyAuthorization(security.some(({type}) => getTempValue(type)));
        }
    }, [isOpen]);

    const close = useCallback(() => {
        setOpen(false);
    }, [setOpen]);

    const open = useCallback(() => {
        setOpen(true);
    }, [setOpen]);

    return (
        <Column gap={10}>
            <Button size="l" width="auto" style={{marginLeft: 'auto'}} view="outlined-info" onClick={open}>Authorization {hasAnyAuthorization ? <Lock /> : <LockOpen />}</Button>
            <Dialog  open={isOpen} onClose={close} hasCloseButton>
                <Dialog.Header caption="Available authorizations" />
                <Dialog.Body>
                    <Column gap={0} minWidth={400}>
                        <Tabs activeTab={activeTab}>
                                {security.map((item, index) => {
                                    return <Tabs.Item
                                        id={String(index)}
                                        key={index}
                                        onClick={() => setActiveTab(`${index}`)}
                                        title={<Text variant="subheader-2">{item.type}</Text>}
                                    />
                                })}
                        </Tabs>
                        <Box spacing={{pt: '4'}}>
                            <SecurityTab security={activeSecurityTab} onClose={close} />
                        </Box>
                    </Column>
                </Dialog.Body>
            </Dialog>
        </Column>
    );
};

function SecurityTab({security, onClose}: {security: V3Security; onClose: () => void}) {
    if (isV3SecurityApiKey(security)) {
            return <SecurityApiKey {...security} onClose={onClose} />
    }

    if (isV3SecurityOAuth2(security)) {
        return  <SecurityOAuth {...security} onClose={onClose} />
    }

    return <SecurityUnsupported type={security.type} />
}

function SecurityUnsupported({type}: {type: string}) {
    return <Text>Unsupported type: {type}</Text>;
}

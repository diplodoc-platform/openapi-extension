import type {OpenAPIV3} from 'openapi-types';
import type {V3SecurityType} from '../../includer/models';

import {
    type FC,
    type PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {Box, Button, Dialog, MobileContext, RadioGroup, Text} from '@gravity-ui/uikit';
import {CircleCheck} from '@gravity-ui/icons';

import {yfmSandbox} from '../../plugin/constants';
import {isV3SecurityApiKey, isV3SecurityOAuthImplicit, isV3SecurityOAuthInline} from '../utils';
import {useAuthSessionStorage} from '../hooks/useAuthSessionStorage';

import {Column, SecurityApiKey, SecurityOAuthImplicit, SecurityOAuthInline} from '.';

type SecurityProps = {
    security?: OpenAPIV3.SecuritySchemeObject[];
    projectName: string;
};

export const Security: FC<SecurityProps> = (props) => {
    const {security = []} = props;
    const mobileContext = useContext(MobileContext);
    const dialogMobileContext = useMemo(() => ({...mobileContext, mobile: false}), [mobileContext]);
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
            <MobileContext.Provider value={dialogMobileContext}>
                <Dialog
                    open={isOpen}
                    onOpenChange={(isOpen) => {
                        if (!isOpen) {
                            close();
                        }
                    }}
                    className={yfmSandbox('security-dialog')}
                    hasCloseButton
                >
                    <Dialog.Header caption="Available authorizations" />
                    <SecurityDialogBody>
                        <Column gap={0} minWidth={400}>
                            <Box>
                                <RadioGroup
                                    onChange={(event) => {
                                        setActiveType(event.currentTarget.value as V3SecurityType);
                                    }}
                                    value={activeType}
                                    options={security.map((item) => ({
                                        value: item.type,
                                        content: item.type,
                                    }))}
                                    size="m"
                                />
                            </Box>
                            <Box paddingBlockStart="spacing-4">
                                <SecurityTab
                                    close={close}
                                    security={activeSecurityTab}
                                    initialValue={auth.type === activeType ? auth.value : ''}
                                    setAuth={setAuth}
                                />
                            </Box>
                        </Column>
                    </SecurityDialogBody>
                </Dialog>
            </MobileContext.Provider>
        </Column>
    );
};

function SecurityDialogBody({children}: PropsWithChildren) {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const content = contentRef.current;
        const body = content?.parentElement;
        if (!content || !body) {
            return;
        }

        let height = 0;
        let animation: Animation | undefined;
        const observer = new ResizeObserver(([entry]) => {
            const nextHeight = entry.contentRect.height;
            if (height === 0 || nextHeight === 0 || nextHeight === height) {
                height = nextHeight;
                return;
            }

            const style = getComputedStyle(body);
            const boxAdjustment =
                style.boxSizing === 'border-box'
                    ? parseFloat(style.paddingTop) +
                      parseFloat(style.paddingBottom) +
                      parseFloat(style.borderTopWidth) +
                      parseFloat(style.borderBottomWidth)
                    : 0;
            const previousHeight =
                animation?.playState === 'running'
                    ? parseFloat(style.height)
                    : height + boxAdjustment;
            height = nextHeight;
            animation?.cancel();

            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                animation = body.animate(
                    [
                        {height: `${previousHeight}px`, overflowY: 'clip'},
                        {height: `${nextHeight + boxAdjustment}px`, overflowY: 'clip'},
                    ],
                    {duration: 350, easing: 'ease-in-out'},
                );
            }
        });
        observer.observe(content);

        return () => {
            observer.disconnect();
            animation?.cancel();
        };
    }, []);

    return (
        <Dialog.Body>
            <div ref={contentRef}>{children}</div>
        </Dialog.Body>
    );
}

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

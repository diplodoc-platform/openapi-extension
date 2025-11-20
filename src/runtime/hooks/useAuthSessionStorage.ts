import type {V3SecurityType} from '../../includer/models';

import {useCallback, useState} from 'react';

import {getSelectedAuth, setAuth as setAuthFromUtils} from '../utils';

type UseAuthSessionStorageProps = {
    initialType: V3SecurityType | undefined;
    projectName: string;
};

type UseAuthSessionStorageResult = [
    {type: V3SecurityType | undefined; value: string},
    (params: {type: V3SecurityType; value: string}) => void,
];

export const useAuthSessionStorage = (
    props: UseAuthSessionStorageProps,
): UseAuthSessionStorageResult => {
    const {projectName} = props;
    const [state, setState] = useState<{type: V3SecurityType | undefined; value: string}>(
        createGetInitialAuthFunction(props),
    );

    const setAuth = useCallback(
        (newAuth: {type: V3SecurityType; value: string}) => {
            setState(newAuth);
            setAuthFromUtils(projectName, newAuth);
        },
        [setState],
    );

    return [state, setAuth];
};

function createGetInitialAuthFunction({projectName, initialType}: UseAuthSessionStorageProps) {
    return () => {
        const hash = window.location.hash;
        if (hash.includes('access_token=')) {
            const searchParams = new URLSearchParams(hash.slice(1));
            const tokenValue = searchParams.get('access_token') as V3SecurityType;
            if (tokenValue) {
                document
                    .querySelector('.openapi')
                    ?.querySelector<HTMLDivElement>('.yfm-tab:nth-child(2)')
                    ?.click();
                const newUrl = new URL(window.location.toString());
                newUrl.hash = '';
                window.history.replaceState(null, document.title, newUrl);
                const auth = {type: 'oauth2' as const, value: tokenValue};
                setAuthFromUtils(projectName, auth);
                return auth;
            }
        }

        return {
            type: getSelectedAuth(projectName).type ?? initialType,
            value: getSelectedAuth(projectName).value ?? '',
        };
    };
}

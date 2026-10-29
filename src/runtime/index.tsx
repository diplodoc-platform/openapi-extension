import {type FC, useEffect, useState} from 'react';
import {createPortal} from 'react-dom';

import {Sandbox} from './sandbox';
import {getCustomHostStorageKey} from './utils';
import './index.scss';

export const Runtime: FC = () => {
    const [sandbox, setSandbox] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setSandbox(document.querySelector<HTMLElement>('.yfm-openapi-sandbox-js'));
    });

    if (!sandbox || !sandbox.dataset.props) {
        return null;
    }

    try {
        const projectName =
            window.__DATA__?.props?.pageProps?.data?.viewerConfigParams?.['project-name'] ??
            'unknown-project';
        const props = JSON.parse(decodeURIComponent(sandbox.dataset.props));
        const sandboxProps = {...props, projectName};
        const sandboxKey = props.customHost ? getCustomHostStorageKey(sandboxProps) : undefined;

        return createPortal(<Sandbox key={sandboxKey} {...sandboxProps} />, sandbox);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);

        return null;
    }
};

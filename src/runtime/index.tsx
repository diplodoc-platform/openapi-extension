import React, {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';

import {Sandbox} from './sandbox';
import './index.scss';

export const Runtime: React.FC = () => {
    const [sandbox, setSandbox] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setSandbox(document.querySelector<HTMLElement>('.yfm-openapi-sandbox-js'));
    });

    if (!sandbox || !sandbox.dataset.props) {
        return null;
    }

    try {
        const projectName = 'unknown_project';
        const props = JSON.parse(decodeURIComponent(sandbox.dataset.props));

        return createPortal(<Sandbox {...{...props, projectName}} />, sandbox);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);

        return null;
    }
};

import React, {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {unescape} from 'html-escaper';

import {Sandbox} from './sandbox';

import './index.scss';

export const OpenapiSandbox: React.FC = () => {
    const [sandbox, setSandbox] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setSandbox(document.querySelector<HTMLElement>('.yfm-sandbox-js'));
    });

    if (!sandbox || !sandbox.dataset.props) {
        return null;
    }

    try {
        const props = JSON.parse(unescape(sandbox.dataset.props));

        return createPortal(<Sandbox { ...props } />, sandbox);
    } catch (error) {
        console.error(error);

        return null;
    }
};

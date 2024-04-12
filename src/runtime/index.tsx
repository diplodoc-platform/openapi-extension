import React, {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';

import {Sandbox} from './sandbox';

import './index.scss';

export const Runtime: React.FC = () => {
    const [sandbox, setSandbox] = useState<HTMLElement | null>(null);

    useEffect(() => {
        document.addEventListener('click', (event: any) => {
            if (!event?.target?.closest('.openapi')) {
                return;
            }

            const id = event?.target?.hash;

            if (!id) {
                return;
            }

            const anchor = document.querySelector(id);

            if (anchor.classList.contains('highlight')) {
                return;
            }

            anchor.classList.toggle('highlight');

            setTimeout(() => anchor.classList.toggle('highlight'), 1_000);
        });
    }, []);

    useEffect(() => {
        setSandbox(document.querySelector<HTMLElement>('.yfm-openapi-sandbox-js'));
    });

    if (!sandbox || !sandbox.dataset.props) {
        return null;
    }

    try {
        const props = JSON.parse(decodeURIComponent(sandbox.dataset.props));

        return createPortal(<Sandbox {...props} />, sandbox);
    } catch (error) {
        console.log(error);

        return null;
    }
};

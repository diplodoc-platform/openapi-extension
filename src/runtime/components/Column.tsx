import type {PropsWithChildren} from 'react';

import React from 'react';

import {yfmSandbox} from '../../plugin/constants';

export const Column: React.FC<
    PropsWithChildren & {
        className?: string;
        gap?: number;
        minWidth?: number;
    }
> = ({className, gap = 20, children, minWidth}) => {
    const style = {
        gap: gap + 'px',
        minWidth,
    };

    return (
        <div className={yfmSandbox('column', className)} style={style}>
            {children}
        </div>
    );
};

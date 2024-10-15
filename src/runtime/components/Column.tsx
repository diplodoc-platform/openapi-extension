import React, {CSSProperties, PropsWithChildren} from 'react';

import {yfmSandbox} from '../../plugin/constants';

export const Column: React.FC<
    PropsWithChildren & {
        className?: string;
        gap?: number;
        minWidth?: number | string;
    style?: CSSProperties;
    }
> = ({className, gap = 20, children, minWidth, style: styleFromProps}) => {
    const style: CSSProperties = {
        ...styleFromProps,
        minWidth,
        gap: gap + 'px',
    };

    return (
        <div className={yfmSandbox('column', className)} style={style}>
            {children}
        </div>
    );
};

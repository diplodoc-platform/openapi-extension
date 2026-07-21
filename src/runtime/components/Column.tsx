import type {FC, ReactNode} from 'react';

import {yfmSandbox} from '../../plugin/constants';

export interface ColumnProps {
    className?: string;
    gap?: number;
    minWidth?: number;
    children?: ReactNode;
}

export const Column: FC<ColumnProps> = (props) => {
    const {className, gap = 20, children, minWidth} = props;

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

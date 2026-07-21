import type {FC} from 'react';

import {Loader as LoaderBase} from '@gravity-ui/uikit';

import {yfmSandbox} from '../../plugin/constants';

export const Loader: FC = () => {
    return (
        <div className={yfmSandbox('loader-container')}>
            <LoaderBase />
        </div>
    );
};

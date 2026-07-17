import type {ErrorState} from '../types';
import type {FC} from 'react';

import {Card, Text} from '@gravity-ui/uikit';

import {Text as TextEnum, possibleReasonsFailToFetch, yfmSandbox} from '../../plugin/constants';

import {Column} from '.';

export const ErrorPart: FC<ErrorState> = (props) => {
    const {message} = props;

    return (
        <Column>
            <Text variant="header-1">{TextEnum.RESPONSE_ERROR_SECTION_TITLE}</Text>
            <Card theme="danger" type="container" view="filled" className={yfmSandbox('card')}>
                <Text variant="code-2" className={yfmSandbox('card-text')}>
                    {message} <br />
                    Possible Reasons:
                    <ul className={yfmSandbox('possible-reasons')}>
                        {possibleReasonsFailToFetch.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </Text>
            </Card>
        </Column>
    );
};

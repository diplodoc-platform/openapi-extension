import React, {useEffect, useState} from 'react';
import {Card, ClipboardButton, Text} from '@gravity-ui/uikit';

import type {ResponseState} from '../types';
import {Text as TextEnum, yfmSandbox} from '../../plugin/constants';
import {Column} from '.';

export const Response: React.FC<{
    response: ResponseState;
}> = ({response}) => {
    const {url, status, file, text} = response;

    const [fileUrl, setFileUrl] = useState<string | null>(null);

    useEffect(() => {
        if (file) {
            setFileUrl(window.URL.createObjectURL(file.blob));
        }

        return () => {
            if (fileUrl) {
                window.URL.revokeObjectURL(fileUrl);
            }
        };
    }, [file]);

    return (
        <Column gap={10}>
            <Text variant="header-2">{TextEnum.RESPONSE_SECTION_TITLE}</Text>
            <div>
                <Text variant="subheader-2" as="div">
                    {TextEnum.RESPONSE_STATUS_LABEL}:
                </Text>
                <Text variant="body-2" as="div">
                    {status}
                </Text>
            </div>
            <div>
                <Text variant="subheader-2" as="div">
                    {TextEnum.URL_VALUE_LABEL}:
                </Text>
                <Text variant="body-2" as="div">
                    {url}
                </Text>
            </div>
            {text !== undefined && (
                <div>
                    <Text variant="subheader-2">{TextEnum.RESPONSE_BODY_LABEL}:</Text>
                    <div className={yfmSandbox('card-wrapper')}>
                        <Card
                            theme="info"
                            type="container"
                            view="filled"
                            className={yfmSandbox('card')}
                        >
                            <Text variant="code-2" className={yfmSandbox('card-text')}>
                                <pre className={yfmSandbox('pre')}>{text}</pre>
                            </Text>
                        </Card>
                        <ClipboardButton
                            size={'m'}
                            text={text}
                            className={yfmSandbox('clipboard-button')}
                        />
                    </div>
                </div>
            )}
            {file && fileUrl && (
                <div>
                    <Text variant="subheader-2" as="div">
                        {TextEnum.RESPONSE_FILE_LABEL}:
                    </Text>
                    <Text variant="body-2" as="div">
                        <a href={fileUrl} download={file.name} data-router="off">
                            {file.name}
                        </a>
                    </Text>
                </div>
            )}
        </Column>
    );
};

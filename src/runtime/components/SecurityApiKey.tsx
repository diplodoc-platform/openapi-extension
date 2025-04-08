import React, {useState} from 'react';
import {Button, Col, Flex, Row, Text, TextArea} from '@gravity-ui/uikit';

import {V3SecurityApiKey} from '../../includer/models';
import {MapperNames} from '../../plugin/constants';

type SecurityApiKeyProps = V3SecurityApiKey & {
    close: () => void;
    initialValue: string;
    setAuth: (params: {type: 'apiKey'; value: string}) => void;
};

export function SecurityApiKey({
    in: inFromProps,
    name,
    close,
    initialValue,
    setAuth,
}: SecurityApiKeyProps) {
    const [value, setValue] = useState<string>(calcInitialValue(initialValue));

    return (
        <Flex direction="column" width="100%" gap={4}>
            <Flex direction="column" width="100%" gap={4}>
                <Row space={1}>
                    <Col s={2}>
                        <Text variant="subheader-1">In</Text>
                    </Col>
                    <Col s={10}>
                        <Text variant="body-1">{MapperNames[inFromProps] ?? inFromProps}</Text>
                    </Col>
                </Row>

                <Row space={1}>
                    <Col s={2}>
                        <Text variant="subheader-1">Name</Text>
                    </Col>
                    <Col s={10}>
                        <Text variant="body-1">{name}</Text>
                    </Col>
                </Row>

                <Row space={1}>
                    <Col s={2}>
                        <Text variant="subheader-1">Key</Text>
                    </Col>
                    <Col s={10}>
                        <TextArea
                            rows={2}
                            value={value}
                            onUpdate={setValue}
                            onFocus={() => {
                                setValue('');
                            }}
                        />
                    </Col>
                </Row>
            </Flex>
            <Flex justifyContent="end" spacing={{mb: 4}} gap={4}>
                <Button size="l" view="flat" onClick={close}>
                    Cancel
                </Button>
                <Button
                    size="l"
                    view="action"
                    onClick={() => {
                        setAuth({type: 'apiKey', value});
                        close();
                    }}
                >
                    Save
                </Button>
            </Flex>
        </Flex>
    );
}

function calcInitialValue(value: string) {
    if (value) {
        return value.length > 6
            ? `${value.slice(0, 3)}${'*'.repeat(value.length - 6)}${value.slice(-3)}`
            : '*'.repeat(value.length);
    } else {
        return '';
    }
}

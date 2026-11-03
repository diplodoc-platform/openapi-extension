import type {V3SecurityApiKey} from '../../includer/models';

import {type FC, useState} from 'react';
import {Button, Col, Flex, Row, Text, TextArea} from '@gravity-ui/uikit';

import {MapperNames, yfmSandbox} from '../../plugin/constants';

type SecurityApiKeyProps = V3SecurityApiKey & {
    close: () => void;
    initialValue: string;
    setAuth: (params: {type: 'apiKey'; value: string}) => void;
};

export const SecurityApiKey: FC<SecurityApiKeyProps> = (props) => {
    const {in: inFromProps, name, close, initialValue, setAuth} = props;
    const [value, setValue] = useState<string>(calcInitialValue(initialValue));

    return (
        <Flex direction="column" width="100%" gap="spacing-4">
            <Flex direction="column" width="100%" gap="spacing-4">
                <Row className={yfmSandbox('security-row')}>
                    <Col size={2}>
                        <Text variant="subheader-1">In</Text>
                    </Col>
                    <Col size={10}>
                        <Text variant="body-1">{MapperNames[inFromProps] ?? inFromProps}</Text>
                    </Col>
                </Row>

                <Row className={yfmSandbox('security-row')}>
                    <Col size={2}>
                        <Text variant="subheader-1">Name</Text>
                    </Col>
                    <Col size={10}>
                        <Text variant="body-1">{name}</Text>
                    </Col>
                </Row>

                <Row className={yfmSandbox('security-row')}>
                    <Col size={2}>
                        <Text variant="subheader-1">Key</Text>
                    </Col>
                    <Col size={10}>
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
            <Flex justifyContent="end" marginBlockEnd="spacing-4" gap="spacing-4">
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
};

function calcInitialValue(value: string) {
    if (value) {
        return value.length > 6
            ? `${value.slice(0, 3)}${'*'.repeat(value.length - 6)}${value.slice(-3)}`
            : '*'.repeat(value.length);
    } else {
        return '';
    }
}

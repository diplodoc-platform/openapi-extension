import type {V3SecurityOAuthInline} from '../../includer/models';

import {type FC, useState} from 'react';
import {Button, Col, Flex, Row, Text, TextArea} from '@gravity-ui/uikit';

import {yfmSandbox} from '../../plugin/constants';

type SecurityOAuthInlineProps = V3SecurityOAuthInline & {
    close: () => void;
    initialValue: string;
    setAuth: (params: {type: 'oauth2'; value: string}) => void;
};

export const SecurityOAuthInline: FC<SecurityOAuthInlineProps> = (props) => {
    const {close, initialValue, setAuth} = props;
    const [value, setValue] = useState(calcInitialValue(initialValue));

    return (
        <Flex direction="column" width="100%" gap="spacing-4">
            <Flex direction="column" width="100%" gap="spacing-4">
                <Row className={yfmSandbox('security-row')}>
                    <Col size={2}>
                        <Text variant="subheader-1">In</Text>
                    </Col>
                    <Col size={10}>
                        <Text variant="body-1">Header</Text>
                    </Col>
                </Row>
                <Row className={yfmSandbox('security-row')}>
                    <Col size={2}>
                        <Text variant="subheader-1">Name</Text>
                    </Col>
                    <Col size={10}>
                        <Text variant="body-1">Authorization</Text>
                    </Col>
                </Row>
                <Row className={yfmSandbox('security-row')}>
                    <Col size={2}>
                        <Text variant="subheader-1">Value</Text>
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
                        setAuth({type: 'oauth2', value});
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

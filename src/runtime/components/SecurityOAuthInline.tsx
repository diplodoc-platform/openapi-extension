import type {V3SecurityOAuthInline} from '../../includer/models';

import React, {useState} from 'react';
import {Button, Col, Flex, Row, Text, TextArea} from '@gravity-ui/uikit';

type SecurityOAuthInlineProps = V3SecurityOAuthInline & {
    close: () => void;
    initialValue: string;
    setAuth: (params: {type: 'oauth2'; value: string}) => void;
};

export const SecurityOAuthInline = ({close, initialValue, setAuth}: SecurityOAuthInlineProps) => {
    const [value, setValue] = useState(calcInitialValue(initialValue));
    return (
        <Flex direction="column" width="100%" gap={4}>
            <Flex direction="column" width="100%" gap={4}>
                <Row space={1}>
                    <Col s={2}>
                        <Text variant="subheader-1">In</Text>
                    </Col>
                    <Col s={10}>
                        <Text variant="body-1">Header</Text>
                    </Col>
                </Row>
                <Row space={1}>
                    <Col s={2}>
                        <Text variant="subheader-1">Name</Text>
                    </Col>
                    <Col s={10}>
                        <Text variant="body-1">Authorization</Text>
                    </Col>
                </Row>
                <Row space={1}>
                    <Col s={2}>
                        <Text variant="subheader-1">Value</Text>
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

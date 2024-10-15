
import React, {useState} from 'react';
import {Button, Col, Icon, Row, Text, TextInput} from '@gravity-ui/uikit';
import {Check, TrashBin} from '@gravity-ui/icons'

import {V3SecurityApiKey} from "../../includer/models";
import {deleteTempValue, getTempValue, setTempValue} from "../utils";

import {Column} from '.';

export const SecurityApiKey = ({type, in: inFromProps, name, onClose}: V3SecurityApiKey & {onClose: () => void}) => {
    const [value, setValue] = useState('');
    const [isLogged, setLogged] = useState(Boolean(getTempValue(type)));

    return <Column gap={12}>
        <Column gap={5}>
            <Text variant="body-1">In: {inFromProps}</Text>
            <Text variant="body-1">Name: {name}</Text>
                {isLogged ? <Row space={1}>
                    <Col s={11}><Text variant="body-1">Key: ***</Text></Col>
                    <Col>
                        <Button
                            style={{marginLeft: 'auto'}}
                            onClick={() => {
                                deleteTempValue(type);
                                setLogged(false);
                            }}><Icon data={TrashBin} /></Button>
                    </Col>
                </Row> : <>
                    <Text variant="body-1">Key:</Text>
                    <Row space={1}>
                        <Col s={11}>
                            <TextInput
                                value={value}
                                onUpdate={setValue} />
                        </Col>
                        <Col>
                            {Boolean(value) && <Button
                                style={{marginLeft: 'auto'}}
                                onClick={() => {
                                    setTempValue(type, value);
                                    setLogged(true);
                                    onClose();
                                }}
                                view="action"
                            ><Icon data={Check}/></Button>}
                        </Col>
                    </Row>
                </>}
        </Column>
    </Column>;
}

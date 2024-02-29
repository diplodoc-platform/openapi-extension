import React, {useCallback, useRef, useState} from 'react';
import {Button} from '@gravity-ui/uikit';
import {Column} from './Column';

const isFile = (item: undefined | File): item is File => item !== undefined;

type Props = {
    onChange(value: File[]): void;
};

type IndexedFiles = Record<number, File | undefined>;

export const FileInputArray: React.FC<Props> = ({onChange}) => {
    const ref = useRef(1);
    const [inputs, setInputs] = useState<IndexedFiles>({});

    const createOnChange = useCallback(
        (idWithChange: number): React.ChangeEventHandler<HTMLInputElement> =>
            (event) => {
                setInputs((oldState) => {
                    const file = event.target.files?.[0];
                    const nextState = {...oldState, [idWithChange]: file};

                    onChange(Object.values(nextState).filter(isFile));

                    return nextState;
                });
            },
        [setInputs],
    );

    const onAdd = useCallback(() => {
        setInputs((prevState) => ({...prevState, [ref.current++]: undefined}));
    }, [setInputs, ref]);

    const createOnRemove = useCallback(
        (idForRemove: number) => () => {
            setInputs((oldState) => {
                delete oldState[idForRemove];

                return oldState;
            });
        },
        [setInputs],
    );

    return (
        <Column gap={3}>
            {Object.keys(inputs).map((id, index) => {
                return (
                    <div key={id}>
                        <input type="file" onChange={createOnChange(index)} />
                        {Boolean(index) && (
                            <Button
                                view="normal"
                                size="s"
                                type="button"
                                onClick={createOnRemove(Number(id))}
                            >
                                -
                            </Button>
                        )}
                    </div>
                );
            })}
            <div>
                <Button view="normal" size="s" type="button" onClick={onAdd}>
                    Add file
                </Button>
            </div>
        </Column>
    );
};

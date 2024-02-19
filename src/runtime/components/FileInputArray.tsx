import React, {useCallback, useRef, useState} from 'react';
import {Button} from '@gravity-ui/uikit';
import {Column} from './Column';

export const FileInputArray = ({onChange}: {onChange: (value: File[]) => void}) => {
    const ref = useRef(1);
    const [array, setArray] = useState<Array< {id: number; value: undefined | File}>>([{id: 0, value: undefined}]);

    const createOnChange = useCallback((idWithChange: number): React.ChangeEventHandler<HTMLInputElement> => (event) => {
        setArray(prevArray => {
            const newArray = prevArray
                .map(({id, value}) =>
                    id === idWithChange
                        ? {id, value: event.target.files?.[0]}
                        : {id, value}
                );
            onChange(newArray.map(({value}) => value).filter(isFile));
            return newArray;
        });
    }, [setArray]);

    const onAdd = useCallback(() => {
        setArray(prevState => [...prevState, {id: ref.current++, value: undefined}]);
    }, [setArray, ref]);

    const createOnRemove = useCallback((idForRemove: number) => () => {
        setArray(prevArray => {
            return prevArray.filter(({id}) => id !== idForRemove);
        });
    }, [setArray]);

    return <Column gap={3}>
        {array.map(({id}, index) => {
            return <div key={id}>
                <input type="file" onChange={createOnChange(index)} />
                {Boolean(index) && <Button view="normal" size="s" type="button" onClick={createOnRemove(id)}>-</Button>}
            </div>
        })}
        <div>
            <Button view="normal" size="s" type="button" onClick={onAdd}>Add file</Button>
        </div>
    </Column>
};

const isFile = (item: undefined | File): item is File => item !== undefined;

import React from 'react';
import {Text, TextArea} from '@gravity-ui/uikit';
import {JSONSchema6Definition} from 'json-schema';

import {Text as TextEnum} from '../../plugin/constants';
import {OpenJSONSchema} from '../../includer/models';

import type {Field, Nullable} from '../types';
import {Column} from './Column';
import {FileInputArray} from './FileInputArray';

type Props = {
    example: Nullable<string>;
    schema: OpenJSONSchema | undefined;
    bodyType?: string;
};

type State = {
    error: Nullable<string>;
};

export class BodyFormData extends React.Component<Props, State> implements Field<FormData, string> {
    private formValue: FormData;
    constructor(props: Props) {
        super(props);
        this.formValue = new FormData();

        this.state = {
            error: null,
        };
    }

    renderInput(key: string) {
        return (
            <Column gap={2}>
                <Text variant="body-2">{key}:</Text>
                <input
                    type="file"
                    onChange={(event) => {
                        this.createOnChange(key)(event.target.files?.[0]);
                    }}
                />
            </Column>
        );
    }

    renderFileInput(key: string) {
        return (
            <Column gap={2}>
                <Text variant="body-2">{key}:</Text>
                <FileInputArray onChange={this.createOnChange(key)} />
            </Column>
        );
    }

    renderTextArea(key: string, property: OpenJSONSchema) {
        const example = JSON.parse(this.props.example ?? '{}');

        const exampleValue =
            property.type === 'string' ? example[key] : JSON.stringify(example[key], null, 2);

        const rows = property.type === 'string' ? 1 : 3;

        return (
            <Column gap={2}>
                <Text variant="body-2">{key}:</Text>
                <TextArea
                    onUpdate={this.createOnChange(key)}
                    defaultValue={exampleValue}
                    rows={rows}
                />
            </Column>
        );
    }

    renderProperty(key: string, property: JSONSchema6Definition) {
        if (typeof property !== 'object') {
            return null;
        }

        if (property.type === 'string' && property.format === 'binary') {
            return this.renderInput(key);
        }

        const {items} = property;

        if (property.type === 'array' && typeof items === 'object' && !Array.isArray(items)) {
            const {format, type} = items;

            if (type === 'string' && format === 'binary') {
                return this.renderFileInput(key);
            }
            // TODO: string array
        }

        return this.renderTextArea(key, property);
    }

    render() {
        const {properties, type} = this.props.schema ?? {};

        if (type !== 'object' || !properties || this.props.bodyType !== 'multipart/form-data') {
            return null;
        }

        const entries = Object.entries(properties);

        return (
            <Column gap={10}>
                <Text variant="header-1">{TextEnum.BODY_INPUT_LABEL}</Text>
                {entries.map(([key, property]) => this.renderProperty(key, property))}
            </Column>
        );
    }

    createOnChange(fieldName: string) {
        return (newValue: string | undefined | File | File[]) => {
            if (!newValue) {
                this.formValue.delete(fieldName);

                return;
            }

            if (typeof newValue === 'string') {
                this.formValue.set(fieldName, newValue);

                return;
            }

            if (Array.isArray(newValue)) {
                this.formValue.delete(fieldName);
                for (const item of newValue) {
                    this.formValue.append(fieldName, item);
                }

                return;
            }

            this.formValue.set(fieldName, newValue);
        };
    }

    validate() {
        const error = this.isRequired && !this.value ? 'Required' : undefined;

        this.setState({error});

        return error;
    }

    value() {
        return this.formValue;
    }

    private get isRequired() {
        return this.props.example !== undefined && this.props.example !== null;
    }
}

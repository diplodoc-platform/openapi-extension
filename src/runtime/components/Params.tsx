import type {OpenAPIV3} from 'openapi-types';
import type {Primitive} from '../../includer/models';
import type {Field, Nullable} from '../types';

import React from 'react';
import {Text, TextInput} from '@gravity-ui/uikit';

import {merge} from '../utils';

import {Column} from './Column';

function validate(
    params: OpenAPIV3.ParameterObject[] | undefined,
    values: Record<string, Nullable<Primitive>>,
): Nullable<Record<string, string>> {
    const errors = merge(params || [], (param) =>
        param.required && !values[param.name] ? {[param.name]: 'Required'} : undefined,
    );

    return Object.keys(errors).length ? errors : undefined;
}

export class Params
    extends React.Component<
        {
            title: string;
            params?: Array<OpenAPIV3.ParameterObject & {placeholder?: string}>;
        },
        {
            values: Record<string, Nullable<Primitive>>;
            errors: Nullable<Record<string, string>>;
        }
    >
    implements Field<Record<string, Nullable<Primitive>>, Record<string, string>>
{
    private onchange: Record<string, (value: string) => void>;

    constructor(props: {
        title: string;
        params?: Array<OpenAPIV3.ParameterObject & {placeholder?: string}>;
    }) {
        super(props);

        this.state = {
            errors: undefined,
            values: merge(props.params || [], (param) => ({
                [param.name]: param.example ?? '',
            })),
        };

        this.onchange = merge(props.params || [], (param) => ({
            [param.name]: this.createOnChange(param.name),
        }));
    }

    render() {
        const {params, title} = this.props;
        const {values, errors} = this.state;

        if (!params || !params.length) {
            return null;
        }

        return (
            <Column gap={15}>
                <Text variant="header-1">{title}</Text>
                <Column gap={10}>
                    {params.map((param, index) => (
                        <Column gap={5} key={index}>
                            <Text variant="body-2">
                                {param.name}
                                {Boolean(param.required) && (
                                    <Text variant="body-2" color="danger">
                                        *
                                    </Text>
                                )}
                                :
                            </Text>

                            <TextInput
                                value={values[param.name] as string}
                                name={param.name}
                                placeholder={param.placeholder}
                                onUpdate={this.onchange[param.name]}
                                error={(errors && errors[param.name]) || false}
                            />
                        </Column>
                    ))}
                </Column>
            </Column>
        );
    }

    validate() {
        const errors = validate(this.props.params, this.state.values);

        this.setState({errors});

        return errors;
    }

    value() {
        return this.state.values;
    }

    private createOnChange = (paramName: string) => (value: string) => {
        this.setState((prevState) => ({
            errors: undefined,
            values: {
                ...prevState.values,
                [paramName]: value,
            },
        }));
    };
}

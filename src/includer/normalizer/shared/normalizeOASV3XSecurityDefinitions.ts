/* eslint-disable camelcase */
import {OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {isOASV3XReferenceObject} from './isOASV3XReferenceObject';
import {Security} from '../../models';

type OASV3XSpec = OpenAPIV3.Document | OpenAPIV3_1.Document;
type OASV3XSecurityScheme = OpenAPIV3.SecuritySchemeObject | OpenAPIV3_1.SecuritySchemeObject;

const definitionIsSecurityScheme = (
    objectEntry: [string, object],
): objectEntry is [string, OASV3XSecurityScheme] => {
    const [, maybeScheme] = objectEntry;

    return !isOASV3XReferenceObject(maybeScheme);
};

export const normalizeOASV3XSecurityDefinitions = (spec: OASV3XSpec) =>
    Object.fromEntries(
        Object.entries(spec.components?.securitySchemes ?? {})
            .filter(definitionIsSecurityScheme)
            .map(([schemeName, {type, description}]) => {
                const normalizedScheme: Security = {
                    type,
                    description: description ?? '',
                };

                return [schemeName, normalizedScheme];
            }),
    );

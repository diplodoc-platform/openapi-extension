/* eslint-disable camelcase */
import {OpenAPIV3, OpenAPIV3_1} from 'openapi-types';

type OASV3XReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject;

export const isOASV3XReferenceObject = (
    maybeReferenceObject: object,
): maybeReferenceObject is OASV3XReferenceObject =>
    Object.prototype.hasOwnProperty.call(maybeReferenceObject, '$ref');

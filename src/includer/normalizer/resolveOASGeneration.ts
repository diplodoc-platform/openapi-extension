import {OpenAPI, OpenAPIV2} from 'openapi-types';

export enum OASVersionGeneration {
    V2_0,
    V3_0,
    V3_1,
}

// this is probably a bit verbose, but `swagger-parser` we use has a similar bit of code
// https://github.com/APIDevTools/swagger-parser/blob/1d9776e2445c3dfc62cf2cd63a33f3449e5ed9fa/lib/index.js#L11
const versionMap = {
    '2.0': OASVersionGeneration.V2_0,
    '3.0.0': OASVersionGeneration.V3_0,
    '3.0.1': OASVersionGeneration.V3_0,
    '3.0.2': OASVersionGeneration.V3_0,
    '3.0.3': OASVersionGeneration.V3_0,
    '3.1.0': OASVersionGeneration.V3_1,
} satisfies Record<string, OASVersionGeneration>;

const isLegacySwaggerSpec = (spec: OpenAPI.Document): spec is OpenAPIV2.Document =>
    Object.prototype.hasOwnProperty.call(spec, 'swagger');

export const resolveOASVersionGeneration = (spec: OpenAPI.Document): OASVersionGeneration => {
    const resolvedVersion = isLegacySwaggerSpec(spec) ? spec.swagger : spec.openapi;

    if (resolvedVersion in versionMap) {
        return versionMap[resolvedVersion as keyof typeof versionMap];
    }

    // technically, this throw is pointless, since `swagger-parser` already should have this checked beforehand
    throw new TypeError(`Unsupported spec version: ${resolvedVersion}`);
};

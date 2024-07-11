/* eslint-disable camelcase */
import {OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {ISpecNormalizationStrategies, NormalizedSecurityDefinitions} from './strategies/defs';
import {OASVersionGeneration, resolveOASVersionGeneration} from './resolveOASGeneration';
import {oasV2NormalizationStrategies} from './strategies/2.0';
import {oasV3NormalizationStrategies} from './strategies/3.0';
import {oasV31NormalizationStrategies} from './strategies/3.1';

export type NormalizedSpec = {
    securityDefinitions: NormalizedSecurityDefinitions;
};

type GenerationToDocumentType = {
    [OASVersionGeneration.V2_0]: OpenAPIV2.Document;
    [OASVersionGeneration.V3_0]: OpenAPIV3.Document;
    [OASVersionGeneration.V3_1]: OpenAPIV3_1.Document;
};

type GenerationToStrategyMapping = {
    [Gen in OASVersionGeneration]: ISpecNormalizationStrategies<GenerationToDocumentType[Gen]>;
};

const generationToStrategyMap: GenerationToStrategyMapping = {
    [OASVersionGeneration.V2_0]: oasV2NormalizationStrategies,
    [OASVersionGeneration.V3_0]: oasV3NormalizationStrategies,
    [OASVersionGeneration.V3_1]: oasV31NormalizationStrategies,
};

// This is a stub for now
// This should probably consist of all the custom schema types defined in `models.ts`
// The idea is to normalize `OpenAPI.Document` so that it provides a consistent
// way of rendering stuff we actually care about, regardless of the spec version
export const normalize = (spec: OpenAPI.Document): NormalizedSpec => {
    const specGeneration = resolveOASVersionGeneration(spec);
    const strategies = generationToStrategyMap[specGeneration] as ISpecNormalizationStrategies;

    return {
        securityDefinitions: strategies.normalizeSecurityDefinitions(spec),
    };
};

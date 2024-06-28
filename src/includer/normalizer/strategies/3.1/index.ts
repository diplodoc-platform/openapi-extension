/* eslint-disable camelcase */
import {OpenAPIV3_1} from 'openapi-types';
import {ISpecNormalizationStrategies} from '../defs';
import {normalizeOASV3XSecurityDefinitions} from '../../shared/normalizeOASV3XSecurityDefinitions';

export const oasV31NormalizationStrategies: ISpecNormalizationStrategies<OpenAPIV3_1.Document> = {
    normalizeSecurityDefinitions: normalizeOASV3XSecurityDefinitions,
};

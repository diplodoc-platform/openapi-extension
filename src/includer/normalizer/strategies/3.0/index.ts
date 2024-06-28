import {OpenAPIV3} from 'openapi-types';
import {ISpecNormalizationStrategies} from '../defs';
import {normalizeOASV3XSecurityDefinitions} from '../../shared/normalizeOASV3XSecurityDefinitions';

export const oasV3NormalizationStrategies: ISpecNormalizationStrategies<OpenAPIV3.Document> = {
    normalizeSecurityDefinitions: normalizeOASV3XSecurityDefinitions,
};

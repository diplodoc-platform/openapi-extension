import {OpenAPI} from 'openapi-types';
import {Security} from '../../models';

export type NormalizedSecurityDefinitions = Record<string, Security>;

export type ISpecNormalizationStrategies<ConcreteSpec extends OpenAPI.Document = OpenAPI.Document> =
    {
        normalizeSecurityDefinitions: (spec: ConcreteSpec) => NormalizedSecurityDefinitions;
    };

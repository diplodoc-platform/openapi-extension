import {OpenAPIV2} from 'openapi-types';
import {ISpecNormalizationStrategies} from '../defs';
import {Security} from '../../../models';

export const oasV2NormalizationStrategies: ISpecNormalizationStrategies<OpenAPIV2.Document> = {
    normalizeSecurityDefinitions: (spec) =>
        Object.fromEntries(
            Object.entries(spec.securityDefinitions ?? {}).map(
                ([schemeName, {type, description}]) => {
                    const normalizedScheme: Security = {
                        type,
                        description: description ?? '',
                    };

                    return [schemeName, normalizedScheme];
                },
            ),
        ),
};

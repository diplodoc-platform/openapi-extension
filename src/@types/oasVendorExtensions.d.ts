import 'openapi-types';

declare module 'openapi-types' {
    namespace OpenAPIV3 {
        interface BaseSchemaObject {
            'x-hidden'?: boolean;
        }

        interface ParameterBaseObject {
            'x-hidden'?: boolean;
        }
    }
}

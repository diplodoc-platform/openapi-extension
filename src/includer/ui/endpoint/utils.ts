const primitiveTypes = new Set(['string', 'number', 'integer', 'boolean', 'null']);

export function isPrimitiveType(
    schema: {type?: unknown} | null | undefined,
): schema is {type: 'string' | 'number' | 'integer' | 'boolean' | 'null'} {
    return Boolean(schema && typeof schema.type === 'string' && primitiveTypes.has(schema.type));
}

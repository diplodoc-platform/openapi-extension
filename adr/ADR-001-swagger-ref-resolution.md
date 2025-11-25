# ADR-001: Disable automatic JSON Schema `$ref` resolution in the Swagger parser

## Status
Accepted

## Context
Our Swagger parser used to eagerly resolve every `$ref`, including the ones that belong to the JSON Schema portion of an OpenAPI document. After the parser expanded a reference, the rendering layer had to reconstruct it back into a standalone entity so we could present it as a separate table/cut block rather than an inline object. This round trip was brittle: we lost original identifiers, broke reusability, and risked mismatches between documentation and the source schema.

## Decision
We forbid the Swagger parser from auto-resolving `$ref` definitions that live in the JSON Schema section. References are now passed through untouched, and any unfolding happens explicitly inside the rendering/normalization layer when needed.

## Consequences
✅ Preserve original entity identifiers, allowing us to render them as independent blocks.  
✅ No need to “re-fold” `$ref` or rely on heuristics to rebuild the links.  
✅ Easier to map documentation output back to the source schema.  
❌ Rendering/normalization must explicitly call `resolveRef` when it truly needs to inspect a referenced schema.

## Alternatives Considered
1. Keep resolving all `$ref` in the parser and store extra metadata to reconstruct references later.  
   - Drawback: dramatically complicates the intermediate representation and duplicates schema data.  
2. Perform partial resolution using an allowlist/denylist.  
   - Drawback: hard to maintain and easy to miss new scenarios.



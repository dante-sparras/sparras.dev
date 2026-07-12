/// <reference types="bun" />

/**
 * Pulls Bun runtime + `bun:test` module types into the TS project.
 * Required for IntelliSense on `import … from "bun:test"` (see @types/bun).
 * Does not replace Next/React/DOM types — triple-slash *adds* bun-types.
 */

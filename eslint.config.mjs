// @ts-check

import eslint from '@eslint/js';
import angular from 'angular-eslint';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { importX } from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: [
            'eslint.config.mjs',
            '**/*.spec.ts',
        ],
    },
    {
        files: ['**/*.ts'],
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.strictTypeChecked,
            ...tseslint.configs.stylisticTypeChecked,
            importX.flatConfigs.recommended,
            importX.flatConfigs.typescript,
            ...angular.configs.tsRecommended,
        ],
        processor: angular.processInlineTemplates,
        languageOptions: {
            parserOptions: {
                tsconfigRootDir: import.meta.dirname,
                projectService: true,
            },
        },
        settings: {
            'import-x': importX,
            'import-x/resolver-next': [
                createTypeScriptImportResolver({
                    alwaysTryTypes: true, // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
                }),
            ],
        },

        rules: {
            "no-underscore-dangle": "off",
            "prefer-arrow/prefer-arrow-functions": "off",
            "newline-after-description": "off",

            "brace-style": ["error", "1tbs", {
                allowSingleLine: true,
            }],

            "no-constant-condition": ["error", {
                checkLoops: false,
            }],

            // "@typescript-eslint/no-unnecessary-boolean-literal-compare": "off", // by default is "error" but needs strict-null-checks
            // "@typescript-eslint/no-non-null-assertion": "off", // by default is "error".  Remove when strict-null-checks are enabled
            "@typescript-eslint/consistent-type-definitions": "error",
            "@typescript-eslint/no-unnecessary-condition": ["error", { // needs strict-null-checks
                allowConstantLoopConditions: true,
            }],
            "@typescript-eslint/no-confusing-void-expression": ["error", {
                ignoreArrowShorthand: true,
            }],
            "@typescript-eslint/naming-convention": ["error", {
                selector: "enumMember",
                format: null,
            }],
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/restrict-template-expressions": ["error", {
                allowNumber: true,
            }],
            "@typescript-eslint/no-invalid-void-type": ["warn", {
                allowAsThisParameter: true,
            }],
            "@typescript-eslint/prefer-nullish-coalescing": ["off", { // was "warn" but needs strict-null-checks
                ignoreIfStatements: true,
                ignoreTernaryTests: true,
            }],
            "@typescript-eslint/prefer-optional-chain": "off",
            "@typescript-eslint/no-empty-object-type": ["warn", {
                allowInterfaces: 'always',
            }],

            "@typescript-eslint/member-ordering": ["warn", {
                default: [
                    "signature",
                    "call-signature",
                    "public-static-field",
                    "protected-static-field",
                    "private-static-field",
                    "public-decorated-field",
                    "protected-decorated-field",
                    "private-decorated-field",
                    "public-instance-field",
                    "protected-instance-field",
                    "private-instance-field",
                    "public-abstract-field",
                    "protected-abstract-field",
                    "public-field",
                    "protected-field",
                    "private-field",
                    "private-field",
                    "static-field",
                    "instance-field",
                    "abstract-field",
                    "decorated-field",
                    "field",
                    "static-initialization",
                    "public-constructor",
                    "protected-constructor",
                    "private-constructor",
                    "constructor",
                    ["public-static-get", "public-static-set"],
                    ["protected-static-get", "protected-static-set"],
                    ["private-static-get", "private-static-set"],
                    ["public-decorated-get", "public-decorated-set"],
                    ["protected-decorated-get", "protected-decorated-set"],
                    ["private-decorated-get", "private-decorated-set"],
                    ["public-instance-get", "public-instance-set"],
                    ["protected-instance-get", "protected-instance-set"],
                    ["private-instance-get", "private-instance-set"],
                    ["public-abstract-get", "public-abstract-set"],
                    ["protected-abstract-get", "protected-abstract-set"],
                    ["public-get", "public-set"],
                    ["protected-get", "protected-set"],
                    ["private-get", "private-set"],
                    ["static-get", "static-set"],
                    ["instance-get", "instance-set"],
                    ["abstract-get", "abstract-set"],
                    ["decorated-get", "decorated-set"],
                    ["get", "set"],
                    "public-static-method",
                    "protected-static-method",
                    "private-static-method",
                    "public-decorated-method",
                    "protected-decorated-method",
                    "private-decorated-method",
                    "public-instance-method",
                    "protected-instance-method",
                    "private-instance-method",
                    "public-abstract-method",
                    "protected-abstract-method",
                    "public-method",
                    "protected-method",
                    "private-method",
                    "static-method",
                    "instance-method",
                    "abstract-method",
                    "decorated-method",
                    "method",
                ],
            }],

            "@typescript-eslint/non-nullable-type-assertion-style": "off",
            "@typescript-eslint/dot-notation": "off",

            "@typescript-eslint/explicit-member-accessibility": ["off", {
                accessibility: "explicit",
            }],

            "@typescript-eslint/no-namespace": "off",
            "@typescript-eslint/prefer-for-of": "off",

            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": ["error", {
                args: "none",
                varsIgnorePattern: "[iI]gnored",
                argsIgnorePattern: "^_",
            }],

            "no-shadow": "off",
            "@typescript-eslint/no-shadow": ["error", {
                ignoreTypeValueShadow: true,
            }],

            "no-return-await": "off",
            "@typescript-eslint/return-await": "error",

            "import-x/no-cycle": ["error"],

            "@angular-eslint/prefer-standalone": "off", // remove when converted to standalone components
            "@angular-eslint/component-class-suffix": "off", // fix after upgrade to Angular 20
        },
    },
    {
        files: ['**/*.html'],
        extends: [
            ...angular.configs.templateRecommended,
            ...angular.configs.templateAccessibility,
        ],
        rules: {
        },
    },
);

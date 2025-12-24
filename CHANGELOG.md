# Changelog

## [5.0.5](https://github.com/diplodoc-platform/openapi-extension/compare/v5.0.4...v5.0.5) (2025-12-24)


### Bug Fixes

* **config:** exclude build and esbuild directories from TypeScript compilation ([70f0434](https://github.com/diplodoc-platform/openapi-extension/commit/70f0434b191d4ca2f5197b9122b69b58cda0fba4))
* **schema:** prevent duplicate examples and description in combinator-based arrays ([ffa55bd](https://github.com/diplodoc-platform/openapi-extension/commit/ffa55bd018d382dda88e72558c91d8e798b3b98a))
* **schema:** render type labels in combinator variants ([4e7fefa](https://github.com/diplodoc-platform/openapi-extension/commit/4e7fefa93b20e5fadd293ee93f2aa45f9577418d))

## [5.0.4](https://github.com/diplodoc-platform/openapi-extension/compare/v5.0.3...v5.0.4) (2025-12-23)


### Bug Fixes

* Infer object and array types in normalizeSchema ([6e3185b](https://github.com/diplodoc-platform/openapi-extension/commit/6e3185b83a17a672ee09aac3b54006db71e43e9f))

## [5.0.3](https://github.com/diplodoc-platform/openapi-extension/compare/v5.0.2...v5.0.3) (2025-12-05)


### Bug Fixes

* Split main page rendering ([3fcdd2d](https://github.com/diplodoc-platform/openapi-extension/commit/3fcdd2de7ec89abeecfc7b2f5e54f57e66a24bc2))

## [5.0.2](https://github.com/diplodoc-platform/openapi-extension/compare/v5.0.1...v5.0.2) (2025-12-03)


### Bug Fixes

* Fix ref file loading ([6908624](https://github.com/diplodoc-platform/openapi-extension/commit/690862462f605c427f0d092af8298b7b391141e3))
* Fix transform autotitle resolfing ([e2511c3](https://github.com/diplodoc-platform/openapi-extension/commit/e2511c3bdad8456fd9c14a3a00ea0496f1000aac))

## [5.0.1](https://github.com/diplodoc-platform/openapi-extension/compare/v5.0.0...v5.0.1) (2025-12-03)


### Bug Fixes

* Normalize local $ref paths ([0bdfd39](https://github.com/diplodoc-platform/openapi-extension/commit/0bdfd3913aa93dfcbc14674ab0910a3ac0798cf0))

## [5.0.0](https://github.com/diplodoc-platform/openapi-extension/compare/v4.0.0...v5.0.0) (2025-12-03)


### ⚠ BREAKING CHANGES

* Replace json schema renderer

### chore

* trigger release 4.0.0 ([#109](https://github.com/diplodoc-platform/openapi-extension/issues/109)) ([eb7835b](https://github.com/diplodoc-platform/openapi-extension/commit/eb7835b83d30cf350b9a04dcf65f43b0d07dc7e3))
* Trigger release 5.0.0 ([#109](https://github.com/diplodoc-platform/openapi-extension/issues/109)) ([b0714f6](https://github.com/diplodoc-platform/openapi-extension/commit/b0714f6ce06e9675856bde2a38917c11cf935a03))


### Features

* Replace json schema renderer ([553d38f](https://github.com/diplodoc-platform/openapi-extension/commit/553d38f7b3bdf74461a922d6c475054ab68706c4))


### Bug Fixes

* Fix deps ([85c670d](https://github.com/diplodoc-platform/openapi-extension/commit/85c670de023a21fa96dce4be74d201e67bf618d5))
* Fix rendering shcema bugs ([de24461](https://github.com/diplodoc-platform/openapi-extension/commit/de24461ad8357243fbc1bb3245decfae35a51d4e))
* Fix sandbox empty security rendering ([eee6d22](https://github.com/diplodoc-platform/openapi-extension/commit/eee6d2271df6365af7a8a5d6d260bec39ab58a05))

## [4.0.0](https://github.com/diplodoc-platform/openapi-extension/compare/v3.1.0...v4.0.0) (2025-11-27)


### ⚠ BREAKING CHANGES

* updated to UIKit 7.26.0 ([#101](https://github.com/diplodoc-platform/openapi-extension/issues/101))

### Features

* updated to UIKit 7.26.0 ([#101](https://github.com/diplodoc-platform/openapi-extension/issues/101)) ([a7bebc9](https://github.com/diplodoc-platform/openapi-extension/commit/a7bebc91aaaa297a71d18ec6edcac0a2219f20b9))

## [3.1.0](https://github.com/diplodoc-platform/openapi-extension/compare/v3.0.0...v3.1.0) (2025-11-01)


### Features

* Render inline object info ([197be2e](https://github.com/diplodoc-platform/openapi-extension/commit/197be2edaad1a6058ccc5d2b3345a45318b7c1b9))

## [3.0.0](https://github.com/diplodoc-platform/openapi-extension/compare/v2.8.1...v3.0.0) (2025-10-13)


### ⚠ BREAKING CHANGES

* Remove old includer interface

### Features

* Filter readOnly/writeOnly props ([4b6fe82](https://github.com/diplodoc-platform/openapi-extension/commit/4b6fe82ca5997ebfd204ef4f496792ff5f688243))
* Remove old includer interface ([457ad7c](https://github.com/diplodoc-platform/openapi-extension/commit/457ad7cf52dc7c3d207c3eff87688ab95e438a85))


### Bug Fixes

* Fix additionalProps render ([9694680](https://github.com/diplodoc-platform/openapi-extension/commit/96946806e9dd1d3adbd59bb26631bc9feb8c29ec))
* Fix descrition complex examples render ([38cb222](https://github.com/diplodoc-platform/openapi-extension/commit/38cb222b6dc774e5af6813b04328e5da66a38f2c))
* update version actions, node 22 ([5098a6a](https://github.com/diplodoc-platform/openapi-extension/commit/5098a6a8bd00a97a17970a1516a832d7464cb908))

## [2.8.1](https://github.com/diplodoc-platform/openapi-extension/compare/v2.8.0...v2.8.1) (2025-07-21)


### Bug Fixes

* update test helper, read from tmp file ([fa82447](https://github.com/diplodoc-platform/openapi-extension/commit/fa82447e7c02dd833b20dc04aea4c751f6fa7805))
* Use vars.for instead of private vars.load ([6012b89](https://github.com/diplodoc-platform/openapi-extension/commit/6012b89cfe9f323a7c3001a9e3b3b9c5bb1a2244))

## [2.8.0](https://github.com/diplodoc-platform/openapi-extension/compare/v2.7.1...v2.8.0) (2025-04-14)


### Features

* add multi security types ([5422d16](https://github.com/diplodoc-platform/openapi-extension/commit/5422d167d1ff73ac70d67d6dd4cdf4305814791b))
* Add security support ([a9a696a](https://github.com/diplodoc-platform/openapi-extension/commit/a9a696a2d69d4ae038327c4df39068d2d1f59791))


### Bug Fixes

* refactor useEffect to only state ([24251eb](https://github.com/diplodoc-platform/openapi-extension/commit/24251eb0a16989df72eda00aeb1c0ba5e6a6f693))
* set real projectName ([387ff5a](https://github.com/diplodoc-platform/openapi-extension/commit/387ff5af838f7dadeb831cab3a33ddcef913a707))

## [2.7.1](https://github.com/diplodoc-platform/openapi-extension/compare/v2.7.0...v2.7.1) (2025-04-03)


### Bug Fixes

* Fix default (boolean) field ([a930301](https://github.com/diplodoc-platform/openapi-extension/commit/a9303016f009430611c1e03f0ad53944d8216ba4))
* Made custom attribute "uniqueItems" without value ([65dcc4a](https://github.com/diplodoc-platform/openapi-extension/commit/65dcc4a0501e7a6a41f6aa8e63191ece12b0d1ed))

## [2.7.0](https://github.com/diplodoc-platform/openapi-extension/compare/v2.6.0...v2.7.0) (2025-01-02)


### Features

* Drop global services ([dcde7bd](https://github.com/diplodoc-platform/openapi-extension/commit/dcde7bdc02cc16890db4418f19c856cbec14efcb))
* Implement `includer` export compatible with next cli ([03e50ec](https://github.com/diplodoc-platform/openapi-extension/commit/03e50ec59f5c28b31df8d9f0256b77076487f939))


### Bug Fixes

* change order constraints for consistency ([a9c0ea2](https://github.com/diplodoc-platform/openapi-extension/commit/a9c0ea27f8419c4f94009ade8243620725ea12a9))
* Update peer deps ([cba8044](https://github.com/diplodoc-platform/openapi-extension/commit/cba8044de0284ec5c79aea606aec75c3ce08f5f8))

## [2.6.0](https://github.com/diplodoc-platform/openapi-extension/compare/v2.5.1...v2.6.0) (2024-11-21)


### Features

* add deprecated in Overview ([392b3fe](https://github.com/diplodoc-platform/openapi-extension/commit/392b3fe90ec22fa837398ffe04a5c256dbba3c25))

## [2.5.1](https://github.com/diplodoc-platform/openapi-extension/compare/v2.5.0...v2.5.1) (2024-11-20)


### Bug Fixes

* resize titles ([e12f54e](https://github.com/diplodoc-platform/openapi-extension/commit/e12f54e4e9229ccbedb8cf2fba8a2a0df4d5222c))

## [2.5.0](https://github.com/diplodoc-platform/openapi-extension/compare/v2.4.4...v2.5.0) (2024-11-19)


### Features

* add deprecated option in toc item ([05bc1eb](https://github.com/diplodoc-platform/openapi-extension/commit/05bc1eb68eb52fbfe7e9d864db247fb0dd961aba))

## [2.4.4](https://github.com/diplodoc-platform/openapi-extension/compare/v2.4.3...v2.4.4) (2024-11-13)


### Bug Fixes

* deprecated with empty schemas ([496f54f](https://github.com/diplodoc-platform/openapi-extension/commit/496f54f2371647bb36892a820d1fa881a3e138b7))

## [2.4.3](https://github.com/diplodoc-platform/openapi-extension/compare/v2.4.2...v2.4.3) (2024-10-25)


### Bug Fixes

* styles ([4e39346](https://github.com/diplodoc-platform/openapi-extension/commit/4e393462500d1ed82382a6c5957beeb3aec9c758))

## [2.4.2](https://github.com/diplodoc-platform/openapi-extension/compare/v2.4.1...v2.4.2) (2024-10-23)


### Bug Fixes

* inline request ([e22357d](https://github.com/diplodoc-platform/openapi-extension/commit/e22357da51bb9badee2b9a90689f8251ea9f0de0))

## [2.4.1](https://github.com/diplodoc-platform/openapi-extension/compare/v2.4.0...v2.4.1) (2024-10-21)


### Bug Fixes

* add 'translate=no' for code ([4bb3490](https://github.com/diplodoc-platform/openapi-extension/commit/4bb3490ecff3e1d87b3f8b1fb880b79a97a2002e))
* deprecated ([492364d](https://github.com/diplodoc-platform/openapi-extension/commit/492364db050b3038d4d49a091b6560370bbb24e0))
* Fix complex descriptions (with constraints) ([b4526d0](https://github.com/diplodoc-platform/openapi-extension/commit/b4526d0a65ce4da72625f98ec11fa7e891e5b243))
* update snapshots ([566ea7d](https://github.com/diplodoc-platform/openapi-extension/commit/566ea7d8b683341f4347269d52c40e105631ecd9))

## [2.4.0](https://github.com/diplodoc-platform/openapi-extension/compare/v2.3.4...v2.4.0) (2024-10-07)


### Features

* support deprecated field ([3fec1a3](https://github.com/diplodoc-platform/openapi-extension/commit/3fec1a34e584773a2bec26dd5ed94fb205efc3e3))


### Bug Fixes

* tests update ([865b641](https://github.com/diplodoc-platform/openapi-extension/commit/865b641ca8ce42689da41f25eca60564d1703d3e))

## [2.3.4](https://github.com/diplodoc-platform/openapi-extension/compare/v2.3.3...v2.3.4) (2024-09-26)


### Bug Fixes

* figure out a way to uniquely identify shallow copies produced by `merge` ([65b497d](https://github.com/diplodoc-platform/openapi-extension/commit/65b497d16a70749bd9c07ab3e8ce1451eb001362))

## [2.3.3](https://github.com/diplodoc-platform/openapi-extension/compare/v2.3.2...v2.3.3) (2024-09-24)


### Bug Fixes

* Update transform version ([f27023f](https://github.com/diplodoc-platform/openapi-extension/commit/f27023fac344e81f2b5b37d7967520143aa160cd))

## [2.3.2](https://github.com/diplodoc-platform/openapi-extension/compare/v2.3.1...v2.3.2) (2024-09-17)


### Bug Fixes

* ensure new object creation when merging schemas ([fff50ad](https://github.com/diplodoc-platform/openapi-extension/commit/fff50add20ed55743776ee026ddd6549b69f99dd))
* Fix package main field ([27057ae](https://github.com/diplodoc-platform/openapi-extension/commit/27057ae4a4aca77c9e9413a1b0510dbc58dab4a0))

## [2.3.1](https://github.com/diplodoc-platform/openapi-extension/compare/v2.3.0...v2.3.1) (2024-07-11)


### Bug Fixes

* Fix complex descriptions (with constraints) ([e5eacec](https://github.com/diplodoc-platform/openapi-extension/commit/e5eacecc0509ca4719964ee529b746784bb06772))
* support windows paths for build includer ([f2490f0](https://github.com/diplodoc-platform/openapi-extension/commit/f2490f065876854bb2e6e2b18b50235f14286a29))

## [2.3.0](https://github.com/diplodoc-platform/openapi-extension/compare/v2.2.0...v2.3.0) (2024-06-27)


### Features

* omit parameters marked with `x-hidden` from resulting markdown ([1fc2ec1](https://github.com/diplodoc-platform/openapi-extension/commit/1fc2ec1683f7676679164cda62d4d27bec9446e1))
* sort parameters and object schema props, hoise required ones to the top ([0ce0498](https://github.com/diplodoc-platform/openapi-extension/commit/0ce04980ae4a562c0ceae8bf754bab7f69b3bf35))
* Use fence for sandbox data ([99c20d5](https://github.com/diplodoc-platform/openapi-extension/commit/99c20d536f9b33dc9d07bf31c535a7464d1b5fc8))


### Bug Fixes

* exclude `__tests__` from mainline TS build ([6208987](https://github.com/diplodoc-platform/openapi-extension/commit/6208987e48da3eadc00cbd4c4994172fb7226027))
* restore functionality to display default values for endpoint parameters ([ab77bea](https://github.com/diplodoc-platform/openapi-extension/commit/ab77bea7f344208fc51fdc7c0bb8cf26c3a017bb))
* small refactor after code review ([271fdcc](https://github.com/diplodoc-platform/openapi-extension/commit/271fdcc681241164582841ff855b643db786a249))

## [2.2.0](https://github.com/diplodoc-platform/openapi-extension/compare/v2.1.0...v2.2.0) (2024-04-22)


### Features

* new design, custom descriptions ([b217056](https://github.com/diplodoc-platform/openapi-extension/commit/b2170567d1f66be336d10630803241ed28cb122e))

## [2.1.0](https://github.com/diplodoc-platform/openapi-extension/compare/v2.0.0...v2.1.0) (2024-03-04)


### Features

* add form-data format with string, file and file Array ([fb54fa8](https://github.com/diplodoc-platform/openapi-extension/commit/fb54fa8c4a0806758c86e2e9d7df6047ded9835d))
* support multiple servers, change oneOf render ([d70a4b1](https://github.com/diplodoc-platform/openapi-extension/commit/d70a4b1f59de9435fcf347c40a6a2f6d8db20e2e))


### Bug Fixes

* add refs ([fbecfd8](https://github.com/diplodoc-platform/openapi-extension/commit/fbecfd82163aaaf35fa06fb287eed8bc7e72a0c5))
* refactor ([687c928](https://github.com/diplodoc-platform/openapi-extension/commit/687c928b9d2de06638d1b166670a8de024ec6725))
* swap send button with response section and refactor ([9c7ba51](https://github.com/diplodoc-platform/openapi-extension/commit/9c7ba51d1090780ce3c8de7e5d98bdefb18a227b))

## [2.0.0](https://github.com/diplodoc-platform/openapi-extension/compare/v1.4.13...v2.0.0) (2024-02-20)


### ⚠ BREAKING CHANGES

* **deps:** update gravity-ui/uikit v6

### Features

* **deps:** update gravity-ui/uikit v6 ([2c85d9d](https://github.com/diplodoc-platform/openapi-extension/commit/2c85d9d59938a501e299883213e5b1554b2df69d))

## [1.4.13](https://github.com/diplodoc-platform/openapi-extension/compare/v1.4.12...v1.4.13) (2024-02-06)


### Bug Fixes

* fix EOL in notes ([bcf6f2d](https://github.com/diplodoc-platform/openapi-extension/commit/bcf6f2d4058ceea3350f4db31649942a417aa1bf))
* properties + oneOf ([68d7ce2](https://github.com/diplodoc-platform/openapi-extension/commit/68d7ce299f9dc31570a5cc88aa962f1ec3e167cc))

## [1.4.12](https://github.com/diplodoc-platform/openapi-extension/compare/v1.4.11...v1.4.12) (2024-01-30)


### Bug Fixes

* array + oneOf ([df7753e](https://github.com/diplodoc-platform/openapi-extension/commit/df7753ecddb2e8a238af74d3ef65d085782bb97d))
* nested oneOf + allOf ([02e1e5e](https://github.com/diplodoc-platform/openapi-extension/commit/02e1e5e41181772a3b247028636deeee540ce58c))

## [1.4.11](https://github.com/diplodoc-platform/openapi-extension/compare/v1.4.10...v1.4.11) (2024-01-15)


### Bug Fixes

* spacing in openapi response codes ([0fb06c2](https://github.com/diplodoc-platform/openapi-extension/commit/0fb06c215ec286a4237b2dff38d1426ef1fbc73e))

## [1.4.10](https://github.com/diplodoc-platform/openapi-extension/compare/v1.4.9...v1.4.10) (2023-12-18)


### Bug Fixes

* Downgrane markdown-it peer dep ([5e4ace0](https://github.com/diplodoc-platform/openapi-extension/commit/5e4ace0a347d09711952ca585e4731a320645e0d))
* Remove unused dev deps ([b771eaf](https://github.com/diplodoc-platform/openapi-extension/commit/b771eafff7336ca6fec34427aaa53fab2dd897e9))

## [1.4.9](https://github.com/diplodoc-platform/openapi-extension/compare/v1.4.8...v1.4.9) (2023-12-18)


### Bug Fixes

* Update core deps ([3d21f10](https://github.com/diplodoc-platform/openapi-extension/commit/3d21f10766999835127ab84ce48110a88f7c5828))

## [1.4.8](https://github.com/diplodoc-platform/openapi-extension/compare/v1.4.7...v1.4.8) (2023-12-11)


### Bug Fixes

* Fix peerDeps range ([4ee050b](https://github.com/diplodoc-platform/openapi-extension/commit/4ee050b8e8bdb57e30fa9dcdadc2d8ce601242b8))

## [1.4.0](https://github.com/diplodoc-platform/openapi-extension/compare/v1.3.4...v1.4.0) (2023-10-30)


### Features

* bump node version in actions ([f608a70](https://github.com/diplodoc-platform/openapi-extension/commit/f608a7016be9b8eb3a061355a0fc6eea0bf9d328))
* lint, package ([2853ea0](https://github.com/diplodoc-platform/openapi-extension/commit/2853ea089bee41e3d9ab382d7785d9b93c665168))
* move to diplodoc configs ([f9df19c](https://github.com/diplodoc-platform/openapi-extension/commit/f9df19cb148016e73719a9219ab970562dfb77f4))


### Bug Fixes

* engines, react/react-dom overrides ([6961cb8](https://github.com/diplodoc-platform/openapi-extension/commit/6961cb880b5dd63bf90fe504b84ebba815deb6b7))
* setup release action ([020888f](https://github.com/diplodoc-platform/openapi-extension/commit/020888f5110a113e131ea7909877440c2c2875b4))
* Update @gravity-ui/uikit ([0237738](https://github.com/diplodoc-platform/openapi-extension/commit/0237738703513c6a7969e37ee341c7143c1be1d3))

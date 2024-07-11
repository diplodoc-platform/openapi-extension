# Changelog

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

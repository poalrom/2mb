const { createDefaultEsmPreset } = require("ts-jest");

/** @type {import("jest").Config} **/
module.exports = {
  ...createDefaultEsmPreset({
    useESM: true,
  }),
  testMatch: [
    "**/?(*.)+(spec|test).ts"
  ],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts"
  ],
  roots: [
    "<rootDir>/src"
  ],
};
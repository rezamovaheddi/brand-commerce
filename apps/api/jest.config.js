/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testRegex: ".*\\.spec\\.ts$",
  moduleFileExtensions: ["ts", "js", "json"],
  moduleNameMapper: {
    "^@bc/contracts$": "<rootDir>/../../packages/contracts/src/index.ts",
  },
};

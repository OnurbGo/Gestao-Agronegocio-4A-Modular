/** @type {import("jest").Config} */
module.exports = {
  clearMocks: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/main.ts",
    "!src/**/*.module.ts",
    "!src/**/*.entity.ts",
    "!src/**/*.dto.ts",
  ],
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.spec.ts", "<rootDir>/test/**/*.spec.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
      },
    ],
  },
};

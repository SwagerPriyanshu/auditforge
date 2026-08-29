/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/test-*.ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: {
        module: "commonjs",
        esModuleInterop: true,
        skipLibCheck: true,
        types: ["jest", "node"],
        typeRoots: ["./node_modules/@types", "./src"],
      },
    }],
  },
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testTimeout: 30_000,
};

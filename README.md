# Intelligent Web News Agent

Intelligent Web News Agent is a development scaffold for building an automated news-monitoring system that ingests feeds, classifies content, and delivers real-time alerts to downstream consumers. The repository already contains a hardened lint/test toolchain, pre-commit automation, and curated editor settings so the team can focus on domain logic rather than project wiring.

## Prerequisites

- Node.js ≥ **20.17.0**
- npm ≥ **10.8.2**

## Installation

```bash
npm install
```

## Available Scripts

| Command | Description |
| --- | --- |
| `npm start` | Run `ng serve` with the default (development) configuration. |
| `npm run start:dev` / `npm run start:prod` | Serve with explicit dev/prod settings. |
| `npm run build` | Create a production build via Angular CLI. |
| `npm run build:dev` / `npm run build:prod` | Build targeted configurations. |
| `npm test` | Execute Jest once. |
| `npm run test:watch` / `npm run test:ci` / `npm run test:coverage` | Watch mode, CI profile, or coverage reporting. |
| `npm run lint` / `npm run lint:fix` | Enforce or auto-fix ESLint violations. |
| `npm run format` / `npm run format:check` | Apply or verify Prettier formatting rules. |

## Tooling Parity With `eco-chain-simulation`

| Area | Details |
| --- | --- |
| ESLint & Prettier | `.eslintrc.json`, `.eslintignore`, `.prettierrc`, `.prettierignore` copied verbatim. |
| Husky & lint-staged | `.husky/`, `.lintstaged-precommit-rc`, `.lintstaged-commitmsg-rc` ensure identical two-step validation. |
| Testing | `jest.config.js`, `jest.preset.js`, and `setup-jest.ts` match the reference project byte-for-byte. |
| Editor | `.vscode/extensions.json`, `tasks.json`, `launch.json` replicate the same recommended environment. |

## Project Structure

```
.
├── src/                # Angular application sources
├── public/             # Static assets copied during build
├── .husky/             # Pre-commit & commit-msg hooks
├── .vscode/            # Workspace recommendations
├── jest.config.js      # Jest entry point
└── angular.json        # Angular CLI workspace configuration
```

## Additional Notes

- Husky installs automatically through the `prepare` script after `npm install`.
- Jest uses `setup-jest.ts` to configure the Angular testing environment, ng-mocks, and browser API shims.
- Strict TypeScript settings (`tsconfig.base.json`) keep the codebase aligned with best practices from the reference implementation.

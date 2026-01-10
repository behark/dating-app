---
trigger: always_on
---
# Coding Standards

## Formatting

- 2 spaces indentation
- Single quotes
- Semicolons required
- Max line length: 100

## Functions

- Max 40 lines per function
- Early returns preferred
- No hidden side effects

## Components

- Max 200 lines per component
- Logic extracted into hooks
- UI components must be dumb

## Errors

- Never swallow errors
- Always log or surface errors to UI
- User-facing messages must be human-readable

## Comments

- Explain WHY, not WHAT
- No commented-out code

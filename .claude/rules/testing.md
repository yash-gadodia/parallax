# Testing

> 🚧 No test framework chosen yet. Pick one when the stack is decided, install it, add the commands to CLAUDE.md, then run `/update`.

## Framework decision table

| Stack | Framework | Why |
|-------|-----------|-----|
| TS/JS (Vite, Next, SvelteKit) | Vitest | Fast, native ESM |
| TS/JS (legacy, webpack) | Jest | Widest ecosystem |
| Python | pytest | Standard, simple |
| Rust | `cargo test` | Built-in |
| Go | `go test` | Built-in |
| Ruby/Rails | RSpec | Community standard |
| PHP/Laravel | Pest / PHPUnit | Framework-native |
| Elixir/Phoenix | ExUnit | Built-in |
| Java/Spring | JUnit 5 | Standard |
| Dart/Flutter | `flutter test` | Built-in |

## Rules (apply once tests exist)

- **Test-first**: write a failing test (RED) before the implementation (GREEN), then refactor.
- **Exact assertions**: assert the exact expected value for known inputs. Use close-comparison only for floats, always with a specific expected value. Never assert just `> 0` or "truthy".
- **Descriptive names**: `should reject expired tokens`, not `test 1`.
- **Independent**: no shared mutable state between tests.
- **Deterministic**: no timing dependencies; seed any randomness.
- **Mock only at boundaries**: external APIs, email, clock. Never mock internal logic.
- **Behavior, not implementation**: a test should survive a refactor and fail on a real regression.
- **API layer is not optional**: if HTTP routes exist, write request/response tests (success, auth failure, validation error, not found) using the framework's test client.

## Commands

<!-- TODO: fill in -->
- Full suite: `TODO`
- Watch: `TODO`
- Coverage: `TODO`

# 🧭 Coding Standards

Consistent, secure, and maintainable code enables reliability, clarity, and collaboration across all projects.

---

## ✅ **DO — Code Quality & Best Practices**

| Category                 | Guideline                                                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Security**             | Use secure coding practices — validate inputs, sanitize outputs, and handle errors safely. Never trust unverified data.                                                                                |
| **Design**               | Follow **SOLID**, **DRY**, **KISS**, and **YAGNI** principles. Prefer composition over deep inheritance.                                                                                               |
| **Structure**            | Keep functions small and low in complexity. Separate concerns clearly between logic, data, and presentation layers.                                                                                    |
| **Testing & Validation** | Ensure code compiles and passes linting, type checks, and unit tests via pre-commit hooks and CI on push, merge, and PR. Write tests at multiple levels (unit, integration, property-based).           |
| **Naming & Clarity**     | **Code must speak to us.** Use descriptive, intention-revealing names. Avoid single letters (except loop counters), abbreviations, and cryptic acronyms. A good name eliminates the need for comments. |
| **Readability**          | Use clear, self-documenting code structure. Favor clarity over cleverness. If you need a comment to explain _what_ the code does, the code needs better names.                                         |
| **Documentation**        | Document _intent_ and _why_ concisely — be conversational, not verbose. Explain **why** decisions were made, not just **how** code works.                                                              |
| **Error Handling**       | Fail fast and loudly on errors; don't hide exceptions or produce misleading outputs.                                                                                                                   |
| **Performance**          | Be mindful of algorithmic efficiency (Big-O) and resource use (CPU, memory, I/O).                                                                                                                      |
| **Maintainability**      | Write code that is easy to review, extend, and refactor. Keep it consistent and predictable.                                                                                                           |
| **Automation**           | Use pre-commit hooks and CI pipelines to enforce quality gates automatically.                                                                                                                          |
| **Version Control**      | Commit small, meaningful changes with clear messages following [Conventional Commits](https://www.conventionalcommits.org/).                                                                           |
| **Style Consistency**    | Adhere to project style guides for formatting, naming, and conventions.                                                                                                                                |

---

## 💡 **Naming Conventions — Make Code Speak**

Good names are the foundation of readable code. They reveal intent, eliminate ambiguity, and reduce cognitive load.

### General Principles

| Principle                  | Guideline                                                                                               | Example                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Intention-Revealing**    | Names should answer: _What does it do? Why does it exist? How is it used?_                              | ❌ `getData()` → ✅ `fetchUserProfile()`                           |
| **Avoid Mental Mapping**   | Don't make readers translate names in their head. Use domain terminology.                               | ❌ `temp`, `aux`, `data` → ✅ `unverifiedToken`, `claimsPayload`   |
| **Pronounceable**          | Use names you can say out loud in conversation without awkwardness.                                     | ❌ `genYmdHms()` → ✅ `generateTimestamp()`                        |
| **Searchable**             | Single-letter names and numeric constants are nearly impossible to find.                                | ❌ `if (d > 7)` → ✅ `if (daysSinceCreation > MAX_TOKEN_AGE_DAYS)` |
| **Avoid Abbreviations**    | Abbreviations force cognitive translation. Spell it out unless universally known (JWT, URL, HTTP).      | ❌ `usrCfg`, `authRes` → ✅ `userConfig`, `authenticationResult`   |
| **Class Names (Nouns)**    | Classes and types should be nouns or noun phrases.                                                      | `JwtToken`, `PolicyBuilder`, `AuthenticationError`                 |
| **Function Names (Verbs)** | Functions should be verbs or verb phrases that describe actions.                                        | `signToken()`, `verifySignature()`, `checkPermissions()`           |
| **Boolean Names**          | Prefix with `is`, `has`, `can`, `should` to indicate true/false nature.                                 | `isExpired`, `hasPermission`, `canAccess`, `shouldRefresh`         |
| **Consistent Vocabulary**  | Use one word per concept. Don't mix `fetch`/`get`/`retrieve` or `create`/`make`/`build` inconsistently. | Choose: `getUser()` or `fetchUser()` — **not both**                |
| **Context Matters**        | In a class `User`, prefer `getName()` over `getUserName()`. The context is already known.               | Inside `class JwtToken`: `getIssuer()` not `getJwtIssuer()`        |
| **Avoid Noise Words**      | Words like `Manager`, `Processor`, `Data`, `Info` are often meaningless. Be specific.                   | ❌ `DataManager` → ✅ `UserRepository`                             |
| **Use Solution Domain**    | When appropriate, use CS/technical terms (`Queue`, `Factory`, `Visitor`).                               | `TokenFactory`, `JwksCache`, `PolicyEvaluator`                     |
| **Use Problem Domain**     | When modeling business concepts, use domain language.                                                   | `checkAuth`, `createToken`, `verifySignature`                      |

### Bad vs Good Examples

| Bad (Cryptic)           | Good (Clear)                        | Why                                 |
| ----------------------- | ----------------------------------- | ----------------------------------- |
| `class B:`              | `class Builder:`                    | Single letter gives no context      |
| `function h(t, s)`      | `function hashToken(token, secret)` | Parameter names reveal intent       |
| `const d = 86400`       | `const SECONDS_IN_DAY = 86400`      | Named constant is self-documenting  |
| `if (x > 90)`           | `if (secondsSinceIssue > leeway)`   | Comparison becomes meaningful       |
| `opts`                  | `verificationOptions`               | Abbreviation removed, context added |
| `tmp`, `temp`, `result` | `unverifiedPayload`, `parsedClaims` | Specific purpose instead of generic |
| `get()`                 | `getJwksFromCache()`                | Action and source are explicit      |
| `validate()`            | `validateTokenSignature()`          | What is being validated             |
| `process()`             | `evaluateAuthorizationPolicy()`     | Specific transformation described   |

---

## 🔧 **Language-Specific Guidelines**

### TypeScript

| Category           | Guideline                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| **Type Safety**    | Enable `strict` mode. Use explicit types for public APIs. Prefer type narrowing over type assertions. |
| **Error Handling** | Use discriminated unions for error types. Avoid `any` — use `unknown` when type is truly unknown.     |
| **Async/Await**    | Always handle promise rejections. Use `Promise<Result<T, E>>` pattern for expected errors.            |
| **Security**       | Validate external data with runtime checks. Don't rely on TypeScript types alone at runtime.          |
| **Naming**         | Use PascalCase for types/interfaces/classes, camelCase for variables/functions/properties.            |
| **Types as Docs**  | Prefer `type JwtCommonConfig` over `dict[str, Any]` — types document structure.                       |

### Python

| Category           | Guideline                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| **Type Hints**     | Use type hints for all public functions. Prefer `TypedDict`/`dataclass` over plain dicts for models. |
| **Error Handling** | Raise specific exceptions. Use type guards with `isinstance()` for runtime validation.               |
| **Style**          | Follow PEP 8. Use consistent formatting and linting tools (Black, Ruff).                             |
| **Security**       | Validate inputs explicitly with type checks and bounds validation. Avoid `eval()`/`exec()`.          |
| **Naming**         | Use snake_case for functions/variables, PascalCase for classes, UPPER_SNAKE_CASE for constants.      |
| **Types as Docs**  | Use `TypedDict`, `Protocol`, `Literal` to make code self-documenting.                                |

---

## ❌ **DON'T — Common Pitfalls**

| Category           | Anti-Pattern                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| **Naming**         | Don't use single letters (except `i`, `j`, `k` for loops), abbreviations, or Hungarian notation. |
| **Testing**        | Don't fake or bypass tests to pass pipelines.                                                    |
| **Quality**        | Don't ignore or suppress lint/type errors unless truly unavoidable.                              |
| **Type Safety**    | Avoid unsafe, implicit, or overly broad generics (`any`, `unknown` misuse).                      |
| **Design**         | Don't over-engineer or add unused features "just in case."                                       |
| **Error Handling** | Never swallow exceptions or return misleading results.                                           |
| **Complexity**     | Don't sacrifice simplicity or readability for premature optimization.                            |
| **Comments**       | Don't comment _what_ the code does if better names would make it obvious.                        |

---

## 🧾 **Documentation Rules**

| Aspect          | Guideline                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Audience**    | Write for software architects and engineers — assume technical fluency.                                                                                                        |
| **Voice**       | Use a plain, conversational tone. Skip filler and jargon.                                                                                                                      |
| **Clarity**     | Be concise — aim for **3–7 bullets or ≤120 words** per section. **Exception:** Security-critical features (authentication, cryptography, key management) may expand as needed. |
| **Focus**       | Explain _intent_ and _why_, not implementation details — capture rationale and design reasoning.                                                                               |
| **Format**      | Use markdown headings, lists, and tables for readability.                                                                                                                      |
| **Maintenance** | Keep docs updated alongside code — outdated docs are worse than missing ones.                                                                                                  |

---

## 🧩 **Summary**

- **Code must speak to us** — good names eliminate the need for explanatory comments
- Build for clarity, safety, and maintainability
- Automate quality gates — lint, test, and type-check early
- Communicate through code structure and documentation
- Strive for simplicity — elegance follows discipline

**Remember:** If a name requires a comment to explain what it does, the name is wrong. Fix the name first.

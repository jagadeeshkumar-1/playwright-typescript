# Playwright Test Automation Framework

Automated UI test suite for [rahulshettyacademy.com](https://rahulshettyacademy.com/client) built with
[Playwright Test](https://playwright.dev/) and TypeScript, using the Page Object Model.

## Tech Stack

- **Playwright Test** — test runner, browser automation, assertions
- **TypeScript** — page objects and specs
- Chromium, Firefox, WebKit — all three run by default
- **allure-playwright** — writes Allure result JSON (dev dependency, in `package.json`)
- **Allure CLI** — renders those results into the HTML report; installed via Homebrew locally
  (`brew install allure`) and downloaded directly from GitHub releases in CI — deliberately **not**
  an npm dependency (see [Allure reporting](#allure-reporting-pass--failed--broken) below)

## Project Structure

```
.
├── playwright.config.ts        # Test runner config: projects, retries, reporters, base URL
├── fixtures/
│   ├── BaseTest.ts             # Custom `test`/`expect` — the shared "base test" every spec imports
│   │                           #   also runs the failure-screenshot/stack-trace afterEach hook
│   └── auth.ts                 # Path to the saved authenticated storage state
├── pages/                      # Page Object classes — one per app screen
│   ├── LoginPage.ts
│   ├── ProductDetailPage.ts
│   ├── CartPage.ts
│   ├── CheckOutPage.ts
│   ├── OrdersPage.ts
│   └── OrderConfirmationPage.ts
├── Utils/
│   ├── ScreenshotsUtil.ts      # captureFailureScreenshot() — full-page screenshot on failure
│   └── ReportingUtil.ts        # attachFailureArtifacts() — attaches screenshot + stack trace to Allure
├── scripts/
│   └── generateAllureReport.js # carries Allure history forward so the Trend graph accumulates
├── storageInfo/
│   └── auth.setup.ts           # Logs in once, saves session to playwright/.auth/user.json
├── tests/
│   ├── LoginPageTest.spec.ts
│   ├── ProductDetailsTest.spec.ts
│   ├── CartPageTest.spec.ts
│   └── OrderPageTest.spec.ts
├── playwright/.auth/           # Saved login session (gitignored — do not commit)
├── screenshots/                # Failure screenshots (gitignored)
├── allure-results/             # Raw Allure result JSON for the last run (gitignored)
└── allure-report/              # Latest generated Allure HTML report — Trend/History carried forward across runs (gitignored)
```

## Architecture Decisions

### Page Object Model, not raw locators in specs

Every screen has a class in `pages/` that owns its locators and user actions (`goto()`, `login()`,
`addToCart()`, etc). Spec files call these methods instead of writing selectors directly — if a
locator changes, it's fixed in one file, not in every test that touches that screen.

### Fixtures instead of a Java-style `BaseTest` base class

Coming from Java/TestNG, the natural instinct is a `BaseTest` class with `@BeforeMethod`/`@AfterMethod`
that subclasses extend. Playwright Test has no class inheritance or annotation system — the equivalent
mechanism is **fixture composition** via `test.extend()`.

`fixtures/BaseTest.ts` builds a custom `test` (and re-exports `expect` alongside it) that wires up a
Page Object per fixture:

```ts
export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => { await use(new LoginPage(page)); },
  productPage: async ({ page }, use) => { await use(new ProductDetailPage(page)); },
});
```

Every spec imports `test`/`expect` from `../fixtures/BaseTest` — never from `@playwright/test` directly —
so a test can just ask for `{ loginPage, productPage, page }` and get ready-to-use page objects instead
of constructing them by hand.

`expect` is re-exported from the same file (not just passed through) so that if custom matchers are ever
added (`expect.extend({...})`), every spec picks them up automatically without changing their imports.

### You get a new tab and a closed browser per test for free

Unlike Selenium/WebDriver, Playwright doesn't need manual `driver = new ChromeDriver()` /
`driver.quit()` in setup/teardown. For every single test, Playwright's built-in fixtures automatically:

1. Reuse the one `browser` process already running for the current worker (fast — no relaunch)
2. Open a brand-new, isolated `context` (no shared cookies/localStorage between tests)
3. Open a `page` (tab) inside it and hand it to the test
4. Close that context (and its tab) the moment the test finishes — pass, fail, or crash

This is why there's no manual `page.close()` anywhere in this codebase — isolation and cleanup are
automatic per test, not something the framework code needs to manage.

### Authentication: log in once via `storageState`, not per test

Logging in through the UI inside a `beforeEach` for every test works, but it's slow and adds an
avoidable point of flakiness to every single test. Instead:

- `storageInfo/auth.setup.ts` is a one-time "setup" test that logs in through the UI and saves the
  authenticated session to `playwright/.auth/user.json` via `page.context().storageState()`.
- `playwright.config.ts` defines a `setup` project (matching `*.setup.ts` files) that the `chromium`,
  `firefox`, and `webkit` projects depend on (`dependencies: ['setup']`), and each of those projects
  loads that saved session via `use: { storageState: AUTH_FILE }`.
- Every test in the suite now starts **already logged in** — no repeated UI login, no extra network
  calls, no login-form flakiness leaking into unrelated tests.

`LoginPageTest.spec.ts` is the one place that specifically needs to test the *unauthenticated* flow
(the login page itself), so it explicitly resets storage state back to empty at the top of the file:

```ts
test.use({ storageState: { cookies: [], origins: [] } });
```

`playwright/.auth/` is gitignored — it holds live session data and should never be committed.

### Failure screenshot + stack trace, captured automatically

`fixtures/BaseTest.ts` has one `test.afterEach` hook that every spec picks up for free (since every
spec imports `test` from here, never from `@playwright/test` directly):

```ts
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshot = await screenshotsUtil.captureFailureScreenshot(page, testInfo);
    await reportingUtil.attachFailureArtifacts(testInfo, screenshot);
  }
});
```

- `testInfo.status !== testInfo.expectedStatus` is the general "this test did not do what it was
  supposed to" check — it's true for assertion failures, thrown errors, *and* timeouts, not just
  `status === 'failed'`.
- `ScreenshotsUtil.captureFailureScreenshot()` takes a full-page screenshot at the moment of failure
  (the page is still open — Playwright closes it right after this hook returns) and saves it under
  `screenshots/<sanitized-test-title>-failure.png`.
- `ReportingUtil.attachFailureArtifacts()` attaches that screenshot plus `testInfo.error.stack` via
  `allure.attachment()` from `allure-js-commons`. That single call is enough for **both** reports —
  under the hood `allure.attachment()` forwards to `testInfo.attach()` itself, so calling
  `testInfo.attach()` again manually would just duplicate the attachment (learned that the hard way
  while wiring this up).

### Allure reporting: pass / failed / broken

`playwright.config.ts` registers two reporters side by side — `html` (Playwright's own report) and
`allure-playwright` (writes `allure-results/*.json`):

```ts
reporter: [
  ['html'],
  ['allure-playwright', { resultsDir: 'allure-results', detail: true, suiteTitle: false }],
],
```

`allure-playwright` maps Playwright's test outcome to Allure's status independently of anything in
this repo:

| Playwright outcome               | Allure status |
|----------------------------------|---------------|
| `status === expectedStatus`      | `passed`       |
| assertion failure or thrown error | `failed`      |
| `status === 'timedOut'`          | `broken`       |
| `status === 'skipped'`           | `skipped`      |

Note that `broken` means *timed out*, not "assertion vs. unexpected exception" the way some Java
Allure adapters split it — both an `expect().toBe()` failure and a thrown `Error` land on `failed`
in this adapter.

**Why the Allure CLI isn't in `package.json`:** the two obvious npm options —
`allure-commandline` (bundles an old Java CLI, 1 critical CVE) and `allure` (JS-native Allure Report 3,
~230 packages, 6 critical CVEs in report-rendering libs) — both add real vulnerable surface area for
a tool that only renders a local report. `allure-playwright` (the actual results *writer* that runs
during the test) stays a normal lean devDependency; the report *renderer* is treated as external
tooling instead — Homebrew locally (`brew install allure`), direct GitHub-release download in CI.

---

### `allure-results/` vs `allure-report/` — what each folder is and who creates it

Think of it like a compiler: `allure-results/` is the **source**, `allure-report/` is the **compiled
output**. They are created by completely different things and serve completely different purposes.

#### `allure-results/` — created by your test run

**Who creates it:** `allure-playwright`, the reporter registered in `playwright.config.ts`.  
**When:** automatically, at the end of every `npx playwright test` run.  
**Never touched by the Allure CLI.**

After a test run it looks like this:

```
allure-results/
  c0698cc2-result.json        ← one file per test: name, status, steps, timestamps
  40b15069-result.json
  5561583b-attachment.png     ← the actual failure screenshot binary (from ScreenshotsUtil)
  88f354d5-attachment.txt     ← the stack trace text (from ReportingUtil)
  1572692b-attachment.md      ← Playwright's own error-context markdown
```

Every test produces at minimum one `-result.json`. Attachments are separate files linked by UUID
from inside that JSON — result and binary are decoupled so large screenshots don't bloat the JSON.

**Key point:** `allure-results/` only ever contains results from the *last* test run. It has no
memory of previous runs. It is completely overwritten every time you run tests.

#### `allure-report/` — created by the Allure CLI

**Who creates it:** the `allure generate` command inside `scripts/generateAllureReport.js`.  
**When:** only when you run `npm run allure:report`. Never created by tests.  
**Never touched by `allure-playwright`.**

After `allure generate` runs it looks like this:

```
allure-report/
  index.html        ← the entry point you open in the browser
  assets/           ← JS/CSS for the UI
  data/             ← processed test cases and attachment data
  widgets/          ← pre-computed summary numbers (pass count, fail count, trend data)
  history/          ← THE KEY FOLDER — explained below
  export/           ← machine-readable summary for CI integrations
```

This is a fully self-contained static website. `allure open` just runs a local HTTP server pointing
at this folder — there is no backend, no database, just static files.

#### The `history/` folder — the only bridge between runs

`allure-results/` is wiped every test run. `allure generate --clean` wipes `allure-report/` every
time you generate. Without any intervention, every report would be a fresh start with a single data
point, and you'd never see a Trend graph or per-test execution history.

Allure's own solution is the `history/` folder. Every time `allure generate` builds a report, it
also writes a `history/` folder *inside that report* (`allure-report/history/`) summarising every
run it has seen so far. If that folder is present inside `allure-results/` *as an input* to the next
generate call, Allure reads it and carries the data forward. The problem is `allure generate` never
does this copy itself between separate invocations — nothing moves `allure-report/history/` back into
`allure-results/history/` automatically. That is the exact gap `scripts/generateAllureReport.js`
closes with two lines:

```js
// Step 1
fs.rmSync(path.join(resultsDir, 'history'), { recursive: true, force: true });

// Step 2
fs.cpSync(previousHistory, path.join(resultsDir, 'history'), { recursive: true });
```

**Step 1 — `rmSync`:** Delete `allure-results/history/` if it exists.

In the normal case (fresh test output) this folder doesn't exist, so `rmSync` with `force: true`
silently does nothing. It only matters in one edge case: if you run `npm run allure:report` twice
back-to-back without running tests in between — on the second call, `allure-results/history/` is
already sitting there from the first call's copy. Without this delete, `cpSync` would *merge* into
that existing folder rather than replace it cleanly, potentially mixing stale files.

**Step 2 — `cpSync`:** Copy `allure-report/history/` → `allure-results/history/`.

After this copy, `allure-results/` looks like this:

```
allure-results/
  c0698cc2-result.json         ← this test run's results
  5561583b-attachment.png
  ...
  history/                     ← JUST COPIED IN from allure-report/history/
    history-trend.json         ← "N data points" accumulated from all previous runs
    history.json               ← each test's past executions with real timestamps
    categories-trend.json
    duration-trend.json
    retry-trend.json
```

Now when `allure generate` reads `allure-results/` it sees both the fresh test results *and* the
full history from before. It appends this run and writes a new `allure-report/history/` — which
becomes the source for the *next* cycle's copy.

#### Full lifecycle across three runs

```
TEST RUN 1                    TEST RUN 2                    TEST RUN 3
──────────                    ──────────                    ──────────
npm test                      npm test                      npm test
  │                             │                             │
  ▼                             ▼                             ▼
allure-results/               allure-results/               allure-results/
  (no history/ inside)          (no history/ inside)          (no history/ inside)

npm run allure:report         npm run allure:report         npm run allure:report
  │                             │                             │
  ├─ rmSync  → nothing          ├─ rmSync  → nothing          ├─ rmSync  → nothing
  │    to delete                │    to delete                │    to delete
  │                             │                             │
  ├─ cpSync  → skipped          ├─ cpSync  ────────────►      ├─ cpSync  ────────────►
  │    (no previous               copies run-1 history          copies run-1+2 history
  │     allure-report/            into allure-results/          into allure-results/
  │     history/ yet)
  │                             │                             │
  ▼                             ▼                             ▼
allure-report/                allure-report/                allure-report/
  history/                      history/                      history/
  [1 data point]                [2 data points]               [3 data points]
```

The `allure-report/history/` folder is the only thing that survives between runs. Everything else —
`allure-results/` and the rest of `allure-report/` — is completely overwritten every cycle.

**History retention limit:** Allure caps both the suite-level Trend graph and each test's History
tab at the last **20 runs** (a hardcoded default in the Allure CLI). Past the 20th run it is FIFO —
the oldest entry drops off as a new one is added.

**Time gap between runs doesn't matter.** History carry-forward is purely file-presence-based, not
time-based. Running tests after 3 days or 3 weeks works exactly the same as running them 3 minutes
later — as long as `allure-report/` is still on disk. Since both folders are gitignored, the cases
where history *does* reset are: a fresh `git clone` on another machine, CI (each run gets a fresh
runner — the current workflow doesn't cache/restore `allure-report/history/` between jobs), or
anyone manually deleting the folder.

Report generation/viewing is a deliberate manual step — `npm test` only produces `allure-results/`.
Run `npm run allure:report` whenever you actually want to view the report.

### npm scripts use `:` instead of spaces

`npm run <name>` only accepts a single script name; anything after the first space is passed as an
*argument* to that script, not treated as part of the name. So `"test report"` as a key is unreachable
via `npm run test report` (npm just runs `test` with `report` as an arg). Scripts are named
`test:ui`, `test:report`, `test:debug`, etc. instead.

## Running Tests

```bash
npm test                 # run everything, all 3 browsers
npm run test:ui          # Playwright's interactive UI mode
npm run test:headed      # run with a visible browser window
npm run test:debug       # step through with the Playwright inspector
npm run test:trace       # force trace recording for every test
npm run test:smoke       # only tests tagged @smoke
npm run test:report      # re-open the Playwright HTML report from the last run

npm run allure:report    # regenerate (from the last allure-results) + open the Allure report
                          # (blocks the terminal serving it, Ctrl+C to stop)

npx playwright test --project=chromium   # single browser only
```

The Playwright HTML report auto-opens after a local run; `test:report` is just for reopening a
previous run's report without re-running tests. The Allure report is fully separate and on-demand —
run any test script to produce `allure-results/`, then `npm run allure:report` whenever you actually
want to see it.

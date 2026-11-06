# Modern Front-End Security Dashboard

## Overview

This Vanilla JavaScript and Express application demonstrates fixes for five modern front-end
security risks: DOM-based XSS, prototype pollution, SSR token leakage, Content Security
Policy, and clickjacking.

## Setup

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Security review and refinements

### 1. DOM-based XSS

**Vulnerable implementation:** `client/app.js` read the attacker-controlled `name` URL
parameter and interpolated it into `app.innerHTML`. This created a direct untrusted
source-to-dangerous-sink flow.

**Security boundary:** URL data is controlled by the browser user or a link author. It must not
be treated as trusted markup.

**Fix:** The profile is constructed with `document.createElement`, `textContent`, and
`createTextNode`. The URL-provided name is displayed only as text. No HTML-interpreting sink is
used. The restrictive CSP provides a second layer if another rendering defect is introduced.

**Verification:**

- Positive: `/?name=Alice` displays `Welcome, Alice`.
- Negative: `/?name=<img src=x onerror=alert(1)>` displays the payload as text and creates no
  image element or alert.
- Evidence: capture the rendered payload and browser Console showing that no script executed.

### 2. Prototype pollution

**Vulnerable implementation:** Both client and server copied arbitrary input properties into
ordinary objects using dynamic assignment. Unexpected or special keys were not checked.

**Security boundary:** Request bodies and client-created objects can be modified outside the
intended UI and must be treated as untrusted.

**Fix:** Supported keys and values are explicitly allowlisted on both sides. The server rejects
`__proto__`, `constructor`, `prototype`, unknown keys, and invalid values. Accepted settings are
stored in an `Object.create(null)` dictionary. Server validation is authoritative; client
validation provides earlier feedback.

**Verification:**

- Positive: supported theme, language, and font-size values are accepted.
- Negative: prototype-related keys, `isAdmin`, and unsupported values receive HTTP 400.
- Evidence: capture the successful settings response and the HTTP 400 response for a raw JSON
  request containing `__proto__`.

### 3. SSR token leakage

**Vulnerable implementation:** The complete server-side `user` object, including fake session
and refresh tokens, was serialized into the home page and returned by `/api/profile`.

**Security boundary:** Data serialized into HTML or JSON crosses from server-only memory into
the browser and is accessible to client-side JavaScript.

**Fix:** `toClientUser` creates an explicit DTO containing only `id`, `name`, `email`, and
`role`. The home page no longer serializes user data into an inline script, and the profile API
returns only the DTO. Tokens remain server-side and are not placed in localStorage,
sessionStorage, URLs, HTML, or API responses.

**Verification:**

- Positive: the dashboard still displays the user's name, email, and role.
- Negative: page source and `/api/profile` contain no session or refresh token.
- Evidence: capture the page source and `/api/profile` response showing only the client DTO.

### 4. Content Security Policy

**Vulnerable implementation:** The application returned no CSP and depended on inline scripts
and styles, allowing the browser to execute unrestricted inline content.

**Fix:** Express now sends a CSP with `default-src 'self'`, `script-src 'self'`,
`style-src 'self'`, `connect-src 'self'`, `object-src 'none'`, `base-uri 'self'`,
`form-action 'self'`, and `frame-ancestors 'none'`. Inline account code and styles were moved
to same-origin static files. The policy does not use `unsafe-inline` or `unsafe-eval`.

**Verification:**

- Positive: dashboard, account actions, styles, profile loading, and settings saving work.
- Negative: inline scripts entered through a payload are not executed.
- Evidence: capture the CSP response header and browser Console showing no unexpected policy
  violations.

### 5. Clickjacking

**Vulnerable implementation:** Sensitive pages could be embedded by another site because no
framing policy was returned.

**Security boundary:** A hostile parent page can disguise or overlay a framed authenticated UI
and trick a user into interacting with it.

**Fix:** Every response includes CSP `frame-ancestors 'none'` and
`X-Frame-Options: DENY`. `SameSite` cookies are not demonstrated because this training
application has no real authentication cookie; cookie configuration would supplement, not
replace, the framing controls.

**Verification:**

- Positive: `/account` works when opened directly.
- Negative: open `test/iframe-test.html`; the browser refuses to display `/account` in its
  iframe.
- Evidence: capture the blocked iframe and the `frame-ancestors` and `X-Frame-Options` headers.

## Defense in depth

The application does not rely on one mechanism:

1. Safe DOM APIs remove the primary XSS sink.
2. Client allowlisting improves feedback, while server allowlisting enforces the boundary.
3. DTO-based minimization prevents sensitive server fields from reaching the browser.
4. CSP restricts resource execution if another defect is introduced.
5. `frame-ancestors` and `X-Frame-Options` independently restrict framing.
6. `X-Content-Type-Options: nosniff` and `Referrer-Policy: no-referrer` further reduce browser
   attack surface and information exposure.

## Test evidence

For demonstration evidence, record:

1. A normal name and DOM XSS payload rendered as text.
2. A valid settings save and rejected prototype payload.
3. Page source and profile JSON without token fields.
4. CSP and framing headers in browser developer tools.
5. The account page working directly and being blocked in `test/iframe-test.html`.

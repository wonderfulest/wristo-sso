# Apple sign-in

The shared login page supports Apple for every SSO client, including Store.
It uses Apple's JavaScript popup flow and the existing `/api/auth/apple/login`
endpoint, which now also creates the shared SSO session. The existing client
redirect and `next` path are retained.

To enable it:

1. Register an Apple Services ID associated with a primary App ID that has
   Sign in with Apple enabled. Register the SSO domain and an exact HTTPS return
   URL on the SSO origin in Apple Developer.
2. Set `VITE_WRISTO_APPLE_CLIENT_ID` to that Services ID and
   `VITE_WRISTO_APPLE_REDIRECT_URI` to that return URL in the SSO build environment
   (`npm run build` uses mode `prod`; Vite reads environment files from the
   workspace root, not this repository). Both are public configuration; the button
   stays hidden until both are set.
3. Include the Services ID in the API's comma-separated
   `WRISTO_APPLE_SIGN_IN_CLIENT_IDS`, preserving existing native app IDs.
4. Rebuild SSO and restart/deploy the API through the normal release process.

The popup flow does not use the native app's `/auth/apple/web/callback` or its
`WRISTO_APPLE_WEB_REDIRECT_URI`. Do not replace that native configuration.
Never put Apple private keys in frontend environment variables.

Apple subjects remain the account identity. Existing backend email matching is
preserved: a private relay email that differs from an existing account's email
can create a separate account. This change does not merge accounts or orders;
existing customers can still use their purchase email to access that account.

Validation: `node --experimental-strip-types --test tests/appleSignIn.test.ts`
and `npm run build`. Before production enablement, verify real Apple approval,
cancellation/retry, returning-user login, hidden-email login, and the Store
callback with its original destination. Check that another SSO client reuses
the session. These require the configured Apple account and HTTPS environment.

Apple documentation: https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web

Registered configuration (Apple Developer): Services ID `io.wristo.sso`,
primary App ID `io.wristo.garmin`, domain `sso.wristo.io`, return URL
`https://sso.wristo.io/login`. Local workspace `.env` and the production
`.env.wristo.prod`, `.env.wristo.prod.primary`, `.env.wristo.prod.secondary`
contain the frontend values and API allowed client IDs. These local changes do
not update server environments or deploy the feature.

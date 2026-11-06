# Security hardening rollout

This branch moves staff PIN verification and application-table access to Vercel server-side API routes.

## Before enabling the migration

1. In Vercel, confirm `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured for the project.
2. Add two new Vercel environment variables for Production (and Preview if you test there):
   - `SJS_SESSION_SECRET`: a random secret of at least 32 bytes.
   - `SJS_PIN_PEPPER`: a different random secret of at least 32 bytes.
3. Redeploy the branch after adding the variables.

Generate independent values locally with:
```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```
Run it twice and use one output for each variable. Do not put either value in GitHub or in browser-side `VITE_*` variables.

## Supabase migration

After deploying the matching code, run `supabase/migrations/20261106_pin_security.sql` in the Supabase SQL Editor.

- Existing PINs are converted to scrypt hashes after each user's first successful login.
- The plaintext `pin` column is set to NULL as each user logs in.
- New users and PIN resets are stored as salted scrypt hashes immediately.
- RLS is enabled and direct anon/authenticated table grants are revoked for the application tables listed in the migration.

## Important

Do not run the migration against the live project until the matching Vercel code and both secrets are deployed. The migration intentionally blocks direct browser access; the server-side API must be live first.

Existing legacy PINs remain in the database until that user next logs in. After all users have logged in successfully, verify that every row has `pin IS NULL` and non-null `pin_hash` / `pin_salt`. Then the legacy `pin` column can be dropped in a separate cleanup migration.

The public customer designer can read only the limited rubber item fields needed for size selection. Customer submissions continue through the dedicated customer-designs API.

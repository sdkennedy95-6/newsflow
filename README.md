# The Loop — News Aggregator

## Public API

Two read-only, unauthenticated routes are available without logging in.

### `GET /api/articles`

Returns the aggregated article list from the default feeds as JSON.

```
GET /api/articles?limit=20&since=2026-10-01T00:00:00Z
```

| Param | Default | Max | Description |
|-------|---------|-----|-------------|
| `limit` | 50 | 500 | Max articles to return |
| `since` | — | — | ISO 8601 date; only articles published **after** this time |
| `source` | — | — | Case-insensitive substring match on feed name. Comma-separated or repeated for OR logic: `?source=HIT%20Consultant,Health%20API%20Guy` |
| `category` | — | — | Case-insensitive substring match on category name. Same multi-value syntax as `source`. |
| `paginate` | — | — | Set to any value to enable cursor pagination (see below) |
| `cursor` | — | — | Opaque cursor from a previous paginated response |

All filters combine with AND. `source` values combine with OR. `category` values combine with OR.

**Legacy response** (default — backward compatible):
```json
{ "articles": [...], "count": 50 }
```

**Paginated response** (add `?paginate=1`):
```json
{
  "articles": [...],
  "nextCursor": "<opaque string, or null on last page>",
  "total": 312
}
```

Articles are ordered newest-first with a stable URL tiebreaker, so pages
never duplicate or skip items.

### Example URLs

```bash
# All health tech articles, up to 500
curl "https://newsfeed-app-phi.vercel.app/api/articles?category=health%20tech&limit=500"

# Specific sources, comma-separated
curl "https://newsfeed-app-phi.vercel.app/api/articles?source=HIT%20Consultant,Health%20Tech%20Nerds"

# Repeated source params (same result)
curl "https://newsfeed-app-phi.vercel.app/api/articles?source=HIT+Consultant&source=Health+Tech+Nerds"

# Health tech since a date
curl "https://newsfeed-app-phi.vercel.app/api/articles?category=health%20tech&since=2026-09-30T00:00:00Z&limit=500"

# First paginated page
curl "https://newsfeed-app-phi.vercel.app/api/articles?paginate=1&limit=50"

# Next page (use nextCursor from previous response)
curl "https://newsfeed-app-phi.vercel.app/api/articles?paginate=1&limit=50&cursor=<nextCursor>"
```

---

### `GET /digest`

Server-rendered HTML page listing the same articles. No client-side JS required — readable by `curl`, scrapers, or any simple fetch tool. Includes a `<link rel="alternate">` pointing back to `/api/articles`.

---

### Feed source configuration

By default the API falls back to a small set of built-in feeds. To serve your
**live configured feeds** (the categories you manage inside the app), set:

```
LOOP_OWNER_USER_ID=<your Supabase user UUID>
```

Find your UUID in the Supabase dashboard → Authentication → Users. The API
will read your categories via the service role key (bypassing RLS) and serve
exactly the feeds you have configured — no code change needed when you add or
remove feeds in the app.

`VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must also be set (they
already are for the digest feature).

---

### Optional token protection

If you want to restrict access, set the `DIGEST_TOKEN` environment variable in
Vercel (Settings → Environment Variables). When set, both `/api/articles` and
`/digest` require the token via either:

- `Authorization: Bearer <token>` header
- `?key=<token>` query parameter (browser-friendly)

When `DIGEST_TOKEN` is **not** set, both routes are fully public with no
authentication required. The existing login and per-user features are
unaffected.

---

# React + TypeScript + Vite (original template notes)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

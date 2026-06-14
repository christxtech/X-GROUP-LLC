# Christ le Dieu du Tech

A community website with 6 pages: contact registration, admin panel, social network with real-time messaging, spin game, social link exchange, and an embedded external site viewer.

## Technologies

- **Frontend**: Vanilla HTML, CSS, JavaScript (no framework)
- **Backend**: Netlify Functions (TypeScript, ESM)
- **Database**: Netlify Database (managed Postgres via Drizzle ORM)
- **Hosting**: Netlify

## Pages

| Page | File | Description |
|------|------|-------------|
| Accueil | `index.html` | Contact registration form |
| Admin | `admin.html` | Password-protected admin panel |
| Réseau Social | `social.html` | User accounts + real-time messaging |
| Spin | `spin.html` | Spin-to-win game (25 GDS/spin) |
| Liens | `links.html` | Social link exchange |
| ChristView | `view.html` | Full-page iframe viewer |

## Running Locally

```bash
npm install
netlify dev --port 8889
```

Requires Netlify CLI and a linked Netlify site for database access.

## Contact

WhatsApp: +50937081286

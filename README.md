# CraftQuote — Furniture & Interior Quotation

A lightweight, responsive web application for creating furniture and interior quotations, generating A4 PDFs, and sharing estimates via WhatsApp. All business details and quotation sequences persist locally in the browser (`localStorage`).

## Local Development

```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run lint
npm run build
```

The static production bundle is generated in `dist/` with relative asset paths (`base: './'`), ready for GitHub Pages, Vercel, Netlify, or any static host.

## GitHub Pages Deployment

A workflow is included at `.github/workflows/deploy.yml`. In your GitHub repository:

1. Go to **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Push to `main` (or `master`) to build and publish automatically.

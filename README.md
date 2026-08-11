# Production Planning

## Live

https://production-planning-six.vercel.app

Wayam AI's production planning app — demo login, production order tracking (list + timeline
views). Built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui.

## Local development

```bash
npm install
npm run dev
```

Visit http://localhost:3000. Sign in with any `@gmail.com` address and any password.

## Testing

```bash
npm run test
```

## Notes

This is a v1 demo: authentication and data both live in the browser (`localStorage`), with no
real backend. See `docs/superpowers/specs/2026-08-11-production-planning-v1-design.md` for
the full design.

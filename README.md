# Home PDI Checklist

A React application for completing a pre-delivery home inspection checklist.

## Local development

```sh
npm ci
npm run dev
```

Run the linter and production build locally with:

```sh
npm run lint
npm run build
```

## GitHub Pages deployment

The GitHub Actions workflow in `.github/workflows/deploy.yml` runs lint and
build checks for pushes to `main`, then deploys the production build to GitHub
Pages. It can also be started manually from the **Actions** tab.

In the repository settings, set **Pages → Build and deployment → Source** to
**GitHub Actions**. The site will be published at
<https://arifuzzaman-tanin.github.io/home-pdi-checklist/>.

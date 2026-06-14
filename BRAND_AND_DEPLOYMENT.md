# Brand and Deployment Notes

This file documents the DateTime Lizard logo, color palette, release/version stamp, and GitHub Pages publishing flow.

## Logo

The site uses the Yelling Lizard mark without text.

Tracked site assets:

- `assets/yelling-lizard-logo.png` - header logo, transparent PNG, 2000x2000 source.
- `assets/apple-icon.png` - favicon/apple touch icon, copied from the same transparent PNG.

The logo should appear as an image asset, not as a redrawn SVG or CSS approximation.

## Colors

The standard Lizard palette is:

| Purpose | Hex |
| --- | --- |
| Logo green | `#80A24D` |
| Light green | `#99CC66` |
| Pale gray | `#EFF0EB` |
| Black | `#000000` |
| White | `#FFFFFF` |

The CSS palette derives from those colors:

```css
--bg: #eff0eb;
--logo-green: #80a24d;
--logo-green-light: #99cc66;
--accent: #5f7a38;
--accent-strong: #35471e;
--accent-soft: #edf5e7;
```

## Version Stamp

The app uses a release stamp in this format:

```text
yyyyMMdd-HHmm
```

The version appears in:

- `script.js`: `const appRelease = "YYYYMMDD-HHMM";`
- `index.html`: visible footer text, `Version: YYYYMMDD-HHMM`
- `index.html`: cache-busting query strings on CSS, JavaScript, favicon, and logo URLs

## Git Hook

The repo uses a tracked pre-commit hook:

```text
.githooks/pre-commit
```

Enable it once in a fresh clone:

```powershell
git config core.hooksPath .githooks
```

The hook runs:

```powershell
scripts/update-release.ps1
```

That script updates:

- `const appRelease` in `script.js`
- all `?v=...` cache-busting query strings in `index.html`
- the visible footer version in `index.html`

## GitHub Pages

Repository:

```text
https://github.com/davidbreyer/datetime-lizard.git
```

Branches:

- `master` - source/history branch.
- `gh-pages` - public GitHub Pages branch.

The intended live site is:

```text
https://davidbreyer.github.io/datetime-lizard/
```

Normal deployment flow:

```powershell
git add -- ...
git commit -m "Some change"
git push origin master
git push origin master:gh-pages
```

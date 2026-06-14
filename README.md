# DateTime Lizard

A small JavaScript app for converting dates and timestamps used in .NET and API work.

Open `index.html` in a browser, paste a date/time value, Unix timestamp, or .NET ticks value, then use `Convert` to see common representations.

For logo, color, versioning, and publishing details, see [BRAND_AND_DEPLOYMENT.md](BRAND_AND_DEPLOYMENT.md).

## Features

- Convert ISO/date strings, Unix seconds, Unix milliseconds, and .NET ticks.
- Show UTC ISO, local ISO, Unix timestamps, .NET ticks, RFC 1123, date-only, time-only, and relative time.
- Generate copy-ready SQL Server snippets for `datetime2`, `datetimeoffset`, date ranges, and time literals.
- Generate C# and LINQ snippets for `DateTimeOffset`, Unix milliseconds, ticks, and common query filters.
- Fill current UTC or local time with one click.
- Add or subtract days, hours, and minutes.
- Copy individual values or save the full conversion report as JSON.

## GitHub Pages

The intended Pages URL is:

```text
https://davidbreyer.github.io/datetime-lizard/
```

Normal deployment flow after the GitHub repo exists:

```powershell
git add -- ...
git commit -m "Some change"
git push origin master
git push origin master:gh-pages
```

`master` stores the source/history. `gh-pages` is the branch GitHub Pages serves publicly.

## Release Stamp

The footer displays the current version:

```text
Version: YYYYMMDD-HHMM
```

The value lives in `script.js`:

```js
const appRelease = "YYYYMMDD-HHMM";
```

The same value is used for cache-busting query strings in `index.html`.

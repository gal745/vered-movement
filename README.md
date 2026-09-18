# ורד גוטרייך · תנועה טבעית — website

A one-page site for Vered Gutreich's movement business, Hebrew-first with a full English version.
Plain static files: no framework, no build dependencies beyond Perl, and it can be hosted anywhere for free.

Replaces the old Wix site at `gal021.wixsite.com/tnuativit`, which was half stock filler.

## Folders

```
site.conf            name, phone, WhatsApp, email, socials, map pin, preview text
site.css             the colours and fonts
template/
  layout.html        page skeleton (head, SEO tags, header/footer slots)
  assets/            base.css, site.js, icons.svg
partials/            header, footer and structured data, per language
pages/he/, pages/en/ page content
images/              artwork and (later) her photos
dist/                build output: this is the folder you upload
serve.ps1            local preview server
INTAKE.md            everything still to ask Vered
```

## Build

From Git Bash in this folder:

```bash
perl build.pl
```

That makes a **preview build** in `dist/`. It has yellow highlights on everything that needs Vered's
confirmation, a "preview" bar, and it's hidden from Google. The yellow button in the corner lists every
highlighted item on the page — click one to jump to it, or hide all the highlights for a clean look.

Once she has approved everything:

```bash
perl build.pl --final
```

That writes `dist-final/` with no highlights, no preview bar, and search engines allowed.

## Preview locally

```bash
powershell -File serve.ps1 -Root dist -Port 8790
```

Then open http://localhost:8790/ (Hebrew) or http://localhost:8790/en/ (English).

## Put it online (free)

1. Go to https://app.netlify.com/drop and sign in.
2. Drag the `dist` folder onto the page.
3. You get a link like `https://random-name.netlify.app`. In Site settings you can rename it
   (e.g. `vered-movement.netlify.app`) or connect a real domain later.
4. To update: rebuild, then drag the folder again in the site's **Deploys** tab.

After the site gets its real address, update `site_url` in `site.conf` and rebuild.

## Pages

| Page | Purpose |
|---|---|
| `index.html` | The landing page: hero, the micro-movement idea, who it's for, the five offerings, her story, reviews, how to start, Ein Hod, FAQ, contact |
| `library.html` | Her recommended books, podcasts, videos, teachers and simple home equipment |
| `accessibility.html` | Accessibility statement (expected of Israeli business sites) |

## Highlighting something for review

Inline text: `<span class="rv" data-note="Question for Vered">text</span>`
A whole block or image: `<div class="rv-block" data-note="Question for Vered">...</div>`

## Photos

The site currently uses generated artwork (`images/*.svg`) in every photo slot, each labelled with the
photo that belongs there. Replace them with Vered's own photos — she has ~700 Instagram posts to pull from.
Save each one at 1600px wide, and keep the same filename so nothing else has to change.

The share image (`images/og.png`, what WhatsApp shows when the link is sent) is a placeholder too, and
should become a real photo of Vered at 1200×630.

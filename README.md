# Egi Vegan Kitchen

Sito statico (HTML/CSS/JS vanilla, nessun backend) del blog di ricette vegane
"Egi Vegan Kitchen" — [egi_vegan_kitchen](https://www.instagram.com/egi_vegan_kitchen/) su Instagram.

## Struttura

- `index.html`, `ricette.html`, `preferiti.html`, `chi-sono.html`, `contatti.html`, `collabora.html` — pagine principali
- `recipe-*.html` — pagine delle singole ricette (105 al momento)
- `assets/style.css`, `assets/site.js` — stile e comportamento del sito
- `assets/images/` — immagini delle ricette e delle categorie
- `assets/fonts/` — font autoospitati
- `sitemap.xml`, `robots.txt` — SEO

Preferiti e lista della spesa sono salvati in `localStorage` nel browser di chi
visita il sito: non c'è nessun database o backend.

## Deploy

Il sito è pensato per essere pubblicato su Cloudflare Pages come sito statico:
nessun build command, directory di output = radice del repository.

<img src="assets/header-en.svg" alt="Mateo Pereyra, full-stack developer, Córdoba, Argentina. I design, build and operate systems in production.">

<p align="center">
  <a href="README.md">Español</a>
  &nbsp;·&nbsp;
  <b>English</b>
</p>

---

I build products end to end: from the database schema to the pixel, from the first commit to the server that has to hold it up. I founded **[Pulso](https://pulsosoftware.com)**, a custom software company in Córdoba, Argentina, and there are shops invoicing every day on systems I wrote myself.

I do not ship demos. I ship systems that stay running, and I stay close, measuring and fixing.

<br>

<img src="assets/pulse-en.svg" alt="Activity panel for the last 12 months: total contributions, current streak, longest streak and busiest day, with the day by day heatmap.">

<br>

## What I am building now

### Facturaza &nbsp;·&nbsp; in production

Invoicing at the moment of payment for self-employed people across Argentina. It reads what each person collects through Mercado Pago, Tiendanube, statements, screenshots and recurring fees, prepares the invoice with ARCA, the tax authority, the same day, and shows collected, invoiced and the yearly limit on a single line. Open to the public since October 2026.

`Next.js 16` `TypeScript` `Drizzle` `PostgreSQL 18` `AWS KMS` `Claude` `Railway` &nbsp;·&nbsp; [facturaza.com.ar](https://facturaza.com.ar)

### Pulso Gestión &nbsp;·&nbsp; under construction

A cloud business management system for any kind of shop: a counter that keeps selling offline, ARCA invoicing, stock, purchases read from a photo, current accounts, cash and double-entry accounting from the first sale. It runs on Windows, Android, iPhone and tablets. It is still at the foundations: it does not invoice or sell yet.

`Next.js 16` `TypeScript` `Drizzle` `PostgreSQL` `PWA`

### Localazo &nbsp;·&nbsp; in production

A subscription platform that gives a small shop two things: its own public website at `{shop}.localazo.com.ar` and a back office to run the day to day.

The decision that shapes the whole project is that **the core knows nothing about verticals**. Barbershop, beauty and takeaway food are already on sale, and each vertical plugs in through a contract in `verticales/` without touching a single line of `nucleo/`. Adding the next one should not cost a refactor.

`Next.js` `TypeScript` `Drizzle` `PostgreSQL` `Railway` &nbsp;·&nbsp; [localazo.com.ar](https://localazo.com.ar)

### Blussi &nbsp;·&nbsp; non-profit adoption app

An app to get rescued dogs and cats off the street and into a family. Nobody ever pays anything. Everything is browsable without an account: you only need one to post a rescue, save favourites and chat.

`Next.js 16` `React 19` `TypeScript` `PostgreSQL 18` `Railway` &nbsp;·&nbsp; [blussi.com.ar](https://blussi.com.ar)

### Pulso Devs &nbsp;·&nbsp; invite-only beta

A platform for freelance developers, built around the part of the job that is not coding. It opens section by section: profiles, threads and skills are already running.

`Next.js 16` `NestJS` `Prisma` `PostgreSQL` &nbsp;·&nbsp; [devs.pulsosoftware.com](https://devs.pulsosoftware.com)

<br>

## Systems in production

| System | What it solves | |
| :--- | :--- | :--- |
| **MyA Importaciones** | Counter sales, online store and wholesale on one base. Over 2,300 products with variants and photos. The invoice is issued automatically when the sale closes. | [live](https://myaimportaciones.com.ar) |
| **Isis Distribuidora** | Wholesale store and management system in one place: orders with picking sheets, current accounts, suppliers, stock, purchasing and reports, with a user per person. | [live](https://isisdistribuidora.catalogocba.com.ar) |
| **MasQ'Maní** | Website and back office for a peanut butter and natural foods brand. Orders go out over WhatsApp and the price list builds itself. | [live](https://masqmani.com.ar) |
| **Catálogos Pulso** | Every business gets a catalogue on its own subdomain, with its logo, its prices and a look for its industry. Domain provisioning runs itself. | [live](https://oficialtienda.catalogocba.com.ar) |
| **Logiweb Distribuciones** | Supplier price list imports, delivery notes exported to PDF and selling by half pack. | [live](https://logiweb.catalogocba.com.ar) |
| **El Paso del Elefante** | Warehouse control by rack and position, timed tasks, and current accounts in pesos and dollars. | [live](https://elpasodelelefante.com) |
| **Meli automation** | Several Mercado Libre accounts on one screen, with revenue, profit and margin already computed and each business kept separate. | |
| **Pulso control centre** | Internal console: clients, projects, tickets and payments. Production systems report into it, so I usually see the problem before the client does. | internal |

<br>

## Stack map

<img src="assets/stack-map-en.svg" alt="Stack map. Frontend: React, Next.js and TypeScript at high command, Tailwind solid, Capacitor in active use. Backend: NestJS and Prisma at high command, Node.js and PostgreSQL solid, Redis in active use. Integrations: MercadoPago and AFIP solid, Mercado Libre, WhatsApp and Gemini in active use. Infrastructure: Railway, Vercel and Git solid, Cloudflare and Docker in active use.">

<br>

## Engineering decisions

What actually shows how I work is not the list of technologies, it is the decisions and what they cost.

**A fake ARCA to test end to end** &nbsp;·&nbsp; *Facturaza*<br>
The issuing engine has two drivers, the real one and a fake one, so the whole flow can be tested without asking ARCA for a single receipt. The certificate key lives in AWS KMS. In invoicing, the expensive mistake is not the one you see on screen: it is the receipt that went out wrong and already has its authorization code.

**The core knows nothing about verticals** &nbsp;·&nbsp; *Localazo*<br>
A new vertical enters through the `verticales/` contract. If adding barbershop means touching `nucleo/`, the contract is badly designed. It costs more up front and pays for itself on the second vertical.

**Idempotent migrations, no migration engine** &nbsp;·&nbsp; *Blussi*<br>
A list of statements that runs in full on every cold start, taking a Postgres lock so two lambdas do not collide creating the same index. Schema changes are appended at the end and old ones are never edited, because they already ran in production. Fewer moving parts to maintain, and the real state of the database reads in a single pass.

**One commit, two domains, one variable** &nbsp;·&nbsp; *Blussi*<br>
The waitlist and the full app are the same build, separated by one environment variable. A proxy sends any route that should not be reachable yet back to the landing, so nobody stumbles into a half-finished product by guessing a URL. On launch day you change the variable, not the code.

**Real multi-tenancy** &nbsp;·&nbsp; *Pulso platform*<br>
Every shop runs on its own domain, with its own brand and isolated data. A reseller subdomain is created and verified automatically against the Vercel API: the shop adds the reseller and the catalogue goes live.

**From the counter to the invoice, in one flow**<br>
A sale at the point of sale drops stock, charges through MercadoPago and issues the AFIP invoice without leaving the screen. The hard part is not each integration on its own: it is making all three fail well when one of them goes down.

**An assistant that does not invent inventory**<br>
It answers only with the shop's real products, stock and prices, with prompt injection defences, and hands the conversation to a human when the sale gets serious. An assistant that hallucinates stock does more damage than no assistant at all.

<br>

## Education

**Software Development Diploma** &nbsp;·&nbsp; in progress, a few subjects from finishing.

Twelve certifications earned along the way:

| | | |
| :--- | :--- | :--- |
| Web development | Backend design and architecture | Scrum |
| JavaScript | Backend testing and scalability | Prompt engineering for AI |
| React | QA testing | Digital culture |
| Java | Cybersecurity | Advanced English |

<br>

## Track record

| | |
| :--- | :--- |
| **2022** | First client: the site for a roleplay server, hand built and delivered on time. It produced the one rule I still follow, which is to listen before writing code. |
| **2023** | Referrals start coming in. First real integrations: direct checkout with Mercado Pago inside the store. |
| **2024** | The diploma begins. Architecture, performance, quality and security stop being learned on the fly. |
| **2025** | The first complete management system, designed for one business from day one. |
| **jun 2026** | The first company selling on the system. Full migration without losing a single record. |
| **2026** | Pulso becomes a company, with several projects running in parallel. |
| **oct 2026** | Facturaza opens to the public and construction of Pulso Gestión begins. |

<br>

## Contact

**[pulsosoftware.com](https://pulsosoftware.com)** &nbsp;·&nbsp; [mateovpereyra@gmail.com](mailto:mateovpereyra@gmail.com)

<sub>Most of what I build is client code and lives in private repositories. What can be looked at is linked above, running.</sub>

# ReviewWeb.site

ReviewWeb.site is a tool that utilizes AI to helps you to scan through the websites and provide feedbacks based on the content.
Use case:
- You have a website and want to know how good it is
- You want to know how to improve your website
- You want to know how to market your website
- You want to know if the website is good for SEO
- You want to know if the website contains inappropriate content
- You want to know if the website is mobile-friendly
- You want to know if the website is secure or contains malware

## Stack

[x] Node.js (TypeScript)
[x] Express.js
[x] Prisma (PostgreSQL)
[x] Auth (Lucia)
[x] Zod
[x] Template Engine (EJS)
[x] Styling with TailwindCSS
[x] Commitlint
[ ] Swagger UI

Uses **PostgreSQL** database.

## Development

Create `.env` from `.example.env`

Then:

```bash
bun i
bun dev
```

## Docker

```bash
docker build -t local/bun-express-starter -f Dockerfile .
docker run -p 3000:3000 local/bun-express-starter
# OR
docker compose up
```

## Deploy with [DXUP](https://dxup.dev)

```bash
dx up
# dx up --prod
```

## CI/CD

- [x] Github Actions: Create Pull Request to `main` branch will trigger a build and push to `preview` environment
- [x] Github Actions: Merge Pull Request to `main` branch will trigger a build and push to `production` environment

## Author

Please feel free to contribute to this project!

- X: [Goon Nguyen](https://x.com/goon_nguyen)
- CTO at [TOP GROUP](https://wearetopgroup.com), [DIGITOP](https://digitop.vn) & [XinChao Live Music](https://xinchao.world)

## Check out my other products

- [DigiCord AI](https://digicord.site) - The Most Useful AI Chatbot on Discord
- [IndieBacklink.com](https://indiebacklink.com) - Indie Makers Unite: Feature, Support, Succeed
- [BoostTogether.com](https://boosttogether.com) - The Power of WE in Advertising
- [TopRanking.ai](https://topranking.ai) - AI Directory, listing AI products
- [ZII.ONE](https://zii.one) - Personalized Link Shortener
- [VidCap.xyz](https://vidcap.xyz) - Extract Youtube caption, download videos, capture screenshot, summarize,…
- [ReadTube.me](https://readtube.me) - Write blog articles based on Youtube videos
- [AIVN.Site](https://aivn.site) - Face Swap, Remove BG, Photo Editor,…
- [GetViral.Now](https://getviral.now) - KOL booking better together!

Thank you!
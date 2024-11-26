# ReviewWeb.site

[ReviewWeb.site](https://reviewweb.site) is a tool that utilizes AI to helps you to scan through the websites and provide feedbacks based on the content.

Use case:
- You have a website and want to know how good it is
- You want to know how to improve your website
- You want to know how to market your website
- You want to know if the website is good for SEO
- You want to know if the website contains inappropriate content
- You want to know if the website is mobile-friendly
- You want to know if the website is secure or contains malware

### Workflow:
- A user inputs a website url
- A user provides prompt instructions for the review
- After submitting, the system will start the review by crawling the website, analyzing the content, and take screenshots, then generate the report
- The user can review the result and download the report

### APIs
| Method | Endpoint               | Body Params                                                          | Description             |
| ------ | ---------------------- | -------------------------------------------------------------------- | ----------------------- |
| GET    | `/api/v1/healthz`      | -                                                                    | Health check endpoint   |
| GET    | `/api/v1/api_key`      | -                                                                    | Retrieve API key        |
| POST   | `/api/v1/upload`       | -                                                                    | Upload endpoint         |
| GET    | `/api/v1/profile`      | -                                                                    | Get user profile        |
| POST   | `/api/v1/screenshot`   | -                                                                    | Take website screenshot |
| -      | -                      | `url` (required): website url to screenshot                          |                         |
| -      | -                      | `full_page` (optional): full page screenshot (default: `false`)      |                         |
| -      | -                      | `viewport_width` (optional): screenshot width (default: `1400`)      |                         |
| -      | -                      | `viewport_height` (optional): screenshot height (default: `800`)     |                         |
| -      | -                      | `device_scale_factor` (optional): device scale factor (default: `1`) |                         |
| -      | -                      | `is_mobile` (optional): mobile screenshot (default: `false`)         |                         |
| POST   | `/api/v1/review`       | -                                                                    | Review a website        |
| -      | -                      | `url` (required): website url to review                              |                         |
| -      | -                      | `instructions`: review instructions                                  |                         |
| POST   | `/api/v1/review/batch` | -                                                                    | Batch review websites   |
| -      | -                      | `urls`: list of website urls (comma-separated)                       |                         |
| -      | -                      | `instructions`: review instructions                                  |                         |

## Stack

- [x] Node.js (TypeScript)
- [x] Express.js
- [x] Prisma (PostgreSQL)
- [x] Auth (Lucia)
- [x] Zod
- [x] Template Engine (EJS)
- [x] Styling with TailwindCSS
- [x] Commitlint
- [ ] Swagger UI

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

- [ ] Github Actions: Create Pull Request to `main` branch will trigger a build and push to `preview` environment
- [ ] Github Actions: Merge Pull Request to `main` branch will trigger a build and push to `production` environment

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
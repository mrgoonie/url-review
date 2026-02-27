# X/Twitter Replies: Solutions Research

**Date:** 2026-02-27
**Context:** Webapp already reads tweet content via edge solution; need replies/comments.

---

## TL;DR Recommendation

**Best pick: [SocialData.tools](https://socialdata.tools)** — REST API, $0.0002/tweet (~$0.20/1K), supports `conversation_id` search + dedicated "Get tweet comments" endpoint. Lowest cost with easiest integration for an existing API-based webapp.

**Runner-up: [TwitterAPI.io (KaitoAPI)](https://twitterapi.io)** — has dedicated `Get Tweet Replies V2` endpoint, pagination, sorting. $0.15/1K tweets pay-as-you-go.

---

## 1. Free / Open-Source

### twscrape (Python)
- **Cost:** Free
- **How:** Uses Twitter internal API with user account auth. Has `tweet_replies TWEET_ID --limit=N` command.
- **Rate limits:** Depends on accounts used; rotating accounts helps
- **Replies:** Yes, dedicated method
- **Integration:** Python lib, not REST — needs a wrapper service
- **Risk:** HIGH. Guest tokens expire, doc_ids rotate every 2-4 weeks, datacenter IPs banned Jan 2025. Requires real Twitter accounts. ToS violation.
- **Reliability:** Low — requires ongoing maintenance
- **Repo:** [github.com/vladkens/twscrape](https://github.com/vladkens/twscrape)

### twikit (Python)
- **Cost:** Free
- **How:** Uses Twitter internal API, no API key needed
- **Replies:** Yes
- **Risk:** HIGH — same issues as twscrape. ToS violation.
- **Repo:** [github.com/d60/twikit](https://github.com/d60/twikit)

### twint
- **Status:** DEAD. Unmaintained, broken since 2023 API changes.

**Verdict on free scrapers:** Fragile, high maintenance, ToS risk, not suitable for production webapp.

---

## 2. Freemium / Cheap Third-Party APIs

### SocialData.tools
- **Cost:** $0.0002/tweet ($0.20/1K) — pay-as-you-go, no minimum
- **Replies endpoint:** `GET /tweet/comments` + search with `conversation_id:TWEET_ID`
- **Rate limits:** Fair-use 3 req/min free; beyond that charged per request
- **All replies or top-level only?** Returns all replies via pagination
- **Integration:** REST API — very easy
- **Risk:** Low (managed scraping service, not official API)
- **Reliability:** High — managed service with SLA
- **Docs:** [docs.socialdata.tools](https://docs.socialdata.tools/reference/get-search-results/)

### TwitterAPI.io (KaitoAPI)
- **Cost:** $0.15/1K tweets ($0.00015/tweet), $1 free signup credit
- **Replies endpoints:**
  - `Get Tweet Replies V2` — paginated, 20/page, sort by Relevance/Latest/Likes
  - `Get Tweet Replies` — ordered by time
  - `Get Tweet Thread Context` — full conversation thread
- **Rate limits:** 1000+ queries/second supported
- **All replies?** Yes, via cursor pagination
- **Integration:** REST API — easy
- **Risk:** Low (managed service)
- **Reliability:** High
- **Docs:** [docs.twitterapi.io](https://docs.twitterapi.io)

### Apify Twitter Reply Scrapers
- **Cost:** $0.20-$0.40/1K tweets (pay-per-result actors)
- **Replies:** Yes — dedicated "Twitter Reply Scraper" actor
- **Integration:** REST API (Apify platform) or SDK
- **Risk:** Low-Medium (actor-based, community maintained)
- **Reliability:** Medium — actor quality varies by maintainer
- **Link:** [apify.com/fastcrawler/twitter-reply-scraper](https://apify.com/fastcrawler/twitter-reply-scraper-0-2-1k-tweets-pay-per-result-2025)

---

## 3. Official X API v2

### Free Tier
- **Cost:** $0/month
- **Read access:** WRITE-ONLY effectively. 1 req/24hrs on most endpoints.
- **Replies:** NOT AVAILABLE. Free tier cannot read tweet data at scale.

### Basic Tier
- **Cost:** $200/month (recently moved toward pay-as-you-go as of Feb 2026)
- **Read:** 15,000 read requests/month; ~50K writes
- **Replies via search:** `search/recent` with `conversation_id:TWEET_ID` — returns replies as tweets
- **All replies?** Paginated yes, but limited by monthly read quota
- **Integration:** REST API, well-documented
- **Risk:** None (official)
- **Reliability:** Highest
- **Limitation:** 15K reads/month burns fast with reply threads; effectively $200/month for limited use

### Pro Tier
- **Cost:** ~$5,000/month
- **Overkill** for most use cases

### New Pay-As-You-Go (Feb 2026)
- X announced usage-based pricing model (closed beta as of research date)
- Could be viable but not yet widely available

**Official API verdict:** Free tier useless for replies. Basic at $200/month is expensive for reply reading given the low read quota. Not recommended unless compliance/ToS is a hard requirement.

---

## 4. Summary Comparison Table

| Solution | Cost/1K replies | REST API | All replies | Reliability | Risk |
|---|---|---|---|---|---|
| twscrape (OSS) | Free | No (Python) | Yes | Low | High (ToS) |
| twikit (OSS) | Free | No (Python) | Yes | Low | High (ToS) |
| **SocialData.tools** | **$0.20** | **Yes** | **Yes** | **High** | **Low** |
| **TwitterAPI.io** | **$0.15** | **Yes** | **Yes** | **High** | **Low** |
| Apify actors | $0.20-$0.40 | Yes | Yes | Medium | Low |
| X API Free | $0 | Yes | No | High | None |
| X API Basic | ~$13.33* | Yes | Yes (limited) | Highest | None |

*$200/month ÷ 15K reads

---

## Recommended Approach

1. **Start with TwitterAPI.io** — cheapest at $0.15/1K, has dedicated replies endpoint with pagination/sorting, $1 free credit to test immediately
2. **SocialData.tools** as alternative — `conversation_id` search approach is simpler if TwitterAPI.io has issues
3. **Avoid official X API** unless legal/compliance forces it — 100x more expensive for same data
4. **Avoid OSS scrapers** for production — maintenance burden + account risk not worth it

**Integration pattern** (either API):
```
GET /tweet/replies?tweet_id=TWEET_ID&cursor=...
→ paginate until all replies collected
→ cache results (replies don't change much)
```

---

## Unresolved Questions

1. Does the existing "edge solution" for tweet content use TwitterAPI.io or SocialData? If so, use same vendor for replies (simpler billing + already integrated).
2. Volume estimate needed — at $0.15-$0.20/1K, 1M replies/month = $150-$200. Need to know expected scale.
3. TwitterAPI.io "Get Tweet Replies V2" returns max 20/page — need to confirm if deep threads (500+ replies) are fully accessible via pagination.
4. X's new pay-as-you-go model (Feb 2026 beta) — worth monitoring if compliance becomes a requirement.

---

## Sources

- [TwitterAPI.io Pricing](https://twitterapi.io/pricing)
- [TwitterAPI.io Docs (llms.txt)](https://docs.twitterapi.io/llms.txt)
- [SocialData Pricing](https://docs.socialdata.tools/getting-started/pricing)
- [SocialData Get Search Results](https://docs.socialdata.tools/reference/get-search-results/)
- [twscrape GitHub](https://github.com/vladkens/twscrape)
- [twikit GitHub](https://github.com/d60/twikit)
- [Apify Twitter Reply Scraper](https://apify.com/fastcrawler/twitter-reply-scraper-0-2-1k-tweets-pay-per-result-2025)
- [X API Pricing 2025 - twitterapi.io blog](https://twitterapi.io/blog/twitter-api-pricing-2025)
- [Top Twitter/X Data API Providers Compared 2026](https://www.netrows.com/blog/top-twitter-x-data-api-providers-2026)
- [Scraping Twitter 2025 - DEV Community](https://dev.to/sivarampg/scraping-twitter-in-2025-a-developers-guide-to-surviving-the-api-apocalypse-5bbd)

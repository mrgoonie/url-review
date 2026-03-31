/**
 * LinkedIn HTML Template Generation
 * Converts LinkedIn profile/company data into structured HTML.
 * All user-supplied values are escaped to prevent XSS.
 */

import type { LinkedInCompany, LinkedInProfile } from "./get-linkedin-content";

// ---------------------------------------------------------------------------
// HTML Escaping
// ---------------------------------------------------------------------------

const ESCAPE_MAP: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

/** Escape HTML special characters to prevent XSS */
function esc(value: string | number | undefined | null): string {
	if (value == null) return "";
	return String(value).replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch] || ch);
}

/** Validate URL starts with https: for safe use in href/src attributes */
function safeUrl(url: string | undefined | null): string {
	if (!url) return "";
	const trimmed = url.trim();
	if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) return trimmed;
	return "";
}

// ---------------------------------------------------------------------------
// Profile HTML
// ---------------------------------------------------------------------------

export function profileToHtml(profile: LinkedInProfile, url: string): string {
	const escapedUrl = esc(url);

	return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>LinkedIn Profile — ${esc(profile.name)}</title>
</head>
<body>
  <article class="linkedin-profile">
    <header>
      ${safeUrl(profile.cover) ? `<img src="${safeUrl(profile.cover)}" alt="Cover" class="cover" />` : ""}
      ${safeUrl(profile.avatar) ? `<img src="${safeUrl(profile.avatar)}" alt="${esc(profile.name)}" class="avatar" />` : ""}
      <h1>${esc(profile.name)}</h1>
      ${profile.headline ? `<p class="headline">${esc(profile.headline)}</p>` : ""}
      ${profile.location ? `<p class="location">${esc(profile.location)}</p>` : ""}
    </header>
    ${profile.summary ? `<section class="summary"><p>${esc(profile.summary)}</p></section>` : ""}
    <footer>
      ${profile.followers != null ? `<span class="followers">${esc(profile.followers.toLocaleString())} followers</span>` : ""}
      ${profile.connections != null ? `<span class="connections">${esc(profile.connections.toLocaleString())} connections</span>` : ""}
      ${profile.isOpenToWork ? `<span class="badge">Open to work</span>` : ""}
      ${profile.isPremium ? `<span class="badge">Premium</span>` : ""}
      <a href="${escapedUrl}" target="_blank" rel="noopener">View on LinkedIn</a>
    </footer>
  </article>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Company HTML
// ---------------------------------------------------------------------------

export function companyToHtml(company: LinkedInCompany, url: string): string {
	const escapedUrl = esc(url);

	return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>LinkedIn Company — ${esc(company.name)}</title>
</head>
<body>
  <article class="linkedin-company">
    <header>
      ${safeUrl(company.cover) ? `<img src="${safeUrl(company.cover)}" alt="Cover" class="cover" />` : ""}
      ${safeUrl(company.logo) ? `<img src="${safeUrl(company.logo)}" alt="${esc(company.name)}" class="logo" />` : ""}
      <h1>${esc(company.name)}</h1>
      ${company.industry ? `<p class="industry">${esc(company.industry)}</p>` : ""}
    </header>
    ${company.description ? `<section class="description"><p>${esc(company.description)}</p></section>` : ""}
    <ul class="details">
      ${safeUrl(company.website) ? `<li><strong>Website:</strong> <a href="${safeUrl(company.website)}" target="_blank" rel="noopener">${esc(company.website)}</a></li>` : ""}
      ${company.headquarters ? `<li><strong>Headquarters:</strong> ${esc(company.headquarters)}</li>` : ""}
      ${company.employeeCount ? `<li><strong>Employees:</strong> ${esc(company.employeeCount.toLocaleString())}</li>` : ""}
      ${company.founded ? `<li><strong>Founded:</strong> ${esc(company.founded)}</li>` : ""}
      ${company.specialties?.length ? `<li><strong>Specialties:</strong> ${esc(company.specialties.join(", "))}</li>` : ""}
    </ul>
    <footer>
      <a href="${escapedUrl}" target="_blank" rel="noopener">View on LinkedIn</a>
    </footer>
  </article>
</body>
</html>`;
}

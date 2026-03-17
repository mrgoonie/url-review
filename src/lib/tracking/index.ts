const stringToArray = (str: string | undefined): Array<string> => {
  if (!str) return [];
  return `${str}`.split(",");
};

export const gaIds = stringToArray(process.env.NEXT_PUBLIC_GA_ID) ?? [];
export const gtmIds = stringToArray(process.env.NEXT_PUBLIC_GTM_ID) ?? [];
export const fbPixelIds = stringToArray(process.env.NEXT_PUBLIC_FACEBOOK_PIXEL) ?? [];

/**
 * Track page view of the website
 * @example
 * gaPage("/home", "Home page");
 */

export const gaPage = (path: string, title: string = "Not specified") => {
  try {
    gaIds.forEach((id) => {
      (window as any).gtag("config", id, {
        page_title: title,
        page_path: path,
      });
    });
  } catch (e) {
    console.warn(`[GaTracking] Track page "${path}" failed.`);
  }
};

/**
 * Track event of the website
 * @example
 * gaEvent("interaction", "click", "View more");
 */
export const gaEvent = (category: string, action: string, label: string) => {
  console.log(category, action, label);
  try {
    (window as any).gtag("event", action, {
      event_category: category,
      event_label: label,
    });
  } catch (e) {
    console.warn(
      `[GaTracking] Track event "Category: ${category} > Action: ${action} > Label: ${label}" failed.`
    );
  }
};

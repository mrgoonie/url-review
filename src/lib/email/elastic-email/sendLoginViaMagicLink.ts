import { replace } from "lodash";

import AppConfig from "@/config/AppConfig";
import type { IElasticSend } from "@/lib/email/elastic-email";
import elasticSend from "@/lib/email/elastic-email";

const template = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333; }
  .email-container { max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; }
  .brand-header { background-color: #0052cc; color: #ffffff; padding: 10px 20px; text-align: center; }
  .brand-header img { max-height: 50px; }
  .email-body { padding: 20px; text-align: center; }
  .button { background-color: #28a745; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
  .email-footer { background-color: #f1f1f1; color: #555; text-align: center; padding: 10px 20px; font-size: 12px; }
</style>
</head>
<body>
<div class="email-container">
  <div class="brand-header">
    <!-- Replace src value with your logo image link -->
    <img src="{{LogoUrlLink}}" alt="Logo">
  </div>
  <div class="email-body">
    <h2>Secure Login Link</h2>
    <p>You or someone else has requested to log in to your {{AppName}} account. You can securely log in by clicking the button below:</p>
    <a href="{{MagicLink}}" class="button">Log In</a>
    <p>This link is valid for 15 minutes and can only be used once. If you did not request this, you can safely ignore this email. No changes have been made to your account.</p>
    <p>If you’re having trouble clicking the "Log In" button, copy and paste the URL below into your web browser:</p>
    <!-- Optionally, include the raw link for users who cannot click the button -->
    <p><a href="{{MagicLink}}">{{MagicLink}}</a></p>
  </div>
  <div class="email-footer">
    © {{Year}} {{AppName}}. All rights reserved.
  </div>
</div>
</body>
</html>

`;

const makeContent = ({ url }) => {
  const currentYear = new Date().getFullYear();

  const appName = AppConfig.siteName;

  return template
    .replace("{{LogoUrlLink}}", AppConfig.getBaseUrl("/assets/images/logo-icon.svg"))
    .replace(/{{MagicLink}}/g, url)
    .replace(/{{AppName}}/g, appName)
    .replace("{{Year}}", `${currentYear}`);
};

interface ISendVerificationCode extends Omit<IElasticSend, "content"> {
  content: {
    url: string;
  };
}

export default async function sendLoginViaMagicLink(params: ISendVerificationCode) {
  //
  try {
    const content = makeContent(params.content);
    return await elasticSend({
      ...params,
      content,
    });
  } catch (error) {
    throw new Error(
      `sendVerificationCode failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

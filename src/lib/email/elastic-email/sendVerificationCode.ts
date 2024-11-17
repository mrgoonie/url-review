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
  .verification-code { font-size: 24px; margin: 20px; padding: 10px; border-radius: 5px; background-color: #e7f4ff; display: inline-block; }
  .email-footer { background-color: #f1f1f1; color: #555; text-align: center; padding: 10px 20px; font-size: 12px; }
  .button { background-color: #0052cc; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
</style>
</head>
<body>
<div class="email-container">
  <div class="brand-header">
    <!-- Replace src value with your logo image link -->
    <img src="{{UrlLogo}}" alt="Logo">
  </div>
  <div class="email-body">
    <h2>Email Verification Needed</h2>
    <p>Thanks for signing up for {{AppName}}! To get started, please verify your email address by entering the code below on the verification page:</p>
    <div class="verification-code">{{VerificationCode}}</div>
    <p>Or, click the button below to automatically verify your email:</p>
    <a href="{{VerificationLink}}" class="button">Verify Email</a>
    <p>If you didn’t request this email, there’s nothing to worry about — you can safely ignore it.</p>
  </div>
  <div class="email-footer">
    © {{Year}} {{AppName}}. All rights reserved.
  </div>
</div>
</body>
</html>

`;

const makeContent = ({ verificationLink, code }) => {
  const currentYear = new Date().getFullYear();

  const appName = AppConfig.siteName;

  return template
    .replace("{{LogoUrlLink}}", AppConfig.getBaseUrl("/assets/images/logo-icon.svg"))
    .replace("{{VerificationLink}}", verificationLink)
    .replace("{{VerificationCode}}", code)
    .replace(/{{AppName}}/g, appName)
    .replace("{{Year}}", `${currentYear}`);
};

interface ISendVerificationCode extends Omit<IElasticSend, "content"> {
  content: {
    verificationLink: string;
    code: string;
  };
}

export default async function sendVerificationCode(params: ISendVerificationCode) {
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

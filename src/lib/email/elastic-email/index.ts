import * as ElasticEmail from "@elasticemail/elasticemail-client";

import { env } from "@/env";
import { isValidEmail } from "@/lib/utils/email";

const defaultClient = ElasticEmail.ApiClient.instance;

const apikey = defaultClient.authentications.apikey;
apikey.apiKey = env.ELASTIC_EMAIL_APIKEY;
const api = new ElasticEmail.EmailsApi();

export interface IElasticSend {
  subject: string;
  content: string;
  from?: string;
  to: string;
}

export default async function elasticSend({
  content,
  to,
  subject,
  from = process.env.ELASTIC_EMAIL_FROM,
}: IElasticSend) {
  try {
    return await new Promise((resolve, reject) => {
      if (!content) throw new Error("Need content");
      if (!from) throw new Error("Need sender");
      if (!to) throw new Error("Need recipient");

      console.log(`🚀 Sending email from "${from}" to "${to}"`);

      // Check email format
      if (!isValidEmail(from) || !isValidEmail(to)) {
        throw new Error("Invalid email address");
      }

      // Set up the email data.
      const email = ElasticEmail.EmailMessageData.constructFromObject({
        Recipients: [new ElasticEmail.EmailRecipient(to)],
        Content: {
          Body: [
            ElasticEmail.BodyPart.constructFromObject({
              ContentType: "HTML",
              Content: content,
            }),
          ],
          From: from,
          Subject: subject,
        },
      });

      const callback = function (error, data, response) {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      };
      api.emailsPost(email, callback);
    });
  } catch (error) {
    console.log("🚨 ElasticSend failed: ", error);
    throw new Error(
      `ElasticSend failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

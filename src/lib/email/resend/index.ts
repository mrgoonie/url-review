import "server-only";

import { Resend } from "resend";

import { EmailTemplate } from "@/components/email/subscription";
import { WaitlistConfirmation } from "@/components/email/waitlist-confirmation";
import EmailWaitlistOffer from "@/components/email/waitlist-offer";
import { env } from "@/env";

const resend = new Resend(env.RESEND_API_KEY || "123");

export type Recipient = {
  name: string;
  email: string;
};

async function sendEmail(recipients: Recipient[]) {
  const { data, error } = await resend.emails.send({
    from: "Goon <goon@indiebacklink.com>",
    to: [recipients[0]?.email || "duy@wearetopgroup.com"],
    subject: "Welcome to IndieBacklink - Thank you for signing up.",
    react: EmailTemplate({ firstName: recipients[0]?.name || "buddy" }),
    text: "",
  });

  return { data, error } as {
    data: { id: string };
    error: { statusCode: number; message: string } | null;
  };
}

export async function sendWaitlistOfferEmail(recipients: Recipient[]) {
  return recipients.map((recipient) => {
    return resend.emails.send({
      from: "Goon <goon@indiebacklink.com>",
      to: [recipient.email],
      subject: "IndieBacklink - Welcome Aboard, Early Adopter!",
      react: WaitlistConfirmation({ firstName: recipient.name || "buddy" }),
      text: "",
    });
  });
}

export default sendEmail;

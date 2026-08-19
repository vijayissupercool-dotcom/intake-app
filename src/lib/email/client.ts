import { Resend } from "resend";
import { env } from "@/lib/config/env";

const resend = new Resend(env.email.apiKey);

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react?: React.ReactNode;
  html?: string;
  from?: string;
}

export async function sendEmail({
  to,
  subject,
  react,
  html,
  from = env.email.from,
}: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    react,
    html,
  });

  if (error) {
    console.error("Failed to send email:", error);
    throw new Error(`Email send failed: ${error.message}`);
  }

  return data;
}

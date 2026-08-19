import { sendEmail } from "@/lib/email/client";
import { env } from "@/lib/config/env";

interface NotifyUploadParams {
  toEmail: string;
  requestTitle: string;
  fileName: string;
  fileSizeMb: string;
  uploaderName?: string;
  requestUrl: string;
}

export async function sendNewUploadEmail({
  toEmail,
  requestTitle,
  fileName,
  fileSizeMb,
  uploaderName,
  requestUrl,
}: NotifyUploadParams) {
  const subject = `New file received: ${fileName}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #111; margin: 0 0 8px;">New file received</h1>
      <p style="color: #555; margin: 0 0 24px;">
        A file has been uploaded to <strong>${requestTitle}</strong>.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 8px; color: #888;">File</td>
          <td style="padding: 8px; font-weight: 600;">${fileName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; color: #888;">Size</td>
          <td style="padding: 8px; font-weight: 600;">${fileSizeMb}</td>
        </tr>
        ${
          uploaderName
            ? `<tr>
          <td style="padding: 8px; color: #888;">Uploaded by</td>
          <td style="padding: 8px; font-weight: 600;">${uploaderName}</td>
        </tr>`
            : ""
        }
      </table>
      <a href="${requestUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        View request
      </a>
    </div>
  `;

  await sendEmail({
    to: toEmail,
    subject,
    html,
    from: env.email.from,
  });
}
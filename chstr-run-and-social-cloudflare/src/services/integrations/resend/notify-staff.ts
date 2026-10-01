import type { ServerEnvironment } from '@/services/environment/server-environment';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export async function notifyStaff(input: { subject: string; text: string }, env: ServerEnvironment) {
  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.NOTIFICATION_FROM_EMAIL,
      to: [env.STAFF_NOTIFICATION_EMAIL],
      subject: input.subject,
      text: input.text,
    }),
  });
  if (!response.ok) throw new Error(`Staff notification failed with status ${response.status}.`);
  return { sent: true };
}

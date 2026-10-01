import { createCheckout, readWebhook } from '@/services/payments/run-payment';
import { completeGoogleSignIn } from '@/services/integrations/google/google-oidc';
import { notifyStaff } from '@/services/integrations/resend/notify-staff';
import type { ServerEnvironment } from '@/services/environment/server-environment';

type Effect = 'read' | 'write';

/** `provider` is a label for the audit line; payment operations name the chosen provider from their input. */
const operations = {
  'payment.createCheckout': { provider: (input: { providerId: string }) => input.providerId, effect: 'write' as Effect, run: createCheckout },
  'payment.readWebhook': { provider: (input: { providerId: string }) => input.providerId, effect: 'read' as Effect, run: readWebhook },
  'google.completeSignIn': { provider: () => 'google', effect: 'read' as Effect, run: completeGoogleSignIn },
  'resend.notifyStaff': { provider: () => 'resend', effect: 'write' as Effect, run: notifyStaff },
};

type OperationId = keyof typeof operations;
type OperationInput<Id extends OperationId> = Parameters<(typeof operations)[Id]['run']>[0];
type OperationOutput<Id extends OperationId> = Awaited<ReturnType<(typeof operations)[Id]['run']>>;

/** The only way application code reaches a third party. Logs one audit line per call, never the payload. */
export async function runOperation<Id extends OperationId>(
  id: Id,
  input: OperationInput<Id>,
  env: ServerEnvironment,
): Promise<OperationOutput<Id>> {
  const operation = operations[id];
  const provider = (operation.provider as (input: OperationInput<Id>) => string)(input);
  const startedAt = Date.now();
  try {
    // The union of handler signatures is not callable directly; the Id generic keeps input/output aligned.
    const result = await (operation.run as (input: OperationInput<Id>, env: ServerEnvironment) => Promise<OperationOutput<Id>>)(input, env);
    console.log(JSON.stringify({ operation: id, provider, effect: operation.effect, status: 'ok', durationMs: Date.now() - startedAt }));
    return result;
  } catch (error) {
    console.log(JSON.stringify({ operation: id, provider, effect: operation.effect, status: 'error', durationMs: Date.now() - startedAt }));
    throw error;
  }
}

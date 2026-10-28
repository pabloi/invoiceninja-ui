import { InvoiceStatus } from '../enums/invoice-status';
import type { Invoice } from '../interfaces/invoice';

export const CFE_EMISSION_WARNING =
  'This emits a CFE (e-Ticket or e-Factura) to DGI. It cannot be deleted afterwards.';

export const CFE_CANCELLATION_WARNING =
  'The CFE remains valid at DGI. You must issue a credit note separately, for example in the SICFE portal. Cancelling here does not issue a credit note.';

export function hasCfe(invoice: Pick<Invoice, 'backup'>) {
  return Boolean(invoice.backup?.guid);
}

export function needsCfeConfirmation(
  invoices: Pick<Invoice, 'backup' | 'status_id'>[]
) {
  return invoices.some(
    (invoice) =>
      (!invoice.status_id || invoice.status_id === InvoiceStatus.Draft) &&
      !hasCfe(invoice)
  );
}

export function canRetryCfe(invoice: Pick<Invoice, 'backup' | 'is_deleted'>) {
  return (
    !invoice.is_deleted &&
    !hasCfe(invoice) &&
    ['rejected', 'failed'].includes(invoice.backup?.cfe_status || '')
  );
}

export function cfeQrUrl(value?: string | null) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

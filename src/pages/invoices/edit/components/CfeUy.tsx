import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import { endpoint } from '$app/common/helpers';
import { canRetryCfe, cfeQrUrl, hasCfe } from '$app/common/helpers/cfe-uy';
import { request } from '$app/common/helpers/request';
import { toast } from '$app/common/helpers/toast/toast';
import { useHasPermission } from '$app/common/hooks/permissions/useHasPermission';
import { useCompanyCfeUy } from '$app/common/hooks/useCompanyCfeUy';
import { $refetch } from '$app/common/hooks/useRefetch';
import { Invoice } from '$app/common/interfaces/invoice';
import { Card, Element } from '$app/components/cards';
import { Button, Link } from '$app/components/forms';
import type { Context } from './Verifactu';

export default function CfeUy() {
  const { invoice, setInvoice } = useOutletContext<Context>();
  const enabled = useCompanyCfeUy();
  const hasPermission = useHasPermission();
  const [t] = useTranslation();
  const [busy, setBusy] = useState(false);

  const refresh = async (retry = false) => {
    if (!invoice?.id || busy) return;
    setBusy(true);
    try {
      if (retry)
        await request(
          'PUT',
          endpoint('/api/v1/invoices/:id?retry_e_send=true', {
            id: invoice.id,
          }),
          {}
        );
      const response = await request(
        'GET',
        endpoint('/api/v1/invoices/:id?is_locked=true', { id: invoice.id })
      );
      const fresh = response.data.data as Invoice;
      setInvoice((current) =>
        current?.id === fresh.id
          ? {
              ...current,
              backup: fresh.backup,
              status_id: fresh.status_id,
              is_locked: fresh.is_locked,
            }
          : current
      );
      $refetch(['invoices']);
    } catch {
      toast.error();
    } finally {
      setBusy(false);
    }
  };

  if (!enabled || !invoice) return null;
  const backup = invoice.backup;
  const status = hasCfe(invoice)
    ? 'emitted'
    : backup?.cfe_status || 'not_emitted';
  const qr = cfeQrUrl(backup?.cfe_link_qr);
  const type = String(backup?.cfe_tipo || '');
  const typeLabel = ['101', '102', '103'].includes(type)
    ? 'e-Ticket'
    : ['111', '112', '113'].includes(type)
      ? 'e-Factura'
      : '';

  return (
    <Card
      title="CFE (Uruguay)"
      topRight={
        <Button
          behavior="button"
          onClick={() => void refresh()}
          disabled={busy}
        >
          {t('refresh')}
        </Button>
      }
    >
      <Element leftSide={t('status')}>
        <span role="status">
          {t(`cfe_status_${status}`, {
            defaultValue: status.replace('_', ' '),
          })}
        </span>
      </Element>
      <Element leftSide={t('type')}>
        {type ? `${typeLabel} (${type})` : '—'}
      </Element>
      <Element leftSide={t('number')}>
        {[backup?.cfe_serie, backup?.cfe_numero].filter(Boolean).join(' ') ||
          '—'}
      </Element>
      <Element leftSide="CAE">{backup?.guid || '—'}</Element>
      {qr && (
        <Element leftSide="QR">
          <Link external to={qr}>
            {t('cfe_verify', { defaultValue: 'Verify CFE' })}
          </Link>
        </Element>
      )}
      {backup?.cfe_error && (
        <Element leftSide={t('message')}>
          <span role="alert" className="whitespace-pre-wrap">
            {backup.cfe_error}
          </span>
        </Element>
      )}
      {canRetryCfe(invoice) && hasPermission('edit_invoice') && (
        <Element leftSide="CFE">
          <Button
            behavior="button"
            disabled={busy}
            onClick={() => void refresh(true)}
          >
            {t('cfe_retry', { defaultValue: 'Retry CFE' })}
          </Button>
        </Element>
      )}
    </Card>
  );
}

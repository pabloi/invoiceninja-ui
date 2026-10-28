import { useTranslation } from 'react-i18next';
import { endpoint } from '../helpers';
import { CFE_EMISSION_WARNING, needsCfeConfirmation } from '../helpers/cfe-uy';
import { request } from '../helpers/request';
import { Invoice } from '../interfaces/invoice';
import { useCurrentCompany } from './useCurrentCompany';

export function useCompanyCfeUy() {
  return useCurrentCompany()?.settings.e_invoice_type === 'CFE_UY';
}

export function useConfirmCfeEmission() {
  const enabled = useCompanyCfeUy();
  const [t] = useTranslation();

  const confirm = (invoices: Invoice[]) =>
    !enabled ||
    !needsCfeConfirmation(invoices) ||
    window.confirm(
      String(t('cfe_emission_warning', { defaultValue: CFE_EMISSION_WARNING }))
    );

  // Read the current server state for actions which only have invoice IDs.
  // A failed read aborts the action rather than submitting without confirmation.
  const confirmIds = async (ids: string[]) => {
    if (!enabled) return true;
    const invoices = await Promise.all(
      ids.map((id) =>
        request('GET', endpoint('/api/v1/invoices/:id', { id })).then(
          (response) => response.data.data as Invoice
        )
      )
    );
    return confirm(invoices);
  };

  return { confirm, confirmIds };
}

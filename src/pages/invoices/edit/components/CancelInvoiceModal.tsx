/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdOutlineWarning } from 'react-icons/md';
import { CFE_CANCELLATION_WARNING } from '$app/common/helpers/cfe-uy';
import { useCompanyCfeUy } from '$app/common/hooks/useCompanyCfeUy';
import { Button } from '$app/components/forms/Button';
import { InputField } from '$app/components/forms/InputField';
import { Icon } from '$app/components/icons/Icon';
import { Modal } from '$app/components/Modal';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function CancelInvoiceModal({ visible, onClose, onConfirm }: Props) {
  const [t] = useTranslation();
  const cfeEnabled = useCompanyCfeUy();
  const [cancellationReason, setCancellationReason] = useState('');

  const handleConfirm = () => {
    onConfirm(cancellationReason);
    setCancellationReason('');
  };

  const handleClose = () => {
    onClose();
    setCancellationReason('');
  };

  return (
    <Modal title={t('cancel')} visible={visible} onClose={handleClose}>
      <div className="flex items-center">
        <Icon element={MdOutlineWarning} color="red" size={48} />
        <span className="font-medium text-sm ml-2 text-red-500">
          {cfeEnabled
            ? t('cfe_cancellation_warning', {
                defaultValue: CFE_CANCELLATION_WARNING,
              })
            : 'Esto cancelará la factura y creará una factura rectificativa por el importe total de la factura'}
        </span>
      </div>
      <InputField
        label={cfeEnabled ? t('reason') : 'Motivo de la rectificación'}
        value={cancellationReason}
        changeOverride={true}
        onValueChange={(value: string) => setCancellationReason(value)}
        required
      />
      <div className="flex justify-end space-x-2 mt-4">
        <Button type="secondary" onClick={handleClose}>
          {t('cancel')}
        </Button>
        <Button onClick={handleConfirm} disabled={!cancellationReason.trim()}>
          {t('confirm')}
        </Button>
      </div>
    </Modal>
  );
}

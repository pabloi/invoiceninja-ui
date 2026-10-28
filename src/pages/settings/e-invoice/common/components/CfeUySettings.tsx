import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { endpoint } from '$app/common/helpers';
import { request } from '$app/common/helpers/request';
import { useAdmin } from '$app/common/hooks/permissions/useHasPermission';
import { useCompanyChanges } from '$app/common/hooks/useCompanyChanges';
import { useDisableSettingsField } from '$app/common/hooks/useDisableSettingsField';
import { Card, Element } from '$app/components/cards';
import { Button, InputField } from '$app/components/forms';
import { PropertyCheckbox } from '$app/components/PropertyCheckbox';
import { SettingsLabel } from '$app/components/SettingsLabel';
import { useHandleCurrentCompanyChangeProperty } from '../../../common/hooks/useHandleCurrentCompanyChange';

const LEGEND_SETTINGS = [
  ['cfe_uy_verification_url', 'e-Ticket verification URL'],
  ['cfe_uy_issuer_since', 'Fecha emisor (date or resolution number)'],
  ['cfe_uy_iva_al_dia_text', 'IVA standing text (optional)'],
] as const;

export function CfeUySettings() {
  const [t] = useTranslation();
  const { isAdmin } = useAdmin();
  const company = useCompanyChanges();
  const handleChange = useHandleCurrentCompanyChangeProperty();
  const disableSettingsField = useDisableSettingsField();
  const { data, isFetching, refetch } = useQuery({
    queryKey: ['/api/v1/einvoice/cfe_uy/health'],
    queryFn: () =>
      request(
        'GET',
        endpoint('/api/v1/einvoice/cfe_uy/health'),
        {},
        { skipIntercept: true }
      ).then((response) => Boolean(response.data.reachable)),
    enabled: isAdmin,
    retry: false,
  });

  return (
    <Card title="CFE (Uruguay)">
      <Element leftSide={t('connection')}>
        <div className="flex items-center space-x-4">
          <span role="status">
            {!isAdmin
              ? t('cfe_health_admin', {
                  defaultValue:
                    'An administrator can check the CFE connection.',
                })
              : isFetching
                ? t('loading')
                : data
                  ? t('cfe_service_connected', {
                      defaultValue: 'CFE service connected',
                    })
                  : t('cfe_service_unavailable', {
                      defaultValue: 'CFE service unavailable or not configured',
                    })}
          </span>
          {isAdmin && (
            <Button
              behavior="button"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              {t('refresh')}
            </Button>
          )}
        </div>
      </Element>
      {LEGEND_SETTINGS.map(([key, label]) => (
        <Element
          key={key}
          leftSide={
            <PropertyCheckbox
              propertyKey={key}
              labelElement={
                <SettingsLabel label={t(key, { defaultValue: label })} />
              }
              defaultValue=""
            />
          }
        >
          <InputField
            value={company?.settings[key] || ''}
            onValueChange={(value) => handleChange(`settings.${key}`, value)}
            disabled={disableSettingsField(key)}
          />
        </Element>
      ))}
    </Card>
  );
}

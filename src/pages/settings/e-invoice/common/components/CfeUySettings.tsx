import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { endpoint } from '$app/common/helpers';
import { request } from '$app/common/helpers/request';
import { useAdmin } from '$app/common/hooks/permissions/useHasPermission';
import { Card, Element } from '$app/components/cards';
import { Button } from '$app/components/forms';

export function CfeUySettings() {
  const [t] = useTranslation();
  const { isAdmin } = useAdmin();
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
    </Card>
  );
}

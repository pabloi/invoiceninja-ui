import { createElement } from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  confirm: vi.fn(),
  navigate: vi.fn(),
  company: { settings: { e_invoice_type: 'CFE_UY' } },
}));
vi.mock('$app/common/helpers', () => ({
  endpoint: (path: string, params?: { id?: string }) =>
    path.replace(':id', params?.id || ''),
}));
vi.mock('$app/common/helpers/request', () => ({ request: mocks.request }));
vi.mock('$app/common/helpers/toast/toast', () => ({
  toast: {
    processing: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}));
vi.mock('$app/common/hooks/useCurrentCompany', () => ({
  useCurrentCompany: () => mocks.company,
}));
vi.mock('$app/common/hooks/useRefetch', () => ({ $refetch: vi.fn() }));
vi.mock('$app/common/atoms/data-table', () => ({ invalidationQueryAtom: {} }));
vi.mock('$app/common/hooks/permissions/useHasPermission', () => ({
  useHasPermission: () => () => true,
}));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('jotai', () => ({ useAtomValue: () => undefined }));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('react-i18next', () => ({
  useTranslation: () => [(key: string) => key],
}));

import { useHandleSend } from '../../src/common/hooks/emails/useHandleSend';
import type { Invoice } from '../../src/common/interfaces/invoice';
import { useBulk } from '../../src/common/queries/invoices';
import { useMarkPaid } from '../../src/pages/invoices/edit/hooks/useMarkPaid';
import { useMarkSent } from '../../src/pages/invoices/edit/hooks/useMarkSent';

let renderer: ReactTestRenderer;
function hook<T>(useHook: () => T): T {
  let value: T;
  function Harness() {
    value = useHook();
    return null;
  }
  act(() => {
    renderer = create(createElement(Harness));
  });
  return value!;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.company.settings.e_invoice_type = 'CFE_UY';
  vi.stubGlobal('window', { confirm: mocks.confirm });
  mocks.confirm.mockReturnValue(false);
  mocks.request.mockImplementation((method: string) =>
    Promise.resolve({
      data: {
        data: { id: 'invoice', status_id: method === 'GET' ? '1' : '2' },
      },
    })
  );
});
afterEach(() => {
  act(() => renderer?.unmount());
  vi.unstubAllGlobals();
});

test.each([
  'email',
  'mark_sent',
  'mark_paid',
] as const)('cancelling bulk %s prevents the mutation', async (action) => {
  const bulk = hook(() => useBulk());
  await bulk(['invoice'], action);
  expect(mocks.confirm).toHaveBeenCalledOnce();
  expect(mocks.request.mock.calls.every(([method]) => method === 'GET')).toBe(
    true
  );
});
test('confirming a mixed batch submits once', async () => {
  mocks.confirm.mockReturnValue(true);
  const bulk = hook(() => useBulk());
  await bulk(['invoice', 'other'], 'email');
  expect(mocks.confirm).toHaveBeenCalledOnce();
  expect(mocks.request).toHaveBeenCalledWith('POST', '/api/v1/invoices/bulk', {
    action: 'email',
    ids: ['invoice', 'other'],
  });
});
test('failed state reads prevent an unconfirmed send', async () => {
  mocks.request.mockRejectedValue(new Error('offline'));
  const bulk = hook(() => useBulk());
  await bulk(['invoice'], 'email');
  expect(mocks.confirm).not.toHaveBeenCalled();
  expect(mocks.request).toHaveBeenCalledTimes(1);
});
test('non-CFE companies keep the existing bulk path', async () => {
  mocks.company.settings.e_invoice_type = 'EN16931';
  const bulk = hook(() => useBulk());
  await bulk(['invoice'], 'mark_sent');
  expect(mocks.confirm).not.toHaveBeenCalled();
  expect(mocks.request.mock.calls.map(([method]) => method)).toEqual(['POST']);
});
test('the final mailer Send is guarded', async () => {
  const send = hook(() => useHandleSend({ setErrors: vi.fn() }));
  await send(
    'body',
    'invoice',
    'invoice',
    'subject',
    'invoice',
    '/invoices',
    ''
  );
  expect(mocks.confirm).toHaveBeenCalledOnce();
  expect(mocks.request.mock.calls.map(([method]) => method)).toEqual(['GET']);
});
test.each([
  useMarkPaid,
  useMarkSent,
])('direct draft actions abort on cancellation', (useAction) => {
  const action = hook(useAction);
  action({ id: 'invoice', status_id: '1' } as Invoice);
  expect(mocks.confirm).toHaveBeenCalledOnce();
  expect(mocks.request).not.toHaveBeenCalled();
});
test('resending an emitted invoice skips the legal warning', async () => {
  mocks.request.mockResolvedValue({
    data: { data: { id: 'invoice', status_id: '2', backup: { guid: 'CAE' } } },
  });
  const bulk = hook(() => useBulk());
  await bulk(['invoice'], 'email');
  expect(mocks.confirm).not.toHaveBeenCalled();
  expect(mocks.request.mock.calls.map(([method]) => method)).toEqual([
    'GET',
    'POST',
  ]);
});

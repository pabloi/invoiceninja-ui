import { describe, expect, test } from 'vitest';
import {
  canRetryCfe,
  cfeQrUrl,
  hasCfe,
  needsCfeConfirmation,
} from '../../src/common/helpers/cfe-uy';

describe('CFE invoice lifecycle', () => {
  test('a mixed bulk selection confirms when any draft can emit', () => {
    expect(
      needsCfeConfirmation([
        { status_id: '2', backup: { guid: 'CAE' } },
        { status_id: '1' },
      ])
    ).toBe(true);
  });
  test('new unsaved invoices confirm', () => {
    expect(needsCfeConfirmation([{ status_id: '' }])).toBe(true);
  });
  test('sent and previously emitted invoices do not confirm again', () => {
    expect(
      needsCfeConfirmation([
        { status_id: '2' },
        { status_id: '1', backup: { guid: 'CAE' } },
      ])
    ).toBe(false);
  });
  test('pending does not count as emitted', () => {
    expect(hasCfe({ backup: { cfe_status: 'pending' } })).toBe(false);
  });
  test.each([
    'rejected',
    'failed',
  ] as const)('%s can be retried', (cfe_status) => {
    expect(canRetryCfe({ is_deleted: false, backup: { cfe_status } })).toBe(
      true
    );
    expect(
      canRetryCfe({ is_deleted: false, backup: { cfe_status, guid: 'CAE' } })
    ).toBe(false);
    expect(canRetryCfe({ is_deleted: true, backup: { cfe_status } })).toBe(
      false
    );
  });
  test.each([
    'pending',
    'emitted',
    undefined,
  ] as const)('%s cannot be retried', (cfe_status) => {
    expect(canRetryCfe({ is_deleted: false, backup: { cfe_status } })).toBe(
      false
    );
  });
  test.each([
    'javascript:alert(1)',
    'data:text/html,test',
    '/relative',
    '',
    null,
  ])('does not expose unsafe or absent QR URL %s', (value) => {
    expect(cfeQrUrl(value)).toBeUndefined();
  });
  test('keeps the accepted provider verification URL', () => {
    expect(cfeQrUrl('https://example.uy/verify?id=123')).toBe(
      'https://example.uy/verify?id=123'
    );
  });
});

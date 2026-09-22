import { describe, expect, it } from 'vitest'
import { getCampaignStatus } from './AdminCampaigns'

describe('campaign lifecycle labels', () => {
  it('shows a disabled campaign as paused even while its dates are active', () => {
    expect(getCampaignStatus({
      trangThai: 0,
      ngayBatDau: '2020-01-01T00:00:00',
      ngayKetThuc: '2099-01-01T00:00:00',
    })).toBe('paused')
  })

  it('derives upcoming and ended states from campaign dates', () => {
    expect(getCampaignStatus({ trangThai: 1, ngayBatDau: '2099-01-01T00:00:00' })).toBe('upcoming')
    expect(getCampaignStatus({ trangThai: 1, ngayKetThuc: '2020-01-01T00:00:00' })).toBe('ended')
  })
})

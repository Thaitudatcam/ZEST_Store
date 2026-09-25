import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminUsers from './AdminUsers'
import { getCustomers, getEmployees } from '../../api/admin'

vi.mock('../../api/admin', () => ({
  getCustomers: vi.fn(),
  toggleCustomerStatus: vi.fn(),
  getEmployees: vi.fn(),
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
  toggleEmployeeStatus: vi.fn(),
  getCustomerAddresses: vi.fn(),
  addCustomerAddress: vi.fn(),
  setDefaultCustomerAddress: vi.fn(),
  deleteCustomerAddress: vi.fn(),
  createCustomer: vi.fn(),
}))

vi.mock('../../api/address', () => ({
  getProvinces: vi.fn(),
  getDistricts: vi.fn(),
  getWards: vi.fn(),
}))

describe('AdminUsers customer route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getCustomers.mockResolvedValue([])
    getEmployees.mockResolvedValue([])
  })

  it('renders the customer management page without crashing', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/customers']}>
        <AdminUsers />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Quản lý tài khoản / Quản lý khách hàng' })).toBeInTheDocument()
    await waitFor(() => expect(getCustomers).toHaveBeenCalledTimes(1))
    expect(screen.getByText('Chưa có khách hàng')).toBeInTheDocument()
  })

  it('renders the employee management page without crashing', async () => {
    getEmployees.mockResolvedValueOnce([{
      maNguoiDung: 7,
      hoTen: 'Nhân viên thử nghiệm',
      email: 'staff@example.test',
      soDienThoai: '0901234567',
      vaiTro: 'STAFF',
      trangThai: 1,
    }])
    render(
      <MemoryRouter initialEntries={['/admin/employees']}>
        <AdminUsers />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'QUẢN LÝ NHÂN VIÊN' })).toBeInTheDocument()
    await waitFor(() => expect(getEmployees).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Nhân viên thử nghiệm')).toBeInTheDocument()
  })
})

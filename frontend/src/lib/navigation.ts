import type { RoleCode } from '@/features/auth/auth-provider';

export const navigationItems: {
  href: string;
  label: string;
  roles: RoleCode[];
}[] = [
  { href: '/', label: 'Tổng quan', roles: [] },
  { href: '/medicines', label: 'Thuốc', roles: ['BAN_THUOC', 'QUAN_LY_KHO', 'QUAN_LY'] },
  { href: '/suppliers', label: 'Nhà cung cấp', roles: ['QUAN_LY_KHO', 'QUAN_LY'] },
  { href: '/goods-receipts', label: 'Nhập kho', roles: ['QUAN_LY_KHO'] },
  { href: '/inventory', label: 'Tồn kho', roles: ['QUAN_LY_KHO', 'QUAN_LY'] },
  { href: '/stocktakes', label: 'Kiểm kê', roles: ['QUAN_LY_KHO', 'QUAN_LY'] },
  { href: '/sales', label: 'Bán hàng', roles: ['BAN_THUOC'] },
  { href: '/customers', label: 'Khách hàng', roles: ['BAN_THUOC'] },
  { href: '/prescriptions', label: 'Đơn thuốc', roles: ['BAN_THUOC'] },
  { href: '/invoices', label: 'Hóa đơn', roles: ['BAN_THUOC', 'QUAN_LY'] },
  { href: '/reports', label: 'Báo cáo', roles: ['QUAN_LY'] },
  { href: '/staff', label: 'Nhân viên', roles: ['QUAN_LY'] },
];

export const roleLabels: Record<RoleCode, string> = {
  BAN_THUOC: 'Bán thuốc',
  QUAN_LY_KHO: 'Quản lý kho',
  QUAN_LY: 'Quản lý',
};

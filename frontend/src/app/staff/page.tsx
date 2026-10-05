'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiRequest } from '@/lib/api-client';
import { useAuth, type RoleCode } from '@/features/auth/auth-provider';

type RoleView = { code: RoleCode; label: string };
type StaffMember = {
  id: number;
  name: string;
  phone: string | null;
  isWorking: boolean;
  account: {
    id: number;
    username: string;
    isActive: boolean;
    roles: RoleCode[];
  } | null;
};
type StaffResponse = {
  data: StaffMember[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};
type StaffForm = {
  name: string;
  phone: string;
  username: string;
  password: string;
  roles: RoleCode[];
};
type EditForm = {
  name: string;
  phone: string;
  isWorking: boolean;
  isActive: boolean;
};

const emptyCreateForm: StaffForm = {
  name: '', phone: '', username: '', password: '', roles: [],
};

function explainError(cause: unknown) {
  if (!(cause instanceof ApiError)) return 'Không thể kết nối máy chủ. Vui lòng thử lại.';
  const messages: Record<string, string> = {
    USERNAME_TAKEN: 'Tên đăng nhập đã được sử dụng.',
    LAST_ACTIVE_MANAGER: 'Không thể bỏ vai trò hoặc khóa quản lý hoạt động cuối cùng.',
    ACCOUNT_NOT_FOUND: 'Nhân viên này chưa có tài khoản.',
    VALIDATION_ERROR: cause.message || 'Thông tin gửi lên chưa hợp lệ.',
    FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
  };
  return messages[cause.code] ?? cause.message;
}

function toggleRole(roles: RoleCode[], role: RoleCode) {
  return roles.includes(role) ? roles.filter((item) => item !== role) : [...roles, role];
}

export default function StaffPage() {
  const router = useRouter();
  const { user, refreshMe, clearLocalSession } = useAuth();
  const [roles, setRoles] = useState<RoleView[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState('');
  const [rolesReloadKey, setRolesReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [list, setList] = useState<StaffResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<StaffForm>(emptyCreateForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<RoleCode[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingRoles, setSavingRoles] = useState(false);
  const [editError, setEditError] = useState('');
  const [rolesSaveError, setRolesSaveError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<{ data: RoleView[] }>('/roles', { signal: controller.signal })
      .then((response) => {
        setRoles(response.data);
        setRolesError('');
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
        setRolesError(explainError(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setRolesLoading(false);
      });
    return () => controller.abort();
  }, [rolesReloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    const parameters = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (search) parameters.set('search', search);
    apiRequest<StaffResponse>(`/users?${parameters.toString()}`, {
      signal: controller.signal,
    })
      .then((response) => {
        setList(response);
        setListError('');
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
        setListError(explainError(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, search, reloadKey]);

  function openEditor(employee: StaffMember) {
    setSelected(employee);
    setEditForm({
      name: employee.name,
      phone: employee.phone ?? '',
      isWorking: employee.isWorking,
      isActive: employee.account?.isActive ?? false,
    });
    setSelectedRoles(employee.account?.roles ?? []);
    setEditError('');
    setRolesSaveError('');
    setSuccess('');
  }

  async function createEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) return;
    setCreating(true);
    setCreateError('');
    setSuccess('');
    try {
      await apiRequest<{ data: StaffMember }>('/users', {
        method: 'POST',
        body: {
          name: createForm.name,
          phone: createForm.phone,
          username: createForm.username,
          password: createForm.password,
          roles: createForm.roles,
        },
      });
      setCreateForm(emptyCreateForm);
      setCreateOpen(false);
      setPage(1);
      setLoading(true);
      setReloadKey((value) => value + 1);
      setSuccess('Đã tạo nhân viên và tài khoản.');
    } catch (cause) {
      setCreateError(explainError(cause));
    } finally {
      setCreating(false);
    }
  }

  async function saveEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !editForm || savingEdit) return;
    const willDisable =
      (selected.isWorking && !editForm.isWorking) ||
      (selected.account?.isActive && !editForm.isActive);
    if (willDisable && !window.confirm('Thao tác này sẽ thu hồi toàn bộ phiên đăng nhập của nhân viên. Tiếp tục?')) return;
    setSavingEdit(true);
    setEditError('');
    setSuccess('');
    try {
      const response = await apiRequest<{ data: StaffMember }>(`/users/${selected.id}`, {
        method: 'PATCH',
        body: {
          name: editForm.name,
          phone: editForm.phone,
          isWorking: editForm.isWorking,
          ...(selected.account ? { isActive: editForm.isActive } : {}),
        },
      });
      setSelected(response.data);
      setEditForm({
        name: response.data.name,
        phone: response.data.phone ?? '',
        isWorking: response.data.isWorking,
        isActive: response.data.account?.isActive ?? false,
      });
      setLoading(true);
      setReloadKey((value) => value + 1);
      setSuccess('Đã cập nhật thông tin nhân viên.');
      if (user?.employeeId === response.data.id) {
        if (!response.data.isWorking || !response.data.account?.isActive) {
          clearLocalSession();
        } else {
          await refreshMe();
        }
      }
    } catch (cause) {
      setEditError(explainError(cause));
    } finally {
      setSavingEdit(false);
    }
  }

  async function saveRoles(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !selected.account || savingRoles) return;
    setSavingRoles(true);
    setRolesSaveError('');
    setSuccess('');
    try {
      const response = await apiRequest<{ data: StaffMember }>(`/users/${selected.id}/roles`, {
        method: 'PUT',
        body: { roles: selectedRoles },
      });
      setSelected(response.data);
      setSelectedRoles(response.data.account?.roles ?? []);
      setLoading(true);
      setReloadKey((value) => value + 1);
      setSuccess('Đã thay đổi vai trò.');
      if (user?.employeeId === response.data.id) {
        const current = await refreshMe();
        if (current && !current.roles.includes('QUAN_LY')) router.replace('/');
      }
    } catch (cause) {
      setRolesSaveError(explainError(cause));
    } finally {
      setSavingRoles(false);
    }
  }

  function closeCreate() {
    setCreateOpen(false);
    setCreateForm(emptyCreateForm);
    setCreateError('');
  }

  return (
    <section>
      <div className="page-heading">
        <p className="eyebrow">Quản trị</p>
        <h1>Nhân viên</h1>
        <p>Tạo tài khoản, cập nhật trạng thái làm việc và gán vai trò.</p>
      </div>

      <div className="staff-toolbar">
        <form className="search-form" onSubmit={(event) => { event.preventDefault(); setLoading(true); setPage(1); setSearch(searchInput.trim()); }}>
          <label htmlFor="staff-search">Tìm theo tên, username hoặc SĐT</label>
          <div><input id="staff-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} maxLength={100} />
            <button type="submit">Tìm</button></div>
        </form>
        <button type="button" onClick={() => { if (createOpen) closeCreate(); else { setCreateOpen(true); setCreateError(''); } }}>
          {createOpen ? 'Ẩn form tạo' : 'Thêm nhân viên'}
        </button>
      </div>

      {success && <p className="success-message" role="status">{success}</p>}

      {createOpen && (
        <form className="staff-panel stack-form" onSubmit={createEmployee}>
          <div className="panel-title"><h2>Tạo nhân viên và tài khoản</h2><button type="button" className="text-button" onClick={closeCreate}>Đóng</button></div>
          <div className="form-grid">
            <label>Họ tên<input required minLength={1} maxLength={100} value={createForm.name} onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })} /></label>
            <label>Số điện thoại<input maxLength={20} value={createForm.phone} onChange={(event) => setCreateForm({ ...createForm, phone: event.target.value })} /></label>
            <label>Tên đăng nhập<input required minLength={3} maxLength={50} autoComplete="username" value={createForm.username} onChange={(event) => setCreateForm({ ...createForm, username: event.target.value })} /></label>
            <label>Mật khẩu<input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={createForm.password} onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })} /></label>
          </div>
          <fieldset className="role-options"><legend>Vai trò</legend>
            {rolesLoading ? <p role="status">Đang tải vai trò…</p> : rolesError ? <div className="inline-error" role="alert"><p>{rolesError}</p><button type="button" onClick={() => { setRolesLoading(true); setRolesError(''); setRolesReloadKey((value) => value + 1); }}>Thử tải lại</button></div> : roles.map((role) => (
              <label key={role.code}><input type="checkbox" checked={createForm.roles.includes(role.code)} onChange={() => setCreateForm({ ...createForm, roles: toggleRole(createForm.roles, role.code) })} /> {role.label}</label>
            ))}
          </fieldset>
          {createError && <p className="inline-error" role="alert">{createError}</p>}
          <div className="form-actions"><button type="submit" disabled={creating || rolesLoading || roles.length === 0}>{creating ? 'Đang tạo…' : 'Tạo tài khoản'}</button><button className="secondary-button" type="button" onClick={closeCreate}>Hủy</button></div>
        </form>
      )}

      {loading ? <p className="state-card" role="status">Đang tải danh sách nhân viên…</p> : listError ? (
        <div className="state-card error-state" role="alert"><p>{listError}</p><button type="button" onClick={() => { setLoading(true); setReloadKey((value) => value + 1); }}>Thử lại</button></div>
      ) : !list?.data.length ? (
        <p className="state-card">{search ? 'Không tìm thấy nhân viên phù hợp.' : 'Chưa có nhân viên.'}</p>
      ) : (
        <>
          <div className="table-scroll"><table className="staff-table">
            <thead><tr><th>Nhân viên</th><th>Tài khoản</th><th>Vai trò</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>{list.data.map((employee) => (
              <tr key={employee.id}>
                <td><strong>{employee.name}</strong><small>{employee.phone || 'Chưa có SĐT'}</small></td>
                <td>{employee.account?.username ?? 'Chưa có tài khoản'}</td>
                <td>{employee.account?.roles.join(', ') || '—'}</td>
                <td><span>{employee.isWorking ? 'Đang làm việc' : 'Đã nghỉ'}</span><small>{employee.account ? (employee.account.isActive ? 'Tài khoản mở' : 'Tài khoản khóa') : ''}</small></td>
                <td><button type="button" className="secondary-button" onClick={() => openEditor(employee)}>Sửa</button></td>
              </tr>
            ))}</tbody>
          </table></div>
          <div className="pagination"><span>{list.meta.total} nhân viên · Trang {list.meta.page} / {Math.max(1, list.meta.totalPages)}</span>
            <div><button type="button" className="secondary-button" disabled={page <= 1} onClick={() => { setLoading(true); setPage((value) => Math.max(1, value - 1)); }}>Trước</button><button type="button" className="secondary-button" disabled={page >= list.meta.totalPages} onClick={() => { setLoading(true); setPage((value) => value + 1); }}>Sau</button></div>
          </div>
        </>
      )}

      {selected && editForm && (
        <div className="staff-edit-grid">
          <form className="staff-panel stack-form" onSubmit={saveEmployee}>
            <div className="panel-title"><h2>Thông tin: {selected.name}</h2><button type="button" className="text-button" onClick={() => { setSelected(null); setEditForm(null); }}>Đóng</button></div>
            <label>Họ tên<input required maxLength={100} value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} /></label>
            <label>Số điện thoại<input maxLength={20} value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} /></label>
            <label className="check-line"><input type="checkbox" checked={editForm.isWorking} onChange={(event) => setEditForm({ ...editForm, isWorking: event.target.checked })} /> Đang làm việc</label>
            {selected.account && <label className="check-line"><input type="checkbox" checked={editForm.isActive} onChange={(event) => setEditForm({ ...editForm, isActive: event.target.checked })} /> Tài khoản đang mở</label>}
            {editError && <p className="inline-error" role="alert">{editError}</p>}
            <button type="submit" disabled={savingEdit}>{savingEdit ? 'Đang lưu…' : 'Lưu thông tin'}</button>
          </form>
          {selected.account && <form className="staff-panel stack-form" onSubmit={saveRoles}>
            <h2>Vai trò: {selected.account.username}</h2>
            <fieldset className="role-options"><legend>Chọn một hoặc nhiều vai trò</legend>
              {rolesLoading ? <p role="status">Đang tải vai trò…</p> : rolesError ? <div className="inline-error" role="alert"><p>{rolesError}</p><button type="button" onClick={() => { setRolesLoading(true); setRolesError(''); setRolesReloadKey((value) => value + 1); }}>Thử tải lại</button></div> : roles.map((role) => <label key={role.code}><input type="checkbox" checked={selectedRoles.includes(role.code)} onChange={() => setSelectedRoles((value) => toggleRole(value, role.code))} /> {role.label}</label>)}
            </fieldset>
            {rolesSaveError && <p className="inline-error" role="alert">{rolesSaveError}</p>}
            <button type="submit" disabled={savingRoles || rolesLoading || roles.length === 0}>{savingRoles ? 'Đang lưu…' : 'Cập nhật vai trò'}</button>
          </form>}
        </div>
      )}
    </section>
  );
}

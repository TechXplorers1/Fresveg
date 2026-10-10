import React from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * AdminUsersTab Component
 * Displays the registered users table and allows changing user roles.
 */
export default function AdminUsersTab({
  usersList = [],
  loadingUsers = false,
  handleRoleChange
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-gray-900">User Account Roles</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Override account privileges for customers, vendors, and admin managers.
          </p>
        </div>
        <div className="text-xs font-bold text-gray-400">
          Total Users: {usersList.length}
        </div>
      </div>

      {loadingUsers ? (
        <div className="py-16 text-center">
          <RefreshCw className="animate-spin text-brand mx-auto mb-3" size={32} />
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
            Loading user database...
          </p>
        </div>
      ) : usersList.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-xs">
          No registered users found in database.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersList.map((userItem) => (
                <tr key={userItem.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-gray-900">
                    {userItem.displayName || 'User'}
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">
                    {userItem.email || 'No email provided'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        userItem.role === 'admin'
                          ? 'bg-red-50 text-red-650 border border-red-100'
                          : userItem.role === 'vendor'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}
                    >
                      {userItem.role || 'customer'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <select
                      value={userItem.role || 'customer'}
                      onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                      className="bg-white border border-slate-200 text-gray-700 font-bold px-3 py-1.5 rounded-xl text-2xs focus:border-brand outline-none cursor-pointer"
                    >
                      <option value="customer">Customer</option>
                      <option value="vendor">Vendor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";

interface AdminManagementProps {
  theme: "light" | "dark";
  newAdminUser: string;
  setNewAdminUser: (val: string) => void;
  newAdminPass: string;
  setNewAdminPass: (val: string) => void;
  adminAddError: string;
  setAdminAddError: (val: string) => void;
  adminAddSuccess: string;
  adminList: { username: string; pass: string }[];
  handleAddAdminSubmit: (e: React.FormEvent) => void;
}

export default function AdminManagement({
  theme,
  newAdminUser,
  setNewAdminUser,
  newAdminPass,
  setNewAdminPass,
  adminAddError,
  setAdminAddError,
  adminAddSuccess,
  adminList,
  handleAddAdminSubmit,
}: AdminManagementProps) {
  return (
    <div
      className={`max-w-xl mx-auto rounded-3xl p-8 shadow-sm border transition-colors duration-0 ${theme === "dark" ? "bg-[#151b2b]" : "bg-white border-slate-100"}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold transition-colors duration-0 ${theme === "dark" ? "bg-orange-500/20 text-orange-400" : "bg-orange-50 text-orange-500"}`}
        >
          ⚙️
        </div>
        <div>
          <h2
            className={`text-xl font-bold transition-colors duration-0 ${theme === "dark" ? "text-white" : "text-slate-800"}`}
          >
            Quản trị Tài khoản Admin
          </h2>
          <p className="text-xs text-slate-500">
            Thêm tài khoản quản trị viên mới vào hệ thống
          </p>
        </div>
      </div>

      <form onSubmit={handleAddAdminSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Tên đăng nhập Admin mới <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={newAdminUser}
            onChange={(e) => {
              setNewAdminUser(e.target.value);
              setAdminAddError("");
            }}
            className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-bold text-sm transition-colors duration-0 mb-3 ${
              theme === "dark"
                ? "bg-[#0a0f1c] border-white/10 text-white"
                : "bg-slate-50 border-slate-200 text-slate-800"
            }`}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Mật khẩu Admin mới <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={newAdminPass}
            onChange={(e) => {
              setNewAdminPass(e.target.value);
              setAdminAddError("");
            }}
            className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-bold text-sm transition-colors duration-0 ${
              theme === "dark"
                ? "bg-[#0a0f1c] border-white/10 text-white"
                : "bg-slate-50 border-slate-200 text-slate-800"
            }`}
          />
          {adminAddError && (
            <p className="text-xs font-bold text-red-500 mt-1.5">
              {adminAddError}
            </p>
          )}
          {adminAddSuccess && (
            <p className="text-xs font-bold text-emerald-500 mt-1.5">
              {adminAddSuccess}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/30 transition-colors cursor-pointer active:scale-95"
        >
          Thêm Tài Khoản Admin
        </button>
      </form>

      <div
        className={`mt-8 pt-6 border-t transition-colors duration-0 ${theme === "dark" ? "border-white/5" : "border-slate-100"}`}
      >
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Danh sách tài khoản Admin ({adminList.length})
        </h4>
        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
          {adminList.map((acc, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between px-4 py-2.5 border rounded-xl text-xs font-bold transition-colors duration-0 ${
                theme === "dark"
                  ? "bg-[#0a0f1c] border-white/5 text-slate-300"
                  : "bg-slate-50 border-slate-100 text-slate-700"
              }`}
            >
              <span>👤 {acc.username}</span>
              <span
                className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${theme === "dark" ? "text-emerald-400 bg-emerald-500/10" : "text-emerald-600 bg-emerald-50"}`}
              >
                Đang hoạt động
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

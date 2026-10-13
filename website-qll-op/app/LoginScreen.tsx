"use client";

import React from "react";

interface LoginScreenProps {
  loginRole: "QLL" | "Admin";
  setLoginRole: (role: "QLL" | "Admin") => void;
  loginError: string;
  setLoginError: (val: string) => void;
  namecode: string;
  setNamecode: (val: string) => void;
  teamLead: string;
  setTeamLead: (val: string) => void;
  adminUsername: string;
  setAdminUsername: (val: string) => void;
  adminPassword: string;
  setAdminPassword: (val: string) => void;
  handleLoginSubmit: (e: React.FormEvent) => void;
}

export default function LoginScreen({
  loginRole,
  setLoginRole,
  loginError,
  setLoginError,
  namecode,
  setNamecode,
  teamLead,
  setTeamLead,
  adminUsername,
  setAdminUsername,
  adminPassword,
  setAdminPassword,
  handleLoginSubmit,
}: LoginScreenProps) {
  return (
    <div className="relative h-screen w-screen overflow-hidden font-sora bg-[#0f172a] flex items-center justify-center">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');
          .font-sora { font-family: 'Sora', sans-serif !important; }

          @keyframes floatBitu {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-12px) rotate(2deg); }
          }
          .animate-float-bitu {
            animation: floatBitu 4s ease-in-out infinite;
          }

          @keyframes typing {
            from { width: 0; }
            to { width: 100%; }
          }
          @keyframes blink {
            from, to { border-color: transparent; }
            50% { border-color: #f97316; }
          }
          .typing-effect {
            display: inline-block;
            overflow: hidden;
            white-space: nowrap;
            border-right: 3px solid #f97316;
            animation: typing 3s steps(16, end) infinite alternate, blink 0.75s step-end infinite;
          }

          @keyframes spin-glow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .animated-border-box {
            position: relative;
            border-radius: 40px; 
            padding: 4px; 
            overflow: hidden;
            background: rgba(255, 255, 255, 0.05); 
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
          }

          .animated-border-box::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: conic-gradient(
              transparent 70%, 
              #00f2fe 85%, 
              #4facfe 100%
            );
            animation: spin-glow 4s linear infinite;
            z-index: 0;
          }

          .animated-border-box::after {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: conic-gradient(
              transparent 70%, 
              #f97316 85%, 
              #f59e0b 100%
            );
            animation: spin-glow 4s linear infinite;
            animation-delay: -2s;
            z-index: 0;
          }

          .animated-border-inner {
            position: relative;
            background: #0d111a; 
            border-radius: 36px; 
            z-index: 1;
            width: 100%;
            height: 100%;
          }

          input:-webkit-autofill,
          input:-webkit-autofill:hover, 
          input:-webkit-autofill:focus, 
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px #151a28 inset !important;
            -webkit-text-fill-color: white !important;
            transition: background-color 5000s ease-in-out 0s;
          }
        `,
        }}
      />

      <div className="absolute inset-0 bg-[#070b19] -z-40"></div>
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 mix-blend-screen -z-30"
        style={{ backgroundImage: `url('/backdrop.jpg')` }}
      ></div>

      <div className="w-full max-w-[1400px] px-6 lg:px-16 flex items-center justify-between">
        <div className="hidden lg:flex flex-col items-start relative animate-float-bitu z-20 pointer-events-none select-none pl-6 xl:pl-12">
          <div className="mb-4 ml-6 bg-[#1a1f33]/90 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl shadow-2xl relative">
            <p className="text-white font-medium text-base tracking-wide">
              <span className="typing-effect">Xin chào bạn! ✨</span>
            </p>
            <div className="absolute -bottom-2 left-8 w-4 h-4 bg-[#1a1f33]/90 border-r border-b border-white/10 rotate-45 backdrop-blur-md"></div>
          </div>

          <img
            src="/Chào hỏi_2.png"
            alt="Nhân vật Bitu Vuihoc"
            className="w-[360px] xl:w-[420px] h-auto object-contain filter drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "/Ch%C3%A0o%20h%E1%BB%8Fi_2.png";
            }}
          />
        </div>

        <div className="animated-border-box w-full max-w-[540px] mx-auto lg:mx-0">
          <div className="animated-border-inner p-10 lg:p-12">
            <div className="flex items-center gap-3 mb-6">
              <img
                src="https://xcdn-cf.vuihoc.vn/theme/vuihoc/imgs/vuihoc_logo_final.png"
                alt="Vuihoc Logo"
                className="h-6 w-auto object-contain drop-shadow-sm"
              />
              <div className="border-l-[1.5px] border-white/10 pl-3">
                <p className="text-[9px] text-sky-400 font-bold uppercase tracking-widest mt-1">
                  Vận Hành
                </p>
              </div>
            </div>

            <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-7">
              Đăng nhập
            </h2>

            <div className="grid grid-cols-2 gap-2.5 p-1.5 bg-[#070a14] rounded-2xl mb-7 border border-white/5 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setLoginRole("QLL");
                  setLoginError("");
                }}
                className={`py-3.5 text-xs font-medium rounded-xl transition-all ${
                  loginRole === "QLL"
                    ? "bg-white/10 text-white shadow-md border border-white/10"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                👩‍💻 Quản Lý Lớp (QLL)
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginRole("Admin");
                  setLoginError("");
                }}
                className={`py-3.5 text-xs font-medium rounded-xl transition-all ${
                  loginRole === "Admin"
                    ? "bg-white/10 text-white shadow-md border border-white/10"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                🔐 Quản Trị (Admin)
              </button>
            </div>

            <form onSubmit={handleLoginSubmit}>
              {loginRole === "QLL" ? (
                <>
                  <div className="mb-5">
                    <label className="text-slate-300 text-sm font-medium mb-2 block">
                      Namecode <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder=""
                      value={namecode}
                      onChange={(e) => {
                        setNamecode(e.target.value);
                        setLoginError("");
                      }}
                      className="w-full min-h-[54px] px-4.5 py-3.5 bg-[#151a28] border border-white/10 rounded-2xl text-white font-normal text-base focus:outline-none focus:border-cyan-500/50 focus:bg-[#1a2133] transition-all shadow-inner"
                      autoFocus
                    />
                  </div>

                  <div className="mb-7">
                    <label className="text-slate-300 text-sm font-medium mb-2 block">
                      Team Lead <span className="text-cyan-400">*</span>
                    </label>
                    <select
                      value={teamLead}
                      onChange={(e) => setTeamLead(e.target.value)}
                      className="w-full min-h-[54px] px-4.5 py-3.5 bg-[#151a28] border border-white/10 rounded-2xl text-white font-normal text-base focus:outline-none focus:border-cyan-500/50 focus:bg-[#1a2133] transition-all cursor-pointer shadow-inner"
                    >
                      <option
                        value="Lead LienDT"
                        className="bg-[#151a28] text-white"
                      >
                        Lead LienDT
                      </option>
                      <option
                        value="Lead QuyenPT"
                        className="bg-[#151a28] text-white"
                      >
                        Lead QuyenPT
                      </option>
                      <option
                        value="Lead ChiNQ"
                        className="bg-[#151a28] text-white"
                      >
                        Lead ChiNQ
                      </option>
                      <option
                        value="Lead ChungMB"
                        className="bg-[#151a28] text-white"
                      >
                        Lead ChungMB
                      </option>
                      <option
                        value="Lead XuanNT14"
                        className="bg-[#151a28] text-white"
                      >
                        Lead XuanNT14
                      </option>
                      <option value="Khác" className="bg-[#151a28] text-white">
                        Khác / QLL chung
                      </option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-5">
                    <label className="text-slate-300 text-sm font-medium mb-2 block">
                      Tên đăng nhập Admin{" "}
                      <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder=""
                      value={adminUsername}
                      onChange={(e) => {
                        setAdminUsername(e.target.value);
                        setLoginError("");
                      }}
                      className="w-full min-h-[54px] px-4.5 py-3.5 bg-[#151a28] border border-white/10 rounded-2xl text-white font-normal text-base focus:outline-none focus:border-cyan-500/50 focus:bg-[#1a2133] transition-all shadow-inner"
                      autoFocus
                    />
                  </div>
                  <div className="mb-7">
                    <label className="text-slate-300 text-sm font-medium mb-2 block">
                      Mật khẩu Admin <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder=""
                      value={adminPassword}
                      onChange={(e) => {
                        setAdminPassword(e.target.value);
                        setLoginError("");
                      }}
                      className="w-full min-h-[54px] px-4.5 py-3.5 bg-[#151a28] border border-white/10 rounded-2xl text-white font-normal text-base focus:outline-none focus:border-cyan-500/50 focus:bg-[#1a2133] transition-all shadow-inner"
                    />
                  </div>
                </>
              )}

              {loginError && (
                <p className="text-red-400 text-xs font-medium mb-4 text-center">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                className="w-full min-h-[58px] rounded-2xl font-medium text-base transition-all cursor-pointer active:scale-95 shadow-xl flex items-center justify-center gap-2 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-white hover:opacity-90 shadow-cyan-500/30 border border-cyan-400/30"
              >
                {loginRole === "QLL"
                  ? "Vào hệ thống QLL →"
                  : "Đăng nhập Admin →"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

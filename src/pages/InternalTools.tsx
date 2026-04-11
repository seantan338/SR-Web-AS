import React from 'react';

export default function InternalTools() {
  // 💡 架构师注：请将这里的 URL 替换为你 Zeabur 上 SR-Internal-Tools 绑定的真实域名！
  // 例如: https://sr-internal-tools.zeabur.app
  const toolsUrl = "http://sunriserecruittools.zeabur.app/";

  return (
    <div className="flex flex-col h-full w-full bg-slate-50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div className="p-4 bg-white shadow-sm border-b z-10 relative">
        <h1 className="text-2xl font-bold text-slate-800">内部员工工具箱</h1>
        <p className="text-sm text-slate-500">机密系统：仅限授权员工访问与操作</p>
      </div>
      
      <div className="flex-grow w-full relative z-0">
        {/* 核心嵌入层：利用 iframe 无缝接入独立的静态工具服务 */}
        <iframe
          src={toolsUrl}
          title="SR Internal Tools"
          className="w-full h-full border-0 absolute inset-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}
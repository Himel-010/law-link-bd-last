import React from "react";
import { FiBell, FiSearch } from "react-icons/fi";

const Topbar = ({ pageTitle }) => {
  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm text-slate-500">Dashboard / {pageTitle}</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          {pageTitle}
        </h2>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <FiSearch className="text-slate-400" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        <button className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5">
          <FiBell className="text-lg text-slate-700" />
          <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </button>
      </div>
    </div>
  );
};

export default Topbar;
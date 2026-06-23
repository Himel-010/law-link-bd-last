import React from "react";
import { motion } from "framer-motion";

const AnalyticsContent = ({ analyticsBars }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
        {[
          ["Visits", "48.2K"],
          ["Conversions", "3.86K"],
          ["Bounce Rate", "18.4%"],
          ["Avg. Session", "6m 12s"],
        ].map(([title, value]) => (
          <div
            key={title}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-slate-500">{title}</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">{value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Traffic Analytics</h3>
              <p className="text-sm text-slate-500">Weekly performance breakdown</p>
            </div>
            <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
              Export
            </button>
          </div>

          <div className="flex h-[320px] items-end gap-4">
            {analyticsBars.map((bar, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-3">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${bar}%` }}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
                  className="w-full rounded-t-3xl bg-gradient-to-t from-slate-900 to-slate-400"
                />
                <span className="text-xs text-slate-400">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Top Metrics</h3>
          <p className="mt-1 text-sm text-slate-500">Channel performance</p>

          <div className="mt-6 space-y-5">
            {[
              ["Organic Search", "72%"],
              ["Direct Traffic", "58%"],
              ["Paid Campaigns", "43%"],
              ["Referral", "31%"],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold text-slate-900">{value}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div className="h-2.5 rounded-full bg-slate-900" style={{ width: value }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsContent;
import React from "react";
import { FiBriefcase, FiArrowUpRight } from "react-icons/fi";

const ProjectsContent = ({ projects }) => {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Project Board</h3>
            <p className="text-sm text-slate-500">Track and organize team progress</p>
          </div>
          <button className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
            New Project
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <div
              key={project.name}
              className="rounded-3xl border border-slate-200 p-5 transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <FiBriefcase className="text-slate-700" />
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {project.status}
                </span>
              </div>

              <h4 className="mt-4 text-lg font-semibold text-slate-900">{project.name}</h4>
              <p className="mt-1 text-sm text-slate-500">{project.team}</p>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div
                    className="h-2.5 rounded-full bg-slate-900"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              <button className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                Open Project <FiArrowUpRight />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Project Summary</h3>
        <p className="mt-1 text-sm text-slate-500">Quick performance overview</p>

        <div className="mt-6 space-y-5">
          {[
            ["Completed", "18"],
            ["In Progress", "11"],
            ["Pending", "6"],
            ["On Hold", "3"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-slate-500">{label}</span>
              <span className="text-lg font-semibold text-slate-900">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl bg-slate-900 p-5 text-white">
          <p className="text-sm text-slate-300">Efficiency Score</p>
          <h4 className="mt-2 text-3xl font-bold">89%</h4>
          <p className="mt-2 text-sm text-slate-300">
            Project delivery performance is staying above target.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectsContent;
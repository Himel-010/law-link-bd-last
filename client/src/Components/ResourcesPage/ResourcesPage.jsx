"use client";

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Eye,
  Search,
  BookOpen,
  Scale,
  Shield,
  Home,
  Users,
  Briefcase,
  ExternalLink,
  RefreshCcw,
} from "lucide-react";

import resourcesPageI18n from "../../json/resourcesPage.json";

const iconMap = {
  FileText,
  BookOpen,
  Scale,
  Shield,
  Home,
  Users,
  Briefcase,
};

const getGoogleDriveFileId = (url = "") => {
  const match = String(url).match(/\/file\/d\/([^/]+)/);
  return match?.[1] || "";
};

const getGoogleDriveDownloadUrl = (url = "") => {
  const fileId = getGoogleDriveFileId(url);
  if (!fileId) return url;
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
};

const getCategoryLabel = (categories = [], key = "all") => {
  return categories.find((item) => item.key === key)?.label || key;
};

const ResourceIcon = ({ iconName }) => {
  const Icon = iconMap[iconName] || FileText;
  return <Icon className="h-6 w-6" />;
};

const ResourcesPage = () => {
  const currentLanguage = useSelector(
    (state) => state.language?.currentLanguage || "en"
  );

  const t =
    resourcesPageI18n[currentLanguage]?.resourcesPage ||
    resourcesPageI18n.en.resourcesPage;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const resources = useMemo(() => t.resources || [], [t.resources]);
  const categories = useMemo(() => t.categories || [], [t.categories]);

  const filteredResources = useMemo(() => {
    const searchValue = searchTerm.trim().toLowerCase();

    return resources.filter((resource) => {
      const categoryLabel = getCategoryLabel(categories, resource.categoryKey);

      const searchableText = [
        resource.title,
        resource.description,
        categoryLabel,
        t.typeLabels?.[resource.typeKey],
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchValue || searchableText.includes(searchValue);

      const matchesCategory =
        selectedCategory === "all" || resource.categoryKey === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [resources, categories, searchTerm, selectedCategory, t.typeLabels]);

  const handleReset = () => {
    setSearchTerm("");
    setSelectedCategory("all");
  };

  return (
    <main className="min-h-screen bg-slate-50 pt-24">
      <section className="bg-white pb-8 pt-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-4xl text-center"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-4 py-2 text-xs font-black text-cyan-700">
              <BookOpen className="h-4 w-4" />
              {t.heroBadge}
            </span>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
              {t.title}
            </h1>

            <p className="mx-auto mt-4 max-w-3xl text-base font-medium leading-8 text-slate-500 md:text-lg">
              {t.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-20 pt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mb-8 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-6"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            <div className="grid gap-4 md:grid-cols-[1fr_280px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                aria-label={t.categoryLabel}
              >
                {categories.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
              >
                <RefreshCcw className="h-4 w-4" />
                {t.resetFilters}
              </button>
            </div>
          </motion.div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-slate-500">
              {t.showingPrefix}{" "}
              <span className="font-black text-slate-950">
                {filteredResources.length}
              </span>{" "}
              {t.showingMiddle}{" "}
              <span className="font-black text-slate-950">
                {resources.length}
              </span>{" "}
              {t.showingSuffix}
            </p>
          </div>

          {filteredResources.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredResources.map((resource, index) => {
                const categoryLabel = getCategoryLabel(
                  categories,
                  resource.categoryKey
                );
                const typeLabel =
                  t.typeLabels?.[resource.typeKey] || resource.typeKey;
                const downloadUrl = getGoogleDriveDownloadUrl(resource.url);

                return (
                  <motion.article
                    key={resource.id}
                    className="group overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-xl"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.45,
                      delay: Math.min(index * 0.04, 0.22),
                    }}
                  >
                    <div className="relative bg-gradient-to-br from-cyan-50 via-white to-slate-50 p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-700 text-white shadow-sm">
                          <ResourceIcon iconName={resource.icon} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h2 className="line-clamp-2 text-xl font-black tracking-tight text-slate-950">
                            {resource.title}
                          </h2>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-cyan-700 ring-1 ring-cyan-100">
                              {categoryLabel}
                            </span>

                            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 ring-1 ring-amber-100">
                              {typeLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 p-6">
                      <p className="line-clamp-3 text-sm font-medium leading-6 text-slate-500">
                        {resource.description}
                      </p>

                      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black text-slate-500">
                        <span>
                          {resource.size || t.fileSizeUnknown} •{" "}
                          {resource.format || "Drive"}
                        </span>

                        <span className="inline-flex items-center gap-1.5 text-cyan-700">
                          <ExternalLink className="h-3.5 w-3.5" />
                          {t.driveFile}
                        </span>
                      </div>

                      <div className="grid grid-cols-[1fr_auto] gap-3">
                        <motion.a
                          href={downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-800"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Download className="h-4 w-4" />
                          {t.download}
                        </motion.a>

                        <motion.a
                          href={resource.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                          aria-label={`${t.preview}: ${resource.title}`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Eye className="h-4 w-4" />
                        </motion.a>
                      </div>

                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {t.openDrive}
                      </a>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                <Search className="h-8 w-8" />
              </div>

              <h3 className="mt-5 text-2xl font-black text-slate-950">
                {t.noResultsTitle}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {t.noResultsText}
              </p>

              <button
                type="button"
                onClick={handleReset}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-800"
              >
                <RefreshCcw className="h-4 w-4" />
                {t.resetFilters}
              </button>
            </div>
          )}

          <motion.div
            className="mt-16"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <h2 className="mb-8 text-center text-2xl font-black text-slate-950">
              {t.popularCategories}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {categories
                .filter((category) => category.key !== "all")
                .map((category, index) => (
                  <motion.button
                    key={category.key}
                    type="button"
                    onClick={() => setSelectedCategory(category.key)}
                    className={`rounded-[24px] border p-5 text-center transition duration-300 hover:-translate-y-1 hover:shadow-lg ${
                      selectedCategory === category.key
                        ? "border-cyan-300 bg-cyan-50 text-cyan-700"
                        : "border-slate-200 bg-white text-slate-900 hover:border-cyan-200"
                    }`}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.42,
                      delay: Math.min(index * 0.04, 0.2),
                    }}
                  >
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                      <Scale className="h-5 w-5" />
                    </div>

                    <span className="text-sm font-black">
                      {category.label}
                    </span>
                  </motion.button>
                ))}
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default ResourcesPage;

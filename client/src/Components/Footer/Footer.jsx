"use client";

import {
  Scale,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
} from "lucide-react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import i18n from "../../json/footer.json";

const Footer = () => {
  const navigate = useNavigate();
  const currentLanguage = useSelector(
    (state) => state.language.currentLanguage || "en"
  );

  const t = i18n?.[currentLanguage]?.footer || i18n?.en?.footer;

  const goToRoute = (route) => {
    navigate(route);

    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 50);
  };

  const footerSections = [
    {
      title: t.sections.quickLinks.title,
      links: [
        {
          label: t.sections.quickLinks.items.home,
          route: "/",
        },
        {
          label: t.sections.quickLinks.items.findLawyers,
          route: "/lawyers",
        },
        {
          label: t.sections.quickLinks.items.submitCase,
          route: "/posts",
        },
        {
          label: t.sections.quickLinks.items.resources,
          route: "/resources",
        },
        {
          label: t.sections.quickLinks.items.aboutUs,
          route: "/about-us",
        },
      ],
    },
    {
      title: t.sections.legalServices.title,
      links: [
        {
          label: t.sections.legalServices.items.familyLaw,
          route: "/lawyers",
        },
        {
          label: t.sections.legalServices.items.propertyLaw,
          route: "/lawyers",
        },
        {
          label: t.sections.legalServices.items.immigration,
          route: "/lawyers",
        },
        {
          label: t.sections.legalServices.items.criminalDefense,
          route: "/lawyers",
        },
        {
          label: t.sections.legalServices.items.civilRights,
          route: "/lawyers",
        },
      ],
    },
    {
      title: t.sections.resources.title,
      links: [
        {
          label: t.sections.resources.items.legalDocuments,
          route: "/resources",
        },
        {
          label: t.sections.resources.items.faq,
          route: "/resources",
        },
        {
          label: t.sections.resources.items.blog,
          route: "/resources",
        },
        {
          label: t.sections.resources.items.caseStudies,
          route: "/resources",
        },
        {
          label: t.sections.resources.items.legalGuides,
          route: "/resources",
        },
      ],
    },
    {
      title: t.sections.support.title,
      links: [
        {
          label: t.sections.support.items.helpCenter,
          route: "/contact-us",
        },
        {
          label: t.sections.support.items.contactUs,
          route: "/contact-us",
        },
        {
          label: t.sections.support.items.privacyPolicy,
          route: "/privacy-policy",
        },
        {
          label: t.sections.support.items.termsOfService,
          route: "/terms-of-service",
        },
        {
          label: t.sections.support.items.accessibility,
          route: "/accessibility",
        },
      ],
    },
  ];

  const socialLinks = [
    {
      icon: Facebook,
      label: "Facebook",
      url: "#",
    },
    {
      icon: Twitter,
      label: "Twitter",
      url: "#",
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      url: "#",
    },
    {
      icon: Instagram,
      label: "Instagram",
      url: "#",
    },
  ];

  const containerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 18,
    },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  if (!t) return null;

  return (
    <footer
      key={currentLanguage}
      className="w-full border-t border-slate-200 bg-slate-50"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.15 }}
        >
          <motion.div
            className="sm:col-span-2 lg:col-span-2"
            variants={itemVariants}
          >
            <button
              type="button"
              onClick={() => goToRoute("/")}
              className="mb-4 flex items-center gap-2 text-left"
            >
              <Scale className="h-8 w-8 text-cyan-600" />

              <span className="text-xl font-bold text-slate-800">
                {t.brand.name}
              </span>
            </button>

            <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              {t.brand.description}
            </p>

            <div className="mt-6 space-y-3">
              <motion.a
                href={`mailto:${t.contact.email}`}
                className="flex w-fit items-center gap-2 text-slate-600 transition-colors hover:text-cyan-600"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Mail className="h-4 w-4 text-cyan-600" />
                <span className="text-sm sm:text-base">{t.contact.email}</span>
              </motion.a>

              <motion.a
                href={`tel:${String(t.contact.phone || "").replace(
                  /\s/g,
                  ""
                )}`}
                className="flex w-fit items-center gap-2 text-slate-600 transition-colors hover:text-cyan-600"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Phone className="h-4 w-4 text-cyan-600" />
                <span className="text-sm sm:text-base">{t.contact.phone}</span>
              </motion.a>

              <motion.div
                className="flex items-start gap-2 text-slate-600"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                <span className="text-sm leading-6 sm:text-base">
                  {t.contact.address}
                </span>
              </motion.div>
            </div>
          </motion.div>

          {footerSections.map((section) => (
            <motion.div key={section.title} variants={itemVariants}>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-800">
                {section.title}
              </h3>

              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.label}`}>
                    <motion.button
                      type="button"
                      onClick={() => goToRoute(link.route)}
                      className="text-left text-sm font-medium leading-6 text-slate-600 transition-colors hover:text-cyan-600"
                      whileHover={{ x: 3 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {link.label}
                    </motion.button>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-12 flex flex-col items-center justify-between gap-5 border-t border-slate-200 pt-8 md:flex-row"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ delay: 0.15 }}
        >
          <div className="text-center text-sm text-slate-600 md:text-left">
            {t.bottom.copyright}
          </div>

          <div className="flex items-center gap-4">
            {socialLinks.map((item) => {
              const Icon = item.icon;

              return (
                <motion.a
                  key={item.label}
                  href={item.url}
                  aria-label={item.label}
                  className="rounded-full p-2 text-slate-600 transition-colors hover:bg-cyan-50 hover:text-cyan-600"
                  whileHover={{ scale: 1.16, rotate: 5 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Icon className="h-5 w-5" />
                </motion.a>
              );
            })}
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
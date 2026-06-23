"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Scale,
  ShieldCheck,
  Users,
  FileText,
  HeartHandshake,
  Globe2,
  CheckCircle,
  ArrowRight,
  Target,
  Eye,
  Handshake,
  Award,
  BriefcaseBusiness,
  MessageCircle,
} from "lucide-react";

const aboutContent = {
  en: {
    heroBadge: "About LawLinkBD",
    heroTitle: "Making Legal Help Simple, Trusted, and Accessible",
    heroDesc:
      "LawLinkBD connects clients with verified lawyers, simplifies case posting, and helps people get legal support without unnecessary hassle.",
    primaryBtn: "Find Lawyers",
    secondaryBtn: "Contact Us",

    stats: [
      { value: "500+", label: "Verified Lawyers" },
      { value: "10K+", label: "People Supported" },
      { value: "24/7", label: "Access Anytime" },
      { value: "95%", label: "User Satisfaction" },
    ],

    missionTitle: "Our Mission",
    missionDesc:
      "Our mission is to remove the complexity from legal help. We help clients find the right lawyer, post legal problems, compare expertise, and communicate with professionals in a secure platform.",

    visionTitle: "Our Vision",
    visionDesc:
      "We aim to build a digital legal ecosystem where justice and legal guidance are easier to access for everyone, regardless of location, background, or experience.",

    valuesTitle: "What We Stand For",
    valuesDesc:
      "LawLinkBD is built around trust, transparency, and smooth user experience.",

    values: [
      {
        title: "Verified Legal Experts",
        desc: "We focus on approved and verified lawyer profiles so users can choose confidently.",
      },
      {
        title: "Simple Case Posting",
        desc: "Clients can explain their legal problems clearly and receive lawyer responses in one place.",
      },
      {
        title: "Secure Communication",
        desc: "Users and lawyers can communicate safely after appointments or accepted case interactions.",
      },
      {
        title: "Accessible Legal Support",
        desc: "Our system is designed to make legal services easier to reach and understand.",
      },
    ],

    processTitle: "How LawLinkBD Helps",
    processDesc:
      "A smoother path from legal problem to professional support.",

    steps: [
      {
        title: "Post Your Legal Need",
        desc: "Clients can create posts describing their legal issue with important details.",
      },
      {
        title: "Connect With Lawyers",
        desc: "Verified lawyers can review posts, send bids, or offer consultation support.",
      },
      {
        title: "Book Consultation",
        desc: "Clients can book available time slots with lawyers based on their needs.",
      },
      {
        title: "Get Legal Guidance",
        desc: "The platform helps both sides manage communication and progress clearly.",
      },
    ],

    teamTitle: "Built for Clients, Lawyers, and Admins",
    teamDesc:
      "Every role has a focused dashboard and experience designed for their actual workflow.",

    roles: [
      {
        title: "Clients",
        desc: "Post cases, browse lawyers, book consultations, and manage legal conversations.",
      },
      {
        title: "Lawyers",
        desc: "Build profile, manage availability, receive bookings, and communicate with clients.",
      },
      {
        title: "Admins",
        desc: "Verify lawyers, manage users, plans, subscriptions, payments, and platform quality.",
      },
    ],

    ctaTitle: "Ready to Get Legal Support?",
    ctaDesc:
      "Start by finding a verified lawyer or contact our team for any questions about the platform.",
    ctaPrimary: "Browse Lawyers",
    ctaSecondary: "Contact Support",
  },

  bn: {
    heroBadge: "LawLinkBD সম্পর্কে",
    heroTitle: "আইনি সহায়তা এখন সহজ, বিশ্বাসযোগ্য ও সহজলভ্য",
    heroDesc:
      "LawLinkBD ক্লায়েন্টদের যাচাইকৃত আইনজীবীদের সাথে যুক্ত করে, কেস পোস্টিং সহজ করে এবং ঝামেলা ছাড়াই আইনি সহায়তা পেতে সাহায্য করে।",
    primaryBtn: "আইনজীবী খুঁজুন",
    secondaryBtn: "যোগাযোগ করুন",

    stats: [
      { value: "৫০০+", label: "যাচাইকৃত আইনজীবী" },
      { value: "১০ হাজার+", label: "সহায়তা পাওয়া মানুষ" },
      { value: "২৪/৭", label: "যেকোনো সময় অ্যাক্সেস" },
      { value: "৯৫%", label: "ব্যবহারকারীর সন্তুষ্টি" },
    ],

    missionTitle: "আমাদের লক্ষ্য",
    missionDesc:
      "আমাদের লক্ষ্য হলো আইনি সহায়তাকে সহজ করা। ক্লায়েন্টরা যেন সঠিক আইনজীবী খুঁজে পায়, আইনি সমস্যা পোস্ট করতে পারে, দক্ষতা তুলনা করতে পারে এবং নিরাপদ প্ল্যাটফর্মে যোগাযোগ করতে পারে।",

    visionTitle: "আমাদের ভিশন",
    visionDesc:
      "আমরা এমন একটি ডিজিটাল আইনি ইকোসিস্টেম তৈরি করতে চাই যেখানে অবস্থান বা অভিজ্ঞতা যাই হোক, সবাই সহজে আইনি পরামর্শ পেতে পারে।",

    valuesTitle: "আমাদের মূল্যবোধ",
    valuesDesc:
      "LawLinkBD তৈরি হয়েছে বিশ্বাস, স্বচ্ছতা এবং সহজ ব্যবহার অভিজ্ঞতার উপর ভিত্তি করে।",

    values: [
      {
        title: "যাচাইকৃত আইনজীবী",
        desc: "ব্যবহারকারীরা যেন আত্মবিশ্বাসের সাথে আইনজীবী বেছে নিতে পারে, তাই আমরা যাচাইকৃত প্রোফাইলে গুরুত্ব দিই।",
      },
      {
        title: "সহজ কেস পোস্টিং",
        desc: "ক্লায়েন্টরা সহজে তাদের আইনি সমস্যা লিখে এক জায়গায় আইনজীবীদের সাড়া পেতে পারে।",
      },
      {
        title: "নিরাপদ যোগাযোগ",
        desc: "অ্যাপয়েন্টমেন্ট বা গ্রহণযোগ্য কেসের পর ব্যবহারকারী ও আইনজীবীরা নিরাপদে যোগাযোগ করতে পারে।",
      },
      {
        title: "সহজলভ্য আইনি সহায়তা",
        desc: "আইনি সেবাকে সহজে পৌঁছানো ও বোঝার জন্য আমাদের সিস্টেম তৈরি করা হয়েছে।",
      },
    ],

    processTitle: "LawLinkBD কীভাবে সাহায্য করে",
    processDesc:
      "আইনি সমস্যা থেকে পেশাদার সহায়তা পাওয়ার একটি সহজ পথ।",

    steps: [
      {
        title: "আপনার আইনি প্রয়োজন পোস্ট করুন",
        desc: "ক্লায়েন্টরা প্রয়োজনীয় তথ্যসহ তাদের আইনি সমস্যা পোস্ট করতে পারে।",
      },
      {
        title: "আইনজীবীদের সাথে যুক্ত হন",
        desc: "যাচাইকৃত আইনজীবীরা পোস্ট দেখে বিড পাঠাতে বা কনসালটেশন দিতে পারে।",
      },
      {
        title: "কনসালটেশন বুক করুন",
        desc: "ক্লায়েন্টরা আইনজীবীর অ্যাভেইলেবিলিটি অনুযায়ী সময় বুক করতে পারে।",
      },
      {
        title: "আইনি গাইডলাইন নিন",
        desc: "প্ল্যাটফর্মটি দুই পক্ষের যোগাযোগ ও অগ্রগতি পরিষ্কারভাবে পরিচালনায় সাহায্য করে।",
      },
    ],

    teamTitle: "ক্লায়েন্ট, আইনজীবী ও অ্যাডমিনের জন্য তৈরি",
    teamDesc:
      "প্রতিটি রোলের জন্য রয়েছে আলাদা ড্যাশবোর্ড ও কাজের সুবিধা।",

    roles: [
      {
        title: "ক্লায়েন্ট",
        desc: "কেস পোস্ট, আইনজীবী ব্রাউজ, কনসালটেশন বুক এবং আইনি কথোপকথন পরিচালনা করতে পারে।",
      },
      {
        title: "আইনজীবী",
        desc: "প্রোফাইল তৈরি, অ্যাভেইলেবিলিটি ম্যানেজ, বুকিং গ্রহণ এবং ক্লায়েন্টের সাথে যোগাযোগ করতে পারে।",
      },
      {
        title: "অ্যাডমিন",
        desc: "আইনজীবী যাচাই, ইউজার, প্ল্যান, সাবস্ক্রিপশন, পেমেন্ট এবং প্ল্যাটফর্ম পরিচালনা করতে পারে।",
      },
    ],

    ctaTitle: "আইনি সহায়তা নিতে প্রস্তুত?",
    ctaDesc:
      "যাচাইকৃত আইনজীবী খুঁজে শুরু করুন অথবা প্ল্যাটফর্ম সম্পর্কে জানতে আমাদের সাথে যোগাযোগ করুন।",
    ctaPrimary: "আইনজীবী দেখুন",
    ctaSecondary: "সাপোর্টে যোগাযোগ",
  },
};

const AboutUsPage = () => {
  const navigate = useNavigate();
  const currentLanguage = useSelector(
    (state) => state?.language?.currentLanguage || "en"
  );

  const t = useMemo(() => {
    return aboutContent[currentLanguage] || aboutContent.en;
  }, [currentLanguage]);

  const navigateToRoute = (route) => {
    navigate(route);

    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 50);
  };

  const valueIcons = [ShieldCheck, FileText, MessageCircle, Globe2];
  const stepIcons = [FileText, Users, BriefcaseBusiness, CheckCircle];
  const roleIcons = [Users, Scale, Award];

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-slate-950 pt-28">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/5668473/pexels-photo-5668473.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Legal consultation"
            className="h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/90 to-cyan-950/70" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-200">
                <Scale className="h-4 w-4" />
                {t.heroBadge}
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                {t.heroTitle}
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
                {t.heroDesc}
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <motion.button
                  type="button"
                  onClick={() => navigateToRoute("/lawyers")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-7 py-4 text-base font-bold text-white shadow-lg shadow-cyan-900/30 transition hover:bg-cyan-700"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {t.primaryBtn}
                  <ArrowRight className="h-5 w-5" />
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => navigateToRoute("/contact-us")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/70 px-7 py-4 text-base font-bold text-white transition hover:bg-white hover:text-slate-950"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {t.secondaryBtn}
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 35 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur">
                <img
                  src="https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=1000"
                  alt="Lawyer support"
                  className="h-[420px] w-full rounded-[1.5rem] object-cover"
                />

                <div className="absolute bottom-8 left-8 right-8 rounded-2xl border border-white/20 bg-slate-950/75 p-5 text-white backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-600">
                      <HeartHandshake className="h-6 w-6" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-cyan-200">
                        Legal Support Platform
                      </p>
                      <h3 className="text-lg font-black">
                        Trusted help, simpler process
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-5 -top-5 hidden rounded-2xl bg-amber-500 px-5 py-4 text-white shadow-xl lg:block">
                <p className="text-2xl font-black">24/7</p>
                <p className="text-sm font-semibold">Digital Access</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="-mt-12 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:grid-cols-2 lg:grid-cols-4">
            {t.stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="rounded-2xl bg-slate-50 p-6 text-center"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                viewport={{ once: true }}
              >
                <p className="text-3xl font-black text-cyan-600">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <motion.div
              className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              viewport={{ once: true }}
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                <Target className="h-7 w-7" />
              </div>

              <h2 className="text-3xl font-black text-slate-950">
                {t.missionTitle}
              </h2>

              <p className="mt-4 text-base leading-8 text-slate-600">
                {t.missionDesc}
              </p>
            </motion.div>

            <motion.div
              className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 shadow-lg"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                <Eye className="h-7 w-7" />
              </div>

              <h2 className="text-3xl font-black text-white">
                {t.visionTitle}
              </h2>

              <p className="mt-4 text-base leading-8 text-slate-300">
                {t.visionDesc}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto mb-14 max-w-3xl text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-black text-slate-950 sm:text-4xl">
              {t.valuesTitle}
            </h2>

            <p className="mt-4 text-lg leading-8 text-slate-600">
              {t.valuesDesc}
            </p>
          </motion.div>

          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-4">
            {t.values.map((item, index) => {
              const Icon = valueIcons[index] || ShieldCheck;

              return (
                <motion.div
                  key={item.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-xl"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  viewport={{ once: true }}
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 transition group-hover:bg-cyan-600 group-hover:text-white">
                    <Icon className="h-7 w-7" />
                  </div>

                  <h3 className="text-xl font-black text-slate-950">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {item.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto mb-14 max-w-3xl text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-black text-slate-950 sm:text-4xl">
              {t.processTitle}
            </h2>

            <p className="mt-4 text-lg leading-8 text-slate-600">
              {t.processDesc}
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {t.steps.map((step, index) => {
              const Icon = stepIcons[index] || CheckCircle;

              return (
                <motion.div
                  key={step.title}
                  className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  viewport={{ once: true }}
                >
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-600/20">
                      <Icon className="h-7 w-7" />
                    </div>

                    <span className="text-4xl font-black text-slate-100">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-950">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto mb-14 max-w-3xl text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              {t.teamTitle}
            </h2>

            <p className="mt-4 text-lg leading-8 text-slate-300">
              {t.teamDesc}
            </p>
          </motion.div>

          <div className="grid gap-7 md:grid-cols-3">
            {t.roles.map((role, index) => {
              const Icon = roleIcons[index] || Handshake;

              return (
                <motion.div
                  key={role.title}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 text-center shadow-xl backdrop-blur transition hover:bg-white/[0.07]"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  viewport={{ once: true }}
                >
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                    <Icon className="h-8 w-8" />
                  </div>

                  <h3 className="text-2xl font-black text-white">
                    {role.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-slate-300">
                    {role.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-cyan-600 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              {t.ctaTitle}
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-cyan-50">
              {t.ctaDesc}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <motion.button
                type="button"
                onClick={() => navigateToRoute("/lawyers")}
                className="rounded-xl bg-amber-500 px-8 py-4 text-lg font-bold text-white transition hover:bg-amber-600"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                {t.ctaPrimary}
              </motion.button>

              <motion.button
                type="button"
                onClick={() => navigateToRoute("/contact-us")}
                className="rounded-xl border-2 border-white px-8 py-4 text-lg font-bold text-white transition hover:bg-white hover:text-cyan-700"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                {t.ctaSecondary}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutUsPage;
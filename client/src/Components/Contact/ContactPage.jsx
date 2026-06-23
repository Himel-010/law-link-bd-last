"use client";

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  MapPin,
  Send,
  MessageCircle,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Headphones,
  ArrowRight,
} from "lucide-react";
import translations from "../../json/contact.json";

const API_BASE_URL = "https://law-link-bd-last.vercel.app/api";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
  urgency: "normal",
};

const ContactPage = () => {
  const { currentLanguage } = useSelector((state) => state.language);
  const t = translations[currentLanguage]?.contact || translations.en.contact;

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const urgencyOptions = useMemo(
    () => [
      {
        value: "low",
        label: t.form.urgencyOptions.low,
      },
      {
        value: "normal",
        label: t.form.urgencyOptions.normal,
      },
      {
        value: "high",
        label: t.form.urgencyOptions.high,
      },
      {
        value: "critical",
        label: t.form.urgencyOptions.critical,
      },
    ],
    [t]
  );

  const contactMethods = [
    {
      icon: Phone,
      title: t.methods.phone.title,
      description: t.methods.phone.description,
      contact: "+880 1700-000000",
      availability: t.methods.phone.availability,
    },
    {
      icon: Mail,
      title: t.methods.email.title,
      description: t.methods.email.description,
      contact: "support@lawlinkbd.com",
      availability: t.methods.email.availability,
    },
    {
      icon: MessageCircle,
      title: t.methods.chat.title,
      description: t.methods.chat.description,
      contact: "Available on website",
      availability: t.methods.chat.availability,
    },
    {
      icon: HelpCircle,
      title: t.methods.help.title,
      description: t.methods.help.description,
      contact: "help.lawlinkbd.com",
      availability: t.methods.help.availability,
    },
  ];

  const offices = [
    {
      city: t.offices.newYork,
      address: "House 12, Road 5, Dhanmondi, Dhaka",
      phone: "+880 1700-000000",
      email: "dhaka@lawlinkbd.com",
    },
    {
      city: t.offices.losAngeles,
      address: "Court Road, Chattogram",
      phone: "+880 1800-000000",
      email: "ctg@lawlinkbd.com",
    },
    {
      city: t.offices.chicago,
      address: "Zindabazar, Sylhet",
      phone: "+880 1900-000000",
      email: "sylhet@lawlinkbd.com",
    },
  ];

  const faqs = [t.faq.q1, t.faq.q2, t.faq.q3, t.faq.q4];

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (successMessage) setSuccessMessage("");
    if (errorMessage) setErrorMessage("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Full name is required.";

    if (!formData.email.trim()) return "Email address is required.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email.trim())) {
      return "Please provide a valid email address.";
    }

    if (!formData.subject.trim()) return "Subject is required.";

    if (!formData.message.trim()) return "Message is required.";

    if (formData.message.trim().length < 10) {
      return "Message must be at least 10 characters.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      setSuccessMessage("");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        urgency: formData.urgency || "normal",
      };

      const res = await fetch(`${API_BASE_URL}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send message.");
      }

      setSuccessMessage(
        data.message || "Your message has been sent successfully."
      );

      setFormData(initialFormData);
    } catch (error) {
      setErrorMessage(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-50 via-cyan-50/40 to-white text-slate-950">
      <section className="px-4 pb-10 pt-14 sm:px-6 lg:px-8 lg:pt-16">
        <div className="mx-auto max-w-7xl">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-cyan-200 bg-white px-5 py-2.5 text-sm font-black tracking-wide text-cyan-700 shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              Public Contact Support
            </div>

            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              {t.header.title}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-8 text-slate-600 sm:text-lg">
              {t.header.description}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.9fr)_minmax(360px,0.9fr)]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-200/70">
              <div className="border-b border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-white px-6 py-7 sm:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-950">
                      {t.form.title}
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
                      Fill out the form below. Your message will be sent directly
                      to the admin contact inbox.
                    </p>
                  </div>

                  <div className="hidden rounded-2xl bg-cyan-600/10 p-3 text-cyan-700 sm:block">
                    <Send className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-8">
                {successMessage && (
                  <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      {t.form.fullName} *
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      placeholder={t.form.fullNamePlaceholder}
                      className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      {t.form.email} *
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      placeholder={t.form.emailPlaceholder}
                      className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Phone
                    </label>

                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={loading}
                      placeholder="Enter your phone number"
                      className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      {t.form.urgency}
                    </label>

                    <select
                      name="urgency"
                      value={formData.urgency}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      {urgencyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    {t.form.subject} *
                  </label>

                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    placeholder={t.form.subjectPlaceholder}
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    {t.form.message} *
                  </label>

                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    rows={6}
                    placeholder={t.form.messagePlaceholder}
                    className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { y: -1 } : undefined}
                  whileTap={!loading ? { scale: 0.98 } : undefined}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4 text-sm font-black text-white shadow-xl shadow-cyan-600/20 transition hover:from-cyan-500 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Sending Message...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {t.form.submit}
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>

          <motion.aside
            className="space-y-6 lg:sticky lg:top-8"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
          >
            <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/70">
              <h3 className="text-2xl font-black tracking-tight text-slate-950">
                {t.info.title}
              </h3>

              <div className="mt-6 space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                    <Phone className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="break-words text-lg font-black text-slate-900">
                      +880 1700-000000
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {t.info.phoneTime}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                    <Mail className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="break-words text-lg font-black text-slate-900">
                      support@lawlinkbd.com
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {t.info.emailTime}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                    <Clock className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-lg font-black text-slate-900">
                      Fast Response
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                      Admin will review your message from the dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-cyan-600 via-cyan-700 to-cyan-900 p-7 text-white shadow-xl shadow-cyan-800/20">
              <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-2xl bg-white/15">
                <Headphones className="h-6 w-6" />
              </div>

              <h3 className="text-2xl font-black tracking-tight">
                {t.emergency.title}
              </h3>

              <p className="mt-3 text-sm font-medium leading-7 text-cyan-50">
                {t.emergency.description}
              </p>

              <button
                type="button"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300"
              >
                {t.emergency.button}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.aside>
        </div>

        <div className="mt-16">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black tracking-tight text-slate-950">
              {t.methods.title}
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
              Choose the support option that works best for your legal service
              request.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;

              return (
                <motion.div
                  key={method.title}
                  className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70 transition hover:-translate-y-1 hover:shadow-xl"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="text-lg font-black text-slate-950">
                    {method.title}
                  </h3>

                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                    {method.description}
                  </p>

                  <p className="mt-4 break-words text-sm font-black text-cyan-700">
                    {method.contact}
                  </p>

                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {method.availability}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-3xl font-black tracking-tight text-slate-950">
              {t.faq.title}
            </h2>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.04 }}
                >
                  <h3 className="font-black text-slate-950">{faq.question}</h3>

                  <p className="mt-2 text-sm font-medium leading-7 text-slate-600">
                    {faq.answer}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-6 text-3xl font-black tracking-tight text-slate-950">
              {t.offices.title}
            </h2>

            <div className="space-y-4">
              {offices.map((office, index) => (
                <motion.div
                  key={index}
                  className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.04 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                      <MapPin className="h-6 w-6" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-black text-slate-950">
                        {office.city}
                      </h3>

                      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                        {office.address}
                      </p>

                      <p className="mt-3 text-sm font-black text-slate-800">
                        {office.phone}
                      </p>

                      <p className="mt-1 break-words text-sm font-black text-cyan-700">
                        {office.email}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
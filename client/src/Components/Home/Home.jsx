"use client";

import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Users,
  Shield,
  Bell,
  Globe,
  Upload,
  Search,
  CheckCircle,
  Star,
  ArrowRight,
  Play,
  Quote,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import homeData from "../../json/home.json";

const HomePage = () => {
  const navigate = useNavigate();
  const currentLanguage = useSelector(
    (state) => state?.language?.currentLanguage || "en"
  );

  const t = useMemo(() => {
    return homeData?.[currentLanguage] || homeData?.en;
  }, [currentLanguage]);

  const [openFAQ, setOpenFAQ] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const carouselImageUrls = useMemo(
    () => [
      "https://images.pexels.com/photos/5668473/pexels-photo-5668473.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/5669602/pexels-photo-5669602.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/5668882/pexels-photo-5668882.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/5669619/pexels-photo-5669619.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    []
  );

  const carouselSlides = t?.carousel?.slides || [];

  const carouselImages = useMemo(() => {
    return carouselImageUrls.map((url, index) => ({
      url,
      title: carouselSlides?.[index]?.title || "",
      subtitle: carouselSlides?.[index]?.subtitle || "",
    }));
  }, [carouselImageUrls, carouselSlides]);

  useEffect(() => {
    if (!carouselImages.length) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [carouselImages.length]);

  const navigateToRoute = (route) => {
    navigate(route);

    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 50);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + carouselImages.length) % carouselImages.length
    );
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const handleSubmitCase = () => {
    navigateToRoute("/posts");
  };

  const handleBrowseLawyers = () => {
    navigateToRoute("/lawyers");
  };

  const handleContactSupport = () => {
    navigateToRoute("/contact-us");
  };

  const featureIcons = [
    <Upload className="h-8 w-8" key="Upload" />,
    <Search className="h-8 w-8" key="Search" />,
    <Users className="h-8 w-8" key="Users" />,
    <FileText className="h-8 w-8" key="FileText" />,
    <CheckCircle className="h-8 w-8" key="CheckCircle" />,
    <Bell className="h-8 w-8" key="Bell" />,
    <Globe className="h-8 w-8" key="Globe" />,
    <Shield className="h-8 w-8" key="Shield" />,
  ];

  const features = useMemo(() => {
    const items = t?.features?.items || [];

    return items.map((item, idx) => ({
      icon:
        featureIcons[idx] || (
          <FileText className="h-8 w-8" key={`fallback-${idx}`} />
        ),
      title: item?.title || "",
      description: item?.desc || "",
    }));
  }, [t, featureIcons]);

  const lawyers = [
    {
      name: "Sarah Ahmed",
      specialty: "Family Law",
      experience: "8 years",
      rating: 4.9,
      cases: 150,
      image:
        "https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    {
      name: "Dr. Rahman Khan",
      specialty: "Property Law",
      experience: "12 years",
      rating: 4.8,
      cases: 200,
      image:
        "https://images.pexels.com/photos/5668473/pexels-photo-5668473.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    {
      name: "Maria Rodriguez",
      specialty: "Immigration Law",
      experience: "6 years",
      rating: 4.9,
      cases: 120,
      image:
        "https://images.pexels.com/photos/5668882/pexels-photo-5668882.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
  ];

  const testimonials = [
    {
      name: "Fatima Hassan",
      case: "Property Dispute",
      text: "The platform helped me find an excellent lawyer who resolved my property dispute efficiently. The process was transparent and I was updated at every step.",
      rating: 5,
    },
    {
      name: "Ahmed Ali",
      case: "Family Law",
      text: "I received free legal aid for my family matter. The lawyer was professional and the multi-language support made everything easier to understand.",
      rating: 5,
    },
    {
      name: "Priya Sharma",
      case: "Document Verification",
      text: "The document verification system saved me from a potential fraud. The technology is impressive and gives peace of mind.",
      rating: 5,
    },
  ];

  const faqs = [
    {
      question: "How does the lawyer matching system work?",
      answer:
        "Our AI-powered system analyzes your case details, location, and legal needs to match you with qualified volunteer lawyers who specialize in your specific area of law. The matching process typically takes 24-48 hours.",
    },
    {
      question: "Is the legal aid service really free?",
      answer:
        "Yes, our platform connects you with volunteer lawyers who provide pro bono services. There are no fees for using our matching service, accessing legal resources, or basic consultations. Some complex cases may require additional services that could incur costs.",
    },
    {
      question: "What types of legal cases do you handle?",
      answer:
        "We handle a wide range of legal matters including family law, property disputes, immigration issues, employment law, civil rights cases, and document verification. Our network includes lawyers specializing in various areas of law.",
    },
    {
      question: "How secure is my personal information?",
      answer:
        "We use bank-level encryption and follow strict privacy protocols. Your personal information is never shared without your consent, and our document verification system uses blockchain technology for maximum security and transparency.",
    },
    {
      question: "Can I track the progress of my case?",
      answer:
        "Our platform provides real-time case tracking with updates on deadlines, milestones, and important developments. You'll receive notifications via SMS and email to keep you informed throughout the process.",
    },
    {
      question: "What languages are supported on the platform?",
      answer:
        "Our platform supports multiple languages including English, Bangla, Spanish, and Arabic. We're continuously adding more languages to serve diverse communities and ensure accessibility for everyone.",
    },
    {
      question: "How do I verify if a lawyer is qualified?",
      answer:
        "All lawyers on our platform go through a rigorous verification process. You can view their credentials, bar association membership, areas of expertise, client reviews, and success rates on their profiles.",
    },
    {
      question: "What if I'm not satisfied with the legal service?",
      answer:
        "We have a quality assurance process in place. If you're not satisfied, you can request a different lawyer or escalate the issue to our support team. We're committed to ensuring you receive quality legal assistance.",
    },
  ];

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="relative h-[85vh] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            <div
              className="h-full w-full bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${
                  carouselImages[currentSlide]?.url || ""
                })`,
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-50" />
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <motion.div
              key={`content-${currentSlide}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-7xl">
                <span className="text-cyan-400">
                  {t?.carousel?.platformName || "LawLinkBD"}
                </span>
              </h1>

              <h2 className="mb-4 text-2xl font-semibold text-white md:text-4xl">
                {carouselImages[currentSlide]?.title || ""}
              </h2>

              <p className="mb-8 text-xl leading-relaxed text-gray-200 md:text-2xl">
                {carouselImages[currentSlide]?.subtitle || ""}
              </p>

              <div className="mb-10 flex flex-col justify-center gap-4 sm:flex-row">
                <motion.button
                  type="button"
                  onClick={handleSubmitCase}
                  className="flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-cyan-700"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t?.carousel?.buttons?.submitCase || "Submit Your Case"}
                  <ArrowRight className="h-5 w-5" />
                </motion.button>

                <motion.button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-lg border-2 border-white px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-white hover:text-gray-900"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="h-5 w-5" />
                  {t?.carousel?.buttons?.watchDemo || "Watch Demo"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute inset-y-0 left-4 z-20 flex items-center">
          <motion.button
            type="button"
            onClick={prevSlide}
            className="rounded-full bg-white bg-opacity-20 p-3 text-white backdrop-blur-sm transition-all hover:bg-opacity-30"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft className="h-6 w-6" />
          </motion.button>
        </div>

        <div className="absolute inset-y-0 right-4 z-20 flex items-center">
          <motion.button
            type="button"
            onClick={nextSlide}
            className="rounded-full bg-white bg-opacity-20 p-3 text-white backdrop-blur-sm transition-all hover:bg-opacity-30"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className="h-6 w-6" />
          </motion.button>
        </div>

        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 transform space-x-4">
          {carouselImages.map((_, index) => (
            <motion.button
              type="button"
              key={index}
              onClick={() => goToSlide(index)}
              className={`text-3xl font-bold transition-all duration-300 ${
                currentSlide === index
                  ? "text-cyan-400"
                  : "text-white text-opacity-60"
              }`}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              animate={{
                scale: currentSlide === index ? 1.1 : 1,
                opacity: currentSlide === index ? 1 : 0.6,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {currentSlide === index ? (
                <span className="inline-block h-4 w-4 rounded-full bg-cyan-400" />
              ) : (
                "•"
              )}
            </motion.button>
          ))}
        </div>

        <div className="absolute bottom-20 left-1/2 z-20 -translate-x-1/2 transform">
          <div className="flex items-center gap-8 rounded-lg bg-white bg-opacity-10 px-8 py-4 backdrop-blur-sm">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-2xl font-bold text-cyan-400">10,000+</div>
              <div className="text-sm text-gray-200">
                {t?.carousel?.stats?.casesResolved || "Cases Resolved"}
              </div>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="text-2xl font-bold text-cyan-400">500+</div>
              <div className="text-sm text-gray-200">
                {t?.carousel?.stats?.volunteerLawyers || "Volunteer Lawyers"}
              </div>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="text-2xl font-bold text-cyan-400">95%</div>
              <div className="text-sm text-gray-200">
                {t?.carousel?.stats?.successRate || "Success Rate"}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              {t?.features?.sectionTitle || "Comprehensive Legal Aid Platform"}
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-gray-600">
              {t?.features?.sectionDesc || ""}
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg transition-all duration-300 hover:border-cyan-300 hover:shadow-xl"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="mb-4 text-cyan-600">{feature.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              {t?.lawyers?.sectionTitle || "Meet Our Volunteer Lawyers"}
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-gray-600">
              {t?.lawyers?.sectionDesc || ""}
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {lawyers.map((lawyer, index) => (
              <motion.div
                key={index}
                className="rounded-xl border border-gray-200 bg-white p-8 shadow-lg transition-all duration-300 hover:border-cyan-300 hover:shadow-xl"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="mb-6 text-center">
                  <img
                    src={lawyer.image || "/placeholder.svg"}
                    alt={lawyer.name}
                    className="mx-auto mb-4 h-24 w-24 rounded-full border-4 border-cyan-200 object-cover"
                  />
                  <h3 className="mb-1 text-xl font-semibold text-gray-900">
                    {lawyer.name}
                  </h3>
                  <p className="font-medium text-cyan-600">
                    {lawyer.specialty}
                  </p>
                </div>

                <div className="mb-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Experience:</span>
                    <span className="font-medium text-gray-900">
                      {lawyer.experience}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Cases Handled:</span>
                    <span className="font-medium text-gray-900">
                      {lawyer.cases}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Rating:</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium text-gray-900">
                        {lawyer.rating}
                      </span>
                    </div>
                  </div>
                </div>

                <motion.button
                  type="button"
                  onClick={handleBrowseLawyers}
                  className="w-full rounded-lg bg-cyan-600 py-3 font-semibold text-white transition-colors hover:bg-cyan-700"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t?.lawyers?.button || "Connect Now"}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              {t?.testimonials?.sectionTitle || "Success Stories"}
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-gray-600">
              {t?.testimonials?.sectionDesc || ""}
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="rounded-xl border border-gray-200 bg-white p-8 shadow-lg"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Quote className="mb-4 h-8 w-8 text-cyan-600" />
                <p className="mb-6 leading-relaxed text-gray-900">
                  "{testimonial.text}"
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {testimonial.case}
                    </p>
                  </div>

                  <div className="flex">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              {t?.faqs?.sectionTitle || "Frequently Asked Questions"}
            </h2>
            <p className="text-xl text-gray-600">
              {t?.faqs?.sectionDesc || ""}
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <motion.button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50"
                  whileHover={{ backgroundColor: "rgb(249 250 251)" }}
                >
                  <span className="pr-4 font-semibold text-gray-900">
                    {faq.question}
                  </span>

                  <motion.div
                    animate={{ rotate: openFAQ === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {openFAQ === index ? (
                      <Minus className="h-5 w-5 flex-shrink-0 text-cyan-600" />
                    ) : (
                      <Plus className="h-5 w-5 flex-shrink-0 text-cyan-600" />
                    )}
                  </motion.div>
                </motion.button>

                <motion.div
                  initial={false}
                  animate={{ height: openFAQ === index ? "auto" : 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="px-6 pb-4">
                    <p className="leading-relaxed text-gray-600">
                      {faq.answer}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="mb-4 text-gray-600">Still have questions?</p>

            <motion.button
              type="button"
              onClick={handleContactSupport}
              className="rounded-lg bg-cyan-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-cyan-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t?.faqs?.contactBtn || "Contact Support"}
            </motion.button>
          </motion.div>
        </div>
      </section>

      <section className="bg-cyan-600 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
              {t?.callToAction?.sectionTitle || "Ready to Get Legal Help?"}
            </h2>

            <p className="mb-8 text-xl leading-relaxed text-cyan-100">
              {t?.callToAction?.sectionDesc || ""}
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <motion.button
                type="button"
                onClick={handleSubmitCase}
                className="rounded-lg bg-amber-500 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-amber-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t?.callToAction?.buttons?.submitCase || "Submit Your Case"}
              </motion.button>

              <motion.button
                type="button"
                onClick={handleBrowseLawyers}
                className="rounded-lg border-2 border-white px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-white hover:text-cyan-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t?.callToAction?.buttons?.browseLawyers || "Browse Lawyers"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
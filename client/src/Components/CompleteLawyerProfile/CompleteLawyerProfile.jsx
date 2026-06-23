"use client";

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Camera,
  Clock,
  FileText,
  ImagePlus,
  Loader2,
  MapPin,
  Scale,
  Wallet,
} from "lucide-react";

const LAWYER_SPECIALIZATIONS = [
  "Family Law",
  "Criminal Law",
  "Property Law",
  "Corporate Law",
  "Immigration Law",
  "Employment Law",
  "Tax Law",
  "Civil Law",
  "Cyber Law",
  "Other",
];

const LAWYER_AVAILABILITY = ["available", "busy", "offline"];

const CompleteLawyerProfile = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  const [formData, setFormData] = useState({
    specialization: "",
    experienceYears: "",
    bio: "",
    officeAddress: "",
    city: "",
    consultationFee: "",
    availability: "available",
    profileImage: null,
  });

  const token = useMemo(() => {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  }, []);

  const currentUser = useMemo(() => {
    const localUser = localStorage.getItem("currentUser");
    const sessionUser = sessionStorage.getItem("currentUser");

    try {
      return JSON.parse(localUser || sessionUser || "null");
    } catch {
      return null;
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload a valid image file.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      profileImage: file,
    }));

    setImagePreview(URL.createObjectURL(file));
    setErrorMessage("");
  };

  const saveUpdatedUser = (updatedUser) => {
    const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
    storage.setItem("currentUser", JSON.stringify(updatedUser));
  };

  const validateForm = () => {
    if (!token) {
      return "You are not logged in. Please sign in again.";
    }

    if (currentUser?.role && currentUser.role !== "lawyer") {
      return "Only lawyers can complete lawyer profile.";
    }

    if (!formData.specialization) {
      return "Please select your specialization.";
    }

    if (formData.experienceYears === "") {
      return "Please enter your experience years.";
    }

    if (Number(formData.experienceYears) < 0 || Number(formData.experienceYears) > 80) {
      return "Experience years must be between 0 and 80.";
    }

    if (!formData.profileImage) {
      return "Please upload your profile image.";
    }

    if (!formData.bio.trim()) {
      return "Please write your professional bio.";
    }

    if (!formData.city.trim()) {
      return "Please enter your city.";
    }

    if (formData.consultationFee === "") {
      return "Please enter your consultation fee.";
    }

    if (Number(formData.consultationFee) < 0) {
      return "Consultation fee cannot be negative.";
    }

    if (!formData.availability) {
      return "Please select your availability.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setLoading(true);

      const payload = new FormData();

      payload.append("specialization", formData.specialization);
      payload.append("experienceYears", formData.experienceYears);
      payload.append("bio", formData.bio);
      payload.append("officeAddress", formData.officeAddress);
      payload.append("city", formData.city);
      payload.append("consultationFee", formData.consultationFee);
      payload.append("availability", formData.availability);
      payload.append("profileImage", formData.profileImage);

      const res = await fetch(
        "https://law-link-bd-last.vercel.app/api/users/lawyer/profile/complete",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: payload,
        }
      );

      const result = await res.json();

      if (!res.ok) {
        setErrorMessage(result?.message || result?.error || "Failed to complete profile.");
        return;
      }

      if (result?.data) {
        saveUpdatedUser(result.data);
      }

      setSuccessMessage(
        result?.message ||
          "Profile completed successfully. Please wait for admin verification."
      );

      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (error) {
      setErrorMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-cyan-700 transition hover:text-cyan-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </button>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.2fr] lg:items-start">
          <motion.div
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                <Scale className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-xl font-bold text-gray-950">
                  Complete Lawyer Profile
                </h1>
                <p className="text-sm text-gray-500">
                  Fill in your professional details.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <BadgeCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <h2 className="text-sm font-semibold text-amber-900">
                    Admin verification required
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    After completing your profile, admin must verify your phone
                    and approve your lawyer account before your profile becomes
                    public or you can take actions.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-gray-100 p-4">
                <FileText className="mt-0.5 h-5 w-5 text-cyan-700" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Required fields
                  </h3>
                  <p className="text-sm text-gray-500">
                    Specialization, experience, profile image, bio, city, fee,
                    and availability.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-gray-100 p-4">
                <Clock className="mt-0.5 h-5 w-5 text-cyan-700" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Approval flow
                  </h3>
                  <p className="text-sm text-gray-500">
                    Profile complete first, then admin verification.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 sm:p-6"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {successMessage && (
              <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-gray-800">
                Profile Image
              </label>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <Camera className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700">
                    <ImagePlus className="h-4 w-4" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>

                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    Upload a clear professional image. This is required for
                    profile completion.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Specialization
                </label>
                <div className="relative">
                  <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    required
                  >
                    <option value="">Select specialization</option>
                    {LAWYER_SPECIALIZATIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Experience Years
                </label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    name="experienceYears"
                    min="0"
                    max="80"
                    value={formData.experienceYears}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    placeholder="Example: 5"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  City
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    placeholder="Example: Dhaka"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Consultation Fee
                </label>
                <div className="relative">
                  <Wallet className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    name="consultationFee"
                    min="0"
                    value={formData.consultationFee}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    placeholder="Example: 1000"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Availability
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {LAWYER_AVAILABILITY.map((item) => (
                    <label
                      key={item}
                      className={`cursor-pointer rounded-xl border px-3 py-3 text-center text-sm font-semibold capitalize transition ${
                        formData.availability === item
                          ? "border-cyan-600 bg-cyan-50 text-cyan-700"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="availability"
                        value={item}
                        checked={formData.availability === item}
                        onChange={handleChange}
                        className="hidden"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Office Address
                </label>
                <input
                  type="text"
                  name="officeAddress"
                  value={formData.officeAddress}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  placeholder="Chamber / office address"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Professional Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="5"
                  maxLength="1000"
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  placeholder="Write a short professional bio about your legal experience..."
                  required
                />

                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>Keep it clear and professional.</span>
                  <span>{formData.bio.length}/1000</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleBack}
                className="w-full rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
              >
                Cancel
              </button>

              <motion.button
                type="submit"
                disabled={loading}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition sm:flex-1 ${
                  loading
                    ? "cursor-not-allowed bg-cyan-400"
                    : "bg-cyan-600 hover:bg-cyan-700"
                }`}
                whileHover={loading ? {} : { scale: 1.01 }}
                whileTap={loading ? {} : { scale: 0.99 }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Completing Profile...
                  </>
                ) : (
                  <>
                    <BadgeCheck className="h-4 w-4" />
                    Complete Profile
                  </>
                )}
              </motion.button>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
};

export default CompleteLawyerProfile;
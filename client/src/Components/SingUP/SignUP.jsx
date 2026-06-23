"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Scale,
  ArrowLeft,
  CreditCard,
  BadgeCheck,
} from "lucide-react"
import { useSelector } from "react-redux"
import data from "../../json/signup.json"

const SignUp = () => {
  const navigate = useNavigate()
  const lang = useSelector((state) => state.language.currentLanguage)
  const t = data[lang].signup

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    userType: "client",
    nid: "",
    lawRegNumber: "",
    agreeToTerms: false,
  })

  const nidLabel = lang === "bn" ? "জাতীয় পরিচয়পত্র নম্বর" : "NID Number"
  const regLabel = lang === "bn" ? "বার কাউন্সিল / আইন নিবন্ধন নম্বর" : "Law Registration Number"

  const passwordMismatchText =
    lang === "bn" ? "পাসওয়ার্ড মিলছে না" : "Passwords don't match!"

  const termsErrorText =
    lang === "bn"
      ? "অনুগ্রহ করে শর্তাবলীতে সম্মতি দিন"
      : "Please accept the terms and conditions"

  const lawyerFieldErrorText =
    lang === "bn"
      ? "আইনজীবীর জন্য NID এবং Law Registration Number আবশ্যক"
      : "NID and Law Registration Number are required for lawyers"

  const genericErrorText =
    lang === "bn" ? "কিছু একটা সমস্যা হয়েছে" : "Something went wrong"

  const creatingAccountText =
    lang === "bn" ? "একাউন্ট তৈরি হচ্ছে..." : "Creating Account..."

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage(passwordMismatchText)
      return
    }

    if (!formData.agreeToTerms) {
      setErrorMessage(termsErrorText)
      return
    }

    if (
      formData.userType === "lawyer" &&
      (!formData.nid.trim() || !formData.lawRegNumber.trim())
    ) {
      setErrorMessage(lawyerFieldErrorText)
      return
    }

    try {
      setLoading(true)

      const fullName = `${formData.firstName} ${formData.lastName}`.trim()

      const endpoint =
        formData.userType === "lawyer"
          ? "http://localhost:4000/api/users/register/lawyer"
          : "http://localhost:4000/api/users/register/client"

      const payload =
        formData.userType === "lawyer"
          ? {
              name: fullName,
              email: formData.email,
              nid: formData.nid,
              lawRegNumber: formData.lawRegNumber,
              phone: formData.phone,
              phoneVerified: 0,
              password: formData.password,
            }
          : {
              name: fullName,
              email: formData.email,
              phone: formData.phone,
              password: formData.password,
            }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok) {
        setErrorMessage(result.message || result.error || genericErrorText)
        return
      }

      setSuccessMessage(
        result.message ||
          (lang === "bn" ? "রেজিস্ট্রেশন সফল হয়েছে" : "Registration successful")
      )

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        userType: "client",
        nid: "",
        lawRegNumber: "",
        agreeToTerms: false,
      })

      setTimeout(() => {
        navigate("/sign-in")
      }, 1200)
    } catch (error) {
      setErrorMessage(error.message || genericErrorText)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-amber-50 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
        <motion.div
          className="hidden lg:block"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center lg:text-left">
            <motion.div
              className="flex items-center justify-center lg:justify-start gap-3 mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <Scale className="w-12 h-12 text-cyan-600" />
              <h1 className="text-4xl font-bold text-gray-900">LegalAid</h1>
            </motion.div>

            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {t.joinTitle}
            </h2>
            <p className="text-lg text-gray-600 mb-8">{t.joinDesc}</p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-cyan-600 rounded-full"></div>
                </div>
                <span className="text-gray-700">{t.freeConsultation}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
                </div>
                <span className="text-gray-700">{t.documentAccess}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-cyan-600 rounded-full"></div>
                </div>
                <span className="text-gray-700">{t.caseTracking}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="w-full max-w-md mx-auto lg:mx-0"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link
            to="/"
            className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backHome}
          </Link>

          <div className="text-center mb-6 lg:hidden">
            <motion.div
              className="flex items-center justify-center gap-2 mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <Scale className="w-8 h-8 text-cyan-600" />
              <h1 className="text-2xl font-bold text-gray-900">LegalAid</h1>
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t.createAccount}
            </h2>
            <p className="text-gray-600">{t.fillDetails}</p>
          </div>

          <motion.form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-xl shadow-xl space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="hidden lg:block text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t.createAccount}
              </h2>
              <p className="text-gray-600 text-sm">{t.fillDetails}</p>
            </div>

            {successMessage && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.accountType}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="userType"
                    value="client"
                    checked={formData.userType === "client"}
                    onChange={handleChange}
                    className="text-cyan-600"
                  />
                  <span className="text-xs">{t.client}</span>
                </label>

                <label className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="userType"
                    value="lawyer"
                    checked={formData.userType === "lawyer"}
                    onChange={handleChange}
                    className="text-cyan-600"
                  />
                  <span className="text-xs">{t.lawyer}</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t.firstName}
                </label>
                <div className="relative">
                  <User className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder={t.firstName}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t.lastName}
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder={t.lastName}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder={t.email}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t.phone}
              </label>
              <div className="relative">
                <Phone className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder={t.phone}
                  required
                />
              </div>
            </div>

            {formData.userType === "lawyer" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {nidLabel}
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="nid"
                      value={formData.nid}
                      onChange={handleChange}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder={nidLabel}
                      required={formData.userType === "lawyer"}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {regLabel}
                  </label>
                  <div className="relative">
                    <BadgeCheck className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="lawRegNumber"
                      value={formData.lawRegNumber}
                      onChange={handleChange}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder={regLabel}
                      required={formData.userType === "lawyer"}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-1 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t.password}
                </label>
                <div className="relative">
                  <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-8 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder={t.password}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t.confirmPassword}
                </label>
                <div className="relative">
                  <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-8 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder={t.confirmPassword}
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500 mt-0.5"
                  required
                />
                <span className="text-xs text-gray-600">
                  {t.agree}{" "}
                  <button
                    type="button"
                    className="text-cyan-600 hover:text-cyan-700 transition-colors"
                  >
                    {t.terms}
                  </button>{" "}
                  {t.privacy}
                </span>
              </label>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-lg text-white ${
                loading
                  ? "bg-cyan-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800"
              }`}
              whileHover={
                loading
                  ? {}
                  : {
                      scale: 1.02,
                      boxShadow: "0 8px 25px rgba(8, 145, 178, 0.3)",
                    }
              }
              whileTap={loading ? {} : { scale: 0.98 }}
            >
              {loading ? creatingAccountText : t.createAccount}
            </motion.button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">
                  {t.orContinue}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <motion.button
                type="button"
                className="flex items-center justify-center gap-2 py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02 }}
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  className="w-4 h-4"
                />
                <span className="text-xs font-medium">Google</span>
              </motion.button>

              <motion.button
                type="button"
                className="flex items-center justify-center gap-2 py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02 }}
              >
                <img
                  src="https://www.facebook.com/favicon.ico"
                  alt="Facebook"
                  className="w-4 h-4"
                />
                <span className="text-xs font-medium">Facebook</span>
              </motion.button>
            </div>
          </motion.form>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              {t.already}{" "}
              <Link
                to="/sign-in"
                className="text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
              >
                {t.signInHere}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default SignUp
"use client";

import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Scale, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// JSON i18n file
import signinI18n from "../../json/signin.json";

// Redux actions
import {
  signInStart,
  signInSuccess,
  signInError,
} from "../../Redux/UserSlice/UserSlice";

const SignIn = ({ onBack }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const currentLanguage = useSelector((state) => state.language.currentLanguage);
  const { loading, error } = useSelector((state) => state.user);

  // Text from JSON
  const t = signinI18n[currentLanguage]?.signin || signinI18n.en.signin;

  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const clearStoredAuth = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    sessionStorage.removeItem("currentUser");
    sessionStorage.removeItem("token");
  };

  const saveAuthData = (user, token, rememberMe) => {
    const storage = rememberMe ? localStorage : sessionStorage;

    clearStoredAuth();

    storage.setItem("currentUser", JSON.stringify(user));
    storage.setItem("token", token);
  };

  const redirectUserAfterLogin = (user) => {
    if (!user?.role) {
      navigate("/");
      return;
    }

    if (user.role === "lawyer") {
      if (!user.profileCompleted) {
        navigate("/lawyer/complete-profile");
        return;
      }

      if (user.phoneVerified !== 1 || !user.isVerifiedLawyer) {
        navigate("/lawyer/verification-pending");
        return;
      }

      navigate("/");
      return;
    }

    if (user.role === "admin") {
      navigate("/admin");
      return;
    }

    navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");

    try {
      dispatch(signInStart());

      const res = await fetch("https://law-link-bd-last.vercel.app/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        dispatch(signInError(data?.message || "Login failed"));
        return;
      }

      if (!data?.user || !data?.token) {
        dispatch(signInError("Login response missing user or token"));
        return;
      }

      saveAuthData(data.user, data.token, formData.rememberMe);

      dispatch(signInSuccess(data.user));
      setSuccessMessage(data?.message || "Login successful");

      setFormData({
        email: "",
        password: "",
        rememberMe: false,
      });

      redirectUserAfterLogin(data.user);
    } catch (err) {
      dispatch(signInError(err.message || "Something went wrong"));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleGoRegister = () => {
    window.scrollTo(0, 0);
    navigate("/sign-up");
  };

  const handleBackHome = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-md w-full space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Back Button */}
        <motion.button
          onClick={handleBackHome}
          className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 transition-colors"
          whileHover={{ x: -5 }}
          type="button"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backHome}
        </motion.button>

        {/* Header */}
        <div className="text-center">
          <motion.div
            className="flex items-center justify-center gap-2 mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Scale className="w-8 h-8 text-cyan-600" />
            <h1 className="text-2xl font-bold text-gray-900">{t.brand}</h1>
          </motion.div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t.welcomeTitle}
          </h2>
          <p className="text-gray-600">{t.welcomeDesc}</p>
        </div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Success Message */}
          {successMessage && (
            <div className="w-full rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.emailLabel}
            </label>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder={t.emailPlaceholder}
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.passwordLabel}
            </label>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder={t.passwordPlaceholder}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
              />
              <span className="text-sm text-gray-600">{t.rememberMe}</span>
            </label>

            <button
              type="button"
              className="text-sm text-cyan-600 hover:text-cyan-700 transition-colors"
            >
              {t.forgotPassword}
            </button>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition-colors text-white ${
              loading
                ? "bg-cyan-400 cursor-not-allowed"
                : "bg-cyan-600 hover:bg-cyan-700"
            }`}
            whileHover={loading ? {} : { scale: 1.02 }}
            whileTap={loading ? {} : { scale: 0.98 }}
          >
            {loading ? "Signing in..." : t.signInButton}
          </motion.button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>

            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                {t.orContinue}
              </span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              type="button"
              className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                className="w-5 h-5"
              />
              <span className="text-sm font-medium">{t.google}</span>
            </motion.button>

            <motion.button
              type="button"
              className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              <img
                src="https://www.facebook.com/favicon.ico"
                alt="Facebook"
                className="w-5 h-5"
              />
              <span className="text-sm font-medium">{t.facebook}</span>
            </motion.button>
          </div>
        </motion.form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-600">
            {t.noAccount}{" "}
            <button
              onClick={handleGoRegister}
              className="text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
              type="button"
            >
              {t.signUpHere}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignIn;
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import console from "../utils/console";
import AuthSplitLayout from "../components/layout/AuthSplitLayout";

function UserLogin() {
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const navigation = useNavigate();

  const loginUser = async (data) => {
    if (!data.email?.trim() || !data.password?.trim()) {
      alert("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/user/login`,
        data
      );

      console.log("Login response:", response.data);

      if (!response?.data?.token) {
        throw new Error("Token not received from server");
      }

      localStorage.setItem("token", response.data.token);
      localStorage.setItem(
        "userData",
        JSON.stringify({
          type: "user",
          data: response.data.user,
        })
      );

      alert("Login successful");
      navigation("/home");
    } catch (error) {
      console.error("Login error:", error);

      const message =
        error.response?.data?.message || error.message || "Login failed";

      setResponseError(message);
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setResponseError("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [responseError]);

  return (
    <AuthSplitLayout
      variant="user"
      eyebrow="Rider Access"
      title="Step back into your QuickRide workspace."
      description="Book rides, track live trips, and manage your travel history from a clean rider interface that mirrors the admin design system."
      featureTitle="Book, track, ride"
      featureText="The updated rider workspace keeps the same auth flow and backend behavior, but presents it with a cleaner, lighter operations-style interface."
      alternateLabel="Need a driver account?"
      alternateTo="/captain/login"
      alternateText="Login as Captain"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
          Rider Sign In
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Use your existing rider credentials. No auth or routing logic has changed.
        </p>
      </div>

      <form onSubmit={handleSubmit(loginUser)} className="mt-8 space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
          <input
            {...register("email")}
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
          />
          {errors.email ? (
            <p className="mt-2 text-xs text-rose-600">{errors.email.message}</p>
          ) : null}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
          <input
            {...register("password")}
            type="password"
            placeholder="Enter your password"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
          />
          {errors.password ? (
            <p className="mt-2 text-xs text-rose-600">{errors.password.message}</p>
          ) : null}
        </label>

        {responseError ? (
          <div className="rounded-2xl border border-rose-300/30 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {responseError}
          </div>
        ) : null}

        <Link
          to="/user/forgot-password"
          className="inline-flex text-sm font-medium text-slate-600 underline underline-offset-4"
        >
          Forgot Password?
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm text-slate-600">
        Do not have an account?{" "}
        <Link to="/signup" className="font-semibold text-slate-900 underline underline-offset-4">
          Sign up
        </Link>
      </div>
    </AuthSplitLayout>
  );
}

export default UserLogin;

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Console from "../utils/console";
import AuthSplitLayout from "../components/layout/AuthSplitLayout";

function CaptainLogin() {
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const navigation = useNavigate();

  const loginCaptain = async (data) => {
    if (data.email.trim() !== "" && data.password.trim() !== "") {
      try {
        setLoading(true);
        const response = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/captain/login`,
          data
        );
        Console.log(response);
        localStorage.setItem("token", response.data.token);
        localStorage.setItem(
          "userData",
          JSON.stringify({
            type: "captain",
            data: response.data.captain,
          })
        );
        navigation("/captain/home");
      } catch (error) {
        setResponseError(error.response.data.message);
        Console.log(error);
      } finally {
        setLoading(false);
      }
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
      variant="captain"
      eyebrow="Captain Access"
      title="Run your QuickRide shift from a sharper driver workspace."
      description="The driver console now mirrors the admin system while preserving the exact same captain login and auth behavior underneath."
      featureTitle="Operational clarity"
      featureText="Accept rides, monitor current activity, and manage your profile from a darker, slightly more tactical layout."
      alternateLabel="Need a rider account?"
      alternateTo="/login"
      alternateText="Login as User"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
          Captain Sign In
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Start your shift</h2>
        <p className="mt-2 text-sm text-slate-400">
          Use your existing captain credentials. Backend auth and routing remain unchanged.
        </p>
      </div>

      <form onSubmit={handleSubmit(loginCaptain)} className="mt-8 space-y-5">
        <Field label="Email" name="email" type="email" register={register} error={errors.email} />
        <Field label="Password" name="password" type="password" register={register} error={errors.password} />

        {responseError ? (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {responseError}
          </div>
        ) : null}

        <Link
          to="/captain/forgot-password"
          className="inline-flex text-sm font-medium text-slate-300 underline underline-offset-4"
        >
          Forgot Password?
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center text-sm text-slate-300">
        Don't have an account?{" "}
        <Link
          to="/captain/signup"
          className="font-semibold text-white underline underline-offset-4"
        >
          Sign up
        </Link>
      </div>
    </AuthSplitLayout>
  );
}

function Field({ label, name, type = "text", register, error }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <input
        {...register(name)}
        type={type}
        placeholder={label}
        className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
      />
      {error ? <p className="mt-2 text-xs text-rose-300">{error.message}</p> : null}
    </label>
  );
}

export default CaptainLogin;

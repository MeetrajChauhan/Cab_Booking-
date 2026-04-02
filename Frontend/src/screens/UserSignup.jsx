import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Console from "../utils/console";
import AuthSplitLayout from "../components/layout/AuthSplitLayout";

function UserSignup() {
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const navigation = useNavigate();
  const signupUser = async (data) => {
    const userData = {
      fullname: {
        firstname: data.firstname,
        lastname: data.lastname,
      },
      email: data.email,
      password: data.password,
      phone: data.phone,
    };

    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/user/register`,
        userData
      );
      Console.log(response);
      localStorage.setItem("token", response.data.token);
      navigation("/home");
    } catch (err) {
      const errorMessage =
        err.response?.data?.msg ||
        err.response?.data?.message ||
        err.message ||
        "Something went wrong";

      setResponseError(errorMessage);
      alert(errorMessage);
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
      title="Create a rider account built for quick booking."
      description="The new rider onboarding uses the same signup request and token behavior, wrapped in a cleaner split-screen layout."
      featureTitle="Fast onboarding"
      featureText="Create your account, jump straight into the booking dashboard, and keep the experience visually aligned with the rest of the platform."
      alternateLabel="Want to drive instead?"
      alternateTo="/captain/signup"
      alternateText="Sign up as Captain"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
          Rider Registration
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Enter your details to access the same ride-booking flow with a refreshed interface.
        </p>
      </div>

      <form onSubmit={handleSubmit(signupUser)} className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" name="firstname" register={register} error={errors.firstname} />
          <Field label="Last name" name="lastname" register={register} error={errors.lastname} />
        </div>
        <Field label="Phone Number" name="phone" type="number" register={register} error={errors.phone} />
        <Field label="Email" name="email" type="email" register={register} error={errors.email} />
        <Field label="Password" name="password" type="password" register={register} error={errors.password} />

        {responseError ? (
          <div className="rounded-2xl border border-rose-300/30 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {responseError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-slate-900 underline underline-offset-4">
          Login
        </Link>
      </div>
    </AuthSplitLayout>
  );
}

function Field({ label, name, type = "text", register, error }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        {...register(name)}
        type={type}
        placeholder={label}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
      />
      {error ? <p className="mt-2 text-xs text-rose-600">{error.message}</p> : null}
    </label>
  );
}

export default UserSignup;

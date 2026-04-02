import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Console from "../utils/console";
import AuthSplitLayout from "../components/layout/AuthSplitLayout";

function CaptainSignup() {
  const [responseError, setResponseError] = useState("");
  const [showVehiclePanel, setShowVehiclePanel] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const navigation = useNavigate();
  const signupCaptain = async (data) => {
    const captainData = {
      fullname: {
        firstname: data.firstname,
        lastname: data.lastname,
      },
      email: data.email,
      password: data.password,
      phone: data.phone,
      vehicle: {
        color: data.color,
        number: data.number,
        capacity: data.capacity,
        type: data.type,
      },
    };
    Console.log(captainData);

    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/captain/register`,
        captainData
      );
      Console.log(response);
      localStorage.setItem("token", response.data.token);
      navigation("/captain/home");
    } catch (error) {
      setResponseError(
        error.response.data[0]?.msg || error.response.data.message
      );
      setShowVehiclePanel(false);
      Console.log(error);
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
      variant="captain"
      eyebrow="Captain Access"
      title="Create a captain account with a cleaner dispatch-style flow."
      description="The form is visually redesigned to match the new captain workspace while keeping the exact existing registration request."
      featureTitle="Two-step registration"
      featureText="Personal details first, vehicle details second. Same backend, same fields, upgraded layout."
      alternateLabel="Looking for rider access?"
      alternateTo="/signup"
      alternateText="Sign up as User"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
          Captain Registration
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Join the fleet</h2>
        <p className="mt-2 text-sm text-slate-400">
          Complete your profile and vehicle details using the same captain signup API.
        </p>
      </div>

      <form onSubmit={handleSubmit(signupCaptain)} className="mt-8 space-y-5">
        {!showVehiclePanel ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First name" name="firstname" register={register} error={errors.firstname} />
              <Field label="Last name" name="lastname" register={register} error={errors.lastname} />
            </div>
            <Field label="Phone Number" name="phone" type="number" register={register} error={errors.phone} />
            <Field label="Email" name="email" type="email" register={register} error={errors.email} />
            <Field label="Password" name="password" type="password" register={register} error={errors.password} />

            {responseError ? (
              <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {responseError}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setShowVehiclePanel(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Next <ChevronRight size={18} />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setShowVehiclePanel(false)}
              className="flex items-center gap-2 text-sm font-medium text-slate-300"
            >
              <ArrowLeft size={18} />
              Back to personal details
            </button>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Vehicle colour" name="color" register={register} error={errors.color} />
              <Field label="Vehicle capacity" name="capacity" type="number" register={register} error={errors.capacity} />
            </div>
            <Field label="Vehicle number" name="number" register={register} error={errors.number} />

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Vehicle type</span>
              <select
                {...register("type")}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
              >
                <option value="car">Car</option>
                <option value="bike">Bike</option>
                <option value="auto">Auto</option>
              </select>
              {errors.type ? (
                <p className="mt-2 text-xs text-rose-300">{errors.type.message}</p>
              ) : null}
            </label>

            {responseError ? (
              <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {responseError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Creating captain account..." : "Sign Up"}
            </button>
          </>
        )}
      </form>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center text-sm text-slate-300">
        Already have an account?{" "}
        <Link
          to="/captain/login"
          className="font-semibold text-white underline underline-offset-4"
        >
          Login
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

export default CaptainSignup;

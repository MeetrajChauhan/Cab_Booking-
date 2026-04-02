import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Input } from "../components";
import axios from "axios";
import { useCaptain } from "../contexts/CaptainContext";
import {
  CarFront,
  CircleDollarSign,
  History,
  LayoutDashboard,
  UserRound,
} from "lucide-react";
import Console from "../utils/console";
import MainLayout from "../components/layout/MainLayout";

const navItems = [
  { to: "/captain/home", label: "Dashboard", icon: LayoutDashboard },
  { to: "/captain/home", label: "Available Rides", icon: CarFront },
  { to: "/captain/rides", label: "My Rides", icon: History },
  { to: "/captain/home", label: "Earnings", icon: CircleDollarSign },
  { to: "/captain/edit-profile", label: "Profile", icon: UserRound },
];

function CaptainEditProfile() {
  const token = localStorage.getItem("token");
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const { captain } = useCaptain();

  const updateUserProfile = async (data) => {
    const captainData = {
      fullname: {
        firstname: data.firstname,
        lastname: data.lastname,
      },
      phone: data.phone,
      vehicle: {
        color: data.color,
        number: data.number,
        capacity: data.capacity,
        type: data.type.toLowerCase(),
      },
    };
    Console.log(captainData);
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/captain/update`,
        { captainData },
        {
          headers: {
            token: token,
          },
        }
      );
      Console.log(response);
    } catch (error) {
      setResponseError(error.response.data[0].msg);
      Console.log(error.response);
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
    <MainLayout
      variant="captain"
      navItems={navItems}
      identity={{
        firstname: captain?.fullname?.firstname,
        lastname: captain?.fullname?.lastname,
        email: captain?.email,
      }}
      title="Captain Profile"
      subtitle="Manage your contact and vehicle details using the same captain update flow."
      topMeta={[
        { label: "Vehicle", value: captain?.vehicle?.number || "Not set" },
      ]}
    >
      <section className="max-w-4xl rounded-[1.9rem] border border-white/15 bg-white/8 p-6 shadow-lg shadow-slate-900/20 backdrop-blur text-white">
        <h3 className="text-2xl font-semibold">Edit captain profile</h3>
        <p className="mt-2 text-sm text-slate-400">
          Update your driver details and keep your vehicle information current.
        </p>

        <div className="mt-6">
          <Input
            label={"Email"}
            type={"email"}
            name={"email"}
            register={register}
            error={errors.email}
            defaultValue={captain.email}
            disabled={true}
            variant="dark"
          />
        </div>

        <form onSubmit={handleSubmit(updateUserProfile)} className="mt-5 space-y-5">
          <Input
            label={"Phone Number"}
            type={"number"}
            name={"phone"}
            register={register}
            error={errors.phone}
            defaultValue={captain.phone}
            variant="dark"
          />
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label={"First name"}
              name={"firstname"}
              register={register}
              error={errors.firstname}
              defaultValue={captain.fullname.firstname}
              variant="dark"
            />
            <Input
              label={"Last name"}
              name={"lastname"}
              register={register}
              error={errors.lastname}
              defaultValue={captain.fullname.lastname}
              variant="dark"
            />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label={"Vehicle colour"}
              name={"color"}
              register={register}
              error={errors.color}
              defaultValue={captain.vehicle.color}
              variant="dark"
            />
            <Input
              label={"Vehicle capacity"}
              type={"number"}
              name={"capacity"}
              register={register}
              error={errors.capacity}
              defaultValue={captain.vehicle.capacity}
              variant="dark"
            />
          </div>
          <Input
            label={"Vehicle number"}
            name={"number"}
            register={register}
            error={errors.number}
            defaultValue={captain.vehicle.number}
            variant="dark"
          />
          <Input
            label={"Vehicle type"}
            type={"select"}
            options={["Car", "Bike", "Auto"]}
            name={"type"}
            register={register}
            error={errors.type}
            defaultValue={captain.vehicle.type}
            variant="dark"
          />
          {responseError ? (
            <p className="text-sm text-center mb-4 text-rose-300">{responseError}</p>
          ) : null}
          <Button
            title={"Update Profile"}
            loading={loading}
            type="submit"
            classes={"mt-4 bg-emerald-400 text-slate-950 hover:bg-emerald-300"}
          />
        </form>
      </section>
    </MainLayout>
  );
}

export default CaptainEditProfile;

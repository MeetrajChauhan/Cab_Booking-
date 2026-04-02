import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Input } from "../components";
import axios from "axios";
import { useUser } from "../contexts/UserContext";
import { CarFront, History, LayoutDashboard, UserRound } from "lucide-react";
import Console from "../utils/console";
import { useAlert } from "../hooks/useAlert";
import { Alert } from "../components";
import MainLayout from "../components/layout/MainLayout";

const navItems = [
  { to: "/home", label: "Home", icon: LayoutDashboard },
  { to: "/home", label: "Book Ride", icon: CarFront },
  { to: "/user/rides", label: "Ride History", icon: History },
  { to: "/user/edit-profile", label: "Profile", icon: UserRound },
];

function UserEditProfile() {
  const token = localStorage.getItem("token");
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);
  const { alert, showAlert, hideAlert } = useAlert();

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const { user } = useUser();

  const updateUserProfile = async (data) => {
    const userData = {
      fullname: {
        firstname: data.firstname,
        lastname: data.lastname,
      },
      phone: data.phone,
    };
    Console.log(userData);
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/user/update`,
        userData,
        {
          headers: {
            token: token,
          },
        }
      );
      Console.log(response);
      showAlert(
        "Edit Successful",
        "Your profile details has been successfully updated",
        "success"
      );
    } catch (error) {
      showAlert("Some Error occured", error.response.data[0].msg, "failure");
      Console.log(error.response);
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
      variant="user"
      navItems={navItems}
      identity={{
        firstname: user?.fullname?.firstname,
        lastname: user?.fullname?.lastname,
        email: user?.email,
      }}
      title="Profile Settings"
      subtitle="Update your personal details without changing the existing account logic."
      topMeta={[
        { label: "Account email", value: user?.email || "Not available" },
      ]}
    >
      <Alert
        heading={alert.heading}
        text={alert.text}
        isVisible={alert.isVisible}
        onClose={hideAlert}
        type={alert.type}
      />

      <section className="max-w-3xl rounded-[1.9rem] border border-white/80 bg-white/72 p-6 shadow-lg shadow-slate-900/10 backdrop-blur">
        <h3 className="text-2xl font-semibold text-slate-900">Edit rider profile</h3>
        <p className="mt-2 text-sm text-slate-500">
          Your email remains locked. Update your name and phone details below.
        </p>

        <div className="mt-6">
          <Input
            label={"Email"}
            type={"email"}
            name={"email"}
            register={register}
            error={errors.email}
            defaultValue={user.email}
            disabled={true}
          />
        </div>

        <form onSubmit={handleSubmit(updateUserProfile)} className="mt-5 space-y-5">
          <Input
            label={"First name"}
            name={"firstname"}
            register={register}
            error={errors.firstname}
            defaultValue={user.fullname.firstname}
          />
          <Input
            label={"Last name"}
            name={"lastname"}
            register={register}
            error={errors.lastname}
            defaultValue={user.fullname.lastname}
          />
          <Input
            label={"Phone Number"}
            type={"number"}
            name={"phone"}
            register={register}
            error={errors.phone}
            defaultValue={user.phone}
          />
          {responseError ? (
            <p className="text-sm text-center mb-4 text-red-500">{responseError}</p>
          ) : null}
          <Button
            title={"Update Profile"}
            loading={loading}
            type="submit"
            classes={"mt-4"}
          />
        </form>
      </section>
    </MainLayout>
  );
}

export default UserEditProfile;

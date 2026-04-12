import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile, updateProfile } from "../../redux/slices/profileSlice";

const ProfileForm = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.profile);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currency: "",
    password: "",
    notificationPreferences: {
      budgetAlerts: true,
      aiInsights: { enabled: true, frequency: "daily" },
      reminders: true,
    },
  });

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        ...user,
        notificationPreferences: {
          ...prev.notificationPreferences,
          ...(user.notificationPreferences || {}),
        },
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        notificationPreferences: {
          ...prev.notificationPreferences,
          [parent]: {
            ...prev.notificationPreferences[parent],
            [child]: type === "checkbox" ? checked : value,
          },
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.password) delete payload.password;
    dispatch(updateProfile(payload));
  };

  if (loading) {
    return (
      <div className="mb-6 animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded w-28"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <h3 className="md:text-lg text-md font-semibold mb-2">Update Profile</h3>

      <div>
        <label className="md:text-sm text-xs font-medium text-[#6B7280]">Name</label>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Name"
          className="w-full p-2 border-2 border-[#6B7280] rounded-lg mb-2 text-sm md:text-base text-[#6B7280] outline-0 focus:border-[#2563EB]"
        />
      </div>

      <div>
        <label className="md:text-sm text-xs font-medium text-[#6B7280]">Email</label>
        <input
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full p-2 border-2 border-[#6B7280] rounded-lg mb-2 text-sm md:text-base text-[#6B7280] outline-0 focus:border-[#2563EB]"
        />
      </div>

      <div>
        <label className="md:text-sm text-xs font-medium text-[#6B7280]">New Password</label>
        <input
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="New Password"
          className="w-full p-2 border-2 border-[#6B7280] rounded-lg mb-2 text-sm md:text-base text-[#6B7280] outline-0 focus:border-[#2563EB]"
        />
      </div>

      <button
        type="submit"
        className="px-4 py-2 md:text-base text-sm bg-blue-600 text-white rounded"
      >
        Save Profile
      </button>
    </form>
  );
};

export default ProfileForm;

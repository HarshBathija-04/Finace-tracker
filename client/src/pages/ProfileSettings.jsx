import Navbar from "../components/Navbar";
import ProfileForm from "../components/settings/ProfileForm";
import BudgetSettings from "../components/settings/BudgetSettings";
import NotificationSettings from "../components/settings/NotificationSettings";
import { useSelector } from "react-redux";
import { Mail } from "lucide-react";
import profilePhoto from "../assets/profile.png";

const ProfileSettings = () => {
  const { user } = useSelector((state) => state.profile);

  return (
    <div>
      <Navbar />
      <div className="md:px-16 px-2 my-4">
        <h2 className="md:text-2xl text-lg font-bold mb-4">Profile & Settings</h2>

        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <div className="flex items-center gap-4">
            <img src={profilePhoto} alt="Profile" className="md:w-16 md:h-16 w-12 h-12 rounded-full border" />
            <div>
              <h2 className="md:text-lg text-md font-bold">{user?.name}</h2>
              <div className="text-gray-600 flex gap-1">
                <Mail className="h-4 w-4 mt-1" />
                <p className="text-sm">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        <ProfileForm />
        <BudgetSettings />
        <NotificationSettings userId={user?._id} />
      </div>
    </div>
  );
};

export default ProfileSettings;

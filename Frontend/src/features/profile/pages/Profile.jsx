import { useEffect, useState } from "react";
import api from "../../../api/axios";
import "../style/profile.scss";

const Profile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await api.get("/api/auth/get-me");

        setUser(response.data.user);
      } catch (error) {
        console.log(error);
      }
    };

    getUser();
  }, []);

  return (
    <div className="profile-page">
      <h1>👤 Profile</h1>

      {user && (
        <div className="profile-card">
          <h3>{user.username}</h3>

          <p>{user.email}</p>

          <p>ID: {user.id}</p>
        </div>
      )}
    </div>
  );
};

export default Profile;

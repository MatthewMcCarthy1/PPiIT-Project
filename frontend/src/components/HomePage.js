import React from "react";

function HomePage({ user, setUser }) {
  // Function to handle user logout
  const handleLogout = () => {
    setUser(null); // Clear the user state to log out
  };

  return (
    <div>
      <h1>Welcome, {user.email}!</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default HomePage;

import React from 'react';

function HomePage({ user, setUser }) {
  //function to handle user logout
  const handleLogout = () => {
    setUser(null); //clear the user state to log out
  };

  return (
    <div>
      <h1>Welcome, {user.email}!</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default HomePage;

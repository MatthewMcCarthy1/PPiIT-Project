import React from "react";
import "./HomePage.css";

function HomePage({ user, setUser }) {
  // Function to handle user logout
  const handleLogout = () => {
    setUser(null); // Clear the user state to log out
    localStorage.removeItem("user");
  };

  return (
    <div>
      <div className="banner">
        <div className="website-name">UniStack</div>
        <div className="search-bar-container">
          <input
            type="text"
            className="search-bar"
            placeholder="Search for questions..."
          />
        </div>
        <div className="banner-buttons">
          <span className="welcome-message">Welcome, {user.email}!</span>
          <button className="ask-question-button">Ask Question</button>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      <div className="content">
      </div>
    </div>
  );
}

export default HomePage;

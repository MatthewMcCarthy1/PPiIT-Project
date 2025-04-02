import React from "react";
import "./HomePage.css";

function HomePage({ user, setUser }) {
  // Function to handle user logout
  const handleLogout = () => {
    setUser(null); // Clear the user state to log out
    localStorage.removeItem("user");
  };

  // Function to handle home navigation
  const goToHome = () => {
    // For now just refreshes the page, could be expanded with routing later
    window.scrollTo(0, 0);
  };

  return (
    <div>
      <div className="banner">
        <div className="website-name" onClick={goToHome}>UniStack</div>
        <div className="search-bar-container">
          <input
            type="text"
            className="search-bar"
            placeholder="Search for questions..."
          />
        </div>
        <div className="banner-buttons">
          <span className="welcome-message">
            <i className="fas fa-user-circle"></i> Welcome, {user.email}!
          </span>
          <button className="ask-question-button">
            <i className="fas fa-plus-circle"></i> Ask Question
          </button>
          <button className="logout-button" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;

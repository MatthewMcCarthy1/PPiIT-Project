import React, { useState } from "react";
import QuestionModal from "./QuestionModal";
import "./HomePage.css";

function HomePage({ user, setUser }) {
  // State to control question modal visibility
  const [showQuestionModal, setShowQuestionModal] = useState(false);

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

  // Toggle question modal
  const toggleQuestionModal = () => {
    setShowQuestionModal(!showQuestionModal);
  };

  // Handle question submission from modal
  const handleQuestionSubmit = (questionData) => {
    // Placeholder for question submission logic
    console.log("Question submitted:", questionData);
    toggleQuestionModal();
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
          <button className="ask-question-button" onClick={toggleQuestionModal}>
            <i className="fas fa-plus-circle"></i> Ask Question
          </button>
          <button className="logout-button" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>

      {/* Question Modal Component */}
      <QuestionModal 
        isOpen={showQuestionModal} 
        onClose={toggleQuestionModal} 
        onSubmit={handleQuestionSubmit} 
      />
    </div>
  );
}

export default HomePage;

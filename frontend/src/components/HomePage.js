import React, { useState, useEffect } from "react";
import QuestionModal from "./QuestionModal";
import Questions from "./Questions";
import "./HomePage.css";

function HomePage({ user, setUser }) {
  // State to control question modal visibility
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  // State to track submission status
  const [submissionStatus, setSubmissionStatus] = useState(null);
  // State for questions data
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch questions from the backend
  const fetchQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get the current hostname from the window location
      const hostname = window.location.hostname;
      const backendUrl = `https://${hostname.replace('-3000', '-8000')}/server.php`;
      
      const response = await fetch(`${backendUrl}?action=getQuestions`, {
        method: 'GET',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Log to check how many questions are returned
        console.log(`Fetched ${data.questions.length} questions:`, data.questions);
        
        // Make sure we're setting the state with the full array of questions
        setQuestions(data.questions || []);
      } else {
        setError(data.message || 'Failed to load questions');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch questions when component mounts
  useEffect(() => {
    fetchQuestions();
  }, []);

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
    // Clear any previous submission status when opening/closing modal
    if (!showQuestionModal) {
      setSubmissionStatus(null);
    }
  };

  // Handle question submission from modal
  const handleQuestionSubmit = async (questionData) => {
    try {
      // Get the current hostname from the window location
      const hostname = window.location.hostname;
      const backendUrl = `https://${hostname.replace('-3000', '-8000')}/server.php`;
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'submitQuestion', 
          userId: user.id, 
          ...questionData 
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSubmissionStatus({
          type: 'success',
          message: 'Question submitted successfully!'
        });
        // Close modal after 2 seconds on success
        setTimeout(() => {
          toggleQuestionModal();
          // Refresh the questions list
          fetchQuestions();
        }, 2000);
      } else {
        setSubmissionStatus({
          type: 'error',
          message: data.message || 'Failed to submit question'
        });
      }
    } catch (error) {
      setSubmissionStatus({
        type: 'error',
        message: 'Network error. Please try again.'
      });
    }
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

      {/* Questions Component */}
      <Questions 
        questions={questions} 
        isLoading={isLoading} 
        error={error} 
      />

      {/* Question Modal Component */}
      <QuestionModal 
        isOpen={showQuestionModal} 
        onClose={toggleQuestionModal} 
        onSubmit={handleQuestionSubmit}
        submissionStatus={submissionStatus}
      />
    </div>
  );
}

export default HomePage;

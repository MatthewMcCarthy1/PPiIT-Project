import React, { useState, useEffect } from "react";
import QuestionModal from "../questions/QuestionModal";
import Questions from "../questions/Questions";
import FullQuestionModal from "../questions/FullQuestionModal";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [activeView, setActiveView] = useState("home"); // 'home', 'myquestions', 'bookmarks'
  const [popularTags, setPopularTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [sortOption, setSortOption] = useState("newest");
  const [viewingQuestion, setViewingQuestion] = useState(null);

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
        
        // Extract and count tags to find popular ones
        const tags = {};
        (data.questions || []).forEach(question => {
          if (question.tags) {
            question.tags.split(',').forEach(tag => {
              const trimmedTag = tag.trim();
              if (trimmedTag) {
                tags[trimmedTag] = (tags[trimmedTag] || 0) + 1;
              }
            });
          }
        });
        
        // Convert to array and sort by frequency
        const tagArray = Object.entries(tags).map(([tag, count]) => ({ tag, count }));
        tagArray.sort((a, b) => b.count - a.count);
        setPopularTags(tagArray.slice(0, 5));
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

  // Effect to filter and sort questions based on search, tags, and view
  useEffect(() => {
    let result = [...questions];
    
    // Filter by search query
    if (searchInput.trim()) {
      const query = searchInput.toLowerCase();
      result = result.filter(question => 
        question.title.toLowerCase().includes(query) ||
        question.body.toLowerCase().includes(query) ||
        (question.tags && question.tags.toLowerCase().includes(query))
      );
    }
    
    // Filter by selected tag
    if (selectedTag) {
      result = result.filter(question => 
        question.tags && question.tags.toLowerCase().includes(selectedTag.toLowerCase())
      );
    }
    
    // Filter by active view
    if (activeView === "myquestions") {
      result = result.filter(question => parseInt(question.user_id) === parseInt(user.id));
    } else if (activeView === "bookmarks") {
      // Get bookmarks from localStorage
      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      
      // Only show questions that are actually in the bookmarks array
      if (bookmarks.length === 0) {
        result = []; // Empty array if no bookmarks instead of showing all questions
      } else {
        result = result.filter(question => bookmarks.includes(parseInt(question.id)));
      }
    }
    
    // Sort questions
    if (sortOption === "oldest") {
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortOption === "newest") {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortOption === "popular") {
      // To be implemented
    }
    
    setFilteredQuestions(result);
  }, [questions, searchInput, selectedTag, activeView, sortOption, user.id]);

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

  // Function to handle question deletion
  const handleQuestionDeleted = (questionId) => {
    // Update the questions list by filtering out the deleted question
    setQuestions(prevQuestions => prevQuestions.filter(q => parseInt(q.id) !== parseInt(questionId)));
  };

  // Function to handle viewing a full question
  const handleQuestionView = (question) => {
    setViewingQuestion(question);
  };
  
  // Function to close the full question view
  const closeFullQuestion = () => {
    setViewingQuestion(null);
  };

  // Search handler
  const handleSearchInput = (e) => {
    setSearchInput(e.target.value);
  };

  // Handle pressing Enter to set the official search query (for displaying "Searching for: X")
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      setSearchQuery(e.target.value);
    }
  };

  // Tag selection handler
  const handleTagSelect = (tag) => {
    if (selectedTag === tag) {
      setSelectedTag(null); // Deselect if already selected
    } else {
      setSelectedTag(tag);
    }
  };

  // View selection handler
  const handleViewSelect = (view) => {
    setActiveView(view);
  };

  // Sort option handler
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  // Reset all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSearchInput("");
    setSelectedTag(null);
    const searchBar = document.querySelector(".search-bar");
    if (searchBar) {
      searchBar.value = "";
    }
  };

  return (
    <div className="home-page">
      <div className="banner">
        <div className="website-name" onClick={goToHome}>UniStack</div>
        <div className="search-bar-container">
          <input
            type="text"
            className="search-bar"
            placeholder="Search for questions..."
            onChange={handleSearchInput}
            onKeyDown={handleSearchKeyPress}
          />
          <i className="fas fa-search search-icon"></i>
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

      <div className="content-container">
        <div className="welcome-banner">
          <h1>Welcome to UniStack</h1>
          <p>A community-driven Q&A platform for ATU students to ask questions, share knowledge, and learn together.</p>
        </div>
        
        <div className="main-content">
          <div className="sidebar">
            <div className="sidebar-section">
              <h3><i className="fas fa-star"></i> Navigation</h3>
              <ul className="sidebar-menu">
                <li 
                  className={activeView === "home" ? "active" : ""}
                  onClick={() => handleViewSelect("home")}
                >
                  <i className="fas fa-home"></i> Home
                </li>
                <li 
                  className={activeView === "myquestions" ? "active" : ""}
                  onClick={() => handleViewSelect("myquestions")}
                >
                  <i className="fas fa-question"></i> My Questions
                </li>
                <li 
                  className={activeView === "bookmarks" ? "active" : ""}
                  onClick={() => handleViewSelect("bookmarks")}
                >
                  <i className="fas fa-bookmark"></i> Bookmarks
                </li>
              </ul>
            </div>
            
            <div className="sidebar-section">
              <h3><i className="fas fa-tags"></i> Popular Tags</h3>
              <div className="tag-cloud">
                {popularTags.length > 0 ? (
                  popularTags.map((tagItem, index) => (
                    <span 
                      key={index} 
                      className={`popular-tag ${selectedTag === tagItem.tag ? 'selected' : ''}`}
                      onClick={() => handleTagSelect(tagItem.tag)}
                    >
                      {tagItem.tag} <small>({tagItem.count})</small>
                    </span>
                  ))
                ) : (
                  <span className="no-tags">No tags yet</span>
                )}
              </div>
              {(searchQuery || selectedTag) && (
                <button className="clear-filters" onClick={clearFilters}>
                  <i className="fas fa-times"></i> Clear Filters
                </button>
              )}
            </div>
          </div>
          
          <div className="questions-section">
            <div className="questions-actions">
              <div className="questions-filter">
                <select 
                  className="filter-dropdown" 
                  value={sortOption}
                  onChange={handleSortChange}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="popular">Most Popular</option>
                </select>
                
                {searchQuery && (
                  <div className="search-results-info">
                    Showing results for: <strong>"{searchQuery}"</strong>
                  </div>
                )}
              </div>
              <button className="refresh-button" onClick={fetchQuestions}>
                <i className="fas fa-sync-alt"></i> Refresh
              </button>
            </div>
            
            {/* Pass filtered questions and additional props */}
            <Questions 
              questions={filteredQuestions} 
              allQuestionsCount={questions.length}
              isLoading={isLoading} 
              error={error}
              searchQuery={searchQuery}
              searchInput={searchInput}
              activeView={activeView}
              currentUser={user}
              onQuestionDeleted={handleQuestionDeleted}
              onQuestionView={handleQuestionView}
            />
          </div>
        </div>
      </div>

      {/* Question Modal Component */}
      <QuestionModal 
        isOpen={showQuestionModal} 
        onClose={toggleQuestionModal} 
        onSubmit={handleQuestionSubmit}
        submissionStatus={submissionStatus}
      />
      
      {/* Full question view modal */}
      <FullQuestionModal
        isOpen={viewingQuestion !== null}
        onClose={closeFullQuestion}
        question={viewingQuestion}
      />
    </div>
  );
}

export default HomePage;

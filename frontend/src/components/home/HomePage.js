import React, { useState, useEffect } from "react";
import QuestionModal from "../questions/QuestionModal";
import Questions from "../questions/Questions";
import FullQuestionModal from "../questions/FullQuestionModal";
import "./HomePage.css";

/**
 * HomePage Component
 * Main component for the application's home page
 * Displays questions, filtering options, and handles user interactions
 * 
 * @param {Object} user - Current logged-in user information
 * @param {Function} setUser - Function to update user state (used for logout)
 */
function HomePage({ user, setUser }) {
  // ----- STATE MANAGEMENT -----
  // Modal control states
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [viewingQuestion, setViewingQuestion] = useState(null);
  
  // Questions data states
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter and view states
  const [searchQuery, setSearchQuery] = useState(""); // Persisted search query for UI display
  const [searchInput, setSearchInput] = useState(""); // Current input in search field
  const [activeView, setActiveView] = useState("home"); // 'home', 'myquestions', 'bookmarks'
  const [popularTags, setPopularTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [sortOption, setSortOption] = useState("newest");

  // ----- DATA FETCHING -----
  /**
   * Fetches questions from the backend API
   * Updates questions state and extracts popular tags
   */
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

  // ----- FILTERING AND SORTING -----
  /**
   * Effect to filter and sort questions based on user-selected criteria
   * Applies filters for: search text, tags, view type (all/my questions/bookmarks)
   * Sorts by: newest, oldest, or popularity (answer count)
   */
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
      // Sort by answer count (highest first), then by views (highest first) as a tiebreaker
      result.sort((a, b) => {
        // Convert to numbers and handle null/undefined values
        const aAnswers = parseInt(a.answer_count) || 0;
        const bAnswers = parseInt(b.answer_count) || 0;
        
        // First compare by answer count
        if (aAnswers !== bAnswers) {
          return bAnswers - aAnswers; // Descending order
        }
        
        // If answer counts are equal, compare by views as secondary criterion
        const aViews = parseInt(a.views) || 0;
        const bViews = parseInt(b.views) || 0;
        return bViews - aViews; // Descending order
      });
    }
    
    setFilteredQuestions(result);
  }, [questions, searchInput, selectedTag, activeView, sortOption, user.id]);

  // ----- USER ACTIONS -----
  /**
   * Handles user logout
   * Clears user state and removes user data from localStorage
   */
  const handleLogout = () => {
    setUser(null); // Clear the user state to log out
    localStorage.removeItem("user");
  };

  /**
   * Scrolls to the top of the page when "Home" is clicked
   * Could be expanded with routing in the future
   */
  const goToHome = () => {
    // For now just refreshes the page, could be expanded with routing later
    window.scrollTo(0, 0);
  };

  /**
   * Toggles the question creation modal visibility
   * Resets submission status when opening modal
   */
  const toggleQuestionModal = () => {
    setShowQuestionModal(!showQuestionModal);
    // Clear any previous submission status when opening/closing modal
    if (!showQuestionModal) {
      setSubmissionStatus(null);
    }
  };

  /**
   * Handles question submission from the modal
   * Sends data to the backend and shows success/error feedback
   * 
   * @param {Object} questionData - The question data to be submitted
   */
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

  /**
   * Updates local state after a question deletion
   * Removes the deleted question from the questions list
   * 
   * @param {number} questionId - The ID of the deleted question
   */
  const handleQuestionDeleted = (questionId) => {
    // Update the questions list by filtering out the deleted question
    setQuestions(prevQuestions => prevQuestions.filter(q => parseInt(q.id) !== parseInt(questionId)));
  };

  /**
   * Updates local state after a question is updated
   * Updates both the questions list and the currently viewed question
   * 
   * @param {Object} updatedQuestion - The updated question data
   */
  const handleQuestionUpdated = (updatedQuestion) => {
    // Update the questions list with the updated question
    setQuestions(prevQuestions => 
      prevQuestions.map(q => 
        parseInt(q.id) === parseInt(updatedQuestion.id) ? updatedQuestion : q
      )
    );
    
    // Also update the viewing question so the UI reflects the changes immediately
    setViewingQuestion(updatedQuestion);
  };

  /**
   * Handles opening the full question view modal
   * Increments view count locally for immediate UI feedback
   * 
   * @param {Object} question - The question to be viewed
   */
  const handleQuestionView = (question) => {
    // Add local view count increment for immediate UI feedback
    // This will be properly updated from the server on the next data refresh
    question.views = (parseInt(question.views) || 0) + 1;
    setViewingQuestion(question);
  };
  
  /**
   * Closes the full question view modal
   */
  const closeFullQuestion = () => {
    setViewingQuestion(null);
  };

  // ----- SEARCH AND FILTER HANDLERS -----
  /**
   * Updates search input state as user types
   * 
   * @param {Event} e - The input change event
   */
  const handleSearchInput = (e) => {
    setSearchInput(e.target.value);
  };

  /**
   * Sets the search query when user presses Enter
   * Used for displaying "Searching for: X" message
   * 
   * @param {Event} e - The key press event
   */
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      setSearchQuery(e.target.value);
    }
  };

  /**
   * Clears the search input and query
   * Called when user clicks the clear button (X) in the search field
   */
  const clearSearchInput = () => {
    setSearchInput("");
    setSearchQuery("");
    const searchBar = document.querySelector(".search-bar");
    if (searchBar) {
      searchBar.value = "";
    }
  };

  /**
   * Toggles tag selection for filtering questions
   * 
   * @param {string} tag - The tag to select or deselect
   */
  const handleTagSelect = (tag) => {
    if (selectedTag === tag) {
      setSelectedTag(null); // Deselect if already selected
    } else {
      setSelectedTag(tag);
    }
  };

  /**
   * Switches between different question views (all, my questions, bookmarks)
   * 
   * @param {string} view - The view to display ('home', 'myquestions', 'bookmarks')
   */
  const handleViewSelect = (view) => {
    setActiveView(view);
  };

  /**
   * Changes the sort order of questions
   * 
   * @param {Event} e - The select change event
   */
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  /**
   * Resets all active filters (search query and selected tag)
   */
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
      {/* ----- HEADER BANNER ----- */}
      <div className="banner">
        <div className="website-name" onClick={goToHome}>UniStack</div>
        
        {/* Search bar with conditional clear button */}
        <div className="search-bar-container">
          <input
            type="text"
            className="search-bar"
            placeholder="Search for questions..."
            onChange={handleSearchInput}
            onKeyDown={handleSearchKeyPress}
            value={searchInput}
          />
          {/* Clear button only appears when there is text in the search input */}
          {searchInput && (
            <i 
              className="fas fa-times clear-search-icon" 
              onClick={clearSearchInput}
            ></i>
          )}
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

      {/* ----- MAIN CONTENT AREA ----- */}
      <div className="content-container">
        {/* Welcome banner */}
        <div className="welcome-banner">
          <h1>Welcome to UniStack</h1>
          <p>A community-driven Q&A platform for ATU students to ask questions, share knowledge, and learn together.</p>
        </div>
        
        <div className="main-content">
          {/* ----- SIDEBAR ----- */}
          <div className="sidebar">
            {/* Navigation section */}
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
            
            {/* Tags section */}
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
          
          {/* ----- QUESTIONS LIST ----- */}
          <div className="questions-section">
            {/* Questions actions bar: sorting, filtering, refresh */}
            <div className="questions-actions">
              <div className="questions-filter">
                <select 
                  className="filter-dropdown" 
                  value={sortOption}
                  onChange={handleSortChange}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="popular">Most Active (by answers)</option>
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
            
            {/* Filtered questions list component */}
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

      {/* ----- MODALS ----- */}
      {/* Question creation modal */}
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
        currentUser={user}
        onQuestionUpdated={handleQuestionUpdated}
      />
    </div>
  );
}

export default HomePage;

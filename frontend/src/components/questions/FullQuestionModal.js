import React, { useState, useEffect, useRef } from "react";
import "./questions-css/FullQuestionModal.css";
import CommentSection from './CommentSection';
import { API_BASE_URL } from '../../config'; // Importing API base URL from config

/**
 * ============================================================================
 * FULL QUESTION MODAL COMPONENT
 * ============================================================================
 * This component displays a detailed view of a question, including:
 * - Question details (title, body, tags)
 * - Question editing functionality (for question authors)
 * - Answer listing, submission, editing and deletion
 * - Answer acceptance (for question authors)
 * - Comment sections for each answer
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Function to call when closing the modal
 * @param {Object} question - The complete question data to display
 * @param {Object} currentUser - The current logged-in user
 * @param {function} onQuestionUpdated - Function to call when the question is updated
 */
function FullQuestionModal({ isOpen, onClose, question, currentUser, onQuestionUpdated }) {
  //============================================================================
  // STATE MANAGEMENT
  //============================================================================
  
  // Answer Input State
  const [answerBody, setAnswerBody] = useState("");
  
  // Answers Data State
  const [answers, setAnswers] = useState([]);
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(false);
  const [answerError, setAnswerError] = useState(null);
  
  // Answer Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);

  // Answer Deletion State
  const [isDeleting, setIsDeleting] = useState(false);
  const [answerToDelete, setAnswerToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Answer Editing State
  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [editAnswerBody, setEditAnswerBody] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Question Editing State
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editQuestionData, setEditQuestionData] = useState({
    title: '',
    body: '',
    tags: ''
  });
  const [isUpdatingQuestion, setIsUpdatingQuestion] = useState(false);

  // Answer Acceptance State
  const [isAccepting, setIsAccepting] = useState(false);

  // References
  const newAnswerRef = useRef(null); // Reference to newly added answer for scrolling
  const answerInputRef = useRef(null); // Reference to answer input field for styling

  //============================================================================
  // LIFECYCLE EFFECTS
  //============================================================================
  
  /**
   * Effect to fetch answers and increment view count when the question is viewed
   */
  useEffect(() => {
    if (isOpen && question) {
      fetchAnswers();
      incrementViewCount();
    }
    
    // Reset states when modal is closed
    if (!isOpen) {
      setAnswerBody("");
      setSubmissionStatus(null);
    }
  }, [isOpen, question]);

  // Early return if modal is not open or no question is provided
  if (!isOpen || !question) return null;

  //============================================================================
  // API INTERACTION FUNCTIONS
  //============================================================================
  
  /**
   * Increments the view count for the question in the backend
   * This is a background operation that doesn't need to block the UI
   */
  const incrementViewCount = async () => {
    try {
      const backendUrl = API_BASE_URL;
      
      await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'incrementViewCount', 
          questionId: question.id 
        }),
      });
      
      // We don't need to handle the response as this is a background operation
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  /**
   * Fetches all answers for the current question from the backend
   * Updates the answers state array on success
   */
  const fetchAnswers = async () => {
    setIsLoadingAnswers(true);
    setAnswerError(null);
    
    try {
      const backendUrl = API_BASE_URL;
      
      const response = await fetch(`${backendUrl}?action=getAnswers&questionId=${question.id}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAnswers(data.answers || []);
      } else {
        setAnswerError(data.message || 'Failed to load answers');
      }
    } catch (error) {
      setAnswerError('Network error. Please try again later.');
    } finally {
      setIsLoadingAnswers(false);
    }
  };

  //============================================================================
  // ANSWER MANAGEMENT FUNCTIONS
  //============================================================================
  
  /**
   * Handles the submission of a new answer
   * - Validates the input
   * - Sends the answer to the backend
   * - Updates UI on success/failure
   * - Scrolls to the new answer
   * 
   * @param {Event} e - Form submission event
   */
  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    
    // Validate answer - prevent empty submissions
    if (!answerBody.trim()) {
      setSubmissionStatus({
        type: 'error',
        message: 'Answer cannot be empty'
      });
      return;
    }
    
    setIsSubmitting(true);
    setSubmissionStatus(null);
    
    try {
      const backendUrl = API_BASE_URL;
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'submitAnswer', 
          questionId: question.id,
          userId: currentUser.id,
          body: answerBody 
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add the new answer to the beginning of the list
        setAnswers(prevAnswers => [data.answer, ...prevAnswers]);
        
        // Clear the input and show success message
        setAnswerBody("");
        setSubmissionStatus({
          type: 'success',
          message: 'Answer posted successfully!'
        });
        
        // Scroll to the new answer with animation and highlight it
        setTimeout(() => {
          if (newAnswerRef.current) {
            newAnswerRef.current.scrollIntoView({ 
              behavior: 'smooth',
              block: 'center'
            });
            
            // Add highlight class then remove after animation
            newAnswerRef.current.classList.add('highlight-answer');
            setTimeout(() => {
              if (newAnswerRef.current) {
                newAnswerRef.current.classList.remove('highlight-answer');
              }
            }, 2000);
          }
        }, 300);

        // Clear success message after some time
        setTimeout(() => {
          setSubmissionStatus(null);
        }, 3000);
      } else {
        setSubmissionStatus({
          type: 'error',
          message: data.message || 'Failed to post answer'
        });
      }
    } catch (error) {
      setSubmissionStatus({
        type: 'error',
        message: 'Network error. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Initiates the answer deletion process
   * Shows a confirmation modal before proceeding with deletion
   * 
   * @param {Object} answer - The answer object to delete
   */
  const handleDeleteClick = (answer) => {
    // Store the answer to delete and show confirmation modal
    setAnswerToDelete(answer);
    setShowDeleteModal(true);
  };

  /**
   * Closes the delete confirmation modal and resets state
   */
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setAnswerToDelete(null);
  };

  /**
   * Confirms and executes the answer deletion after user confirmation
   * Removes the deleted answer from the answers array on success
   */
  const confirmDeleteAnswer = async () => {
    if (!answerToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const backendUrl = API_BASE_URL;
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'deleteAnswer',
          answerId: answerToDelete.id,
          userId: currentUser.id
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the deleted answer from the list
        setAnswers(prevAnswers => prevAnswers.filter(a => a.id !== answerToDelete.id));
        // Close the modal
        closeDeleteModal();
      } else {
        alert(data.message || 'Failed to delete answer');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Initiates the answer editing process
   * Sets the answer ID being edited and populates the edit form
   * 
   * @param {Object} answer - The answer object to edit
   */
  const handleEditClick = (answer) => {
    setEditingAnswerId(answer.id);
    setEditAnswerBody(answer.body);
  };

  /**
   * Cancels the answer editing process and resets state
   */
  const cancelEditAnswer = () => {
    setEditingAnswerId(null);
    setEditAnswerBody("");
  };

  /**
   * Submits an edited answer to the backend
   * Updates the answer in the answers array on success
   * 
   * @param {number} answerId - ID of the answer being edited
   */
  const submitEditedAnswer = async (answerId) => {
    if (!editAnswerBody.trim()) {
      alert('Answer cannot be empty');
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const backendUrl = API_BASE_URL;
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'updateAnswer',
          answerId: answerId,
          userId: currentUser.id,
          body: editAnswerBody
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the answer in the list
        setAnswers(prevAnswers => prevAnswers.map(a => 
          a.id === answerId ? data.answer : a
        ));
        
        // Exit edit mode
        setEditingAnswerId(null);
        setEditAnswerBody("");
        
        // Show brief success message
        setSubmissionStatus({
          type: 'success',
          message: 'Answer updated successfully!'
        });
        
        // Clear success message after some time
        setTimeout(() => {
          setSubmissionStatus(null);
        }, 3000);
      } else {
        alert(data.message || 'Failed to update answer');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Marks an answer as accepted
   * Only the question author can accept answers
   * Updates both the answer status and the question's has_accepted_answer property
   * 
   * @param {number} answerId - ID of the answer to mark as accepted
   */
  const handleAcceptAnswer = async (answerId) => {
    // Only the question owner can accept answers
    if (!currentUser || parseInt(question.user_id) !== parseInt(currentUser.id)) {
      return;
    }
    
    setIsAccepting(true);
    
    try {
      const backendUrl = API_BASE_URL;
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'acceptAnswer',
          answerId: answerId,
          userId: currentUser.id
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update all answers - mark the accepted one and unmark all others
        setAnswers(prevAnswers => 
          prevAnswers.map(a => 
            parseInt(a.id) === parseInt(answerId) 
              ? { ...a, is_accepted: 1 } 
              : { ...a, is_accepted: 0 } // Make sure other answers are marked as not accepted
          )
        );
        
        // Show success message
        setSubmissionStatus({
          type: 'success',
          message: 'Answer marked as accepted!'
        });
        
        // Clear success message after some time
        setTimeout(() => {
          setSubmissionStatus(null);
        }, 3000);
        
        // Update question to reflect that it has an accepted answer
        if (onQuestionUpdated && question) {
          const updatedQuestion = { ...question, has_accepted_answer: 1 };
          onQuestionUpdated(updatedQuestion);
        }
      } else {
        alert(data.message || 'Failed to accept answer');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  //============================================================================
  // QUESTION MANAGEMENT FUNCTIONS
  //============================================================================
  
  /**
   * Initiates the question editing process
   * Populates the form with current question data
   */
  const handleEditQuestionClick = () => {
    setEditQuestionData({
      title: question.title,
      body: question.body,
      tags: question.tags || ''
    });
    setIsEditingQuestion(true);
  };

  /**
   * Cancels question editing and reverts to view mode
   */
  const cancelEditQuestion = () => {
    setIsEditingQuestion(false);
  };

  /**
   * Handles input changes for question edit form fields
   * 
   * @param {Event} e - Change event from form inputs
   */
  const handleEditQuestionChange = (e) => {
    const { name, value } = e.target;
    setEditQuestionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Submits the edited question data to the backend
   * Updates the question in the parent component on success
   */
  const submitEditedQuestion = async () => {
    // Validate inputs
    if (!editQuestionData.title.trim() || !editQuestionData.body.trim()) {
      alert('Title and body cannot be empty');
      return;
    }
    
    setIsUpdatingQuestion(true);
    
    try {
      const backendUrl = API_BASE_URL;
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'updateQuestion',
          questionId: question.id,
          userId: currentUser.id,
          title: editQuestionData.title,
          body: editQuestionData.body,
          tags: editQuestionData.tags
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the question in parent component
        if (onQuestionUpdated) {
          onQuestionUpdated(data.question);
        }
        
        // Exit edit mode
        setIsEditingQuestion(false);
        
        // Show success message
        setSubmissionStatus({
          type: 'success',
          message: 'Question updated successfully!'
        });
        
        // Clear success message after some time
        setTimeout(() => {
          setSubmissionStatus(null);
        }, 3000);
      } else {
        alert(data.message || 'Failed to update question');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setIsUpdatingQuestion(false);
    }
  };

  //============================================================================
  // UI HELPER FUNCTIONS
  //============================================================================
  
  /**
   * Adds a focused class to the answer input for styling
   */
  const handleTextareaFocus = () => {
    if (answerInputRef.current) {
      answerInputRef.current.classList.add('focused');
    }
  };

  /**
   * Removes the focused class from the answer input
   */
  const handleTextareaBlur = () => {
    if (answerInputRef.current) {
      answerInputRef.current.classList.remove('focused');
    }
  };

  /**
   * Returns a CSS class based on remaining characters
   * Used to visually indicate when approaching character limit
   * 
   * @returns {string} - CSS class name
   */
  const getCharCountClass = () => {
    const length = answerBody.length;
    if (length > 1950) return 'char-count-danger';
    if (length > 1800) return 'char-count-warning';
    return '';
  };

  /**
   * Cancels answer submission and clears the form
   */
  const handleCancelAnswer = () => {
    setAnswerBody("");
    setSubmissionStatus(null);
  };

  /**
   * Formats a date string into a more readable format
   * 
   * @param {string} dateString - The raw date string from the database
   * @returns {string} - Formatted date string for display
   */
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  /**
   * Converts comma-separated tags string into an array of individual tags
   * 
   * @param {string} tags - Comma-separated string of tags
   * @returns {Array} - Array of individual tag strings
   */
  const formatTags = (tags) => {
    if (!tags) return [];
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  };

  //============================================================================
  // COMPONENT RENDER
  //============================================================================
  
  return (
    <div className="full-question-overlay" onClick={onClose}>
      <div className="full-question-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header - Title and Action Buttons */}
        <div className="full-question-header">
          {isEditingQuestion ? (
            <h2>Edit Question</h2>
          ) : (
            <h2>{question.title}</h2>
          )}
          <div className="question-header-actions">
            {currentUser && parseInt(question.user_id) === parseInt(currentUser.id) && !isEditingQuestion && (
              <button 
                className="question-edit-btn" 
                onClick={handleEditQuestionClick}
                title="Edit this question"
              >
                <i className="fas fa-edit"></i>
              </button>
            )}
            <button className="close-full-question" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
        
        {/* Question Content Section */}
        <div className="full-question-content">
          {/* Question Edit Form - Visible when editing */}
          {isEditingQuestion ? (
            <div className="question-edit-form">
              <div className="edit-form-group">
                <label htmlFor="edit-title">Title</label>
                <input
                  type="text"
                  id="edit-title"
                  name="title"
                  value={editQuestionData.title}
                  onChange={handleEditQuestionChange}
                  className="edit-title-input"
                  disabled={isUpdatingQuestion}
                />
              </div>
              <div className="edit-form-group">
                <label htmlFor="edit-body">Body</label>
                <textarea
                  id="edit-body"
                  name="body"
                  value={editQuestionData.body}
                  onChange={handleEditQuestionChange}
                  className="edit-body-textarea"
                  disabled={isUpdatingQuestion}
                ></textarea>
              </div>
              <div className="edit-form-group">
                <label htmlFor="edit-tags">Tags (comma separated)</label>
                <input
                  type="text"
                  id="edit-tags"
                  name="tags"
                  value={editQuestionData.tags}
                  onChange={handleEditQuestionChange}
                  className="edit-tags-input"
                  placeholder="e.g. javascript, react, css"
                  disabled={isUpdatingQuestion}
                />
              </div>
              <div className="question-edit-actions">
                <button 
                  className="question-save-btn" 
                  onClick={submitEditedQuestion}
                  disabled={isUpdatingQuestion}
                >
                  {isUpdatingQuestion ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Updating...
                    </>
                  ) : 'Save Changes'}
                </button>
                <button 
                  className="question-cancel-btn" 
                  onClick={cancelEditQuestion}
                  disabled={isUpdatingQuestion}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Question Body - Visible when not editing */
            <>
              <div className="question-body">
                {question.body}
              </div>
            </>
          )}
          
          {/* Author Information - Shown beneath question when not editing */}
          {!isEditingQuestion && (
            <div className="full-question-meta">
              <div className="full-question-author">
                <div className="author-avatar">
                  {question.user_email ? question.user_email.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="author-info">
                  <span className="author-name">{question.user_email}</span>
                  <span className="post-date">Posted on {formatDate(question.created_at)}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Question Tags - Shown beneath question when not editing */}
          {!isEditingQuestion && (
            <div className="full-question-tags">
              {formatTags(question.tags).length > 0 ? (
                <>
                  <span className="tags-label">Tags:</span>
                  <div className="tags-container">
                    {formatTags(question.tags).map((tag, index) => (
                      <span key={index} className="question-tag">{tag}</span>
                    ))}
                  </div>
                </>
              ) : (
                <span className="no-tags">No tags</span>
              )}
            </div>
          )}
        </div>
        
        {/* Answers Section */}
        <div className="answers-section">
          <h3 className="answers-header">
            <i className="fas fa-comment-alt"></i> Answers ({answers.length})
          </h3>
          
          {/* Answer Loading State */}
          {isLoadingAnswers && (
            <div className="answers-loading">
              <div className="answer-spinner"></div>
              <span>Loading answers...</span>
            </div>
          )}
          
          {/* Answer Error State */}
          {answerError && !isLoadingAnswers && (
            <div className="answers-error">
              <i className="fas fa-exclamation-circle"></i>
              <p>{answerError}</p>
            </div>
          )}
          
          {/* Empty State - No Answers */}
          {!isLoadingAnswers && !answerError && answers.length === 0 && (
            <div className="no-answers">
              <i className="fas fa-comments"></i>
              <p>No answers yet. Be the first to answer this question!</p>
            </div>
          )}
          
          {/* Answer List - Shows when answers are available */}
          {!isLoadingAnswers && !answerError && answers.length > 0 && (
            <div className="answers-list">
              {answers.map((answer, index) => (
                <div 
                  key={answer.id} 
                  className={`answer-item ${parseInt(answer.is_accepted) === 1 ? 'accepted-answer' : ''}`}
                  ref={index === 0 ? newAnswerRef : null}
                >
                  {/* Answer Edit Form - Shown when editing this answer */}
                  {editingAnswerId === answer.id ? (
                    <div className="answer-edit-form">
                      <textarea
                        value={editAnswerBody}
                        onChange={(e) => setEditAnswerBody(e.target.value)}
                        className="answer-edit-textarea"
                        disabled={isUpdating}
                      ></textarea>
                      <div className="answer-edit-actions">
                        <button 
                          className="answer-save-btn" 
                          onClick={() => submitEditedAnswer(answer.id)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <>
                              <i className="fas fa-spinner fa-spin"></i> Updating...
                            </>
                          ) : 'Save Changes'}
                        </button>
                        <button 
                          className="answer-cancel-btn" 
                          onClick={cancelEditAnswer}
                          disabled={isUpdating}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Answer Content - Shown when not editing */
                    <>
                      {/* Accepted Answer Badge */}
                      {parseInt(answer.is_accepted) === 1 && (
                        <div className="accepted-badge">
                          <i className="fas fa-check-circle"></i> Accepted Answer
                        </div>
                      )}
                      
                      {/* Answer Body */}
                      <div className="answer-content">
                        {answer.body}
                      </div>
                      
                      {/* Comment Section for this Answer */}
                      <CommentSection 
                        answerId={answer.id} 
                        currentUser={currentUser}
                      />
                    </>
                  )}
                  
                  {/* Answer Metadata - Author info and action buttons */}
                  <div className="answer-meta">
                    <div className="answer-author">
                      <div className="user-avatar small">
                        {answer.user_email ? answer.user_email.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="user-details">
                        <span className="answer-author-name">{answer.user_email}</span>
                        <span className="answer-date">
                          Answered on {formatDate(answer.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Answer Action Buttons */}
                    <div className="answer-actions">
                      {/* Accept Button - Visible only to question author and for non-accepted answers */}
                      {currentUser && 
                       parseInt(question.user_id) === parseInt(currentUser.id) && 
                       editingAnswerId !== answer.id &&
                       parseInt(answer.is_accepted) !== 1 && (
                        <button 
                          className="answer-accept-btn" 
                          onClick={() => handleAcceptAnswer(answer.id)}
                          title="Mark as accepted answer"
                          disabled={isAccepting}
                        >
                          {isAccepting ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fas fa-check"></i>
                          )}
                        </button>
                      )}
                      
                      {/* Edit/Delete Buttons - Visible to answer author */}
                      {currentUser && parseInt(answer.user_id) === parseInt(currentUser.id) && (
                        <>
                          {editingAnswerId !== answer.id && (
                            <button 
                              className="answer-edit-btn" 
                              onClick={() => handleEditClick(answer)}
                              title="Edit this answer"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                          )}
                          <button 
                            className="answer-delete-btn" 
                            onClick={() => handleDeleteClick(answer)}
                            title="Delete this answer"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Answer Submission Form */}
          <div className="answer-form">
            <h4 className="answer-form-heading">
              <i className="fas fa-pen"></i> Your Answer
            </h4>
            
            {/* Status Messages - Success or Error */}
            {submissionStatus && (
              <div className={`answer-submission-status ${submissionStatus.type}`}>
                <i className={`fas ${submissionStatus.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                {submissionStatus.message}
              </div>
            )}
            
            {/* Answer Input Form */}
            <form onSubmit={handleAnswerSubmit} className={isSubmitting ? 'form-submitting' : ''}>
              <div className="answer-input-wrapper" ref={answerInputRef}>
                <textarea 
                  value={answerBody}
                  onChange={(e) => setAnswerBody(e.target.value)}
                  placeholder="Write your answer here..." 
                  className="answer-input"
                  disabled={isSubmitting}
                  maxLength="2000"
                  onFocus={handleTextareaFocus}
                  onBlur={handleTextareaBlur}
                  aria-label="Your answer"
                ></textarea>
                
                {/* Submission Overlay - Shown while submitting */}
                {isSubmitting && (
                  <div className="input-overlay">
                    <div className="overlay-spinner"></div>
                    <span>Submitting your answer...</span>
                  </div>
                )}
              </div>
              
              {/* Answer Form Action Bar */}
              <div className="answer-form-actions">
                <span className={`answer-char-count ${getCharCountClass()}`}>
                  {2000 - answerBody.length} characters remaining
                </span>
                <div className="answer-buttons">
                  {/* Cancel Button - Shown only when there's content to cancel */}
                  {answerBody.trim() && !isSubmitting && (
                    <button 
                      type="button" 
                      className="cancel-answer-btn" 
                      onClick={handleCancelAnswer}
                    >
                      Cancel
                    </button>
                  )}
                  {/* Submit Button */}
                  <button 
                    type="submit" 
                    className="post-answer-btn"
                    disabled={isSubmitting || !answerBody.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Posting...
                      </>
                    ) : 'Post Your Answer'}
                  </button>
                </div>
              </div>
            </form>
            
            {/* Login Prompt - Shown to non-authenticated users */}
            {!currentUser && (
              <div className="login-prompt">
                <i className="fas fa-info-circle"></i> You need to be logged in to post an answer.
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete Answer Confirmation Modal */}
      {showDeleteModal && (
        <div className="delete-modal-overlay" onClick={closeDeleteModal}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <h3>Delete Answer</h3>
              <button className="delete-close-button" onClick={closeDeleteModal}>×</button>
            </div>
            
            <div className="delete-modal-content">
              <div className="delete-warning">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <p>Are you sure you want to delete your answer?</p>
              <p className="delete-modal-subtext">This action cannot be undone.</p>
            </div>
            
            <div className="delete-modal-actions">
              <button 
                className="delete-cancel-btn" 
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-btn" 
                onClick={confirmDeleteAnswer}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Deleting...
                  </>
                ) : (
                  'Delete Answer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FullQuestionModal;

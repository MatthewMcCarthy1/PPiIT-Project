import React, { useState, useEffect, useRef } from "react";
import "./questions-css/FullQuestionModal.css";

/**
 * Modal to display the full question details
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Function to call when closing the modal
 * @param {Object} question - The complete question data to display
 * @param {Object} currentUser - The current logged-in user
 */
function FullQuestionModal({ isOpen, onClose, question, currentUser }) {
  // State for the answer input
  const [answerBody, setAnswerBody] = useState("");
  
  // State for answers data
  const [answers, setAnswers] = useState([]);
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(false);
  const [answerError, setAnswerError] = useState(null);
  
  // State for answer submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);

  const newAnswerRef = useRef(null);
  const answerInputRef = useRef(null);

  // Fetch answers when question changes
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

  if (!isOpen || !question) return null;

  /**
   * Increment view count for the question
   */
  const incrementViewCount = async () => {
    try {
      // Get the current hostname from the window location
      const hostname = window.location.hostname;
      const backendUrl = `https://${hostname.replace('-3000', '-8000')}/server.php`;
      
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
   * Fetch answers for the current question
   */
  const fetchAnswers = async () => {
    setIsLoadingAnswers(true);
    setAnswerError(null);
    
    try {
      // Get the current hostname from the window location
      const hostname = window.location.hostname;
      const backendUrl = `https://${hostname.replace('-3000', '-8000')}/server.php`;
      
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

  /**
   * Handle answer submission
   */
  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    
    // Validate answer
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
          action: 'submitAnswer', 
          questionId: question.id,
          userId: currentUser.id,
          body: answerBody 
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add the new answer to the list
        setAnswers(prevAnswers => [data.answer, ...prevAnswers]);
        
        // Clear the input and show success message
        setAnswerBody("");
        setSubmissionStatus({
          type: 'success',
          message: 'Answer posted successfully!'
        });
        
        // Scroll to the new answer with animation
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
   * Handle textarea focus
   */
  const handleTextareaFocus = () => {
    if (answerInputRef.current) {
      answerInputRef.current.classList.add('focused');
    }
  };

  /**
   * Handle textarea blur
   */
  const handleTextareaBlur = () => {
    if (answerInputRef.current) {
      answerInputRef.current.classList.remove('focused');
    }
  };

  /**
   * Get character count class based on remaining characters
   */
  const getCharCountClass = () => {
    const length = answerBody.length;
    if (length > 1800) return 'char-count-warning';
    if (length > 1950) return 'char-count-danger';
    return '';
  };

  /**
   * Cancel answer submission and clear form
   */
  const handleCancelAnswer = () => {
    setAnswerBody("");
    setSubmissionStatus(null);
  };

  /**
   * Formats a date string into a more readable format
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
   */
  const formatTags = (tags) => {
    if (!tags) return [];
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  };

  return (
    <div className="full-question-overlay" onClick={onClose}>
      <div className="full-question-modal" onClick={e => e.stopPropagation()}>
        <div className="full-question-header">
          <h2>{question.title}</h2>
          <button className="close-full-question" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="full-question-content">
          <div className="question-body">
            {question.body}
          </div>
          
          {/* Author info moved below question body */}
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
        </div>
        
        <div className="answers-section">
          <h3 className="answers-header">
            <i className="fas fa-comment-alt"></i> Answers ({answers.length})
          </h3>
          
          {/* Loading state */}
          {isLoadingAnswers && (
            <div className="answers-loading">
              <div className="answer-spinner"></div>
              <span>Loading answers...</span>
            </div>
          )}
          
          {/* Error state */}
          {answerError && !isLoadingAnswers && (
            <div className="answers-error">
              <i className="fas fa-exclamation-circle"></i>
              <p>{answerError}</p>
            </div>
          )}
          
          {/* Empty state */}
          {!isLoadingAnswers && !answerError && answers.length === 0 && (
            <div className="no-answers">
              <i className="fas fa-comments"></i>
              <p>No answers yet. Be the first to answer this question!</p>
            </div>
          )}
          
          {/* Answer list */}
          {!isLoadingAnswers && !answerError && answers.length > 0 && (
            <div className="answers-list">
              {answers.map((answer, index) => (
                <div 
                  key={answer.id} 
                  className="answer-item"
                  ref={index === 0 ? newAnswerRef : null}
                >
                  <div className="answer-content">
                    {answer.body}
                  </div>
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
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Answer form */}
          <div className="answer-form">
            <h4 className="answer-form-heading">
              <i className="fas fa-pen"></i> Your Answer
            </h4>
            
            {submissionStatus && (
              <div className={`answer-submission-status ${submissionStatus.type}`}>
                <i className={`fas ${submissionStatus.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                {submissionStatus.message}
              </div>
            )}
            
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
                
                {isSubmitting && (
                  <div className="input-overlay">
                    <div className="overlay-spinner"></div>
                    <span>Submitting your answer...</span>
                  </div>
                )}
              </div>
              
              <div className="answer-form-actions">
                <span className={`answer-char-count ${getCharCountClass()}`}>
                  {2000 - answerBody.length} characters remaining
                </span>
                <div className="answer-buttons">
                  {answerBody.trim() && !isSubmitting && (
                    <button 
                      type="button" 
                      className="cancel-answer-btn" 
                      onClick={handleCancelAnswer}
                    >
                      Cancel
                    </button>
                  )}
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
            
            {!currentUser && (
              <div className="login-prompt">
                <i className="fas fa-info-circle"></i> You need to be logged in to post an answer.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FullQuestionModal;

import React, { useState, useEffect, useRef } from 'react';
import Comment from './Comment';
import './questions-css/CommentSection.css';
import { API_BASE_URL } from '../../config'; // Importing API base URL from config

/**
 * Comment Section Component
 * 
 * Displays a collapsible section of comments for an answer and provides a form
 * to add new comments. Handles loading, displaying, adding, and deleting comments.
 * 
 * @param {number} answerId - ID of the answer to fetch comments for
 * @param {Object} currentUser - Current logged-in user object with id and other profile information
 * @returns {JSX.Element} - Rendered component
 */
function CommentSection({ answerId, currentUser }) {
  // Stores the list of comments retrieved from the server
  const [comments, setComments] = useState([]);
  
  // Indicates whether comments are currently being fetched from the server
  const [isLoading, setIsLoading] = useState(true);
  
  // Stores any error message that occurs during data fetching
  const [error, setError] = useState(null);
  
  // Stores the text input for a new comment being composed
  const [newComment, setNewComment] = useState('');
  
  // Tracks whether a comment is currently being submitted to prevent double submissions
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Controls whether the comments list is expanded/visible or collapsed/hidden
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  
  // Reference to store the polling interval
  const pollingIntervalRef = useRef(null);
  
  // Track the last comment count to avoid unnecessary re-renders
  const lastCommentCountRef = useRef(0);
  
  /**
   * Fetch comments when component mounts or when answerId changes
   * This ensures comments are always up-to-date for the current answer
   */
  useEffect(() => {
    fetchComments();
    
    // Start polling for new comments every 5 seconds
    pollingIntervalRef.current = setInterval(() => {
      if (!isSubmitting) { // Don't poll while submitting to avoid race conditions
        fetchComments(true); // The 'silent' parameter prevents showing loading indicators
      }
    }, 5000);
    
    // Clean up interval when component unmounts or answerId changes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [answerId]);
  
  /**
   * Fetches comments for the current answer from the server
   * Updates state with the retrieved comments or any error messages
   * 
   * @param {boolean} silent - If true, don't show loading indicators (for background polling)
   */
  const fetchComments = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      const backendUrl = API_BASE_URL;
      
      const response = await fetch(`${backendUrl}?action=getComments&answerId=${answerId}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Only update state if the comment count has changed to avoid unnecessary re-renders
        if (!silent || data.comments.length !== lastCommentCountRef.current) {
          setComments(data.comments || []);
          lastCommentCountRef.current = data.comments.length;
        }
      } else {
        if (!silent) {
          setError(data.message || 'Failed to load comments');
        }
      }
    } catch (error) {
      if (!silent) {
        setError('Network error. Please try again later.');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };
  
  /**
   * Submits a new comment to the server
   * Adds the new comment to the list if successful
   * 
   * @param {Event} e - Form submission event
   */
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    if (!currentUser) {
      alert('Please log in to add a comment');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const backendUrl = API_BASE_URL;
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'addComment',
          userId: currentUser.id,
          answerId: answerId,
          body: newComment.trim()
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add the new comment to the list
        setComments(prevComments => [...prevComments, data.comment]);
        setNewComment(''); // Clear input
        // Expand comments if they were collapsed
        if (!commentsExpanded) {
          setCommentsExpanded(true);
        }
      } else {
        alert(data.message || 'Failed to add comment');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  /**
   * Deletes a comment from the server
   * Removes the comment from the list if successful
   * 
   * @param {number} commentId - ID of the comment to delete
   */
  const handleDeleteComment = async (commentId) => {
    if (!currentUser) {
      alert('Please log in to delete a comment');
      return;
    }
    
    try {
      const backendUrl = API_BASE_URL;
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'deleteComment',
          commentId: commentId,
          userId: currentUser.id
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the deleted comment from the list
        setComments(prevComments => prevComments.filter(c => c.id !== commentId));
      } else {
        alert(data.message || 'Failed to delete comment');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };
  
  /**
   * Toggles the visibility of the comments section
   * Also adjusts polling frequency - poll more frequently when expanded
   */
  const toggleComments = () => {
    const newExpandedState = !commentsExpanded;
    setCommentsExpanded(newExpandedState);
    
    // Clear existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Set new polling interval - poll more frequently when comments are expanded
    const pollingTime = newExpandedState ? 2000 : 5000;
    pollingIntervalRef.current = setInterval(() => {
      if (!isSubmitting) {
        fetchComments(true);
      }
    }, pollingTime);
  };
  
  // Content for the toggle button
  const toggleButtonText = commentsExpanded 
    ? `Hide comments (${comments.length})` 
    : `Show comments (${comments.length})`;
  
  return (
    <div className="comments-section">
      {/* Comment toggle button (only shown if there are comments) */}
      {comments.length > 0 && (
        <button 
          className="toggle-comments-btn"
          onClick={toggleComments}
        >
          <i className={`fas fa-chevron-${commentsExpanded ? 'up' : 'down'}`}></i>
          {toggleButtonText}
        </button>
      )}
      
      {/* Show comments when expanded or when there are no comments yet */}
      {(commentsExpanded || comments.length === 0) && (
        <>
          {/* Comments list */}
          <div className="comments-list">
            {isLoading && (
              <div className="comments-loading">Loading comments...</div>
            )}
            
            {error && !isLoading && (
              <div className="comments-error">{error}</div>
            )}
            
            {!isLoading && !error && comments.length === 0 && (
              <div className="no-comments">No comments yet</div>
            )}
            
            {!isLoading && !error && comments.map(comment => (
              <Comment
                key={comment.id}
                comment={comment}
                currentUser={currentUser}
                onDelete={handleDeleteComment}
              />
            ))}
          </div>
          
          {/* Add comment form */}
          {currentUser && (
            <form className="add-comment-form" onSubmit={handleSubmitComment}>
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength="500"
                disabled={isSubmitting}
              />
              <button 
                type="submit" 
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </form>
          )}
          
          {!currentUser && (
            <div className="login-to-comment">
              <i className="fas fa-info-circle"></i> Log in to add a comment
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CommentSection;

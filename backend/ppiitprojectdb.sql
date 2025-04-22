-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Mar 04, 2025 at 03:41 PM
-- Server version: 9.1.0
-- PHP Version: 8.3.14


-- Features supported by this schema:
-- - User registration and authentication (with ATU email addresses)
-- - Question posting with tags for categorization
-- - Answer submission with ability to mark accepted answers
-- - Comment system for discussion on specific answers
-- - Bookmark system to save questions for later reference
--
-- ------------------------------------------------------------------------------

-- Tables:
-- 1. users - Stores user accounts with email authentication
-- 2. questions - Stores questions posted by users
-- 3. bookmarks - Tracks which questions are bookmarked by which users
-- 4. answers - Stores answers to questions
-- 5. comments - Stores comments on answers
-- ------------------------------------------------------------------------------

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ppiitprojectdb`
--

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,  -- Unique user identifier
  `email` varchar(60) NOT NULL,      -- User's ATU email address (@atu.ie)
  `password` varchar(60) NOT NULL,   -- Hashed password (bcrypt)
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,  -- Account creation timestamp
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)       -- Ensures emails are unique in the system
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `created_at`) VALUES
(1, 'test@atu.ie', '$2y$12$YYYn5CwkwcU1t1yxJPNyEODw9Qd.CHHtKV1QOPi92KMCB2hT50MCy', CURRENT_TIMESTAMP), -- Password: testpass123
(2, 'admin@atu.ie', '$2y$12$YmJUigR1FUOXvMX.5yD/y.WBKzGBYbJ.ETdYw0KjIhjD48bTmqmfK', CURRENT_TIMESTAMP); -- Password: adminpass123

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

DROP TABLE IF EXISTS `questions`;
CREATE TABLE IF NOT EXISTS `questions` (
  `id` int NOT NULL AUTO_INCREMENT,       -- Unique question identifier
  `user_id` int NOT NULL,                 -- References users.id - question author
  `title` varchar(150) NOT NULL,          -- Question title/headline
  `body` text NOT NULL,                   -- Full question content
  `tags` varchar(255) DEFAULT NULL,       -- Comma-separated tags for categorization
  `views` int DEFAULT 0,                  -- Counter for question views
  `answer_count` int DEFAULT 0,           -- Counter for answers to this question
  `has_accepted_answer` tinyint DEFAULT 0, -- Indicates if question has an accepted answer (0=no, 1=yes)
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP, -- Question creation timestamp
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),              -- Foreign key index to users table
  CONSTRAINT `question_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create a table for bookmarks 
DROP TABLE IF EXISTS `bookmarks`;
CREATE TABLE IF NOT EXISTS `bookmarks` (
  `id` int NOT NULL AUTO_INCREMENT,       -- Unique bookmark identifier
  `user_id` int NOT NULL,                 -- References users.id - who created the bookmark
  `question_id` int NOT NULL,             -- References questions.id - which question is bookmarked
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP, -- Bookmark creation timestamp
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_question` (`user_id`, `question_id`), -- Prevents duplicate bookmarks
  KEY `user_id` (`user_id`),              -- Index for user lookups
  KEY `question_id` (`question_id`),      -- Index for question lookups
  CONSTRAINT `bookmark_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `bookmark_question_fk` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create a table for answers
DROP TABLE IF EXISTS `answers`;
CREATE TABLE IF NOT EXISTS `answers` (
  `id` int NOT NULL AUTO_INCREMENT,       -- Unique answer identifier
  `question_id` int NOT NULL,             -- References questions.id - which question this answers
  `user_id` int NOT NULL,                 -- References users.id - answer author
  `body` text NOT NULL,                   -- Answer content
  `is_accepted` tinyint DEFAULT 0,        -- Whether this is the accepted answer (0=no, 1=yes)
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP, -- Answer creation timestamp
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`),      -- Index for question lookups
  KEY `user_id` (`user_id`),              -- Index for user lookups
  CONSTRAINT `answer_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `answer_question_fk` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create a table for comments on answers only
DROP TABLE IF EXISTS `comments`;
CREATE TABLE IF NOT EXISTS `comments` (
  `id` int NOT NULL AUTO_INCREMENT,       -- Unique comment identifier
  `user_id` int NOT NULL,                 -- References users.id - comment author
  `answer_id` int NOT NULL,               -- References answers.id - which answer this comments on
  `body` text NOT NULL,                   -- Comment content
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP, -- Comment creation timestamp
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),              -- Index for user lookups
  KEY `answer_id` (`answer_id`),          -- Index for answer lookups
  CONSTRAINT `comment_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `comment_answer_fk` FOREIGN KEY (`answer_id`) REFERENCES `answers` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

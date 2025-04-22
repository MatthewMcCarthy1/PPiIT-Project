<?php
// Start output buffering to prevent any unintended output
ob_start();

// Suppress warnings and notices that might appear in the JSON output
error_reporting(E_ERROR | E_PARSE);

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Credentials: true");
    exit(0);
}

// Add CORS headers to all responses
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=utf-8");

try {
    // Connect to the MySQL database
    $conn = new mysqli("mysql", "root", "root", "ppiitprojectdb");

    // Check connection
    if ($conn->connect_error) {
        // Clear any output that might have been generated
        ob_clean();
        die(json_encode(["success" => false, "message" => "Database connection failed"]));
    }

    // Handle GET requests separately
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'getQuestions':
                    // Clear any output before sending JSON
                    ob_clean();
                    getQuestions($conn);
                    exit;
                case 'getAnswers':
                    // Clear any output before sending JSON
                    ob_clean();
                    getAnswers($conn);
                    exit;
                default:
                    // Clear any output before sending JSON
                    ob_clean();
                    echo json_encode(["success" => false, "message" => "Invalid action"]);
                    exit;
            }
        }
    }

    // Decode the JSON data sent from the client
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput);

    if (json_last_error() !== JSON_ERROR_NONE) {
        // Clear any output before sending JSON
        ob_clean();
        die(json_encode([
            "success" => false,
            "message" => "Invalid request format",
            "error" => json_last_error_msg(),
            "input" => $rawInput
        ]));
    }

    // Check if an action is specified in the request
    if (isset($data->action)) {
        // Clear any output before sending JSON
        ob_clean();

        switch ($data->action) {
            case 'login':
                login($conn, $data);
                break;
            case 'register':
                register($conn, $data);
                break;
            case 'submitQuestion':
                submitQuestion($conn, $data);
                break;
            case 'updateQuestion':
                updateQuestion($conn, $data);
                break;
            case 'deleteQuestion':
                deleteQuestion($conn, $data);
                break;
            case 'submitAnswer':
                submitAnswer($conn, $data);
                break;
            case 'deleteAnswer':
                deleteAnswer($conn, $data);
                break;
            case 'updateAnswer':
                updateAnswer($conn, $data);
                break;
            case 'incrementViewCount':
                incrementViewCount($conn, $data);
                break;
            case 'acceptAnswer':
                acceptAnswer($conn, $data);
                break;
            default:
                echo json_encode(["success" => false, "message" => "Invalid action"]);
        }
    } else {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode(["success" => false, "message" => "No action specified"]);
    }

    // Close the database connection
    $conn->close();
} catch (Exception $e) {
    // Clear any output before sending JSON
    ob_clean();
    echo json_encode([
        "success" => false,
        "message" => "Server error",
        "error" => $e->getMessage()
    ]);
}

// Function to get all questions from the database with optional filtering
function getQuestions($conn) {
    // Check for filtering parameters
    $userId = isset($_GET['userId']) ? $_GET['userId'] : null;
    $tag = isset($_GET['tag']) ? $_GET['tag'] : null;
    $search = isset($_GET['search']) ? $_GET['search'] : null;
    $sort = isset($_GET['sort']) ? $_GET['sort'] : 'newest';
    
    // Build the SQL query with JOIN
    $sql = "SELECT q.*, u.email as user_email, 
            (SELECT COUNT(*) FROM answers WHERE question_id = q.id) as answer_count
            FROM questions q 
            JOIN users u ON q.user_id = u.id ";
    
    // Add WHERE conditions if filtering
    $conditions = [];
    $params = [];
    $types = "";
    
    if ($userId) {
        $conditions[] = "q.user_id = ?";
        $params[] = $userId;
        $types .= "i"; // Integer
    }
    
    if ($tag) {
        $conditions[] = "q.tags LIKE ?";
        $params[] = "%$tag%";
        $types .= "s"; // String
    }
    
    if ($search) {
        $conditions[] = "(q.title LIKE ? OR q.body LIKE ? OR q.tags LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $types .= "sss"; // Three strings
    }
    
    // Combine conditions if any
    if (!empty($conditions)) {
        $sql .= "WHERE " . implode(" AND ", $conditions) . " ";
    }
    
    // Add ORDER BY based on sort parameter
    if ($sort === 'oldest') {
        $sql .= "ORDER BY q.created_at ASC";
    } else {
        // Default to newest
        $sql .= "ORDER BY q.created_at DESC";
    }
    
    // Use prepared statements if we have parameters
    if (!empty($params)) {
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Error preparing query: " . $conn->error
            ]);
            return;
        }
        
        // Bind parameters dynamically
        if (!empty($types) && !empty($params)) {
            $bindParams = [$types];
            for ($i = 0; $i < count($params); $i++) {
                $bindParams[] = &$params[$i];
            }
            call_user_func_array([$stmt, 'bind_param'], $bindParams);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        // Direct query if no parameters
        $result = $conn->query($sql);
    }
    
    // Handle query execution errors
    if ($result === false) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode([
            "success" => false, 
            "message" => "Error retrieving questions: " . $conn->error
        ]);
        return;
    }
    
    $questions = [];
    $count = 0;
    
    // Collect all questions from the result set
    while ($row = $result->fetch_assoc()) {
        $questions[] = $row;
        $count++;
    }
    
    // Return JSON response with success status and questions array
    // Clear any output before sending JSON
    ob_clean();
    echo json_encode([
        "success" => true,
        "count" => $count,
        "questions" => $questions
    ]);
}

// Function to handle user login
function login($conn, $data)
{
    $email = $data->email;
    $password = $data->password;

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode(["success" => false, "message" => "Invalid email format"]);
        return;
    }

    // Prepare and execute a SQL query to find the user
    $stmt = $conn->prepare("SELECT id, email, password FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        // Verify the password
        if (password_verify($password, $user['password'])) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode(["success" => true, "user" => ["id" => $user['id'], "email" => $user['email']]]);
        } else {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode(["success" => false, "message" => "Invalid password"]);
        }
    } else {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode(["success" => false, "message" => "User not found"]);
    }
}

// Function to handle user registration
function register($conn, $data)
{
    $email = $data->email;
    $password = $data->password;

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode(["success" => false, "message" => "Invalid email format"]);
        return;
    }

    // Check if the email ends with @atu.ie
    if (!preg_match('/@atu\.ie$/', $email)) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode(["success" => false, "message" => "Only @atu.ie email addresses are allowed"]);
        return;
    }

    // Check if password is minimum 8 characters long
    if (strlen($password) < 8) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode(["success" => false, "message" => "Password must be at least 8 characters long"]);
        return;
    }

    // Hash the password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Prepare and execute a SQL query to insert the new user
    $stmt = $conn->prepare("INSERT INTO users (email, password) VALUES (?, ?)");
    $stmt->bind_param("ss", $email, $hashed_password);

    if ($stmt->execute()) {
        $user_id = $conn->insert_id; // Get the ID of the newly created user
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode([
            "success" => true, 
            "message" => "User registered successfully",
            "user" => ["id" => $user_id, "email" => $email]
        ]);
    } else {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode(["success" => false, "message" => "Error registering user"]);
    }
}

// Function to handle question submission from users
function submitQuestion($conn, $data)
{
    // Verify user authentication before allowing question submission
    if (!isset($data->userId) || empty($data->userId)) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode(["success" => false, "message" => "User authentication required"]);
        return;
    }

    // Validate required question fields
    if (empty($data->title) || empty($data->body)) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode(["success" => false, "message" => "Title and body are required"]);
        return;
    }

    try {
        // Prepare SQL statement to insert the new question
        $stmt = $conn->prepare("INSERT INTO questions (user_id, title, body, tags) VALUES (?, ?, ?, ?)");
        if (!$stmt) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode(["success" => false, "message" => "Database error"]);
            return;
        }
        
        // Bind parameters to prevent SQL injection
        $stmt->bind_param("isss", $data->userId, $data->title, $data->body, $data->tags);
        
        // Execute the statement and handle result
        if ($stmt->execute()) {
            $questionId = $stmt->insert_id; // Get ID of newly created question
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => true, 
                "message" => "Question submitted successfully",
                "questionId" => $questionId
            ]);
        } else {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Error submitting question"
            ]);
        }
        
        $stmt->close();
    } catch (Exception $e) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode([
            "success" => false, 
            "message" => "Error processing question"
        ]);
    }
}

/**
 * Update an existing question
 * Ensures only the owner can edit their own questions
 */
function updateQuestion($conn, $data) {
    // Check if required parameters are provided
    if (!isset($data->questionId) || !isset($data->userId) || 
        !isset($data->title) || !isset($data->body) || 
        empty(trim($data->title)) || empty(trim($data->body))) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode([
            "success" => false, 
            "message" => "Missing required parameters"
        ]);
        return;
    }

    // Convert parameters to integers to ensure type safety
    $questionId = intval($data->questionId);
    $userId = intval($data->userId);
    $title = trim($data->title);
    $body = trim($data->body);
    $tags = isset($data->tags) ? trim($data->tags) : "";

    try {
        // First check if the user is the owner of this question
        $checkStmt = $conn->prepare("SELECT user_id FROM questions WHERE id = ?");
        if (!$checkStmt) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Database error"
            ]);
            return;
        }

        $checkStmt->bind_param("i", $questionId);
        $checkStmt->execute();
        $result = $checkStmt->get_result();

        // If question doesn't exist
        if ($result->num_rows === 0) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Question not found"
            ]);
            return;
        }

        // Check if user is the owner
        $question = $result->fetch_assoc();
        if (intval($question['user_id']) !== $userId) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "You can only edit your own questions"
            ]);
            return;
        }

        // User is authorized, proceed with update
        $updateStmt = $conn->prepare("UPDATE questions SET title = ?, body = ?, tags = ? WHERE id = ?");
        if (!$updateStmt) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Database error during update"
            ]);
            return;
        }

        $updateStmt->bind_param("sssi", $title, $body, $tags, $questionId);
        
        if ($updateStmt->execute()) {
            // Fetch the updated question with user info
            $fetchStmt = $conn->prepare("SELECT q.*, u.email as user_email,
                                       (SELECT COUNT(*) FROM answers WHERE question_id = q.id) as answer_count
                                       FROM questions q 
                                       JOIN users u ON q.user_id = u.id 
                                       WHERE q.id = ?");
            $fetchStmt->bind_param("i", $questionId);
            $fetchStmt->execute();
            $questionResult = $fetchStmt->get_result();
            $updatedQuestion = $questionResult->fetch_assoc();
            
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => true, 
                "message" => "Question successfully updated",
                "question" => $updatedQuestion
            ]);
        } else {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Failed to update question"
            ]);
        }
        
        $updateStmt->close();
    } catch (Exception $e) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode([
            "success" => false, 
            "message" => "Error processing update request: " . $e->getMessage()
        ]);
    }
}

/**
 * Delete a question from the database
 * Ensures only the owner can delete their own questions
 */
function deleteQuestion($conn, $data) {
    // Check if required parameters are provided
    if (!isset($data->questionId) || !isset($data->userId)) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode([
            "success" => false, 
            "message" => "Missing required parameters"
        ]);
        return;
    }

    // Convert parameters to integers to ensure type safety
    $questionId = intval($data->questionId);
    $userId = intval($data->userId);

    try {
        // First check if the user is the owner of this question
        $checkStmt = $conn->prepare("SELECT user_id FROM questions WHERE id = ?");
        if (!$checkStmt) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Database error"
            ]);
            return;
        }

        $checkStmt->bind_param("i", $questionId);
        $checkStmt->execute();
        $result = $checkStmt->get_result();

        // If question doesn't exist
        if ($result->num_rows === 0) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Question not found"
            ]);
            return;
        }

        // Check if user is the owner
        $question = $result->fetch_assoc();
        if (intval($question['user_id']) !== $userId) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "You can only delete your own questions"
            ]);
            return;
        }

        // User is authorized, proceed with deletion
        $deleteStmt = $conn->prepare("DELETE FROM questions WHERE id = ?");
        if (!$deleteStmt) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Database error during deletion"
            ]);
            return;
        }

        $deleteStmt->bind_param("i", $questionId);
        
        if ($deleteStmt->execute()) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => true, 
                "message" => "Question successfully deleted"
            ]);
        } else {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Failed to delete question"
            ]);
        }
        
        $deleteStmt->close();
    } catch (Exception $e) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode([
            "success" => false, 
            "message" => "Error processing delete request"
        ]);
    }
}

/**
 * Submit an answer to a question
 */
function submitAnswer($conn, $data) {
    // Check if required parameters are provided
    if (!isset($data->questionId) || !isset($data->userId) || !isset($data->body) || trim($data->body) === '') {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode([
            "success" => false, 
            "message" => "Missing required parameters"
        ]);
        return;
    }

    try {
        // First verify the question exists
        $checkStmt = $conn->prepare("SELECT id FROM questions WHERE id = ?");
        $checkStmt->bind_param("i", $data->questionId);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        
        if ($result->num_rows === 0) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Question not found"
            ]);
            return;
        }
        
        // Insert the answer
        $stmt = $conn->prepare("INSERT INTO answers (question_id, user_id, body) VALUES (?, ?, ?)");
        if (!$stmt) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Database error"
            ]);
            return;
        }
        
        $stmt->bind_param("iis", $data->questionId, $data->userId, $data->body);
        
        if ($stmt->execute()) {
            $answerId = $stmt->insert_id;
            
            // Update the answer count in the questions table
            $updateStmt = $conn->prepare("UPDATE questions SET answer_count = answer_count + 1 WHERE id = ?");
            $updateStmt->bind_param("i", $data->questionId);
            $updateStmt->execute();
            
            // Fetch the created answer with user info for immediate display
            $fetchStmt = $conn->prepare("SELECT a.*, u.email as user_email FROM answers a 
                                        JOIN users u ON a.user_id = u.id 
                                        WHERE a.id = ?");
            $fetchStmt->bind_param("i", $answerId);
            $fetchStmt->execute();
            $answerResult = $fetchStmt->get_result();
            $answer = $answerResult->fetch_assoc();
            
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => true, 
                "message" => "Answer submitted successfully",
                "answer" => $answer
            ]);
        } else {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Error submitting answer"
            ]);
        }
        
        $stmt->close();
    } catch (Exception $e) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode([
            "success" => false, 
            "message" => "Error processing request: " . $e->getMessage()
        ]);
    }
}

/**
 * Delete an answer from the database
 * Ensures only the owner can delete their own answers
 */
function deleteAnswer($conn, $data) {
    // Check if required parameters are provided
    if (!isset($data->answerId) || !isset($data->userId)) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode([
            "success" => false, 
            "message" => "Missing required parameters"
        ]);
        return;
    }

    // Convert parameters to integers to ensure type safety
    $answerId = intval($data->answerId);
    $userId = intval($data->userId);

    try {
        // First check if the user is the owner of this answer
        $checkStmt = $conn->prepare("SELECT user_id, question_id FROM answers WHERE id = ?");
        if (!$checkStmt) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Database error"
            ]);
            return;
        }

        $checkStmt->bind_param("i", $answerId);
        $checkStmt->execute();
        $result = $checkStmt->get_result();

        // If answer doesn't exist
        if ($result->num_rows === 0) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Answer not found"
            ]);
            return;
        }

        // Check if user is the owner
        $answer = $result->fetch_assoc();
        $questionId = $answer['question_id'];
        
        if (intval($answer['user_id']) !== $userId) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "You can only delete your own answers"
            ]);
            return;
        }

        // User is authorized, proceed with deletion
        $deleteStmt = $conn->prepare("DELETE FROM answers WHERE id = ?");
        if (!$deleteStmt) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Database error during deletion"
            ]);
            return;
        }

        $deleteStmt->bind_param("i", $answerId);
        
        if ($deleteStmt->execute()) {
            // Decrement the answer count for the question
            $updateStmt = $conn->prepare("UPDATE questions SET answer_count = GREATEST(answer_count - 1, 0) WHERE id = ?");
            $updateStmt->bind_param("i", $questionId);
            $updateStmt->execute();
            
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => true, 
                "message" => "Answer successfully deleted"
            ]);
        } else {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Failed to delete answer"
            ]);
        }
        
        $deleteStmt->close();
    } catch (Exception $e) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode([
            "success" => false, 
            "message" => "Error processing delete request: " . $e->getMessage()
        ]);
    }
}

/**
 * Update an existing answer
 * Ensures only the owner can edit their own answers
 */
function updateAnswer($conn, $data) {
    // Check if required parameters are provided
    if (!isset($data->answerId) || !isset($data->userId) || !isset($data->body) || trim($data->body) === '') {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode([
            "success" => false, 
            "message" => "Missing required parameters"
        ]);
        return;
    }

    // Convert parameters to integers to ensure type safety
    $answerId = intval($data->answerId);
    $userId = intval($data->userId);
    $body = trim($data->body);

    try {
        // First check if the user is the owner of this answer
        $checkStmt = $conn->prepare("SELECT user_id FROM answers WHERE id = ?");
        if (!$checkStmt) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Database error"
            ]);
            return;
        }

        $checkStmt->bind_param("i", $answerId);
        $checkStmt->execute();
        $result = $checkStmt->get_result();

        // If answer doesn't exist
        if ($result->num_rows === 0) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Answer not found"
            ]);
            return;
        }

        // Check if user is the owner
        $answer = $result->fetch_assoc();
        if (intval($answer['user_id']) !== $userId) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "You can only edit your own answers"
            ]);
            return;
        }

        // User is authorized, proceed with update
        $updateStmt = $conn->prepare("UPDATE answers SET body = ? WHERE id = ?");
        if (!$updateStmt) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Database error during update"
            ]);
            return;
        }

        $updateStmt->bind_param("si", $body, $answerId);
        
        if ($updateStmt->execute()) {
            // Fetch the updated answer with user info
            $fetchStmt = $conn->prepare("SELECT a.*, u.email as user_email FROM answers a 
                                         JOIN users u ON a.user_id = u.id 
                                         WHERE a.id = ?");
            $fetchStmt->bind_param("i", $answerId);
            $fetchStmt->execute();
            $answerResult = $fetchStmt->get_result();
            $updatedAnswer = $answerResult->fetch_assoc();
            
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => true, 
                "message" => "Answer successfully updated",
                "answer" => $updatedAnswer
            ]);
        } else {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Failed to update answer"
            ]);
        }
        
        $updateStmt->close();
    } catch (Exception $e) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode([
            "success" => false, 
            "message" => "Error processing update request: " . $e->getMessage()
        ]);
    }
}

/**
 * Increment view count for a question
 */
function incrementViewCount($conn, $data) {
    // Check if question ID is provided
    if (!isset($data->questionId)) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode([
            "success" => false, 
            "message" => "Question ID is required"
        ]);
        return;
    }
    
    $questionId = intval($data->questionId);
    
    try {
        // Update view count in the database
        $stmt = $conn->prepare("UPDATE questions SET views = views + 1 WHERE id = ?");
        $stmt->bind_param("i", $questionId);
        
        if ($stmt->execute()) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => true,
                "message" => "View count incremented successfully"
            ]);
        } else {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Failed to increment view count"
            ]);
        }
        
    } catch (Exception $e) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode([
            "success" => false, 
            "message" => "Error processing request: " . $e->getMessage()
        ]);
    }
}

/**
 * Mark an answer as accepted
 * Only the question owner can mark answers as accepted
 */
function acceptAnswer($conn, $data) {
    // Check if required parameters are provided
    if (!isset($data->answerId) || !isset($data->userId)) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode([
            "success" => false, 
            "message" => "Missing required parameters"
        ]);
        return;
    }

    // Convert parameters to integers to ensure type safety
    $answerId = intval($data->answerId);
    $userId = intval($data->userId);

    try {
        // Get the question ID from the answer
        $questionStmt = $conn->prepare("SELECT question_id FROM answers WHERE id = ?");
        if (!$questionStmt) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Database error"
            ]);
            return;
        }

        $questionStmt->bind_param("i", $answerId);
        $questionStmt->execute();
        $result = $questionStmt->get_result();

        // Check if answer exists
        if ($result->num_rows === 0) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Answer not found"
            ]);
            return;
        }

        $answer = $result->fetch_assoc();
        $questionId = $answer['question_id'];
        
        // Now check if the user is the owner of the question
        $ownerCheckStmt = $conn->prepare("SELECT user_id FROM questions WHERE id = ?");
        $ownerCheckStmt->bind_param("i", $questionId);
        $ownerCheckStmt->execute();
        $ownerResult = $ownerCheckStmt->get_result();
        $question = $ownerResult->fetch_assoc();
        
        if (intval($question['user_id']) !== $userId) {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Only the question owner can accept answers"
            ]);
            return;
        }
        
        // First unmark any previously accepted answer for this question
        $clearStmt = $conn->prepare("UPDATE answers SET is_accepted = 0 WHERE question_id = ?");
        $clearStmt->bind_param("i", $questionId);
        $clearStmt->execute();
        
        // Now mark this answer as accepted
        $acceptStmt = $conn->prepare("UPDATE answers SET is_accepted = 1 WHERE id = ?");
        $acceptStmt->bind_param("i", $answerId);
        
        if ($acceptStmt->execute()) {
            // Mark the question as having an accepted answer
            $updateQuestionStmt = $conn->prepare("UPDATE questions SET has_accepted_answer = 1 WHERE id = ?");
            $updateQuestionStmt->bind_param("i", $questionId);
            $updateQuestionStmt->execute();
            
            // Fetch the updated answer with user info
            $fetchStmt = $conn->prepare("SELECT a.*, u.email as user_email FROM answers a 
                                         JOIN users u ON a.user_id = u.id 
                                         WHERE a.id = ?");
            $fetchStmt->bind_param("i", $answerId);
            $fetchStmt->execute();
            $answerResult = $fetchStmt->get_result();
            $updatedAnswer = $answerResult->fetch_assoc();
            
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => true, 
                "message" => "Answer marked as accepted",
                "answer" => $updatedAnswer
            ]);
        } else {
            // Clear any output before sending JSON
            ob_clean();
            echo json_encode([
                "success" => false, 
                "message" => "Failed to accept answer"
            ]);
        }
        
    } catch (Exception $e) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode([
            "success" => false, 
            "message" => "Error processing request: " . $e->getMessage()
        ]);
    }
}

/**
 * Get answers for a specific question
 */
function getAnswers($conn) {
    // Check if question ID is provided
    if (!isset($_GET['questionId'])) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode([
            "success" => false, 
            "message" => "Question ID is required"
        ]);
        return;
    }
    
    $questionId = intval($_GET['questionId']);
    
    try {
        // Fetch answers with user information
        // Updated to order by is_accepted first (accepted answers come first)
        $stmt = $conn->prepare("SELECT a.*, u.email as user_email 
                               FROM answers a 
                               JOIN users u ON a.user_id = u.id 
                               WHERE a.question_id = ? 
                               ORDER BY a.is_accepted DESC, a.created_at ASC");
        
        $stmt->bind_param("i", $questionId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $answers = [];
        $count = 0;
        
        while ($row = $result->fetch_assoc()) {
            $answers[] = $row;
            $count++;
        }
        
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode([
            "success" => true,
            "count" => $count,
            "answers" => $answers
        ]);
        
    } catch (Exception $e) {
        // Clear any output before sending JSON
        ob_clean();
        echo json_encode([
            "success" => false, 
            "message" => "Error retrieving answers: " . $e->getMessage()
        ]);
    }
}
?>
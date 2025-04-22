<?php
// Start output buffering to prevent any unintended output
ob_start();

// Suppress warnings and notices that might appear in the JSON output
error_reporting(E_ERROR | E_PARSE);

/**
 * Sends a JSON response to the client
 * 
 * Cleans the output buffer and encodes the provided data as JSON
 * 
 * @param array $data The data to be JSON-encoded and sent
 * @return void
 */
function sendJsonResponse($data) {
    ob_clean();
    echo json_encode($data);
    return;
}

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
        ob_clean();
        die(json_encode(["success" => false, "message" => "Database connection failed"]));
    }

    // Handle GET requests separately
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'getQuestions':
                    ob_clean();
                    getQuestions($conn);
                    exit;
                case 'getAnswers':
                    ob_clean();
                    getAnswers($conn);
                    exit;
                case 'getComments':
                    ob_clean();
                    getComments($conn);
                    exit;
                default:
                    sendJsonResponse(["success" => false, "message" => "Invalid action"]);
                    exit;
            }
        }
    }

    // Decode the JSON data sent from the client
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput);

    if (json_last_error() !== JSON_ERROR_NONE) {
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
            case 'addComment':
                addComment($conn, $data);
                break;
            case 'deleteComment':
                deleteComment($conn, $data);
                break;
            default:
                sendJsonResponse(["success" => false, "message" => "Invalid action"]);
        }
    } else {
        sendJsonResponse(["success" => false, "message" => "No action specified"]);
    }

    // Close the database connection
    $conn->close();
} catch (Exception $e) {
    sendJsonResponse([
        "success" => false,
        "message" => "Server error",
        "error" => $e->getMessage()
    ]);
}

//==============================================================================
// DATABASE HELPER FUNCTIONS
//==============================================================================

/**
 * Prepares a SQL statement with error handling
 * 
 * @param mysqli $conn Database connection object
 * @param string $sql SQL query to prepare
 * @param string $errorMessage Custom error message on failure
 * @return mysqli_stmt|null Prepared statement or null on failure
 */
function prepareStatement($conn, $sql, $errorMessage = "Database error") {
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        sendJsonResponse(["success" => false, "message" => $errorMessage]);
        return null;
    }
    return $stmt;
}

/**
 * Verifies if a user is the owner of a resource
 * 
 * @param mysqli $conn Database connection object
 * @param string $table Table name containing the resource
 * @param int $id ID of the resource to check
 * @param int $userId ID of the user to verify ownership against
 * @param string $notFoundMessage Error message if resource not found
 * @param string $notOwnerMessage Error message if user is not owner
 * @return bool True if user is owner, false otherwise
 */
function verifyOwnership($conn, $table, $id, $userId, $notFoundMessage, $notOwnerMessage) {
    $stmt = prepareStatement($conn, "SELECT user_id FROM $table WHERE id = ?");
    if (!$stmt) return false;
    
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendJsonResponse(["success" => false, "message" => $notFoundMessage]);
        return false;
    }
    
    $item = $result->fetch_assoc();
    if (intval($item['user_id']) !== intval($userId)) {
        sendJsonResponse(["success" => false, "message" => $notOwnerMessage]);
        return false;
    }
    
    return true;
}

/**
 * Fetches a question with all its details including user info
 * 
 * @param mysqli $conn Database connection object
 * @param int $questionId ID of the question to fetch
 * @return array|null Question data with details or null if not found
 */
function fetchQuestionWithDetails($conn, $questionId) {
    $stmt = prepareStatement(
        $conn, 
        "SELECT q.*, u.email as user_email,
         (SELECT COUNT(*) FROM answers WHERE question_id = q.id) as answer_count
         FROM questions q 
         JOIN users u ON q.user_id = u.id 
         WHERE q.id = ?"
    );
    
    if (!$stmt) return null;
    
    $stmt->bind_param("i", $questionId);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result->fetch_assoc();
}

/**
 * Fetches any entity with its associated user information
 * 
 * @param mysqli $conn Database connection object
 * @param string $table Table name to fetch from (answers, comments)
 * @param int $id ID of the entity to fetch
 * @return array|null Entity data with user info or null if not found
 */
function fetchEntityWithUser($conn, $table, $id) {
    $stmt = prepareStatement(
        $conn,
        "SELECT t.*, u.email as user_email FROM $table t
         JOIN users u ON t.user_id = u.id
         WHERE t.id = ?"
    );
    
    if (!$stmt) return null;
    
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result->fetch_assoc();
}

//==============================================================================
// AUTHENTICATION FUNCTIONS
//==============================================================================

/**
 * Handles user login functionality
 *
 * Validates email format and verifies password against stored hash
 *
 * @param mysqli $conn Database connection object
 * @param object $data Request data containing email and password
 * @return void Sends JSON response directly
 */
function login($conn, $data) {
    $email = $data->email;
    $password = $data->password;

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendJsonResponse(["success" => false, "message" => "Invalid email format"]);
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
            sendJsonResponse(["success" => true, "user" => ["id" => $user['id'], "email" => $user['email']]]);
        } else {
            sendJsonResponse(["success" => false, "message" => "Invalid password"]);
        }
    } else {
        sendJsonResponse(["success" => false, "message" => "User not found"]);
    }
}

/**
 * Registers a new user in the system
 *
 * Validates email format and domain (@atu.ie), ensures password meets
 * minimum length requirements, and creates a new user account
 *
 * @param mysqli $conn Database connection object
 * @param object $data Request data containing email and password
 * @return void Sends JSON response directly
 */
function register($conn, $data) {
    $email = $data->email;
    $password = $data->password;

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendJsonResponse(["success" => false, "message" => "Invalid email format"]);
        return;
    }

    // Check if the email ends with @atu.ie
    if (!preg_match('/@atu\.ie$/', $email)) {
        sendJsonResponse(["success" => false, "message" => "Only @atu.ie email addresses are allowed"]);
        return;
    }

    // Check if password is minimum 8 characters long
    if (strlen($password) < 8) {
        sendJsonResponse(["success" => false, "message" => "Password must be at least 8 characters long"]);
        return;
    }

    // Hash the password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Prepare and execute a SQL query to insert the new user
    $stmt = $conn->prepare("INSERT INTO users (email, password) VALUES (?, ?)");
    $stmt->bind_param("ss", $email, $hashed_password);

    if ($stmt->execute()) {
        $user_id = $conn->insert_id; // Get the ID of the newly created user
        sendJsonResponse([
            "success" => true, 
            "message" => "User registered successfully",
            "user" => ["id" => $user_id, "email" => $email]
        ]);
    } else {
        sendJsonResponse(["success" => false, "message" => "Error registering user"]);
    }
}

//==============================================================================
// QUESTION MANAGEMENT FUNCTIONS
//==============================================================================

/**
 * Fetches questions from the database with optional filtering
 * 
 * @param mysqli $conn Database connection object
 * @return void Sends JSON response directly
 */
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
        $sql .= "ORDER BY q.created_at DESC";
    }
    
    // Use prepared statements if we have parameters
    if (!empty($params)) {
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            sendJsonResponse([
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
        sendJsonResponse([
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
    
    sendJsonResponse([
        "success" => true,
        "count" => $count,
        "questions" => $questions
    ]);
}

/**
 * Creates a new question in the database
 *
 * Verifies user authentication and validates required fields before
 * creating the question
 *
 * @param mysqli $conn Database connection object
 * @param object $data Request data containing userId, title, body, and tags
 * @return void Sends JSON response directly
 */
function submitQuestion($conn, $data) {
    // Verify user authentication before allowing question submission
    if (!isset($data->userId) || empty($data->userId)) {
        sendJsonResponse(["success" => false, "message" => "User authentication required"]);
        return;
    }

    // Validate required question fields
    if (empty($data->title) || empty($data->body)) {
        sendJsonResponse(["success" => false, "message" => "Title and body are required"]);
        return;
    }

    try {
        // Prepare SQL statement to insert the new question
        $stmt = $conn->prepare("INSERT INTO questions (user_id, title, body, tags) VALUES (?, ?, ?, ?)");
        if (!$stmt) {
            sendJsonResponse(["success" => false, "message" => "Database error"]);
            return;
        }
        
        // Bind parameters to prevent SQL injection
        $stmt->bind_param("isss", $data->userId, $data->title, $data->body, $data->tags);
        
        // Execute the statement and handle result
        if ($stmt->execute()) {
            $questionId = $stmt->insert_id; // Get ID of newly created question
            sendJsonResponse([
                "success" => true, 
                "message" => "Question submitted successfully",
                "questionId" => $questionId
            ]);
        } else {
            sendJsonResponse(["success" => false, "message" => "Error submitting question"]);
        }
        
        $stmt->close();
    } catch (Exception $e) {
        sendJsonResponse(["success" => false, "message" => "Error processing question: " . $e->getMessage()]);
    }
}

/**
 * Updates an existing question in the database
 * 
 * Ensures only the owner can edit their own questions by verifying ownership
 *
 * @param mysqli $conn Database connection object
 * @param object $data Request data containing questionId, userId, title, body, and tags
 * @return void Sends JSON response directly
 */
function updateQuestion($conn, $data) {
    // Check if required parameters are provided
    if (!isset($data->questionId) || !isset($data->userId) || 
        !isset($data->title) || !isset($data->body) || 
        empty(trim($data->title)) || empty(trim($data->body))) {
        sendJsonResponse(["success" => false, "message" => "Missing required parameters"]);
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
        if (!verifyOwnership($conn, "questions", $questionId, $userId, "Question not found", "You can only edit your own questions")) {
            return;
        }

        // User is authorized, proceed with update
        $updateStmt = prepareStatement($conn, "UPDATE questions SET title = ?, body = ?, tags = ? WHERE id = ?");
        if (!$updateStmt) return;

        $updateStmt->bind_param("sssi", $title, $body, $tags, $questionId);
        
        if ($updateStmt->execute()) {
            // Fetch the updated question with user info
            $updatedQuestion = fetchQuestionWithDetails($conn, $questionId);
            
            sendJsonResponse([
                "success" => true, 
                "message" => "Question successfully updated",
                "question" => $updatedQuestion
            ]);
        } else {
            sendJsonResponse(["success" => false, "message" => "Failed to update question"]);
        }
        
        $updateStmt->close();
    } catch (Exception $e) {
        sendJsonResponse([
            "success" => false, 
            "message" => "Error processing update request: " . $e->getMessage()
        ]);
    }
}

/**
 * Deletes a question from the database
 *
 * Ensures only the owner can delete their own questions
 *
 * @param mysqli $conn Database connection object
 * @param object $data Request data containing questionId and userId
 * @return void Sends JSON response directly
 */
function deleteQuestion($conn, $data) {
    // Check if required parameters are provided
    if (!isset($data->questionId) || !isset($data->userId)) {
        sendJsonResponse(["success" => false, "message" => "Missing required parameters"]);
        return;
    }

    // Convert parameters to integers to ensure type safety
    $questionId = intval($data->questionId);
    $userId = intval($data->userId);

    try {
        // First check if the user is the owner of this question
        if (!verifyOwnership($conn, "questions", $questionId, $userId, "Question not found", "You can only delete your own questions")) {
            return;
        }

        // User is authorized, proceed with deletion
        $deleteStmt = prepareStatement($conn, "DELETE FROM questions WHERE id = ?");
        if (!$deleteStmt) return;

        $deleteStmt->bind_param("i", $questionId);
        
        if ($deleteStmt->execute()) {
            sendJsonResponse(["success" => true, "message" => "Question successfully deleted"]);
        } else {
            sendJsonResponse(["success" => false, "message" => "Failed to delete question"]);
        }
        
        $deleteStmt->close();
    } catch (Exception $e) {
        sendJsonResponse([
            "success" => false, 
            "message" => "Error processing delete request: " . $e->getMessage()
        ]);
    }
}

/**
 * Increments the view count for a question
 *
 * @param mysqli $conn Database connection object
 * @param object $data Request data containing questionId
 * @return void Sends JSON response directly
 */
function incrementViewCount($conn, $data) {
    // Check if question ID is provided
    if (!isset($data->questionId)) {
        sendJsonResponse(["success" => false, "message" => "Question ID is required"]);
        return;
    }
    
    $questionId = intval($data->questionId);
    
    try {
        // Update view count in the database
        $stmt = prepareStatement($conn, "UPDATE questions SET views = views + 1 WHERE id = ?");
        if (!$stmt) return;
        
        $stmt->bind_param("i", $questionId);
        
        if ($stmt->execute()) {
            sendJsonResponse(["success" => true, "message" => "View count incremented successfully"]);
        } else {
            sendJsonResponse(["success" => false, "message" => "Failed to increment view count"]);
        }
    } catch (Exception $e) {
        sendJsonResponse([
            "success" => false, 
            "message" => "Error processing request: " . $e->getMessage()
        ]);
    }
}

//==============================================================================
// ANSWER MANAGEMENT FUNCTIONS
//==============================================================================

/**
 * Retrieves answers for a specific question
 *
 * Returns answers ordered by acceptance status and creation time
 *
 * @param mysqli $conn Database connection object
 * @return void Sends JSON response directly
 */
function getAnswers($conn) {
    // Check if question ID is provided
    if (!isset($_GET['questionId'])) {
        sendJsonResponse(["success" => false, "message" => "Question ID is required"]);
        return;
    }
    
    $questionId = intval($_GET['questionId']);
    
    try {
        // Fetch answers with user information
        $stmt = prepareStatement($conn, 
            "SELECT a.*, u.email as user_email 
             FROM answers a 
             JOIN users u ON a.user_id = u.id 
             WHERE a.question_id = ? 
             ORDER BY a.is_accepted DESC, a.created_at ASC"
        );
        
        if (!$stmt) return;
        
        $stmt->bind_param("i", $questionId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $answers = [];
        $count = 0;
        
        while ($row = $result->fetch_assoc()) {
            $answers[] = $row;
            $count++;
        }
        
        sendJsonResponse([
            "success" => true,
            "count" => $count,
            "answers" => $answers
        ]);
    } catch (Exception $e) {
        sendJsonResponse([
            "success" => false, 
            "message" => "Error retrieving answers: " . $e->getMessage()
        ]);
    }
}

/**
 * Submits a new answer to a question
 *
 * Creates an answer record and updates the answer count for the question
 *
 * @param mysqli $conn Database connection object
 * @param object $data Request data containing questionId, userId, and body
 * @return void Sends JSON response directly
 */
function submitAnswer($conn, $data) {
    // Check if required parameters are provided
    if (!isset($data->questionId) || !isset($data->userId) || !isset($data->body) || trim($data->body) === '') {
        sendJsonResponse(["success" => false, "message" => "Missing required parameters"]);
        return;
    }

    try {
        // First verify the question exists
        $checkStmt = prepareStatement($conn, "SELECT id FROM questions WHERE id = ?");
        if (!$checkStmt) return;
        
        $checkStmt->bind_param("i", $data->questionId);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        
        if ($result->num_rows === 0) {
            sendJsonResponse(["success" => false, "message" => "Question not found"]);
            return;
        }
        
        // Insert the answer
        $stmt = prepareStatement($conn, "INSERT INTO answers (question_id, user_id, body) VALUES (?, ?, ?)");
        if (!$stmt) return;
        
        $stmt->bind_param("iis", $data->questionId, $data->userId, $data->body);
        
        if ($stmt->execute()) {
            $answerId = $stmt->insert_id;
            
            // Update the answer count in the questions table
            $updateStmt = prepareStatement($conn, "UPDATE questions SET answer_count = answer_count + 1 WHERE id = ?");
            if ($updateStmt) {
                $updateStmt->bind_param("i", $data->questionId);
                $updateStmt->execute();
            }
            
            // Fetch the created answer with user info
            $answer = fetchEntityWithUser($conn, "answers", $answerId);
            
            sendJsonResponse([
                "success" => true, 
                "message" => "Answer submitted successfully",
                "answer" => $answer
            ]);
        } else {
            sendJsonResponse(["success" => false, "message" => "Error submitting answer"]);
        }
    } catch (Exception $e) {
        sendJsonResponse([
            "success" => false, 
            "message" => "Error processing request: " . $e->getMessage()
        ]);
    }
}

/**
 * Updates an existing answer
 *
 * Ensures only the owner can edit their own answers
 *
 * @param mysqli $conn Database connection object
 * @param object $data Request data containing answerId, userId, and body
 * @return void Sends JSON response directly
 */
function updateAnswer($conn, $data) {
    // Check if required parameters are provided
    if (!isset($data->answerId) || !isset($data->userId) || !isset($data->body) || trim($data->body) === '') {
        sendJsonResponse(["success" => false, "message" => "Missing required parameters"]);
        return;
    }

    // Convert parameters to integers to ensure type safety
    $answerId = intval($data->answerId);
    $userId = intval($data->userId);
    $body = trim($data->body);

    try {
        // Verify ownership
        if (!verifyOwnership($conn, "answers", $answerId, $userId, "Answer not found", "You can only edit your own answers")) {
            return;
        }

        // Update the answer
        $updateStmt = prepareStatement($conn, "UPDATE answers SET body = ? WHERE id = ?");
        if (!$updateStmt) return;

        $updateStmt->bind_param("si", $body, $answerId);
        
        if ($updateStmt->execute()) {
            // Fetch the updated answer with user info
            $updatedAnswer = fetchEntityWithUser($conn, "answers", $answerId);
            
            sendJsonResponse([
                "success" => true, 
                "message" => "Answer successfully updated",
                "answer" => $updatedAnswer
            ]);
        } else {
            sendJsonResponse(["success" => false, "message" => "Failed to update answer"]);
        }
    } catch (Exception $e) {
        sendJsonResponse([
            "success" => false, 
            "message" => "Error processing update request: " . $e->getMessage()
        ]);
    }
}

/**
 * Deletes an answer from the database
 *
 * Ensures only the owner can delete their own answers and updates
 * the question's answer count
 *
 * @param mysqli $conn Database connection object
 * @param object $data Request data containing answerId and userId
 * @return void Sends JSON response directly
 */
function deleteAnswer($conn, $data) {
    // Check if required parameters are provided
    if (!isset($data->answerId) || !isset($data->userId)) {
        sendJsonResponse(["success" => false, "message" => "Missing required parameters"]);
        return;
    }

    // Convert parameters to integers to ensure type safety
    $answerId = intval($data->answerId);
    $userId = intval($data->userId);

    try {
        // Get question ID before checking ownership
        $questionStmt = prepareStatement($conn, "SELECT question_id FROM answers WHERE id = ?");
        if (!$questionStmt) return;
        
        $questionStmt->bind_param("i", $answerId);
        $questionStmt->execute();
        $result = $questionStmt->get_result();
        
        if ($result->num_rows === 0) {
            sendJsonResponse(["success" => false, "message" => "Answer not found"]);
            return;
        }
        
        $answer = $result->fetch_assoc();
        $questionId = $answer['question_id'];
        
        // Verify ownership
        if (!verifyOwnership($conn, "answers", $answerId, $userId, "Answer not found", "You can only delete your own answers")) {
            return;
        }

        // Delete the answer
        $deleteStmt = prepareStatement($conn, "DELETE FROM answers WHERE id = ?");
        if (!$deleteStmt) return;

        $deleteStmt->bind_param("i", $answerId);
        
        if ($deleteStmt->execute()) {
            // Decrement the answer count for the question
            $updateStmt = prepareStatement($conn, "UPDATE questions SET answer_count = GREATEST(answer_count - 1, 0) WHERE id = ?");
            if ($updateStmt) {
                $updateStmt->bind_param("i", $questionId);
                $updateStmt->execute();
            }
            
            sendJsonResponse(["success" => true, "message" => "Answer successfully deleted"]);
        } else {
            sendJsonResponse(["success" => false, "message" => "Failed to delete answer"]);
        }
    } catch (Exception $e) {
        sendJsonResponse([
            "success" => false, 
            "message" => "Error processing delete request: " . $e->getMessage()
        ]);
    }
}

/**
 * Marks an answer as accepted
 *
 * Only the original question owner can mark an answer as accepted.
 * Unmarks any previously accepted answer for the same question.
 *
 * @param mysqli $conn Database connection object
 * @param object $data Request data containing answerId and userId
 * @return void Sends JSON response directly
 */
function acceptAnswer($conn, $data) {
    // Check if required parameters are provided
    if (!isset($data->answerId) || !isset($data->userId)) {
        sendJsonResponse(["success" => false, "message" => "Missing required parameters"]);
        return;
    }

    // Convert parameters to integers to ensure type safety
    $answerId = intval($data->answerId);
    $userId = intval($data->userId);

    try {
        // Get the question ID from the answer
        $questionStmt = prepareStatement($conn, "SELECT question_id FROM answers WHERE id = ?");
        if (!$questionStmt) return;

        $questionStmt->bind_param("i", $answerId);
        $questionStmt->execute();
        $result = $questionStmt->get_result();

        // Check if answer exists
        if ($result->num_rows === 0) {
            sendJsonResponse(["success" => false, "message" => "Answer not found"]);
            return;
        }

        $answer = $result->fetch_assoc();
        $questionId = $answer['question_id'];
        
        // Verify the user is the question owner
        if (!verifyOwnership($conn, "questions", $questionId, $userId, "Question not found", 
                             "Only the question owner can accept answers")) {
            return;
        }
        
        // Clear any previously accepted answers
        $clearStmt = prepareStatement($conn, "UPDATE answers SET is_accepted = 0 WHERE question_id = ?");
        if ($clearStmt) {
            $clearStmt->bind_param("i", $questionId);
            $clearStmt->execute();
        }
        
        // Mark this answer as accepted
        $acceptStmt = prepareStatement($conn, "UPDATE answers SET is_accepted = 1 WHERE id = ?");
        if (!$acceptStmt) return;
        
        $acceptStmt->bind_param("i", $answerId);
        
        if ($acceptStmt->execute()) {
            // Mark the question as having an accepted answer
            $updateQuestionStmt = prepareStatement($conn, "UPDATE questions SET has_accepted_answer = 1 WHERE id = ?");
            if ($updateQuestionStmt) {
                $updateQuestionStmt->bind_param("i", $questionId);
                $updateQuestionStmt->execute();
            }
            
            // Fetch the updated answer with user info
            $updatedAnswer = fetchEntityWithUser($conn, "answers", $answerId);
            
            sendJsonResponse([
                "success" => true, 
                "message" => "Answer marked as accepted",
                "answer" => $updatedAnswer
            ]);
        } else {
            sendJsonResponse(["success" => false, "message" => "Failed to accept answer"]);
        }
    } catch (Exception $e) {
        sendJsonResponse([
            "success" => false, 
            "message" => "Error processing request: " . $e->getMessage()
        ]);
    }
}

//==============================================================================
// COMMENT MANAGEMENT FUNCTIONS
//==============================================================================

/**
 * Retrieves comments for a specific answer
 * 
 * Fetches all comments for the given answer ID, including the username
 * of the commenter, ordered by creation time.
 * 
 * @param mysqli $conn Database connection object
 * @return void Sends JSON response directly
 */
function getComments($conn) {
    // Check if answer ID is provided
    if (!isset($_GET['answerId'])) {
        sendJsonResponse(["success" => false, "message" => "Answer ID is required"]);
        return;
    }
    
    $answerId = intval($_GET['answerId']);
    
    try {
        // Fetch comments with user information
        $stmt = prepareStatement($conn,
            "SELECT c.*, u.email as user_email 
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.answer_id = ? 
             ORDER BY c.created_at ASC"
        );
        
        if (!$stmt) return;
        
        $stmt->bind_param("i", $answerId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $comments = [];
        $count = 0;
        
        while ($row = $result->fetch_assoc()) {
            $comments[] = $row;
            $count++;
        }
        
        sendJsonResponse([
            "success" => true,
            "count" => $count,
            "comments" => $comments
        ]);
    } catch (Exception $e) {
        sendJsonResponse([
            "success" => false, 
            "message" => "Error retrieving comments: " . $e->getMessage()
        ]);
    }
}

/**
 * Adds a comment to an answer
 *
 * @param mysqli $conn Database connection object
 * @param object $data Request data containing userId, answerId, and body
 * @return void Sends JSON response directly
 */
function addComment($conn, $data) {
    // Check if required parameters are provided
    if (!isset($data->userId) || !isset($data->answerId) || 
        !isset($data->body) || empty(trim($data->body))) {
        sendJsonResponse(["success" => false, "message" => "Missing required parameters"]);
        return;
    }

    // Convert parameters to ensure type safety
    $userId = intval($data->userId);
    $answerId = intval($data->answerId);
    $body = trim($data->body);

    try {
        // Verify that the answer exists
        $checkStmt = prepareStatement($conn, "SELECT id FROM answers WHERE id = ?");
        if (!$checkStmt) return;
        
        $checkStmt->bind_param("i", $answerId);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        
        if ($result->num_rows === 0) {
            sendJsonResponse(["success" => false, "message" => "Answer not found"]);
            return;
        }

        // Insert the comment
        $stmt = prepareStatement($conn, "INSERT INTO comments (user_id, answer_id, body) VALUES (?, ?, ?)");
        if (!$stmt) return;
        
        $stmt->bind_param("iis", $userId, $answerId, $body);
        
        if ($stmt->execute()) {
            $commentId = $stmt->insert_id;
            
            // Fetch the created comment with user info
            $comment = fetchEntityWithUser($conn, "comments", $commentId);
            
            sendJsonResponse([
                "success" => true, 
                "message" => "Comment added successfully",
                "comment" => $comment
            ]);
        } else {
            sendJsonResponse(["success" => false, "message" => "Error adding comment"]);
        }
    } catch (Exception $e) {
        sendJsonResponse([
            "success" => false, 
            "message" => "Error processing request: " . $e->getMessage()
        ]);
    }
}

/**
 * Deletes a comment from the database
 *
 * Ensures only the author can delete their own comments
 *
 * @param mysqli $conn Database connection object
 * @param object $data Request data containing commentId and userId
 * @return void Sends JSON response directly
 */
function deleteComment($conn, $data) {
    // Check if required parameters are provided
    if (!isset($data->commentId) || !isset($data->userId)) {
        sendJsonResponse(["success" => false, "message" => "Missing required parameters"]);
        return;
    }

    // Convert parameters to integers for type safety
    $commentId = intval($data->commentId);
    $userId = intval($data->userId);

    try {
        // Verify ownership
        if (!verifyOwnership($conn, "comments", $commentId, $userId, "Comment not found", "You can only delete your own comments")) {
            return;
        }

        // Delete the comment
        $deleteStmt = prepareStatement($conn, "DELETE FROM comments WHERE id = ?");
        if (!$deleteStmt) return;
        
        $deleteStmt->bind_param("i", $commentId);
        
        if ($deleteStmt->execute()) {
            sendJsonResponse(["success" => true, "message" => "Comment deleted successfully"]);
        } else {
            sendJsonResponse(["success" => false, "message" => "Error deleting comment"]);
        }
    } catch (Exception $e) {
        sendJsonResponse([
            "success" => false, 
            "message" => "Error processing request: " . $e->getMessage()
        ]);
    }
}
?>
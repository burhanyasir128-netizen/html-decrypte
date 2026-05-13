<?php
// ==========================================
// ZERO-KNOWLEDGE KEY MANAGEMENT SERVER (API)
// ==========================================

// 1. CORS Headers (Very Important for Fetch API)
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: POST, OPTIONS"); // OPTIONS allow karna zaroori hai
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// 2. Handle Preflight (OPTIONS) Request
// Jab browser check karne aaye, to usay FORAN success (200 OK) wapas bhej do
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json");

// 3. Apki Asli Master Key (Ye sirf server ko pata hai)
$REAL_MASTER_KEY = "AdminMaster786_UltraSecure";

// Only allow POST requests for actual data
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(["status" => "error", "message" => "Invalid Request Method"]));
}

$rawPostData = file_get_contents("php://input");
$requestData = json_decode($rawPostData, true);

if (isset($requestData['encrypted_auth_vault']) && isset($requestData['encrypted_master_vault']) && isset($requestData['user_key'])) {
    
    $vA = $requestData['encrypted_auth_vault'];
    $vM = $requestData['encrypted_master_vault'];
    $userKey = $requestData['user_key'];
    
    $decryptedCode = null;
    
    // First, try to decrypt with the user's provided key
    try {
        $decryptedCode = cryptoJsAesDecrypt($vA, $userKey);
    } catch (Exception $e) {}

    // If User Key fails, try to decrypt with the Server's Master Key
    if (!$decryptedCode) {
        try {
            $decryptedCode = cryptoJsAesDecrypt($vM, $REAL_MASTER_KEY);
        } catch (Exception $e) {}
    }

    if ($decryptedCode) {
        echo json_encode([
            "status" => "success",
            "decrypted_code" => base64_encode($decryptedCode) 
        ]);
        exit;
    } else {
        echo json_encode(["status" => "error", "message" => "Access Denied: Invalid Key."]);
        exit;
    }
}

echo json_encode(["status" => "error", "message" => "Invalid Payload Parameters"]);

// Helper Function: Decrypts CryptoJS AES string in PHP
function cryptoJsAesDecrypt($passphrase, $jsonString){
    $jsondata = json_decode($jsonString, true);
    if(!$jsondata) return null;
    try {
        $salt = hex2bin($jsondata["s"]);
        $ct = base64_decode($jsondata["ct"]);
        $iv  = hex2bin($jsondata["iv"]);
        $concatedPassphrase = $passphrase.$salt;
        $md5 = array();
        $md5[0] = md5($concatedPassphrase, true);
        $result = $md5[0];
        for ($i = 1; $i < 3; $i++) {
            $md5[$i] = md5($md5[$i - 1].$concatedPassphrase, true);
            $result .= $md5[$i];
        }
        $key = substr($result, 0, 32);
        $data = openssl_decrypt($ct, 'aes-256-cbc', $key, true, $iv);
        return json_decode($data, true);
    } catch (Exception $e) { return null; }
}
?>

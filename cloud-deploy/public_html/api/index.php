<?php
/**
 * API Router - Guia Canindé
 * Ponto de entrada único da API PHP
 *
 * Todas as requisições para /api/* chegam aqui via .htaccess
 */

ob_start();

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/jwt.php';

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

$allowedOrigins = array_filter(explode(',', $_ENV['ALLOWED_ORIGINS'] ?? '*'));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array('*', $allowedOrigins, true) || in_array($origin, $allowedOrigins, true)) {
    $corsOrigin = in_array('*', $allowedOrigins, true) ? '*' : $origin;
    header("Access-Control-Allow-Origin: $corsOrigin");
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 3600');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = preg_replace('#^/api#', '', $uri);
$uri = rtrim($uri, '/') ?: '/';

$segments = explode('/', trim($uri, '/'));
$resource = $segments[0] ?? '';
$id = $segments[1] ?? null;
$sub = $segments[2] ?? null;

try {
    switch ($resource) {
        case 'health':
        case '':
            respond(200, ['status' => 'ok', 'version' => '1.1.0', 'service' => 'Guia Canindé API']);

        case 'auth':
            require_once __DIR__ . '/controllers/AuthController.php';
            match (true) {
                $method === 'POST' && $id === 'admin' && $sub === 'login' => adminLogin(),
                $method === 'POST' && $id === 'company' && $sub === 'login' => companyLogin(),
                $method === 'GET' && $id === 'me' => authMe(),
                $method === 'POST' && $id === 'change-password' => changePassword(),
                default => respondError(404, 'Rota não encontrada'),
            };
            break;

        case 'settings':
            require_once __DIR__ . '/controllers/SettingsController.php';
            match (true) {
                $method === 'GET' && !$id => getPublicSettings(),
                $method === 'GET' && $id === 'admin' => getAdminSettings(),
                $method === 'PUT' && !$id => updateSettings(),
                default => respondError(404, 'Rota não encontrada'),
            };
            break;

        case 'companies':
            require_once __DIR__ . '/controllers/CompanyController.php';

            if ($id === 'upload-logo' && $method === 'POST') {
                uploadLogo();
                break;
            }

            match (true) {
                $method === 'GET' && !$id => getCompanies(),
                $method === 'GET' && $id && !$sub => getCompany($id),
                $method === 'POST' && !$id => createCompany(),
                $method === 'PUT' && $id && !$sub => updateCompany($id),
                $method === 'DELETE' && $id && !$sub => deleteCompany($id),
                $method === 'PATCH' && $id && $sub === 'approve' => toggleApprove($id),
                default => respondError(404, 'Rota não encontrada'),
            };
            break;

        case 'categories':
            require_once __DIR__ . '/controllers/CategoryController.php';
            match (true) {
                $method === 'GET' && !$id => getCategories(),
                $method === 'GET' && $id => getCategory($id),
                $method === 'POST' && !$id => createCategory(),
                $method === 'PUT' && $id => updateCategory($id),
                $method === 'DELETE' && $id => deleteCategory($id),
                default => respondError(404, 'Rota não encontrada'),
            };
            break;

        case 'ratings':
            require_once __DIR__ . '/controllers/RatingController.php';
            match (true) {
                $method === 'GET' && $id === 'top-rated' => getTopRatedCompanies(),
                $method === 'POST' && !$id => createRating(),
                $method === 'GET' && $id => getCompanyRatings($id),
                default => respondError(404, 'Rota não encontrada'),
            };
            break;

        case 'dashboard':
            require_once __DIR__ . '/controllers/DashboardController.php';
            if ($method === 'GET') {
                getDashboard();
            }
            respondError(405, 'Método não permitido');
            break;

        default:
            respondError(404, 'Recurso não encontrado');
    }
} catch (PDOException $e) {
    error_log('[API PDO ERROR] ' . $e->getMessage());
    respondError(500, 'Erro interno do servidor');
} catch (Throwable $e) {
    error_log('[API ERROR] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    respondError(500, 'Erro interno do servidor');
}

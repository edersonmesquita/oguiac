<?php
/**
 * Controller de Autenticação
 * Guia Canindé
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

function configuredAdmin(): ?array {
    $username = trim((string) ($_ENV['ADMIN_USERNAME'] ?? ''));
    $password = (string) ($_ENV['ADMIN_PASSWORD'] ?? '');

    if ($username === '' || $password === '') {
        return null;
    }

    return [
        'id' => 'env-admin',
        'username' => $username,
        'name' => $_ENV['ADMIN_NAME'] ?? 'Administrador',
        'password' => $password,
    ];
}

function adminLogin(): void {
    $body = getJsonBody();

    if (empty($body['username']) || empty($body['password'])) {
        respondError(400, 'Username e senha obrigatórios');
    }

    $username = sanitize($body['username']);
    $password = (string) $body['password'];
    $admin = null;

    try {
        $db = getDB();
        $stmt = $db->prepare("SELECT * FROM admins WHERE username = ? LIMIT 1");
        $stmt->execute([$username]);
        $admin = $stmt->fetch() ?: null;
    } catch (Throwable $e) {
        error_log('[ADMIN LOGIN FALLBACK] ' . $e->getMessage());
    }

    if ($admin) {
        $hash = $admin['password'] ?? '$2y$10$invalidhashtopreventtiming0000000';
        if (password_verify($password, $hash)) {
            $token = jwtEncode([
                'sub' => $admin['id'],
                'name' => $admin['name'],
                'role' => 'admin',
            ]);

            respond(200, [
                'token' => $token,
                'user' => [
                    'id' => $admin['id'],
                    'name' => $admin['name'],
                    'role' => 'admin',
                ],
            ]);
        }
    }

    $envAdmin = configuredAdmin();
    if ($envAdmin && hash_equals($envAdmin['username'], $username) && hash_equals($envAdmin['password'], $password)) {
        $token = jwtEncode([
            'sub' => $envAdmin['id'],
            'name' => $envAdmin['name'],
            'role' => 'admin',
        ]);

        respond(200, [
            'token' => $token,
            'user' => [
                'id' => $envAdmin['id'],
                'name' => $envAdmin['name'],
                'role' => 'admin',
            ],
        ]);
    }

    respondError(401, 'Credenciais inválidas');
}

function companyLogin(): void {
    $body = getJsonBody();

    if (empty($body['email']) || empty($body['password'])) {
        respondError(400, 'Email e senha obrigatórios');
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM companies WHERE email = ? LIMIT 1");
    $stmt->execute([sanitize($body['email'])]);
    $company = $stmt->fetch();

    $hash = $company['password'] ?? '$2y$10$invalidhashtopreventtiming0000000';
    if (!$company || !password_verify($body['password'], $hash)) {
        respondError(401, 'Credenciais inválidas');
    }

    if (!$company['approved']) {
        respondError(403, 'Empresa bloqueada. Entre em contato com o suporte.');
    }

    $token = jwtEncode([
        'sub' => $company['id'],
        'name' => $company['name'],
        'role' => 'company',
        'companyId' => $company['id'],
    ]);

    respond(200, [
        'token' => $token,
        'company' => [
            'id' => $company['id'],
            'name' => $company['name'],
            'role' => 'company',
        ],
    ]);
}

function authMe(): void {
    $payload = requireAuth();
    respond(200, $payload);
}

function changePassword(): void {
    $payload = requireCompany();
    $body = getJsonBody();

    if (empty($body['currentPassword']) || empty($body['newPassword'])) {
        respondError(400, 'Senhas atual e nova são obrigatórias');
    }

    if (strlen($body['newPassword']) < 6) {
        respondError(400, 'Nova senha deve ter ao menos 6 caracteres');
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT password FROM companies WHERE id = ?");
    $stmt->execute([$payload['companyId']]);
    $company = $stmt->fetch();

    if (!$company || !password_verify($body['currentPassword'], $company['password'])) {
        respondError(401, 'Senha atual incorreta');
    }

    $newHash = password_hash($body['newPassword'], PASSWORD_BCRYPT);
    $db->prepare("UPDATE companies SET password = ?, updatedAt = NOW() WHERE id = ?")
        ->execute([$newHash, $payload['companyId']]);

    respond(200, ['message' => 'Senha alterada com sucesso']);
}

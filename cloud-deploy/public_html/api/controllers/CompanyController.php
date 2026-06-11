<?php
/**
 * Controller de Empresas
 * Guia Canindé
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

function getCompanies(): void {
    $db = getDB();
    $search = sanitize($_GET['search'] ?? '');
    $categoryId = sanitize($_GET['category'] ?? '');
    $approved = $_GET['approved'] ?? null;
    $sort = sanitize($_GET['sort'] ?? 'rating');
    $page = max(1, (int) ($_GET['page'] ?? 1));
    $limit = min(50, max(1, (int) ($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;

    $where = ['1=1'];
    $params = [];

    if ($approved === null) {
        $where[] = 'c.approved = 1';
    } elseif ($approved !== '') {
        $where[] = 'c.approved = ?';
        $params[] = (int) $approved;
    }

    if ($search) {
        $where[] = '(c.name LIKE ? OR c.address LIKE ? OR c.description LIKE ?)';
        $like = "%$search%";
        $params = array_merge($params, [$like, $like, $like]);
    }

    if ($categoryId) {
        $where[] = 'c.categoryId = ?';
        $params[] = $categoryId;
    }

    $whereStr = implode(' AND ', $where);
    $countStmt = $db->prepare("SELECT COUNT(*) FROM companies c WHERE $whereStr");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    $orderBy = $sort === 'recent'
        ? 'c.createdAt DESC'
        : 'COALESCE(AVG(r.stars), 0) DESC, COUNT(r.id) DESC, c.name ASC';

    $stmt = $db->prepare("
        SELECT
            c.*,
            cat.name AS categoryName,
            AVG(r.stars) AS avgRating,
            COUNT(r.id)  AS totalRatings
        FROM companies c
        LEFT JOIN categories cat ON cat.id = c.categoryId
        LEFT JOIN ratings r ON r.companyId = c.id
        WHERE $whereStr
        GROUP BY c.id
        ORDER BY $orderBy
        LIMIT ? OFFSET ?
    ");
    $stmt->execute(array_merge($params, [$limit, $offset]));
    $companies = array_map('formatCompany', $stmt->fetchAll());

    respond(200, [
        'data' => $companies,
        'meta' => [
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'pages' => (int) ceil($total / $limit),
        ],
    ]);
}

function getCompany(string $id): void {
    $db = getDB();
    $stmt = $db->prepare("
        SELECT
            c.*,
            cat.name AS categoryName,
            AVG(r.stars) AS avgRating,
            COUNT(r.id) AS totalRatings
        FROM companies c
        LEFT JOIN categories cat ON cat.id = c.categoryId
        LEFT JOIN ratings r ON r.companyId = c.id
        WHERE c.id = ?
        GROUP BY c.id
    ");
    $stmt->execute([$id]);
    $company = $stmt->fetch();

    if (!$company) {
        respondError(404, 'Empresa não encontrada');
    }

    unset($company['password']);
    respond(200, formatCompany($company));
}

function createCompany(): void {
    $body = getJsonBody();
    foreach (['name', 'whatsapp', 'address', 'categoryId'] as $field) {
        if (empty($body[$field])) {
            respondError(400, "Campo obrigatório ausente: $field");
        }
    }

    $db = getDB();
    $catCheck = $db->prepare("SELECT id FROM categories WHERE id = ?");
    $catCheck->execute([$body['categoryId']]);
    if (!$catCheck->fetch()) {
        respondError(400, 'Categoria inválida');
    }

    $id = generateUuid();
    $password = !empty($body['password']) ? password_hash($body['password'], PASSWORD_BCRYPT) : null;

    $stmt = $db->prepare("
        INSERT INTO companies
            (id, name, whatsapp, address, logo, instagram, facebook, youtube,
             website, email, password, description, categoryId, approved, createdAt, updatedAt)
        VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    ");

    $stmt->execute([
        $id,
        sanitize($body['name']),
        sanitize($body['whatsapp']),
        sanitize($body['address']),
        $body['logo'] ?? null,
        $body['instagram'] ?? null,
        $body['facebook'] ?? null,
        $body['youtube'] ?? null,
        $body['website'] ?? null,
        $body['email'] ?? null,
        $password,
        isset($body['description']) ? substr(sanitize($body['description']), 0, 300) : null,
        $body['categoryId'],
    ]);

    respond(201, ['id' => $id, 'message' => 'Empresa cadastrada com sucesso!']);
}

function updateCompany(string $id): void {
    $payload = requireAuth();
    $db = getDB();

    if ($payload['role'] === 'company' && $payload['companyId'] !== $id) {
        respondError(403, 'Sem permissão para editar esta empresa');
    }

    $body = getJsonBody();
    if (empty($body)) {
        respondError(400, 'Nenhum dado enviado');
    }

    $allowed = ['name', 'whatsapp', 'address', 'instagram', 'facebook', 'youtube', 'website', 'email', 'description', 'categoryId', 'logo'];
    $sets = [];
    $params = [];

    foreach ($allowed as $field) {
        if (array_key_exists($field, $body)) {
            $sets[] = "$field = ?";
            $params[] = $field === 'description'
                ? substr(sanitize((string) $body[$field]), 0, 300)
                : sanitize((string) ($body[$field] ?? ''));
        }
    }

    if (empty($sets)) {
        respondError(400, 'Nenhum campo válido para atualizar');
    }

    $params[] = $id;
    $db->prepare("UPDATE companies SET " . implode(', ', $sets) . ", updatedAt = NOW() WHERE id = ?")->execute($params);

    respond(200, ['message' => 'Empresa atualizada com sucesso']);
}

function deleteCompany(string $id): void {
    requireAdmin();
    $db = getDB();
    $stmt = $db->prepare("DELETE FROM companies WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        respondError(404, 'Empresa não encontrada');
    }

    respond(200, ['message' => 'Empresa removida']);
}

function toggleApprove(string $id): void {
    requireAdmin();
    $db = getDB();
    $body = getJsonBody();

    if (!isset($body['approved'])) {
        respondError(400, 'Campo approved obrigatório');
    }

    $db->prepare("UPDATE companies SET approved = ?, updatedAt = NOW() WHERE id = ?")->execute([(int) (bool) $body['approved'], $id]);
    respond(200, ['message' => 'Status atualizado']);
}

function uploadLogo(): void {
    if (empty($_FILES['logo'])) {
        respondError(400, 'Nenhum arquivo enviado');
    }

    $file = $_FILES['logo'];
    $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!in_array($file['type'], $allowed, true)) {
        respondError(400, 'Tipo de arquivo não permitido. Use JPG, PNG ou WebP');
    }

    if ($file['size'] > MAX_UPLOAD_SIZE) {
        respondError(400, 'Arquivo muito grande. Máximo 2MB');
    }

    if (!is_dir(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0755, true);
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = generateUuid() . '.' . strtolower($ext);
    $dest = UPLOAD_DIR . $filename;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        respondError(500, 'Erro ao salvar arquivo');
    }

    respond(200, ['url' => UPLOAD_URL . $filename, 'filename' => $filename]);
}

<?php
/**
 * Controller de Avaliacoes
 * Guia Caninde
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

function ratingSummary(PDO $db, string $companyId): array {
    $stmt = $db->prepare("
        SELECT
            COALESCE(AVG(stars), 0) AS avgRating,
            COUNT(id) AS totalRatings
        FROM ratings
        WHERE companyId = ?
    ");
    $stmt->execute([$companyId]);
    $summary = $stmt->fetch() ?: ['avgRating' => 0, 'totalRatings' => 0];

    return [
        'avgRating' => round((float) ($summary['avgRating'] ?? 0), 1),
        'totalRatings' => (int) ($summary['totalRatings'] ?? 0),
    ];
}

function createRating(): void {
    $body = getJsonBody();
    $companyId = sanitize($body['companyId'] ?? '');
    $stars = (int) ($body['stars'] ?? 0);

    if ($companyId === '' || $stars < 1 || $stars > 5) {
        respondError(400, 'Informe a empresa e uma nota entre 1 e 5 estrelas');
    }

    $db = getDB();
    $companyStmt = $db->prepare("SELECT id FROM companies WHERE id = ? AND approved = 1 LIMIT 1");
    $companyStmt->execute([$companyId]);

    if (!$companyStmt->fetch()) {
        respondError(404, 'Empresa nao encontrada para avaliacao');
    }

    $userId = null;
    $id = generateUuid();

    $stmt = $db->prepare("
        INSERT INTO ratings (id, stars, companyId, userId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, NOW(), NOW())
    ");
    $stmt->execute([$id, $stars, $companyId, $userId]);

    respond(201, [
        'id' => $id,
        'message' => 'Avaliacao registrada com sucesso',
        'summary' => ratingSummary($db, $companyId),
    ]);
}

function getCompanyRatings(string $companyId): void {
    if ($companyId === 'top-rated') {
        getTopRatedCompanies();
        return;
    }

    $db = getDB();
    $companyStmt = $db->prepare("SELECT id FROM companies WHERE id = ? LIMIT 1");
    $companyStmt->execute([$companyId]);

    if (!$companyStmt->fetch()) {
        respondError(404, 'Empresa nao encontrada');
    }

    $stmt = $db->prepare("
        SELECT id, stars, userId, createdAt
        FROM ratings
        WHERE companyId = ?
        ORDER BY createdAt DESC
        LIMIT 50
    ");
    $stmt->execute([$companyId]);
    $ratings = array_map(static function (array $rating): array {
        return [
            'id' => $rating['id'],
            'stars' => (int) $rating['stars'],
            'userId' => $rating['userId'] ?: null,
            'createdAt' => $rating['createdAt'],
        ];
    }, $stmt->fetchAll() ?: []);

    respond(200, [
        'ratings' => $ratings,
        'summary' => ratingSummary($db, $companyId),
    ]);
}

function getTopRatedCompanies(): void {
    $db = getDB();
    $limit = min(20, max(1, (int) ($_GET['limit'] ?? 5)));

    $stmt = $db->prepare("
        SELECT
            c.id,
            c.name,
            c.logo,
            cat.name AS categoryName,
            AVG(r.stars) AS avgRating,
            COUNT(r.id) AS totalRatings
        FROM companies c
        INNER JOIN ratings r ON r.companyId = c.id
        LEFT JOIN categories cat ON cat.id = c.categoryId
        WHERE c.approved = 1
        GROUP BY c.id
        ORDER BY AVG(r.stars) DESC, COUNT(r.id) DESC, c.name ASC
        LIMIT ?
    ");
    $stmt->execute([$limit]);
    $rows = $stmt->fetchAll() ?: [];

    $ranking = array_map(static function (array $row, int $index): array {
        return [
            'position' => $index + 1,
            'id' => $row['id'],
            'name' => $row['name'],
            'logo' => $row['logo'],
            'categoryName' => $row['categoryName'] ?? null,
            'avgRating' => round((float) ($row['avgRating'] ?? 0), 1),
            'totalRatings' => (int) ($row['totalRatings'] ?? 0),
        ];
    }, $rows, array_keys($rows));

    respond(200, ['data' => $ranking]);
}

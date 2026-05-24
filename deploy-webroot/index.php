<?php

declare(strict_types=1);

require_once __DIR__ . '/src/helpers/env.php';
require_once __DIR__ . '/src/helpers/Jwt.php';
require_once __DIR__ . '/src/core/Database.php';
require_once __DIR__ . '/src/core/JsonResponse.php';

env_load(__DIR__ . '/.env');

$origin = env_get('CORS_ORIGIN', 'http://localhost:3000');
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$jwtSecret = env_get('JWT_SECRET', 'change-me-super-secret');
$pdo = null;

function db(): PDO {
    global $pdo;
    if ($pdo instanceof PDO) return $pdo;
    $pdo = Database::connection();
    return $pdo;
}

function auth_user(string $secret): ?array {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($auth, 'Bearer ')) return null;
    $token = substr($auth, 7);
    return Jwt::decode($token, $secret);
}

function require_admin(string $secret): array {
    $user = auth_user($secret);
    if (!$user) JsonResponse::send(['message' => 'Token não fornecido ou inválido'], 401);
    if (($user['role'] ?? '') !== 'admin') JsonResponse::send(['message' => 'Acesso negado'], 403);
    return $user;
}

function uuidv4(): string {
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function h(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function page_shell(string $title, string $body): void {
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' . h($title) . '</title><style>
    body{font-family:Inter,Arial,sans-serif;background:linear-gradient(135deg,#eef2ff,#fff);margin:0;color:#111827}
    .wrap{max-width:1150px;margin:0 auto;padding:24px}
    .top{background:#fff;border-bottom:1px solid #e5e7eb;position:sticky;top:0;z-index:30}
    .nav{display:flex;gap:14px;align-items:center;justify-content:space-between;padding:12px 20px;max-width:1150px;margin:0 auto}
    .brand{font-weight:800;font-size:22px;background:linear-gradient(90deg,#7c3aed,#16a34a);-webkit-background-clip:text;background-clip:text;color:transparent}
    .hero{display:grid;grid-template-columns:1.2fr 1fr;gap:28px;align-items:center;margin-top:18px}
    .hero h1{font-size:46px;line-height:1.05;margin:0 0 10px;background:linear-gradient(90deg,#7c3aed,#16a34a);-webkit-background-clip:text;background-clip:text;color:transparent}
    .hero p{font-size:20px;color:#4b5563}
    .hero-actions{display:flex;gap:12px;flex-wrap:wrap}
    .btn{display:inline-flex;align-items:center;gap:8px;padding:13px 16px;border-radius:12px;color:#fff;font-weight:700;text-decoration:none}
    .btn1{background:linear-gradient(90deg,#7c3aed,#6d28d9)} .btn2{background:linear-gradient(90deg,#16a34a,#15803d)}
    .hero-logo{background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:14px;box-shadow:0 12px 30px rgba(0,0,0,.08)}
    .hero-logo img{width:100%;height:270px;object-fit:contain}
    .section-title{font-size:28px;margin:28px 0 12px}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
    .card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:14px;box-shadow:0 3px 8px rgba(0,0,0,.04)}
    .muted{color:#6b7280;font-size:14px}
    .search{display:flex;gap:8px;margin:14px 0}
    input{padding:11px 12px;border:1px solid #d1d5db;border-radius:10px;flex:1}
    button{padding:10px 14px;border:0;border-radius:10px;background:#16a34a;color:#fff;cursor:pointer}
    a{text-decoration:none;color:#1d4ed8}
    .company-head{background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden}
    .company-banner{height:180px;background:linear-gradient(90deg,#7c3aed,#16a34a)}
    .company-main{padding:18px}
    .logo-xl{width:128px;height:128px;border-radius:16px;object-fit:cover;border:4px solid #fff;margin-top:-70px;background:#fff}
    .wa{display:inline-block;padding:12px 18px;border-radius:10px;background:#16a34a;color:#fff;font-weight:700}
    @media (max-width:900px){.hero{grid-template-columns:1fr}.hero h1{font-size:34px}}
    </style></head><body><div class="top"><div class="nav"><div class="brand">Guia Canindé</div><div><a href="/">Início</a> | <a href="/buscar">Buscar</a></div></div></div><div class="wrap">' . $body . '</div></body></html>';
    exit;
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
$base = rtrim((string)env_get('APP_BASE_PATH', ''), '/');
$path = ($base !== '' && str_starts_with($uri, $base)) ? substr($uri, strlen($base)) : $uri;
$path = $path === '' ? '/' : $path;
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' && $path === '/') {
    $pdo = db();
    $cats = $pdo->query('SELECT id,name FROM categories ORDER BY name LIMIT 12')->fetchAll();
    $companies = $pdo->query('SELECT id,name,address,logo FROM companies WHERE approved = 1 ORDER BY createdAt DESC LIMIT 12')->fetchAll();
    $body = '<section class="hero"><div><h1>Encontre tudo em Canindé</h1><p>Conecte-se diretamente com empresas e profissionais da sua cidade. Rápido, fácil e gratuito.</p><div class="hero-actions"><a class="btn btn1" href="/buscar">O que está buscando?</a><a class="btn btn2" href="/cadastrar">Cadastrar Meu Negócio</a></div></div><div class="hero-logo"><img src="/LOGO-BG.png" onerror="this.src=\'/ICONETESTE.png\'" alt="Guia Canindé"></div></section><form class="search" action="/buscar" method="get"><input name="q" placeholder="Buscar empresa..."><button>Buscar</button></form>';
    $body .= '<h2>Categorias</h2><div class="grid">';
    foreach ($cats as $c) $body .= '<div class="card"><a href="/categorias/' . h((string)$c['id']) . '">' . h((string)$c['name']) . '</a></div>';
    $body .= '</div><h2 class="section-title">Empresas recentes</h2><div class="grid">';
    foreach ($companies as $c) {
        $logo = trim((string)($c['logo'] ?? ''));
        $img = $logo !== '' ? '<img src="' . h($logo) . '" style="width:56px;height:56px;object-fit:cover;border-radius:8px;border:1px solid #ddd">' : '';
        $body .= '<div class="card">' . $img . '<div><a href="/empresas/' . h((string)$c['id']) . '">' . h((string)$c['name']) . '</a></div><div class="muted">' . h((string)($c['address'] ?? '')) . '</div></div>';
    }
    $body .= '</div>';
    page_shell('Guia Canindé', $body);
}

if ($method === 'GET' && $path === '/buscar') {
    $q = trim((string)($_GET['q'] ?? ''));
    $pdo = db();
    if ($q === '') page_shell('Buscar', '<h1>Buscar empresas</h1><form class="search" action="/buscar" method="get"><input name="q" placeholder="Digite o nome da empresa"><button>Buscar</button></form>');
    $stmt = $pdo->prepare('SELECT id,name,address,whatsapp FROM companies WHERE approved = 1 AND name LIKE :q ORDER BY name');
    $stmt->execute([':q' => '%' . $q . '%']);
    $rows = $stmt->fetchAll();
    $body = '<h1>Resultado para: ' . h($q) . '</h1><form class="search" action="/buscar" method="get"><input name="q" value="' . h($q) . '"><button>Buscar</button></form><div class="grid">';
    foreach ($rows as $r) $body .= '<div class="card"><a href="/empresas/' . h((string)$r['id']) . '">' . h((string)$r['name']) . '</a><div class="muted">' . h((string)($r['address'] ?? '')) . '</div><div class="muted">' . h((string)($r['whatsapp'] ?? '')) . '</div></div>';
    $body .= '</div>';
    page_shell('Buscar', $body);
}

if ($method === 'GET' && preg_match('#^/categorias/([a-f0-9\-]+)$#i', $path, $m)) {
    $pdo = db();
    $catStmt = $pdo->prepare('SELECT id,name FROM categories WHERE id = :id');
    $catStmt->execute([':id' => $m[1]]);
    $cat = $catStmt->fetch();
    if (!$cat) page_shell('Categoria', '<h1>Categoria não encontrada</h1>');
    $stmt = $pdo->prepare('SELECT id,name,address FROM companies WHERE approved = 1 AND categoryId = :id ORDER BY name');
    $stmt->execute([':id' => $m[1]]);
    $rows = $stmt->fetchAll();
    $body = '<h1>Categoria: ' . h((string)$cat['name']) . '</h1><div class="grid">';
    foreach ($rows as $r) $body .= '<div class="card"><a href="/empresas/' . h((string)$r['id']) . '">' . h((string)$r['name']) . '</a><div class="muted">' . h((string)($r['address'] ?? '')) . '</div></div>';
    $body .= '</div>';
    page_shell((string)$cat['name'], $body);
}

if ($method === 'GET' && preg_match('#^/empresas/(.+)$#i', $path, $m)) {
    $raw = (string)$m[1];
    $id = preg_match('/([a-f0-9]{8}-[a-f0-9\\-]{27})$/i', $raw, $mm) ? $mm[1] : $raw;
    $pdo = db();
    $stmt = $pdo->prepare('SELECT c.*, cat.name as category_name FROM companies c LEFT JOIN categories cat ON cat.id = c.categoryId WHERE c.id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $r = $stmt->fetch();
    if (!$r) page_shell('Empresa', '<h1>Empresa não encontrada</h1>');
    $wa = preg_replace('/\D+/', '', (string)($r['whatsapp'] ?? ''));
    $waLink = $wa !== '' ? 'https://wa.me/55' . $wa : '#';
    $logo = !empty($r['logo']) ? h((string)$r['logo']) : '/ICONETESTE.png';
    $body = '<div class="company-head"><div class="company-banner"></div><div class="company-main"><img class="logo-xl" src="' . $logo . '" onerror="this.src=\'/ICONETESTE.png\'"><h1 style="margin:10px 0 0">' . h((string)$r['name']) . '</h1><p class="muted">' . h((string)($r['category_name'] ?? '')) . '</p><p><strong>Endereço:</strong> ' . h((string)($r['address'] ?? '')) . '</p><p>' . h((string)($r['description'] ?? '')) . '</p>';
    if ($wa !== '') $body .= '<p><a class="wa" href="' . h($waLink) . '" target="_blank">WhatsApp</a></p>';
    $body .= '</div></div>';
    page_shell((string)$r['name'], $body);
}

if ($path === '/health') JsonResponse::send(['status' => 'ok', 'env' => env_get('APP_ENV', 'local')]);

if ($method === 'POST' && $path === '/api/admin/login') {
    $body = JsonResponse::body();
    $username = $body['username'] ?? '';
    $password = $body['password'] ?? '';

    if ($username !== env_get('ADMIN_USERNAME', 'admin') || $password !== env_get('ADMIN_PASSWORD', '')) {
        JsonResponse::send(['message' => 'Credenciais inválidas'], 401);
    }

    $payload = [
        'id' => '1',
        'role' => 'admin',
        'iat' => time(),
        'exp' => time() + 86400,
    ];
    JsonResponse::send(['token' => Jwt::encode($payload, $jwtSecret)]);
}

if ($method === 'GET' && $path === '/api/admin/verify') {
    require_admin($jwtSecret);
    JsonResponse::send(['valid' => true]);
}

if ($method === 'GET' && $path === '/api/admin/stats') {
    require_admin($jwtSecret);
    $pdo = db();
    $totalEmpresas = (int)$pdo->query('SELECT COUNT(*) FROM companies')->fetchColumn();
    $totalCategorias = (int)$pdo->query('SELECT COUNT(*) FROM categories')->fetchColumn();
    $empresasLiberadas = (int)$pdo->query('SELECT COUNT(*) FROM companies WHERE approved = 1')->fetchColumn();
    $empresasBloqueadas = (int)$pdo->query('SELECT COUNT(*) FROM companies WHERE approved = 0')->fetchColumn();
    JsonResponse::send(compact('totalEmpresas', 'totalCategorias', 'empresasLiberadas', 'empresasBloqueadas'));
}

if ($method === 'GET' && $path === '/api/admin/empresas/recent') {
    require_admin($jwtSecret);
    $pdo = db();
    $stmt = $pdo->query('SELECT c.id, c.name AS nome, cat.name AS categoria, c.website, c.approved AS aprovado, c.createdAt
                         FROM companies c
                         LEFT JOIN categories cat ON cat.id = c.categoryId
                         ORDER BY c.createdAt DESC
                         LIMIT 10');
    JsonResponse::send($stmt->fetchAll());
}

if ($method === 'GET' && $path === '/api/admin/empresas') {
    require_admin($jwtSecret);
    $pdo = db();
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = max(1, (int)($_GET['limit'] ?? 10));
    $search = trim((string)($_GET['search'] ?? ''));
    $offset = ($page - 1) * $limit;

    $where = '';
    $params = [];
    if ($search !== '') {
        $where = 'WHERE c.name LIKE :search OR cat.name LIKE :search';
        $params[':search'] = '%' . $search . '%';
    }

    $countSql = "SELECT COUNT(*) FROM companies c LEFT JOIN categories cat ON cat.id = c.categoryId $where";
    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $k => $v) $countStmt->bindValue($k, $v);
    $countStmt->execute();
    $total = (int)$countStmt->fetchColumn();

    $sql = "SELECT c.*, cat.id AS cat_id, cat.name AS cat_name
            FROM companies c
            LEFT JOIN categories cat ON cat.id = c.categoryId
            $where
            ORDER BY c.createdAt DESC
            LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) $stmt->bindValue($k, $v);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $empresas = array_map(fn($r) => [
        'id' => $r['id'],
        'name' => $r['name'],
        'whatsapp' => $r['whatsapp'],
        'address' => $r['address'],
        'description' => $r['description'],
        'logo' => $r['logo'],
        'instagram' => $r['instagram'],
        'facebook' => $r['facebook'],
        'youtube' => $r['youtube'],
        'website' => $r['website'],
        'approved' => (bool)$r['approved'],
        'categoryId' => $r['categoryId'],
        'category' => ['id' => $r['cat_id'], 'name' => $r['cat_name']],
        'createdAt' => $r['createdAt'],
    ], $rows);

    JsonResponse::send([
        'empresas' => $empresas,
        'pagination' => [
            'total' => $total,
            'pages' => (int)ceil($total / $limit),
            'currentPage' => $page,
            'perPage' => $limit,
        ],
    ]);
}

if ($method === 'PATCH' && preg_match('#^/api/admin/empresas/([a-f0-9\-]+)/approve$#i', $path, $m)) {
    require_admin($jwtSecret);
    $pdo = db();
    $id = $m[1];
    $body = JsonResponse::body();
    $approved = !empty($body['approved']) ? 1 : 0;
    $pdo = db();
    $stmt = $pdo->prepare('UPDATE companies SET approved = :approved WHERE id = :id');
    $stmt->execute([':approved' => $approved, ':id' => $id]);
    JsonResponse::send(['ok' => true]);
}

if ($method === 'GET' && $path === '/api/categories') {
    $pdo = db();
    $stmt = $pdo->query('SELECT id, name, description, createdAt, updatedAt FROM categories ORDER BY name ASC');
    JsonResponse::send($stmt->fetchAll());
}

if ($method === 'GET' && preg_match('#^/api/categories/([a-f0-9\-]+)$#i', $path, $m)) {
    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, name, description FROM categories WHERE id = :id');
    $stmt->execute([':id' => $m[1]]);
    $row = $stmt->fetch();
    if (!$row) JsonResponse::send(['message' => 'Categoria não encontrada'], 404);
    JsonResponse::send($row);
}

if ($method === 'GET' && $path === '/api/companies') {
    $sql = 'SELECT c.*, cat.id AS cat_id, cat.name AS cat_name,
                   COALESCE(AVG(r.stars),0) AS averageRating,
                   COUNT(r.id) AS totalRatings
            FROM companies c
            LEFT JOIN categories cat ON cat.id = c.categoryId
            LEFT JOIN ratings r ON r.companyId = c.id
            WHERE c.approved = 1
            GROUP BY c.id
            ORDER BY c.createdAt DESC';
    $pdo = db();
    $rows = $pdo->query($sql)->fetchAll();
    $companies = array_map(fn($r) => [
        'id' => $r['id'], 'name' => $r['name'], 'whatsapp' => $r['whatsapp'], 'address' => $r['address'],
        'logo' => $r['logo'], 'instagram' => $r['instagram'], 'facebook' => $r['facebook'], 'youtube' => $r['youtube'],
        'website' => $r['website'], 'description' => $r['description'], 'approved' => (bool)$r['approved'],
        'categoryId' => $r['categoryId'], 'category' => ['id' => $r['cat_id'], 'name' => $r['cat_name']],
        'averageRating' => (float)$r['averageRating'], 'totalRatings' => (int)$r['totalRatings'], 'createdAt' => $r['createdAt'],
    ], $rows);
    JsonResponse::send($companies);
}

if ($method === 'GET' && preg_match('#^/api/companies/category/([a-f0-9\-]+)$#i', $path, $m)) {
    $sql = 'SELECT c.*, cat.id AS cat_id, cat.name AS cat_name,
                   COALESCE(AVG(r.stars),0) AS averageRating,
                   COUNT(r.id) AS totalRatings
            FROM companies c
            LEFT JOIN categories cat ON cat.id = c.categoryId
            LEFT JOIN ratings r ON r.companyId = c.id
            WHERE c.approved = 1 AND c.categoryId = :categoryId
            GROUP BY c.id
            ORDER BY c.createdAt DESC';
    $pdo = db();
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':categoryId' => $m[1]]);
    $rows = $stmt->fetchAll();
    $companies = array_map(fn($r) => [
        'id' => $r['id'], 'name' => $r['name'], 'whatsapp' => $r['whatsapp'], 'address' => $r['address'],
        'logo' => $r['logo'], 'instagram' => $r['instagram'], 'facebook' => $r['facebook'], 'youtube' => $r['youtube'],
        'website' => $r['website'], 'description' => $r['description'], 'approved' => (bool)$r['approved'],
        'categoryId' => $r['categoryId'], 'category' => ['id' => $r['cat_id'], 'name' => $r['cat_name']],
        'averageRating' => (float)$r['averageRating'], 'totalRatings' => (int)$r['totalRatings'], 'createdAt' => $r['createdAt'],
    ], $rows);
    JsonResponse::send($companies);
}

if ($method === 'GET' && preg_match('#^/api/companies/([a-f0-9\-]+)$#i', $path, $m)) {
    $sql = 'SELECT c.*, cat.id AS cat_id, cat.name AS cat_name,
                   COALESCE(AVG(r.stars),0) AS averageRating,
                   COUNT(r.id) AS totalRatings
            FROM companies c
            LEFT JOIN categories cat ON cat.id = c.categoryId
            LEFT JOIN ratings r ON r.companyId = c.id
            WHERE c.approved = 1 AND c.id = :id
            GROUP BY c.id';
    $pdo = db();
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $m[1]]);
    $r = $stmt->fetch();
    if (!$r) JsonResponse::send(['message' => 'Empresa não encontrada'], 404);
    JsonResponse::send([
        'id' => $r['id'], 'name' => $r['name'], 'whatsapp' => $r['whatsapp'], 'address' => $r['address'],
        'logo' => $r['logo'], 'instagram' => $r['instagram'], 'facebook' => $r['facebook'], 'youtube' => $r['youtube'],
        'website' => $r['website'], 'description' => $r['description'], 'approved' => (bool)$r['approved'],
        'categoryId' => $r['categoryId'], 'category' => ['id' => $r['cat_id'], 'name' => $r['cat_name']],
        'averageRating' => (float)$r['averageRating'], 'totalRatings' => (int)$r['totalRatings'], 'createdAt' => $r['createdAt'],
    ]);
}

if ($method === 'POST' && $path === '/api/companies') {
    $body = JsonResponse::body();
    $id = uuidv4();
    $pdo = db();
    $stmt = $pdo->prepare('INSERT INTO companies (id, name, whatsapp, address, description, logo, instagram, facebook, youtube, website, approved, categoryId, createdAt, updatedAt)
                           VALUES (:id,:name,:whatsapp,:address,:description,:logo,:instagram,:facebook,:youtube,:website,0,:categoryId,NOW(),NOW())');
    $stmt->execute([
        ':id' => $id,
        ':name' => $body['name'] ?? '',
        ':whatsapp' => $body['whatsapp'] ?? '',
        ':address' => $body['address'] ?? '',
        ':description' => $body['description'] ?? null,
        ':logo' => $body['logo'] ?? null,
        ':instagram' => $body['instagram'] ?? null,
        ':facebook' => $body['facebook'] ?? null,
        ':youtube' => $body['youtube'] ?? null,
        ':website' => $body['website'] ?? null,
        ':categoryId' => $body['categoryId'] ?? '',
    ]);
    JsonResponse::send(['id' => $id], 201);
}

if ($method === 'PUT' && preg_match('#^/api/companies/([a-f0-9\-]+)$#i', $path, $m)) {
    require_admin($jwtSecret);
    $pdo = db();
    $id = $m[1];
    $body = JsonResponse::body();
    $fields = ['name','whatsapp','address','description','logo','instagram','facebook','youtube','website','categoryId'];
    $set = [];
    $params = [':id' => $id];
    foreach ($fields as $f) {
        if (array_key_exists($f, $body)) {
            $set[] = "$f = :$f";
            $params[":$f"] = $body[$f];
        }
    }
    if (!$set) JsonResponse::send(['ok' => true]);
    $sql = 'UPDATE companies SET ' . implode(',', $set) . ', updatedAt = NOW() WHERE id = :id';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    JsonResponse::send(['ok' => true]);
}

if ($method === 'DELETE' && preg_match('#^/api/companies/([a-f0-9\-]+)$#i', $path, $m)) {
    require_admin($jwtSecret);
    $pdo = db();
    $stmt = $pdo->prepare('DELETE FROM companies WHERE id = :id');
    $stmt->execute([':id' => $m[1]]);
    JsonResponse::send(['ok' => true]);
}

if ($method === 'POST' && $path === '/api/ratings') {
    $body = JsonResponse::body();
    $id = uuidv4();
    $pdo = db();
    $stmt = $pdo->prepare('INSERT INTO ratings (id, stars, companyId, userId, createdAt, updatedAt) VALUES (:id,:stars,:companyId,:userId,NOW(),NOW())');
    $stmt->execute([
        ':id' => $id,
        ':stars' => (int)($body['stars'] ?? 0),
        ':companyId' => $body['companyId'] ?? '',
        ':userId' => $body['userId'] ?? null,
    ]);
    JsonResponse::send(['id' => $id], 201);
}

if ($method === 'GET' && preg_match('#^/api/ratings/company/([a-f0-9\-]+)$#i', $path, $m)) {
    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, stars, companyId, userId, createdAt FROM ratings WHERE companyId = :companyId ORDER BY createdAt DESC');
    $stmt->execute([':companyId' => $m[1]]);
    JsonResponse::send(['ratings' => $stmt->fetchAll()]);
}

if ($method === 'GET' && $path === '/api/ratings/top-rated') {
    $sql = 'SELECT c.id, c.name, c.logo, AVG(r.stars) AS averageRating, COUNT(r.id) AS totalRatings
            FROM companies c
            JOIN ratings r ON r.companyId = c.id
            WHERE c.approved = 1
            GROUP BY c.id
            ORDER BY averageRating DESC, totalRatings DESC
            LIMIT 10';
    $pdo = db();
    $rows = $pdo->query($sql)->fetchAll();
    JsonResponse::send($rows);
}

JsonResponse::send(['message' => 'Not found', 'path' => $path], 404);

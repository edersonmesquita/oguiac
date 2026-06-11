<?php
/**
 * Controller de configurações do site
 * Guia Canindé
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

function settingsDefaults(): array {
    return [
        'branding' => [
            'siteName' => 'Guia Canindé',
            'siteTitle' => 'Guia Canindé - Encontre os melhores negócios da cidade',
            'siteDescription' => 'O melhor guia de empresas e serviços de Canindé. Encontre os melhores negócios da cidade.',
            'iconUrl' => '/ICONETESTE.png',
            'logoLightUrl' => '/LOGO-BG.png',
            'logoDarkUrl' => '/LOGO-BR.png',
            'ogImageUrl' => 'https://oguiacaninde.online/ICONETESTE.png',
        ],
        'contact' => [
            'whatsappNumber' => '5585999999999',
            'whatsappMessage' => 'Olá! Gostaria de falar com a equipe do Guia Canindé.',
            'whatsappButtonTitle' => 'Fale conosco',
        ],
        'navigation' => [
            'menuItems' => [
                ['label' => 'Início', 'route' => '/', 'icon' => 'home', 'visible' => true, 'highlight' => false],
                ['label' => 'Categorias', 'route' => '/categorias', 'icon' => 'grid', 'visible' => true, 'highlight' => false],
                ['label' => 'Buscar', 'route' => '/buscar', 'icon' => 'search', 'visible' => true, 'highlight' => false],
                ['label' => 'Login da Empresa', 'route' => '/empresa-login', 'icon' => 'building', 'visible' => true, 'highlight' => false],
                ['label' => 'Cadastrar Negócio', 'route' => '/cadastrar', 'icon' => 'briefcase', 'visible' => true, 'highlight' => true],
            ],
        ],
        'home' => [
            'heroTitle' => 'Encontre tudo em Canindé',
            'heroDescription' => 'Conecte-se diretamente com empresas e profissionais da sua cidade. Rápido, fácil e gratuito!',
            'primaryButtonLabel' => 'O que está buscando?',
            'primaryButtonRoute' => '/buscar',
            'secondaryButtonLabel' => 'Cadastrar Meu Negócio',
            'secondaryButtonRoute' => '/cadastrar',
            'sectionTitle' => 'Como funciona?',
            'featurePrimaryTitle' => '100% gratuito!',
            'featurePrimaryText' => 'Conecte-se diretamente pelo WhatsApp com empresas e profissionais.',
            'featureSecondaryTitle' => 'Encontre serviços perto de você',
            'featureSecondaryText' => 'Encontre serviços próximos a você: pizzarias, encanadores, cabeleireiros e muito mais!',
            'footerLine1' => 'Encontre o que precisa em Canindé',
            'footerLine2' => 'Rápido, fácil e direto no WhatsApp',
        ],
        'theme' => [
            'themeColorLight' => '#4f46e5',
            'themeColorDark' => '#182132',
            'pwaName' => 'Guia Canindé',
            'pwaShortName' => 'Guia',
        ],
    ];
}

function ensureSettingsTable(PDO $db): void {
    static $checked = false;
    if ($checked) {
        return;
    }

    $db->exec(
        'CREATE TABLE IF NOT EXISTS system_settings (
            setting_key VARCHAR(191) NOT NULL PRIMARY KEY,
            setting_value LONGTEXT NOT NULL,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    $checked = true;
}

function mergeSettings(array $defaults, array $saved): array {
    foreach ($saved as $key => $value) {
        if (isset($defaults[$key]) && is_array($defaults[$key]) && is_array($value)) {
            $defaults[$key] = mergeSettings($defaults[$key], $value);
        } else {
            $defaults[$key] = $value;
        }
    }

    return $defaults;
}

function loadSettings(PDO $db): array {
    ensureSettingsTable($db);
    $defaults = settingsDefaults();
    $rows = $db->query('SELECT setting_key, setting_value FROM system_settings')->fetchAll();
    $saved = [];

    foreach ($rows as $row) {
        $decoded = json_decode((string) $row['setting_value'], true);
        $saved[(string) $row['setting_key']] = json_last_error() === JSON_ERROR_NONE ? $decoded : $row['setting_value'];
    }

    return mergeSettings($defaults, $saved);
}

function persistSettings(PDO $db, array $settings): array {
    ensureSettingsTable($db);
    $merged = mergeSettings(settingsDefaults(), $settings);
    $stmt = $db->prepare(
        'INSERT INTO system_settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
    );

    foreach ($merged as $key => $value) {
        $stmt->execute([$key, json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
    }

    return $merged;
}

function getPublicSettings(): void {
    respond(200, loadSettings(getDB()));
}

function getAdminSettings(): void {
    requireAdmin();
    respond(200, loadSettings(getDB()));
}

function updateSettings(): void {
    requireAdmin();
    $body = getJsonBody();

    if (!is_array($body)) {
        respondError(422, 'Payload inválido');
    }

    $settings = persistSettings(getDB(), $body);
    respond(200, ['ok' => true, 'settings' => $settings]);
}

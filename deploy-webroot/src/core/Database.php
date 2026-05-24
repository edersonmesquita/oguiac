<?php

declare(strict_types=1);

final class Database
{
    private static ?PDO $pdo = null;

    public static function connection(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $host = env_get('DB_HOST', '127.0.0.1');
        $port = env_get('DB_PORT', '3306');
        $db = env_get('DB_DATABASE', env_get('DB_NAME', 'gcan'));
        $user = env_get('DB_USERNAME', env_get('DB_USER', 'root'));
        $pass = env_get('DB_PASSWORD', env_get('DB_PASS', ''));

        $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
        self::$pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);

        return self::$pdo;
    }
}

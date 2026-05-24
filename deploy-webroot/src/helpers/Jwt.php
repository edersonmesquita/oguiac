<?php

declare(strict_types=1);

final class Jwt
{
    public static function encode(array $payload, string $secret): string
    {
        $header = ['alg' => 'HS256', 'typ' => 'JWT'];
        $segments = [
            self::b64(json_encode($header)),
            self::b64(json_encode($payload)),
        ];
        $signature = hash_hmac('sha256', implode('.', $segments), $secret, true);
        $segments[] = self::b64($signature);
        return implode('.', $segments);
    }

    public static function decode(string $token, string $secret): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;

        [$h, $p, $s] = $parts;
        $check = self::b64(hash_hmac('sha256', "$h.$p", $secret, true));
        if (!hash_equals($check, $s)) return null;

        $payload = json_decode(self::ub64($p), true);
        if (!is_array($payload)) return null;

        if (isset($payload['exp']) && time() >= (int)$payload['exp']) {
            return null;
        }

        return $payload;
    }

    private static function b64(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function ub64(string $data): string
    {
        $pad = strlen($data) % 4;
        if ($pad > 0) $data .= str_repeat('=', 4 - $pad);
        return base64_decode(strtr($data, '-_', '+/')) ?: '';
    }
}

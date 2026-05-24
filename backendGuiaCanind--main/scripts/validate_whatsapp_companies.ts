import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ONLY_PENDING = process.env.VALIDATE_ONLY_PENDING === 'true';
const ONLY_APPROVED = process.env.VALIDATE_ONLY_APPROVED === 'true';
const LIMIT = Number(process.env.VALIDATE_LIMIT || '0');
const DEMOTE_INVALID = process.env.VALIDATE_DEMOTE_INVALID !== 'false';
const DELAY_MS = Number(process.env.VALIDATE_DELAY_MS || '350');

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeWhatsapp(raw: string): string {
  return raw.replace(/\D/g, '');
}

async function isWhatsappReachable(number: string): Promise<{ ok: boolean; reason: string }> {
  // wa.me returns a page that clearly states invalid numbers.
  const url = `https://wa.me/${number}`;

  const res = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
  });

  const html = await res.text();
  const normalized = html.toLowerCase();

  if (
    normalized.includes('phone number shared via url is invalid') ||
    normalized.includes('número de telefone compartilhado através de url é inválido') ||
    normalized.includes('número de telefone compartilhado via url é inválido')
  ) {
    return { ok: false, reason: 'invalid_by_wa_me' };
  }

  // If response is successful and does not contain invalid message, consider reachable.
  if (res.ok) {
    return { ok: true, reason: 'ok' };
  }

  return { ok: false, reason: `http_${res.status}` };
}

async function main() {
  const where: Record<string, unknown> = {};
  if (ONLY_PENDING) where.approved = false;
  if (ONLY_APPROVED) where.approved = true;

  const companies = await prisma.company.findMany({
    where,
    select: {
      id: true,
      name: true,
      whatsapp: true,
      approved: true,
    },
    orderBy: { createdAt: 'desc' },
    ...(LIMIT > 0 ? { take: LIMIT } : {}),
  });

  console.log(`Empresas selecionadas para validar: ${companies.length}`);

  let valid = 0;
  let invalid = 0;
  let error = 0;
  const invalidIds: string[] = [];

  for (const company of companies) {
    const number = normalizeWhatsapp(company.whatsapp);
    if (!number) {
      invalid += 1;
      invalidIds.push(company.id);
      console.log(`[INVALID] ${company.name} - sem dígitos no WhatsApp`);
      continue;
    }

    try {
      const result = await isWhatsappReachable(number);
      if (result.ok) {
        valid += 1;
        console.log(`[OK] ${company.name} - ${number}`);
      } else {
        invalid += 1;
        invalidIds.push(company.id);
        console.log(`[INVALID] ${company.name} - ${number} (${result.reason})`);
      }
    } catch (err) {
      error += 1;
      console.log(`[ERRO] ${company.name} - ${(err as Error).message}`);
    }

    await sleep(DELAY_MS);
  }

  if (DEMOTE_INVALID && invalidIds.length > 0) {
    const updated = await prisma.company.updateMany({
      where: { id: { in: invalidIds } },
      data: { approved: false },
    });
    console.log(`Empresas inválidas movidas para pendente (approved=false): ${updated.count}`);
  }

  console.log('\n=== RESUMO VALIDAÇÃO ===');
  console.log(`Válidas: ${valid}`);
  console.log(`Inválidas: ${invalid}`);
  console.log(`Erros: ${error}`);
}

main()
  .catch((err) => {
    console.error('Falha na validação de WhatsApp:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

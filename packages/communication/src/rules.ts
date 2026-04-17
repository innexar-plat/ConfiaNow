const FORBIDDEN_PATTERNS = [
  /chave\s*pix/i,
  /envia\s*dinheiro/i,
  /pagamento\s*fora\s*da\s*plataforma/i,
  /golpe/i
];

export function containsForbiddenMessagePattern(body: string) {
  return FORBIDDEN_PATTERNS.some((pattern) => pattern.test(body));
}

const defaults = {
    name: process.env.PLATFORM_NAME ?? process.env.NEXT_PUBLIC_PLATFORM_NAME ?? "Nome Provisorio",
    legalName: process.env.PLATFORM_LEGAL_NAME ?? "Nome Provisorio LTDA",
    slug: process.env.PLATFORM_SLUG ?? "nome-provisorio",
    tagline: process.env.PLATFORM_TAGLINE ??
        process.env.NEXT_PUBLIC_PLATFORM_TAGLINE ??
        "Confianca real para negocios locais verificados",
    supportEmail: process.env.PLATFORM_SUPPORT_EMAIL ?? "contato@exemplo.com",
    defaultLocale: "pt-BR"
};
export function getPlatformConfig() {
    return defaults;
}
export const platformConfig = getPlatformConfig();

"""
Cria uma cópia anonimizada do SQLite para prints da LP.

NÃO grava no banco original. Só lê (mode=ro) e escreve num arquivo novo.

Uso:
  python scripts/anonymize-db-for-lp.py
  python scripts/anonymize-db-for-lp.py --src "D:\\caminho\\cashflow-desktop.db" --dest "data\\cashflow-lp-demo.db"
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SRC = Path(r"d:\cashflow\Cashflow Pro\data\cashflow-desktop.db")
DEFAULT_DEST = ROOT / "data" / "cashflow-lp-demo.db"

DEMO_USER_NAME = "Alex Mendes"
DEMO_USER_EMAIL = "eu@local"

WORKSPACES = ["Operação Principal", "Projetos Laterais", "Reservado"]

OFFERS = [
    "Método Foco",
    "Protocolo Norte",
    "Kit Starter",
    "Plano Pulse",
    "Academia Atlas",
    "Mentoria Orbit",
    "Pack Delta",
    "Curso Horizon",
    "Guia Compacto",
    "Trilha Nova",
    "Oferta Apex",
    "Oferta Lumen",
    "Oferta Nimbus",
    "Oferta Vale",
    "Oferta Porto",
    "Oferta Serra",
    "Oferta Farol",
    "Oferta Brasa",
    "Oferta Néctar",
    "Oferta Prisma",
    "Oferta Vértice",
    "Oferta Âncora",
    "Oferta Fluxo",
    "Oferta Aurora",
    "Oferta Eco",
    "Oferta Zenith",
    "Oferta Mare",
    "Oferta Solis",
    "Oferta Alta",
    "Oferta Base",
]

CATEGORIES = [
    "Tráfego",
    "Ferramentas",
    "Infraestrutura",
    "Equipe",
    "Impostos",
    "Operação",
    "Criativos",
    "Geral",
    "Administrativo",
    "Financeiro",
    "Marketing",
    "Produto",
    "Suporte",
    "Logística",
    "Reserva",
    "Outros",
]

FEE_PROFILES = [
    "Perfil Brasil",
    "Perfil Internacional",
    "Perfil Checkout",
    "Perfil Padrão",
]

INVESTMENTS = [
    "Aporte operacional",
    "Reserva de caixa",
    "Aporte de mídia",
    "Ajuste de capital",
    "Reforço do mês",
]

MANUAL_INCOMES = [
    "Receita extra",
    "Ajuste de entrada",
    "Reembolso recebido",
    "Receita pontual",
    "Transferência interna",
    "Recuperação",
    "Bonificação",
    "Aporte de receita",
    "Receita avulsa",
    "Outras entradas",
]

SPEND_PLANS = ["Plano do mês", "Plano extra"]
SPEND_NOTES = ["Controle de teto do período", "Ajustes pontuais"]
SPEND_GROUPS = [
    "Fixas",
    "Variáveis",
    "Projetos",
    "Mídia",
    "Operação",
    "Reserva",
]
SPEND_ITEMS = [
    "Ferramenta principal",
    "Ferramenta secundária",
    "Tráfego do mês",
    "Criativos",
    "Infraestrutura",
    "Domínio e e-mail",
    "Checkout",
    "Gateway",
    "Suporte",
    "Freelancer",
    "Contabilidade",
    "Impostos",
    "Reserva",
    "Teste de campanha",
    "Escala de campanha",
    "Software de gestão",
    "Armazenamento",
    "Design",
    "Vídeo",
    "Copy",
    "Automação",
    "CRM",
    "E-mail marketing",
    "Página de captura",
    "Área de membros",
    "Jurídico",
    "Internet",
    "Telefonia",
    "Backup",
    "Monitoramento",
    "Licença de escritório",
    "Banco de mídia",
    "Pixel e tracking",
    "CDN",
    "Hospedagem",
    "Certificado",
    "Tarifa bancária",
    "Chargeback previsto",
    "Ajuste financeiro",
    "Outros",
    "Item complementar A",
    "Item complementar B",
    "Item complementar C",
    "Item complementar D",
    "Item complementar E",
]

COMMENTS = [
    "Teste A/B de criativo",
    "Escala de campanha",
    "Ajuste de lance",
    "Público novo",
    "Pausa temporária",
    "Criativo vencedor",
    "Custo acima do teto",
    "Boa margem no dia",
    "Revisão de copy",
    "Troca de oferta",
    "Retargeting",
    "Prospecção fria",
    "Campanha de remarketing",
    "Criativo desgastado",
    "Horário de pico",
    "Público saturado",
    "Teste de página",
    "Ajuste de checkout",
    "Bloqueio pontual",
    "Otimização de CPC",
    "Otimização de CPA",
    "Volume baixo",
    "Volume alto",
    "Dia estável",
    "Dia fora da curva",
    "Corte de conjunto",
    "Novo conjunto",
    "Troca de criativo",
    "Melhora no ROAS",
    "Queda no ROAS",
    "Ajuste de orçamento",
    "Orçamento redistribuído",
    "Campanha em aprendizado",
    "Campanha madura",
    "Teste de headline",
    "Teste de oferta",
    "Página lenta",
    "Página ok",
    "Pixel conferido",
    "Evento duplicado",
    "Público lookalike",
    "Público interesse",
    "Público remarketing",
    "Escalada conservadora",
    "Escalada agressiva",
    "Pausa de fim de semana",
    "Retomada na segunda",
    "Criativo UGC",
    "Criativo estático",
    "Criativo vídeo",
    "Copy direta",
    "Copy longa",
    "Oferta com bônus",
    "Oferta sem bônus",
    "Checkout com order bump",
    "Checkout simples",
    "Ticket médio alto",
    "Ticket médio baixo",
    "Muitas recusas",
    "Poucas recusas",
    "Chargeback no radar",
    "Qualidade boa",
    "Qualidade fraca",
    "Tráfego quente",
    "Tráfego frio",
    "Ângulo novo",
    "Ângulo antigo",
    "Promoção relâmpago",
    "Preço cheio",
    "Garantia destacada",
    "Prova social",
    "Escassez",
    "Autoridade",
    "Antes e depois",
    "Depoimento",
    "Bastidor",
    "FAQ na página",
    "VSL curta",
    "VSL longa",
    "Captura + nutrição",
    "Venda direta",
    "WhatsApp no funil",
    "E-mail no funil",
    "SMS no funil",
    "Comunidade",
    "Webinar",
    "Desafio",
    "Lançamento interno",
    "Evergreen",
    "Reativação de base",
    "Lista nova",
    "Lista antiga",
    "Segmento A",
    "Segmento B",
    "Ajuste fino",
    "Sem alteração",
    "Revisão geral",
    "Nota operacional",
    "Acompanhamento diário",
    "Meta do dia",
    "Fora da meta",
]

EXPENSES = [
    "Ferramenta de tráfego",
    "Gerenciador de anúncios",
    "Plataforma de criativos",
    "Banco de imagens",
    "Banco de vídeos",
    "Editor de vídeo",
    "Ferramenta de copy",
    "E-mail marketing",
    "Automação de funil",
    "Página de captura",
    "Checkout online",
    "Gateway de pagamento",
    "Antifraude",
    "Domínio principal",
    "Domínio extra",
    "Hospedagem do site",
    "CDN",
    "Certificado SSL",
    "E-mail corporativo",
    "CRM",
    "Planilha e dados",
    "BI e relatórios",
    "Pixel e tracking",
    "Encurtador de links",
    "Teste A/B",
    "Pesquisa de público",
    "Comunidade",
    "Suporte ao cliente",
    "Central de ajuda",
    "Contabilidade",
    "Notas fiscais",
    "Impostos e taxas",
    "Tarifa bancária",
    "Transferência internacional",
    "Câmbio",
    "Software de gestão",
    "Armazenamento em nuvem",
    "Backup",
    "Monitoramento",
    "VPN",
    "Telefonia",
    "Reunião online",
    "Design gráfico",
    "Identidade visual",
    "Landing page",
    "Copy de anúncio",
    "Edição de criativo",
    "Motion design",
    "Fotografia",
    "Estúdio",
    "Equipamento",
    "Internet",
    "Energia",
    "Coworking",
    "Aluguel operacional",
    "Material de escritório",
    "Correios",
    "Logística",
    "Embalagem",
    "Produção",
    "Terceirização",
    "Freelancer de tráfego",
    "Freelancer de design",
    "Freelancer de copy",
    "Freelancer de vídeo",
    "Gestor de tráfego",
    "Assistente virtual",
    "Mentoria operacional",
    "Capacitação",
    "Ferramenta de IA",
    "Transcrição",
    "Legendas",
    "Tradução",
    "Revisão de texto",
    "Jurídico",
    "Contratos",
    "Marca e registro",
    "Anuidade",
    "Seguro",
    "Reserva de emergência",
    "Aporte em mídia",
    "Teste de campanha",
    "Escala de campanha",
    "Retargeting",
    "Prospecção",
    "Lista de e-mails",
    "SMS marketing",
    "WhatsApp business",
    "Chat no site",
    "Enquete",
    "Webinar",
    "Plataforma de curso",
    "Área de membros",
    "Programa de indicação",
    "Cashback operacional",
    "Chargeback",
    "Reembolso operacional",
    "Ajuste financeiro",
    "Tarifa de saque",
    "Antecipação",
    "Link de pagamento",
    "Assinatura de newsletter",
    "Pacote de stock",
    "Fonte tipográfica",
    "Ícones e mockup",
    "Mapa de calor",
    "Gravação de sessão",
    "Formulário",
    "Agendamento",
    "Assinatura digital",
    "Gestão de senhas",
    "Licença de escritório",
    "Suíte de documentos",
    "Armazenamento de criativos",
    "Fila de publicação",
    "Agendador social",
    "Pesquisa de mercado",
    "Benchmark",
    "Deslocamento",
    "Evento operacional",
    "Infra de servidor",
    "Banco de dados",
    "Fila de jobs",
    "Logs e alerta",
    "DNS",
    "Proteção de bot",
    "Privacidade e consentimento",
    "Cookies",
    "Status da operação",
    "Qualidade",
    "Teste de produto",
    "Publicidade extra",
    "Brinde operacional",
    "Amostra",
    "Manutenção",
    "Atualização de sistema",
    "Suporte técnico",
    "Consultoria pontual",
    "Auditoria",
    "Compliance",
    "Treinamento interno",
    "Biblioteca de criativos",
    "Banco de headlines",
    "Pesquisa de palavra-chave",
    "Pesquisa de anúncios",
    "Extensão do navegador",
    "App de produtividade",
    "Quadro kanban",
    "Documentação interna",
    "Wiki da operação",
    "Gravador de tela",
    "Banco de áudio",
    "Mixagem",
    "Locução",
    "Fotógrafo",
    "Figurinista",
    "Locação de espaço",
    "Transporte de equipe",
    "Coffee operacional",
    "Software de edição",
    "Plugin extra",
    "Tema do site",
    "Construtor de página",
    "Popup",
    "Contador de estoque",
    "Cupom",
    "Programa de pontos",
    "Recuperação de carrinho",
    "Prova social no site",
    "Selo de segurança",
    "Atendimento humano",
    "Atendimento automático",
]


def die(msg: str, code: int = 1) -> None:
    print(msg, file=sys.stderr)
    raise SystemExit(code)


def same_file(a: Path, b: Path) -> bool:
    try:
        return a.resolve() == b.resolve()
    except OSError:
        return os.path.normcase(str(a)) == os.path.normcase(str(b))


def hashed_order(values: list[str]) -> list[str]:
    return sorted(
        values,
        key=lambda s: hashlib.sha256(s.encode("utf-8", "surrogatepass")).hexdigest(),
    )


def build_map(values: list[str], pool: list[str], fallback_prefix: str) -> dict[str, str]:
    unique = [v for v in dict.fromkeys(values) if v not in (None, "")]
    mapping: dict[str, str] = {}
    unused = list(pool)
    extra = 1
    for original in hashed_order(unique):
        if unused:
            mapping[original] = unused.pop(0)
        else:
            mapping[original] = f"{fallback_prefix} {extra:02d}"
            extra += 1
    return mapping


def column_exists(cur: sqlite3.Cursor, table: str, column: str) -> bool:
    cols = {row[1] for row in cur.execute(f"PRAGMA table_info([{table}])")}
    return column in cols


def table_exists(cur: sqlite3.Cursor, table: str) -> bool:
    row = cur.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (table,)
    ).fetchone()
    return row is not None


def collect(cur: sqlite3.Cursor, table: str, column: str) -> list[str]:
    if not table_exists(cur, table) or not column_exists(cur, table, column):
        return []
    rows = cur.execute(f"SELECT [{column}] FROM [{table}]").fetchall()
    return [r[0] for r in rows if isinstance(r[0], str) and r[0] != ""]


def apply_map(
    cur: sqlite3.Cursor, table: str, column: str, mapping: dict[str, str]
) -> int:
    if not mapping:
        return 0
    if not table_exists(cur, table) or not column_exists(cur, table, column):
        return 0
    rows = cur.execute(f"SELECT rowid, [{column}] FROM [{table}]").fetchall()
    pending: list[tuple[str, int]] = []
    for rowid, original in rows:
        fake = mapping.get(original)
        if fake is None:
            continue
        pending.append((fake, rowid))
    if not pending:
        return 0
    for _, rowid in pending:
        cur.execute(
            f"UPDATE [{table}] SET [{column}] = ? WHERE rowid = ?",
            (f"__lp_tmp_{rowid}__", rowid),
        )
    for fake, rowid in pending:
        cur.execute(
            f"UPDATE [{table}] SET [{column}] = ? WHERE rowid = ?",
            (fake, rowid),
        )
    return len(pending)


def scrub_user(cur: sqlite3.Cursor) -> None:
    if not table_exists(cur, "User"):
        return
    cur.execute(
        """
        UPDATE User
        SET name = ?,
            email = ?,
            image = NULL,
            resetPasswordToken = NULL,
            resetPasswordExpires = NULL,
            stripeCustomerId = NULL
        """,
        (DEMO_USER_NAME, DEMO_USER_EMAIL),
    )


def scrub_json_names(cur: sqlite3.Cursor, table: str, column: str, mapping: dict[str, str]) -> int:
    if not table_exists(cur, table) or not column_exists(cur, table, column):
        return 0
    n = 0
    rows = cur.execute(f"SELECT rowid, [{column}] FROM [{table}]").fetchall()
    for rowid, raw in rows:
        if not raw:
            continue
        text = raw if isinstance(raw, str) else str(raw)
        updated = text
        for original, fake in mapping.items():
            if original and original in updated:
                updated = updated.replace(original, fake)
        if updated != text:
            try:
                json.loads(updated)
            except Exception:
                continue
            cur.execute(
                f"UPDATE [{table}] SET [{column}] = ? WHERE rowid = ?",
                (updated, rowid),
            )
            n += 1
    return n


def copy_readonly(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        dest.unlink()
    source = sqlite3.connect(f"file:{src.as_posix()}?mode=ro", uri=True)
    try:
        target = sqlite3.connect(str(dest))
        try:
            source.backup(target)
        finally:
            target.close()
    finally:
        source.close()


def anonymize(dest: Path) -> None:
    conn = sqlite3.connect(str(dest))
    conn.execute("PRAGMA foreign_keys = OFF")
    cur = conn.cursor()
    try:
        maps = {
            "Workspace.name": build_map(collect(cur, "Workspace", "name"), WORKSPACES, "Workspace"),
            "Offer.name": build_map(collect(cur, "Offer", "name"), OFFERS, "Oferta"),
            "Category.name": build_map(collect(cur, "Category", "name"), CATEGORIES, "Categoria"),
            "Expense.tag": build_map(collect(cur, "Expense", "tag"), EXPENSES, "Despesa"),
            "PersonalExpense.tag": build_map(
                collect(cur, "PersonalExpense", "tag"), EXPENSES, "Despesa pessoal"
            ),
            "RecurringExpense.description": build_map(
                collect(cur, "RecurringExpense", "description"), EXPENSES, "Recorrente"
            ),
            "DailyPerformance.comment": build_map(
                collect(cur, "DailyPerformance", "comment"), COMMENTS, "Nota"
            ),
            "FeeProfile.name": build_map(
                collect(cur, "FeeProfile", "name"), FEE_PROFILES, "Perfil"
            ),
            "Investment.description": build_map(
                collect(cur, "Investment", "description"), INVESTMENTS, "Aporte"
            ),
            "ManualIncome.description": build_map(
                collect(cur, "ManualIncome", "description"), MANUAL_INCOMES, "Entrada"
            ),
            "SpendPlan.name": build_map(collect(cur, "SpendPlan", "name"), SPEND_PLANS, "Plano"),
            "SpendPlan.notes": build_map(collect(cur, "SpendPlan", "notes"), SPEND_NOTES, "Nota do plano"),
            "SpendPlanGroup.name": build_map(
                collect(cur, "SpendPlanGroup", "name"), SPEND_GROUPS, "Grupo"
            ),
            "SpendPlanItem.description": build_map(
                collect(cur, "SpendPlanItem", "description"), SPEND_ITEMS, "Item"
            ),
            "SpendPlanEntry.note": build_map(
                collect(cur, "SpendPlanEntry", "note"), COMMENTS, "Nota"
            ),
            "Budget.name": build_map(collect(cur, "Budget", "name"), CATEGORIES, "Orçamento"),
            "BudgetNotification.title": build_map(
                collect(cur, "BudgetNotification", "title"), COMMENTS, "Alerta"
            ),
            "BudgetNotification.message": build_map(
                collect(cur, "BudgetNotification", "message"), COMMENTS, "Mensagem"
            ),
            "SavedReport.name": build_map(
                collect(cur, "SavedReport", "name"), SPEND_PLANS, "Relatório"
            ),
            "SavedReport.description": build_map(
                collect(cur, "SavedReport", "description"), SPEND_NOTES, "Relatório"
            ),
            "ApiKey.name": build_map(collect(cur, "ApiKey", "name"), ["Chave local"], "Chave"),
        }

        counts = {}
        for key, mapping in maps.items():
            table, column = key.split(".", 1)
            counts[key] = apply_map(cur, table, column, mapping)

        all_strings = {}
        for mapping in maps.values():
            all_strings.update(mapping)

        json_counts = {
            "BudgetNotification.metadata_json": scrub_json_names(
                cur, "BudgetNotification", "metadata_json", all_strings
            ),
            "SavedReport.filters_json": scrub_json_names(
                cur, "SavedReport", "filters_json", all_strings
            ),
        }

        if table_exists(cur, "WorkspaceInvite") and column_exists(cur, "WorkspaceInvite", "email"):
            cur.execute("UPDATE WorkspaceInvite SET email = 'convite@cashflow.demo'")
        if table_exists(cur, "StripeCustomer") and column_exists(cur, "StripeCustomer", "email"):
            cur.execute("UPDATE StripeCustomer SET email = ?", (DEMO_USER_EMAIL,))
        if table_exists(cur, "VerificationToken") and column_exists(
            cur, "VerificationToken", "identifier"
        ):
            cur.execute(
                "UPDATE VerificationToken SET identifier = ?", (DEMO_USER_EMAIL,)
            )
        if table_exists(cur, "ApiKey"):
            if column_exists(cur, "ApiKey", "key"):
                cur.execute("UPDATE ApiKey SET key = 'cf_demo_key'")
            if column_exists(cur, "ApiKey", "keyPrefix"):
                cur.execute("UPDATE ApiKey SET keyPrefix = 'cf_demo'")

        scrub_user(cur)
        conn.commit()
        cur.execute("VACUUM")
        ok = cur.execute("PRAGMA integrity_check").fetchone()
        if not ok or ok[0] != "ok":
            die(f"integrity_check falhou: {ok}")

        print("Cópia anonimizada criada.")
        print(f"Destino: {dest}")
        for key, n in counts.items():
            if n:
                print(f"  {key}: {n} linhas")
        for key, n in json_counts.items():
            if n:
                print(f"  {key}: {n} json")
        print(f"  User: nome={DEMO_USER_NAME!r} email={DEMO_USER_EMAIL!r}")
    finally:
        conn.close()


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Copia e anonimiza um SQLite para prints da LP.")
    p.add_argument("--src", type=Path, default=DEFAULT_SRC)
    p.add_argument("--dest", type=Path, default=DEFAULT_DEST)
    return p.parse_args()


def main() -> None:
    args = parse_args()
    src = args.src.expanduser()
    dest = args.dest.expanduser()
    if not src.is_file():
        die(f"Banco original não encontrado: {src}")
    if same_file(src, dest):
        die("Recusei gravar no arquivo original. Passe outro --dest.")

    src_stat = src.stat()
    copy_readonly(src, dest)
    after = src.stat()
    if (after.st_size, after.st_mtime_ns) != (src_stat.st_size, src_stat.st_mtime_ns):
        die("O arquivo original mudou durante a cópia. Abortado.")

    anonymize(dest)
    final = src.stat()
    if (final.st_size, final.st_mtime_ns) != (src_stat.st_size, src_stat.st_mtime_ns):
        die("O arquivo original mudou depois da anonimização. Conferir o disco.")
    print(f"Original intacto: {src} ({final.st_size} bytes)")


if __name__ == "__main__":
    main()

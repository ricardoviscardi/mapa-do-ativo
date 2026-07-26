from __future__ import annotations

import argparse
import subprocess
import sys
from datetime import date


def run(command: list[str], *, optional: bool = False) -> bool:
    print({"running": " ".join(command)})
    completed = subprocess.run(command)
    if completed.returncode != 0:
        if optional:
            print({"warning": "Etapa opcional falhou, mas a rotina continuará.", "returncode": completed.returncode})
            return False
        raise SystemExit(completed.returncode)
    return True


def default_dfp_years() -> list[str]:
    current_year = date.today().year
    return [str(year) for year in range(current_year - 1, current_year - 6, -1)]


def default_itr_years() -> list[str]:
    current_year = date.today().year
    return [str(current_year), str(current_year - 1)]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Atualiza toda a base monitorada de ações.")
    parser.add_argument("--sleep", type=float, default=1.0)
    parser.add_argument("--with-itr", action="store_true")
    parser.add_argument("--years", nargs="+", default=default_dfp_years())
    parser.add_argument("--itr-years", nargs="+", default=default_itr_years())
    parser.add_argument("--skip-prices", action="store_true", help="Pula atualização de preço/histórico/proventos.")
    parser.add_argument("--skip-cvm", action="store_true", help="Pula atualização CVM.")
    parser.add_argument("--cvm-optional", action="store_true", help="Continua a rotina mesmo se a CVM estiver temporariamente indisponível.")
    parser.add_argument("--prices-optional", action="store_true", help="Continua para CVM mesmo se preços falharem.")
    parser.add_argument("--b3-stocks", action="store_true", help="Usa universo amplo/dinâmico de ações da B3 na etapa de preços.")
    return parser


def main() -> int:
    args = build_parser().parse_args()

    if not args.skip_prices:
        price_command = [sys.executable, "scripts/update_base_inicial.py", "--sleep", str(args.sleep)]
        price_command.append("--b3-stocks" if args.b3_stocks else "--stocks")
        run(price_command, optional=args.prices_optional)

        # Garante que ações críticas para publicação existam em assets antes da
        # etapa CVM. Assim, mesmo quando Yahoo falha para EMBR3/NTCO3/ELET3 etc.,
        # a CVM ainda consegue associar o ticker e preencher demonstrativos.
        run([sys.executable, "scripts/ensure_required_stocks.py"], optional=True)

    if not args.skip_cvm:
        cvm_command = [sys.executable, "scripts/update_cvm_companies.py", "--all", "--years", *args.years]
        if args.with_itr:
            cvm_command.extend(["--itr-years", *args.itr_years])
        cvm_ok = run(cvm_command, optional=args.cvm_optional)
        if not cvm_ok and args.cvm_optional:
            print({
                "warning": "cvm_unavailable_continuing",
                "message": "A CVM falhou nesta execução. A rotina continuará para permitir publicar snapshot com os dados já existentes no Supabase e os preços atualizados."
            })

    run([sys.executable, "scripts/check_supabase_data.py"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

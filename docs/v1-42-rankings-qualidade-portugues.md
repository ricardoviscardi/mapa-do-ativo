# v1.42 — Rankings com base ampliada + português na interface

## Mudanças

- Rankings passam a usar a base ampliada de ações e FIIs.
- A página pública dos rankings deixa de mencionar fornecedores ou detalhes operacionais de dados.
- Textos vindos em inglês são traduzidos para português antes de serem exibidos.
- Criada rota interna de qualidade de dados:

```text
/api/data/quality
```

## Traduções adicionadas

- Farm & Heavy Construction Machinery → Máquinas agrícolas e construção pesada
- Oil & Gas Integrated → Petróleo e gás integrado
- REIT - Diversified → FII - Diversificado
- Specialty Industrial Machinery → Máquinas industriais especializadas
- Engineering & Construction → Engenharia e construção

## Testes recomendados

```text
http://localhost:3000/acoes/pomo4
http://localhost:3000/acoes/petr4
http://localhost:3000/acoes/mxrf11
http://localhost:3000/rankings
http://localhost:3000/api/data/quality
```

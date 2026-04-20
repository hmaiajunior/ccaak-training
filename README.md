# CCAAK Training Quiz

Simulador de prova para a certificação **Confluent Certified Administrator for Apache Kafka (CCAAK)**. Aplicação web estática, sem backend, sem dependências de runtime — abre direto no navegador.

## Funcionalidades

- **Modo Simulado** — timer regressivo (2 min/questão), sem feedback durante o quiz, resultado ao final com breakdown por categoria
- **Modo Treinamento** — feedback imediato após cada resposta com explicação técnica detalhada
- **Bilíngue** — interface e questões disponíveis em PT-BR e EN
- **Seleção de quantidade** — 10, 20, 30, 40 ou 50 questões por sessão (sorteadas aleatoriamente do banco)
- **Critério de aprovação** — ≥ 70% = APROVADO, < 70% = REPROVADO (alinhado ao exame oficial)
- **Revisão completa** — ao final, revise todas as respostas com gabarito e explicação

## Domínios cobertos

| Categoria | Questões |
|---|---|
| Kafka Core Concepts | ✓ |
| Topics, Partitions & Replication | ✓ |
| Producers | ✓ |
| Consumers & Consumer Groups | ✓ |
| Kafka Connect | ✓ |
| Security | ✓ |
| Monitoring & Operations | ✓ |

## Como executar

Nenhuma instalação necessária. Basta servir os arquivos estáticos:

```bash
# Python (recomendado)
python3 -m http.server 8090

# Node.js
npx http-server . -p 8090
```

Acesse `http://localhost:8090` no navegador.

## Estrutura do projeto

```
├── index.html           # Aplicação single-page (4 telas)
├── style.css            # Tema escuro com CSS variables
├── app.js               # Toda a lógica (i18n, quiz, timer, score)
├── data/
│   └── questions.json   # Banco de questões bilíngues
└── i18n/
    ├── pt-br.json       # Strings da interface em PT-BR
    └── en.json          # Strings da interface em EN
```

## Expandindo o banco de questões

Cada questão em `data/questions.json` segue esta estrutura:

```json
{
  "id": "q001",
  "category": "Kafka Core Concepts",
  "difficulty": "medium",
  "correct": "B",
  "pt": {
    "question": "Enunciado em português...",
    "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
    "explanation": "Explicação técnica em português..."
  },
  "en": {
    "question": "Question in English...",
    "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
    "explanation": "Technical explanation in English..."
  }
}
```

Basta adicionar novos objetos ao array para ampliar o banco. Os botões de quantidade se adaptam automaticamente ao total disponível.

## Licença

MIT

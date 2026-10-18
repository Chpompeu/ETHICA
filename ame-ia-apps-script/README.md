# AME-IA — Web App (Google Apps Script)

Questionário dinâmico com cálculo automático, gráficos, geração de relatório em PDF, envio por e-mail e armazenamento de dados tratados no Google Sheets.

O mesmo app traz dois questionários, escolhidos pela URL:

| Questionário | URL | Para quem |
|---|---|---|
| **AME-IA (universidades)** | URL do Web App (ou `?q=ies`) | Instituições de ensino superior — 6 dimensões, 36 itens, Likert 1–5 |
| **Governança de IA — Empresas** | URL do Web App + `?q=empresa` | Empresas que usam ou desenvolvem IA — 7 dimensões, 21 itens, escala de maturidade 0–4 |

## Passo a passo

1. Abra `script.google.com` e crie um **novo projeto**.
2. No editor, crie os seguintes arquivos e **cole o conteúdo** correspondente:
   - `Code.gs`
   - `Instrumentos.gs`
   - `Index.html`
   - `EmailTemplate.html`
   - `appsscript.json` (Menu: Exibir > Mostrar arquivo de manifesto)
3. Salve o projeto (Ctrl/Cmd+S).
4. Execute uma função qualquer (ex.: `doGet`) para o Apps Script solicitar **autorização**.
5. Publique como **Aplicativo da Web**:
   - Menu: Implantar > Implantar como aplicativo da Web
   - "Quem tem acesso": Qualquer pessoa com o link (ou dentro do domínio)
   - Implantar e copiar a URL
6. Abra a URL do Web App e responda ao questionário. Para a versão de empresas, acrescente `?q=empresa` ao fim da URL.

## O que o app faz
- Renderiza o questionário escolhido, com legenda da escala
- Calcula os índices dimensionais em escala 0–100 (cada opção vale 0, 25, 50, 75 ou 100), IGM, desvio-padrão e CV entre dimensões, nível de maturidade e posição na escala (quartos de 0–100; não é comparação com outras organizações)
- Calcula o **percentil e quartil** do IGM de duas formas, usando as respostas anteriores gravadas na planilha (só as da escala atual):
  - **entre respondentes**: cada resposta conta uma vez (a partir de 10 respostas anteriores);
  - **entre organizações**: média do IGM por instituição/empresa, comparada com as demais (a partir de 5 outras). Nomes são comparados sem diferenciar maiúsculas, acentos e espaços, mas sigla e nome por extenso contam como organizações diferentes.
- Mostra um **gráfico de colunas** com os scores por dimensão
- Gera um **Google Doc** com o relatório e salva um **PDF** em `Meu Drive/AME-IA_Relatorios`
- Envia e-mail ao respondente com o PDF anexo e links para o Drive
- Armazena os dados em planilha Google criada automaticamente (`AME-IA_Base_Dados`), com abas separadas por questionário:
  - Universidades: `Base_Dados` (respostas cruas) e `Processado` (métricas)
  - Empresas: `Empresa_Base_Dados` e `Empresa_Processado`

## Questionário para empresas
- **Escala de maturidade** em vez de concordo/discordo: 0 Não existe · 1 Informal · 2 Definido por escrito · 3 Praticado na maior parte da empresa · 4 Praticado, medido e revisado.
- **"Não sei" e "Não se aplica"** não entram na nota. Se mais de 25% das respostas forem "Não sei", o relatório alerta que a nota é pouco confiável.
- **Plano de ação**: cada item abaixo do nível 3 entra numa lista priorizada (Alta = nível 0–1, Média = nível 2, Verificar = "Não sei"), com o próximo passo e a referência (LGPD, NIST AI RMF, ISO/IEC 42001).
- Dimensões: Governança e responsabilidades · Inventário e classificação de risco · Dados e privacidade · Testes e monitoramento · Fornecedores e terceiros · Transparência e supervisão humana · Incidentes e capacitação.
- As referências indicam o tema correspondente, não cláusulas específicas da ISO/IEC 42001. Os artigos da LGPD citados devem ser conferidos por um profissional jurídico antes de uso comercial.
- O questionário não cita o PL 2338/2023 (marco legal da IA), que até outubro de 2026 não foi aprovado pela Câmara. Quando houver lei, vale revisar os itens.

## Personalizações
- Perguntas, escala, níveis, textos do relatório e do e-mail: `Instrumentos.gs`. Para criar um novo questionário, copie um dos blocos de `INSTRUMENTOS` com outro `id` e abas próprias; ele fica disponível em `?q=<id>`.
- Estilos da página: `Index.html`
- Template do e-mail: `EmailTemplate.html`
- Cálculos, relatório e gravação: `Code.gs`

## Observações
- Os arquivos são gravados em pastas e planilhas automaticamente se não existirem.
- Os relatórios (Doc e PDF) ficam **privados**, pois contêm dados pessoais (LGPD). Apenas o e-mail do respondente recebe acesso de leitura (função `compartilharComRespondente` em `Code.gs`).
- A planilha com todas as respostas não é exibida ao respondente; só o dono do script tem acesso.
- Linhas gravadas na aba `Processado` por versões anteriores usavam outra escala (média × 20) e não são diretamente comparáveis com as novas.
- Os questionários não passaram por validação estatística (painel de especialistas, piloto, análise fatorial). Os cortes dos níveis de maturidade são convenções, não normas.

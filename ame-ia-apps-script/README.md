# AME-IA — Web App (Google Apps Script)

Questionário dinâmico com cálculo automático, gráficos, geração de relatório em PDF, envio por e-mail e armazenamento de dados tratados no Google Sheets.

## Passo a passo

1. Abra `script.google.com` e crie um **novo projeto**.
2. No editor, crie os seguintes arquivos e **cole o conteúdo** correspondente:
   - `Code.gs`
   - `Index.html`
   - `EmailTemplate.html`
   - `appsscript.json` (Menu: Exibir > Mostrar arquivo de manifesto)
3. Salve o projeto (Ctrl/Cmd+S).
4. Execute uma função qualquer (ex.: `doGet`) para o Apps Script solicitar **autorização**.
5. Publique como **Aplicativo da Web**:
   - Menu: Implantar > Implantar como aplicativo da Web
   - "Quem tem acesso": Qualquer pessoa com o link (ou dentro do domínio)
   - Implantar e copiar a URL
6. Abra a URL do Web App e responda ao questionário.

## O que o app faz
- Renderiza as 6 dimensões (36 itens) com escala Likert 1–5
- Calcula os índices dimensionais, IGM, DP, CV, nível e quartil
- Mostra um **gráfico de colunas** com os scores por dimensão
- Gera um **Google Doc** com o relatório e salva um **PDF** em `Meu Drive/AME-IA_Relatorios`
- Envia e-mail ao respondente com os links do relatório (PDF + Doc)
- Armazena os dados em planilha Google criada automaticamente:
  - Aba `Base_Dados`: respostas cruas
  - Aba `Processado`: dados tratados (métricas e classificações)

## Personalizações
- Título, textos e estilos podem ser ajustados em `Index.html`
- Template do e-mail em `EmailTemplate.html`
- Mensagens e lógica de diagnóstico em `Code.gs` (`gerarDiagnostico`, `gerarRecomendacoes`, etc.)

## Observações
- Os arquivos são gravados em pastas e planilhas automaticamente se não existirem.
- Os relatórios (Doc e PDF) são compartilhados como **Qualquer pessoa com o link: visualizador**.
- Para controle restrito, ajuste o compartilhamento no `Code.gs` (função `gerarRelatorioPDF`).
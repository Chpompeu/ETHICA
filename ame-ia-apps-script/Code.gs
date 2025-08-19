const SPREADSHEET_NAME = 'AME-IA_Base_Dados';
const RAW_SHEET_NAME = 'Base_Dados';
const PROCESSED_SHEET_NAME = 'Processado';
const REPORTS_FOLDER_NAME = 'AME-IA_Relatorios';

function doGet() {
	return HtmlService
		.createTemplateFromFile('Index')
		.evaluate()
		.setTitle('AME-IA - Questionário Dinâmico')
		.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
	return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getFormConfig() {
	return {
		likertOptions: [
			{ value: 1, label: 'Discordo totalmente' },
			{ value: 2, label: 'Discordo parcialmente' },
			{ value: 3, label: 'Neutro' },
			{ value: 4, label: 'Concordo parcialmente' },
			{ value: 5, label: 'Concordo totalmente' }
		],
		regioes: ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'],
		cargos: ['Reitor', 'Pró-Reitor', 'Diretor', 'Coordenador', 'Docente', 'Técnico'],
		dimensoes: [
			{
				key: 'avaliacao',
				title: 'Avaliação',
				items: [
					'A instituição operacionaliza métricas sistemáticas para mensuração do impacto educacional dos sistemas de IA implementados.',
					'Existe protocolo institucionalizado para identificação e mitigação de vieses algorítmicos nos sistemas de IA educacional.',
					'Os benefícios e riscos associados aos sistemas de IA são documentados e comunicados formalmente à comunidade acadêmica.',
					'São realizadas análises estratificadas sobre o impacto diferencial da IA em distintos grupos socioeconômicos discentes.',
					'A eficácia pedagógica dos sistemas de IA é mensurada periodicamente através de indicadores objetivos validados.',
					'Existe protocolo estabelecido para identificação e mitigação de consequências não intencionais decorrentes da implementação de IA.'
				]
			},
			{
				key: 'transparencia',
				title: 'Transparência',
				items: [
					'As decisões algorítmicas são explicadas através de linguagem adequada aos diferentes públicos da comunidade acadêmica.',
					'Existe documentação técnica acessível sobre a arquitetura e funcionamento dos algoritmos de IA institucionais.',
					'Os datasets utilizados para treinamento e operação dos sistemas de IA são documentados e auditáveis.',
					'As limitações técnicas e margens de erro dos sistemas de IA são formalmente comunicadas aos stakeholders.',
					'Existem canais institucionalizados para questionamento e esclarecimento sobre decisões algorítmicas.',
					'A instituição produz relatórios periódicos sobre implementação, uso e impacto dos sistemas de IA.'
				]
			},
			{
				key: 'centralidadeHumana',
				title: 'Centralidade Humana',
				items: [
					'O corpo docente mantém autonomia decisória final sobre aspectos pedagógicos, independentemente de recomendações algorítmicas.',
					'Discentes possuem mecanismos formais para contestação e solicitação de revisão humana de decisões algorítmicas.',
					'Os sistemas de IA são arquitetados para augmentação de capacidades humanas, não substituição de agentes.',
					'Existe protocolo institucional definindo categorias de decisões não passíveis de automação integral.',
					'A autonomia intelectual e criatividade de docentes e discentes são preservadas nos processos mediados por IA.',
					'Existem mecanismos técnicos e procedimentais para override ou desativação de sistemas de IA quando necessário.'
				]
			},
			{
				key: 'inclusao',
				title: 'Inclusão',
				items: [
					'Os sistemas de IA são submetidos a testes com grupos demograficamente diversos previamente à implementação.',
					'Pessoas com deficiência participam ativamente dos processos de desenvolvimento e avaliação dos sistemas de IA.',
					'A instituição considera sistematicamente diferentes contextos socioeconômicos na implementação de soluções de IA.',
					'Há representatividade de grupos minoritários nas instâncias decisórias sobre governança de IA.',
					'Os sistemas de IA incorporam e valorizam epistemologias plurais e diferentes modalidades de aprendizagem.',
					'Existem alternativas analógicas estruturadas para discentes sem acesso adequado à infraestrutura tecnológica.'
				]
			},
			{
				key: 'conformidade',
				title: 'Conformidade',
				items: [
					'A instituição demonstra conformidade integral com a Lei Geral de Proteção de Dados (LGPD) no contexto de IA educacional.',
					'Existe comitê de ética institucionalizado para avaliação e aprovação de projetos envolvendo IA.',
					'Os instrumentos contratuais com fornecedores de soluções de IA incorporam cláusulas éticas e de responsabilização.',
					'A instituição adere a frameworks nacionais e internacionais de governança ética em IA.',
					'Existem protocolos estruturados de consentimento informado para utilização de dados em sistemas de IA.',
					'São realizadas auditorias periódicas para verificação de conformidade legal e ética dos sistemas de IA.'
				]
			},
			{
				key: 'sustentabilidade',
				title: 'Sustentabilidade',
				items: [
					'A instituição mensura e monitora o impacto ambiental (pegada carbônica) dos sistemas de IA implementados.',
					'Existe planejamento estratégico para sustentabilidade tecnológica independente de fornecedores externos.',
					'Os custos totais de propriedade (TCO) de longo prazo são considerados nas decisões de adoção de IA.',
					'A instituição desenvolve sistematicamente capacidade técnica interna para manutenção e evolução de sistemas de IA.',
					'O conhecimento institucional sobre IA é compartilhado através de redes colaborativas interinstitucionais.',
					'Os sistemas de IA são alinhados estrategicamente com a missão institucional e objetivos educacionais de longo prazo.'
				]
			}
		]
	};
}

function submitResponse(payload) {
	try {
		const spreadsheet = getOrCreateSpreadsheet();
		const rawSheet = getOrCreateSheet(spreadsheet, RAW_SHEET_NAME, [
			'Timestamp', 'Email', 'Instituição', 'Região', 'Cargo',
			...buildRawHeaders()
		]);
		const processedSheet = getOrCreateSheet(spreadsheet, PROCESSED_SHEET_NAME, [
			'Timestamp', 'Email', 'Instituição', 'Região', 'Cargo',
			'IGM', 'DP', 'CV', 'Quartil', 'Nível (número)', 'Nível (nome)',
			'Avaliação', 'Transparência', 'Centralidade Humana', 'Inclusão', 'Conformidade', 'Sustentabilidade',
			'Ponto Forte (dim)', 'Ponto Forte (score)', 'Ponto Fraco (dim)', 'Ponto Fraco (score)'
		]);

		const indices = computeIndices(payload.answers);
		const igm = calcularIGM(indices);
		const estatisticas = calcularEstatisticas(indices, igm);
		const diagnostico = gerarDiagnostico(indices, estatisticas);

		appendRawRow(rawSheet, payload);
		appendProcessedRow(processedSheet, payload, indices, igm, estatisticas, diagnostico);

		const folder = getOrCreateReportsFolder();
		const { docUrl, pdfUrl } = gerarRelatorioPDF(folder, payload, indices, igm, estatisticas, diagnostico, spreadsheet.getUrl());

		enviarEmailRelatorio(payload.email, pdfUrl, docUrl, igm, diagnostico);

		return {
			spreadsheetUrl: spreadsheet.getUrl(),
			indices: indices,
			igm: igm,
			estatisticas: estatisticas,
			diagnostico: diagnostico,
			docUrl: docUrl,
			pdfUrl: pdfUrl
		};
	} catch (err) {
		throw new Error('Falha ao processar resposta: ' + (err && err.message ? err.message : err));
	}
}

function buildRawHeaders() {
	const cfg = getFormConfig();
	const headers = [];
	cfg.dimensoes.forEach(function(dim) {
		dim.items.forEach(function(_, idx) {
			headers.push(dim.title + ' - Q' + (idx + 1));
		});
	});
	return headers;
}

function appendRawRow(sheet, payload) {
	const cfg = getFormConfig();
	const row = [
		new Date(), payload.email, payload.instituicao, payload.regiao, payload.cargo
	];
	cfg.dimensoes.forEach(function(dim) {
		const valores = payload.answers[dim.key] || [];
		for (var i = 0; i < dim.items.length; i++) {
			row.push(parseInt(valores[i], 10));
		}
	});
	sheet.appendRow(row);
}

function appendProcessedRow(sheet, payload, indices, igm, estatisticas, diagnostico) {
	sheet.appendRow([
		new Date(),
		payload.email,
		payload.instituicao,
		payload.regiao,
		payload.cargo,
		igm,
		estatisticas.desvioPadrao,
		estatisticas.coeficienteVariacao,
		calcularQuartil(estatisticas.media),
		diagnostico.nivel.numero,
		diagnostico.nivel.nome,
		indices.avaliacao,
		indices.transparencia,
		indices.centralidadeHumana,
		indices.inclusao,
		indices.conformidade,
		indices.sustentabilidade,
		diagnostico.pontoForte[0], diagnostico.pontoForte[1],
		diagnostico.pontoFraco[0], diagnostico.pontoFraco[1]
	]);
}

function computeIndices(answers) {
	function calcularIndice(valores) {
		var soma = 0;
		for (var i = 0; i < valores.length; i++) {
			soma += parseInt(valores[i], 10);
		}
		return (soma / valores.length) * 20; // converte 1-5 para 0-100
	}
	return {
		avaliacao: calcularIndice(answers.avaliacao || []),
		transparencia: calcularIndice(answers.transparencia || []),
		centralidadeHumana: calcularIndice(answers.centralidadeHumana || []),
		inclusao: calcularIndice(answers.inclusao || []),
		conformidade: calcularIndice(answers.conformidade || []),
		sustentabilidade: calcularIndice(answers.sustentabilidade || [])
	};
}

function calcularIGM(indices) {
	var valores = Object.values(indices);
	var soma = 0;
	for (var i = 0; i < valores.length; i++) soma += valores[i];
	return soma / valores.length;
}

function calcularEstatisticas(indices, igm) {
	var valores = Object.values(indices);
	var sq = 0;
	for (var i = 0; i < valores.length; i++) {
		sq += Math.pow(valores[i] - igm, 2);
	}
	var desvioPadrao = Math.sqrt(sq / valores.length);
	return {
		media: igm,
		desvioPadrao: desvioPadrao,
		coeficienteVariacao: (desvioPadrao / igm) * 100,
		min: Math.min.apply(null, valores),
		max: Math.max.apply(null, valores),
		amplitude: Math.max.apply(null, valores) - Math.min.apply(null, valores)
	};
}

function gerarDiagnostico(indices, estatisticas) {
	var entries = Object.entries(indices).sort(function(a, b) { return b[1] - a[1]; });
	return {
		pontoForte: entries[0],
		pontoFraco: entries[entries.length - 1],
		assimetria: estatisticas.coeficienteVariacao > 20,
		nivel: getNivelMaturidade(estatisticas.media),
		quartil: calcularQuartil(estatisticas.media)
	};
}

function getNivelMaturidade(score) {
	if (score >= 81) return { numero: 5, nome: 'Referência - Excelência em Governança' };
	if (score >= 61) return { numero: 4, nome: 'Avançado - Governança Estruturada' };
	if (score >= 41) return { numero: 3, nome: 'Intermediário - Desenvolvimento Progressivo' };
	if (score >= 21) return { numero: 2, nome: 'Básico - Estruturação Preliminar' };
	return { numero: 1, nome: 'Inicial - Governança Incipiente' };
}

function classificar(score) {
	if (score >= 80) return 'Referência';
	if (score >= 70) return 'Adequado';
	if (score >= 50) return 'Em Desenvolvimento';
	return 'Crítico';
}

function calcularDP(valor) {
	return (valor * 0.15).toFixed(1);
}

function calcularQuartil(score) {
	if (score >= 75) return 'quartil superior (Q3)';
	if (score >= 58) return 'tercil superior';
	if (score >= 42) return 'tercil médio';
	return 'tercil inferior';
}

function gerarInterpretacao(indices, diagnostico) {
	var padrao = identificarPadrao(indices);
	return 'Os resultados indicam ' + padrao + ', padrão consistente com instituições do Sul Global conforme literatura (Santos, 2007; Quijano, 2000). A discrepância identificada corrobora hipóteses sobre colonialidade algorítmica e necessidade de abordagens contextualizadas.';
}

function identificarPadrao(indices) {
	if (indices.conformidade > indices.inclusao + 20) {
		return 'maturidade técnico-normativa desenvolvida com lacunas socioculturais';
	}
	if (indices.transparencia > indices.sustentabilidade + 20) {
		return 'foco em aspectos procedimentais com gaps em sustentabilidade';
	}
	return 'desenvolvimento equilibrado com oportunidades de melhoria sistêmica';
}

function gerarRecomendacoes(dimensao) {
	var rec = {
		avaliacao: '• Implementação de framework de métricas de impacto educacional\n• Estabelecimento de protocolos de auditoria algorítmica\n• Desenvolvimento de indicadores de equidade e justiça',
		transparencia: '• Desenvolvimento de documentação técnica multinível\n• Criação de interfaces de explicabilidade algorítmica\n• Estabelecimento de canais de accountability',
		centralidadeHumana: '• Fortalecimento de mecanismos de supervisão humana\n• Preservação da autonomia docente e discente\n• Implementação de protocolos de override',
		inclusao: '• Incorporação de epistemologias plurais no design de sistemas\n• Implementação de testes com grupos demograficamente diversos\n• Estabelecimento de governança participativa inclusiva',
		conformidade: '• Adequação integral aos marcos regulatórios (LGPD, AI Act)\n• Constituição de comitê de ética em IA\n• Desenvolvimento de framework de compliance',
		sustentabilidade: '• Desenvolvimento de capacidade técnica institucional\n• Avaliação de impactos ambientais e sociais\n• Planejamento estratégico de longo prazo'
	};
	return rec[dimensao] || 'Desenvolvimento de plano de ação específico recomendado.';
}

function gerarCriteriosOperacionais(dimensao) {
	var criterios = {
		avaliacao: 'Primário: Auditabilidade Contínua | Secundário: Explicabilidade Algorítmica',
		transparencia: 'Primário: Explicabilidade Algorítmica | Secundário: Participação Coletiva',
		centralidadeHumana: 'Primário: Participação Coletiva | Secundário: Auditabilidade Contínua',
		inclusao: 'Primário: Epistemologia Plural | Secundário: Participação Coletiva',
		conformidade: 'Integração de todos os critérios operacionais do Modelo Contextual',
		sustentabilidade: 'Desenvolvimento equilibrado dos quatro critérios operacionais'
	};
	return criterios[dimensao];
}

function getOrCreateSpreadsheet() {
	const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
	if (files.hasNext()) {
		const file = files.next();
		return SpreadsheetApp.open(file);
	}
	const ss = SpreadsheetApp.create(SPREADSHEET_NAME);
	return ss;
}

function getOrCreateSheet(spreadsheet, name, headers) {
	var sheet = spreadsheet.getSheetByName(name);
	if (!sheet) {
		sheet = spreadsheet.insertSheet(name);
		if (headers && headers.length) {
			sheet.appendRow(headers);
		}
	} else {
		// Garantir cabeçalhos na primeira linha se vazia
		if (headers && headers.length && sheet.getLastRow() === 0) {
			sheet.appendRow(headers);
		}
	}
	return sheet;
}

function getOrCreateReportsFolder() {
	var folders = DriveApp.getFoldersByName(REPORTS_FOLDER_NAME);
	if (folders.hasNext()) return folders.next();
	return DriveApp.createFolder(REPORTS_FOLDER_NAME);
}

function gerarRelatorioPDF(folder, payload, indices, igm, estatisticas, diagnostico, spreadsheetUrl) {
	var doc = DocumentApp.create('Relatório AME-IA - ' + payload.instituicao + ' - ' + new Date().toISOString());
	var body = doc.getBody();
	body.appendParagraph('AME-IA | Diagnóstico Institucional - Modelo Contextual').setHeading(DocumentApp.ParagraphHeading.HEADING1);
	body.appendParagraph('Respondente: ' + payload.email);
	body.appendParagraph('Instituição: ' + payload.instituicao + ' | Região: ' + payload.regiao + ' | Cargo: ' + payload.cargo);
	body.appendParagraph('');
	body.appendParagraph('Índice Global de Maturidade (IGM): ' + estatisticas.media.toFixed(1) + '%');
	body.appendParagraph('Classificação: Nível ' + diagnostico.nivel.numero + ' - ' + diagnostico.nivel.nome);
	body.appendParagraph('CV: ' + estatisticas.coeficienteVariacao.toFixed(1) + '% | DP: ' + estatisticas.desvioPadrao.toFixed(1));
	body.appendParagraph('');

	var tableData = [
		['Dimensão', 'Score (%)', 'Classificação'],
		['Avaliação', indices.avaliacao.toFixed(1), classificar(indices.avaliacao)],
		['Transparência', indices.transparencia.toFixed(1), classificar(indices.transparencia)],
		['Centralidade Humana', indices.centralidadeHumana.toFixed(1), classificar(indices.centralidadeHumana)],
		['Inclusão', indices.inclusao.toFixed(1), classificar(indices.inclusao)],
		['Conformidade', indices.conformidade.toFixed(1), classificar(indices.conformidade)],
		['Sustentabilidade', indices.sustentabilidade.toFixed(1), classificar(indices.sustentabilidade)]
	];
	body.appendTable(tableData);
	body.appendParagraph('');

	body.appendParagraph('Análise Contextual').setHeading(DocumentApp.ParagraphHeading.HEADING2);
	body.appendParagraph('Ponto forte: ' + diagnostico.pontoForte[0] + ' (' + diagnostico.pontoForte[1].toFixed(1) + '%)');
	body.appendParagraph('Ponto fraco: ' + diagnostico.pontoFraco[0] + ' (' + diagnostico.pontoFraco[1].toFixed(1) + '%)');
	body.appendParagraph(gerarInterpretacao(indices, diagnostico));
	body.appendParagraph('');

	body.appendParagraph('Recomendações Estratégicas').setHeading(DocumentApp.ParagraphHeading.HEADING2);
	body.appendParagraph('Prioridade imediata - Dimensão ' + diagnostico.pontoFraco[0]);
	body.appendParagraph(gerarRecomendacoes(diagnostico.pontoFraco[0]));
	body.appendParagraph('Critérios operacionais aplicáveis: ' + gerarCriteriosOperacionais(diagnostico.pontoFraco[0]));
	body.appendParagraph('');

	body.appendParagraph('Dados e próximos passos').setHeading(DocumentApp.ParagraphHeading.HEADING2);
	body.appendParagraph('Planilha com dados: ' + spreadsheetUrl);
	body.appendParagraph('Para relatório expandido, responda este email.');

	doc.saveAndClose();

	var file = DriveApp.getFileById(doc.getId());
	folder.addFile(file);
	DriveApp.getRootFolder().removeFile(file);

	file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
	var pdfBlob = file.getAs('application/pdf');
	var pdf = folder.createFile(pdfBlob).setName(file.getName() + '.pdf');
	pdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

	return { docUrl: file.getUrl(), pdfUrl: pdf.getUrl() };
}

function enviarEmailRelatorio(email, pdfUrl, docUrl, igm, diagnostico) {
	var subject = 'AME-IA | Diagnóstico Institucional - IGM: ' + Math.round(igm) + '%';
	var template = HtmlService.createTemplateFromFile('EmailTemplate');
	template.igm = igm;
	template.diagnostico = diagnostico;
	template.docUrl = docUrl;
	template.pdfUrl = pdfUrl;
	var html = template.evaluate().getContent();
	MailApp.sendEmail({
		to: email,
		subject: subject,
		htmlBody: html
	});
}
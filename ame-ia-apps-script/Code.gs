// Motor genérico do questionário. Os conteúdos (perguntas, escala, níveis, textos)
// ficam em Instrumentos.gs.

const SPREADSHEET_NAME = 'AME-IA_Base_Dados';
const REPORTS_FOLDER_NAME = 'AME-IA_Relatorios';
// Identifica linhas calculadas na escala atual (cada opção vale 0, 25, 50, 75 ou 100).
const ESCALA_VERSAO = 'v2';
// Mínimo de respostas anteriores para calcular percentil/quartil relativo.
const MIN_RESPOSTAS_COMPARACAO = 10;
// Mínimo de outras organizações para calcular percentil/quartil entre organizações.
const MIN_ORGANIZACOES_COMPARACAO = 5;
// Acima desta proporção de "Não sei", o relatório alerta que a nota é pouco confiável.
const LIMITE_NAO_SEI = 0.25;

function doGet(e) {
	var id = e && e.parameter && e.parameter.q;
	if (!INSTRUMENTOS[id]) id = INSTRUMENTO_PADRAO;
	var template = HtmlService.createTemplateFromFile('Index');
	template.instrumentoId = id;
	return template
		.evaluate()
		.setTitle(INSTRUMENTOS[id].titulo)
		.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
	return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getFormConfig(id) {
	return getInstrumento(id);
}

function submitResponse(payload) {
	try {
		const cfg = getInstrumento(payload && payload.instrumento);
		validarPayload(cfg, payload);
		const spreadsheet = getOrCreateSpreadsheet();
		const rawSheet = getOrCreateSheet(spreadsheet, cfg.abaRespostas, buildRawHeaders(cfg));
		const processedSheet = getOrCreateSheet(spreadsheet, cfg.abaProcessado, buildProcessedHeaders(cfg));

		const resultado = calcularResultado(cfg, payload.answers);
		// Calculado antes de gravar a linha atual, para não comparar a resposta consigo mesma.
		resultado.diagnostico.comparacao = calcularPosicaoRelativa(cfg, processedSheet, resultado.igm, payload.organizacao);

		appendRawRow(cfg, rawSheet, payload);
		appendProcessedRow(cfg, processedSheet, payload, resultado);

		const folder = getOrCreateReportsFolder();
		const { docUrl, pdfUrl, pdfBlob } = gerarRelatorioPDF(cfg, folder, payload, resultado);

		enviarEmailRelatorio(cfg, payload.email, pdfUrl, docUrl, pdfBlob, resultado);

		resultado.docUrl = docUrl;
		resultado.pdfUrl = pdfUrl;
		return resultado;
	} catch (err) {
		throw new Error('Falha ao processar resposta: ' + (err && err.message ? err.message : err));
	}
}

function validarPayload(cfg, payload) {
	if (!payload || !payload.answers) throw new Error('Respostas ausentes.');
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email || '').trim())) {
		throw new Error('E-mail inválido.');
	}
	if (!String(payload.organizacao || '').trim()) throw new Error(cfg.organizacao.rotulo + ' não informada.');
	cfg.perfil.forEach(function(campo) {
		const valor = payload.perfil && payload.perfil[campo.campo];
		if (campo.opcoes.indexOf(valor) < 0) throw new Error('Campo "' + campo.rotulo + '" inválido.');
	});
	cfg.dimensoes.forEach(function(dim) {
		const valores = payload.answers[dim.key] || [];
		if (valores.length !== dim.items.length) {
			throw new Error('Respostas incompletas na dimensão ' + dim.title + '.');
		}
		valores.forEach(function(v) {
			if (!opcaoEscala(cfg, v)) throw new Error('Resposta fora da escala na dimensão ' + dim.title + '.');
		});
	});
}

function opcaoEscala(cfg, valor) {
	return cfg.escala.filter(function(o) { return o.value === String(valor); })[0];
}

function textoItem(item) {
	return typeof item === 'string' ? item : item.texto;
}

function labelDimensao(cfg, key) {
	const dim = cfg.dimensoes.filter(function(d) { return d.key === key; })[0];
	return dim ? dim.title : key;
}

function buildRawHeaders(cfg) {
	const headers = ['Timestamp', 'Email', cfg.organizacao.rotulo];
	cfg.perfil.forEach(function(campo) { headers.push(campo.rotulo); });
	cfg.dimensoes.forEach(function(dim) {
		dim.items.forEach(function(_, idx) {
			headers.push(dim.title + ' - Q' + (idx + 1));
		});
	});
	return headers;
}

// A ordem das colunas só cresce no final, para manter planilhas antigas compatíveis.
function buildProcessedHeaders(cfg) {
	const org = cfg.organizacao;
	const orgPlural = org.plural.charAt(0).toUpperCase() + org.plural.slice(1);
	const headers = ['Timestamp', 'Email', org.rotulo];
	cfg.perfil.forEach(function(campo) { headers.push(campo.rotulo); });
	headers.push('IGM', 'DP', 'CV', 'Faixa da escala', 'Nível (número)', 'Nível (nome)');
	cfg.dimensoes.forEach(function(dim) { headers.push(dim.title); });
	headers.push(
		'Ponto Forte (dim)', 'Ponto Forte (score)', 'Ponto Fraco (dim)', 'Ponto Fraco (score)',
		'Percentil (respostas anteriores)', 'Quartil (respostas anteriores)', 'Base de comparação (n)', 'Versão da escala',
		'IGM médio da ' + org.singular, 'Percentil (' + org.plural + ')', 'Quartil (' + org.plural + ')', orgPlural + ' comparadas (n)',
		'Respostas "Não sei" (%)', 'Respostas "Não se aplica" (%)', 'Itens no plano de ação (n)'
	);
	return headers;
}

function appendRawRow(cfg, sheet, payload) {
	const row = [new Date(), payload.email, payload.organizacao];
	cfg.perfil.forEach(function(campo) { row.push(payload.perfil[campo.campo]); });
	cfg.dimensoes.forEach(function(dim) {
		const valores = payload.answers[dim.key];
		for (var i = 0; i < dim.items.length; i++) {
			const v = String(valores[i]);
			row.push(isNaN(Number(v)) ? v : Number(v));
		}
	});
	sheet.appendRow(row);
}

function appendProcessedRow(cfg, sheet, payload, r) {
	const d = r.diagnostico;
	const resp = d.comparacao.respondentes;
	const org = d.comparacao.organizacoes;
	const row = [new Date(), payload.email, payload.organizacao];
	cfg.perfil.forEach(function(campo) { row.push(payload.perfil[campo.campo]); });
	row.push(r.igm, r.estatisticas.desvioPadrao, r.estatisticas.coeficienteVariacao, d.faixa, d.nivel.numero, d.nivel.nome);
	cfg.dimensoes.forEach(function(dim) {
		row.push(r.indices[dim.key] === null ? '' : r.indices[dim.key]);
	});
	row.push(
		d.pontoForte[0], d.pontoForte[1], d.pontoFraco[0], d.pontoFraco[1],
		resp.disponivel ? resp.percentil : '', resp.disponivel ? resp.quartil : '', resp.n,
		ESCALA_VERSAO,
		org.igmOrganizacao, org.disponivel ? org.percentil : '', org.disponivel ? org.quartil : '', org.n,
		Math.round(r.contagem.ns / r.contagem.total * 100),
		Math.round(r.contagem.na / r.contagem.total * 100),
		r.planoAcao ? r.planoAcao.length : ''
	);
	sheet.appendRow(row);
}

// Converte as respostas em índices 0-100 por dimensão. "Não sei" e "Não se aplica"
// não entram na média; uma dimensão sem nenhuma resposta válida fica sem índice (null).
function calcularResultado(cfg, answers) {
	const indices = {};
	const contagem = { total: 0, ns: 0, na: 0 };
	const itens = [];
	cfg.dimensoes.forEach(function(dim) {
		const scores = [];
		answers[dim.key].forEach(function(valor, idx) {
			const opcao = opcaoEscala(cfg, valor);
			contagem.total++;
			if (opcao.score === null) contagem[opcao.tipo]++;
			else scores.push(opcao.score);
			itens.push({ dim: dim, item: dim.items[idx], opcao: opcao });
		});
		indices[dim.key] = scores.length ? media(scores) : null;
	});

	const valores = cfg.dimensoes
		.map(function(dim) { return indices[dim.key]; })
		.filter(function(v) { return v !== null; });
	if (!valores.length) {
		throw new Error('Nenhuma resposta válida: todas foram "Não sei" ou "Não se aplica".');
	}
	const igm = media(valores);
	const estatisticas = calcularEstatisticas(valores, igm);
	return {
		indices: indices,
		igm: igm,
		estatisticas: estatisticas,
		diagnostico: gerarDiagnostico(cfg, indices, estatisticas),
		contagem: contagem,
		alertaNaoSei: contagem.ns / contagem.total > LIMITE_NAO_SEI,
		planoAcao: gerarPlanoAcao(cfg, itens)
	};
}

function media(valores) {
	var soma = 0;
	for (var i = 0; i < valores.length; i++) soma += valores[i];
	return soma / valores.length;
}

function calcularEstatisticas(valores, igm) {
	var sq = 0;
	for (var i = 0; i < valores.length; i++) {
		sq += Math.pow(valores[i] - igm, 2);
	}
	var desvioPadrao = Math.sqrt(sq / valores.length);
	return {
		media: igm,
		desvioPadrao: desvioPadrao,
		coeficienteVariacao: igm > 0 ? (desvioPadrao / igm) * 100 : 0,
		min: Math.min.apply(null, valores),
		max: Math.max.apply(null, valores),
		amplitude: Math.max.apply(null, valores) - Math.min.apply(null, valores)
	};
}

function gerarDiagnostico(cfg, indices, estatisticas) {
	var entries = Object.keys(indices)
		.filter(function(k) { return indices[k] !== null; })
		.map(function(k) { return [k, indices[k]]; })
		.sort(function(a, b) { return b[1] - a[1]; });
	return {
		pontoForte: entries[0],
		pontoFraco: entries[entries.length - 1],
		assimetria: estatisticas.coeficienteVariacao > 20,
		nivel: getNivelMaturidade(cfg, estatisticas.media),
		faixa: calcularFaixaEscala(estatisticas.media)
	};
}

function getNivelMaturidade(cfg, score) {
	for (var i = 0; i < cfg.niveis.length; i++) {
		if (score >= cfg.niveis[i].min) return { numero: cfg.niveis[i].numero, nome: cfg.niveis[i].nome };
	}
	return { numero: cfg.niveis[cfg.niveis.length - 1].numero, nome: cfg.niveis[cfg.niveis.length - 1].nome };
}

function classificar(score) {
	if (score >= 80) return 'Referência';
	if (score >= 70) return 'Adequado';
	if (score >= 50) return 'Em Desenvolvimento';
	return 'Crítico';
}

// Posição do score dentro da própria escala 0-100 (quartos da escala).
// Não é um quartil populacional: não compara com outras organizações.
function calcularFaixaEscala(score) {
	if (score >= 75) return '4º quarto da escala (75–100)';
	if (score >= 50) return '3º quarto da escala (50–75)';
	if (score >= 25) return '2º quarto da escala (25–50)';
	return '1º quarto da escala (0–25)';
}

// Lista do que falta, por item, para instrumentos que definem metaItem e uma ação por pergunta.
function gerarPlanoAcao(cfg, itens) {
	if (!cfg.metaItem) return null;
	var ordem = { 'Alta': 0, 'Média': 1, 'Verificar': 2 };
	return itens
		.filter(function(it) {
			if (it.opcao.tipo === 'ns') return true;
			return it.opcao.score !== null && it.opcao.score < cfg.metaItem;
		})
		.map(function(it) {
			var prioridade = it.opcao.tipo === 'ns' ? 'Verificar' : (it.opcao.score <= 25 ? 'Alta' : 'Média');
			return {
				prioridade: prioridade,
				dimensao: it.dim.title,
				texto: textoItem(it.item),
				situacao: it.opcao.label,
				acao: it.item.acao || '',
				ref: it.item.ref || ''
			};
		})
		.sort(function(a, b) { return ordem[a.prioridade] - ordem[b.prioridade]; });
}

function gerarInterpretacao(cfg, indices, diagnostico, estatisticas) {
	var aviso = ' ' + cfg.avisos[0];
	if (estatisticas.amplitude === 0) {
		return 'Todas as dimensões obtiveram o mesmo score (' + estatisticas.media.toFixed(1) + ').' + aviso;
	}
	var texto = 'Os resultados indicam ' + identificarPadrao(cfg, indices) + '. ' +
		'A dimensão mais desenvolvida é ' + labelDimensao(cfg, diagnostico.pontoForte[0]) +
		' (' + diagnostico.pontoForte[1].toFixed(1) + ') e a menos desenvolvida é ' +
		labelDimensao(cfg, diagnostico.pontoFraco[0]) + ' (' + diagnostico.pontoFraco[1].toFixed(1) +
		'), uma amplitude de ' + estatisticas.amplitude.toFixed(1) + ' pontos.';
	if (diagnostico.assimetria) {
		texto += ' O coeficiente de variação acima de 20% sinaliza desenvolvimento assimétrico entre as dimensões.';
	}
	return texto + aviso;
}

function identificarPadrao(cfg, indices) {
	for (var i = 0; i < cfg.padroes.length; i++) {
		var p = cfg.padroes[i];
		var a = indices[p.acima], b = indices[p.abaixo];
		if (a !== null && b !== null && a > b + p.margem) return p.texto;
	}
	return cfg.padraoGeral;
}

// Posição do IGM em relação às respostas já gravadas na escala atual, de duas formas:
// - respondentes: cada resposta anterior conta uma vez;
// - organizacoes: média do IGM por organização, comparando a organização atual
//   (incluindo esta resposta) com as demais.
function calcularPosicaoRelativa(cfg, sheet, igm, organizacao) {
	var anteriores = [];
	var porOrganizacao = {};
	if (sheet.getLastRow() > 1) {
		var dados = sheet.getDataRange().getValues();
		var cab = dados[0];
		var colIgm = cab.indexOf('IGM');
		var colOrg = cab.indexOf(cfg.organizacao.rotulo);
		var colEscala = cab.indexOf('Versão da escala');
		for (var i = 1; i < dados.length; i++) {
			var valor = dados[i][colIgm];
			if (colEscala >= 0 && dados[i][colEscala] === ESCALA_VERSAO && typeof valor === 'number') {
				anteriores.push(valor);
				var chave = normalizarNome(dados[i][colOrg]);
				(porOrganizacao[chave] = porOrganizacao[chave] || []).push(valor);
			}
		}
	}

	var chaveAtual = normalizarNome(organizacao);
	var daAtual = (porOrganizacao[chaveAtual] || []).concat([igm]);
	var igmOrganizacao = media(daAtual);
	var outras = Object.keys(porOrganizacao)
		.filter(function(k) { return k !== chaveAtual; })
		.map(function(k) { return media(porOrganizacao[k]); });

	var porOrg = calcularPercentil(outras, igmOrganizacao, MIN_ORGANIZACOES_COMPARACAO);
	porOrg.igmOrganizacao = igmOrganizacao;
	porOrg.respostasDaOrganizacao = daAtual.length;

	return {
		respondentes: calcularPercentil(anteriores, igm, MIN_RESPOSTAS_COMPARACAO),
		organizacoes: porOrg
	};
}

// "UFMG ", "ufmg" e "Ufmg" contam como a mesma organização. Siglas e nomes por
// extenso ("Universidade Federal de Minas Gerais") continuam sendo diferentes.
function normalizarNome(nome) {
	return String(nome || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
		.toLowerCase().replace(/\s+/g, ' ').trim();
}

function calcularPercentil(anteriores, igm, minimo) {
	var n = anteriores.length;
	if (n < minimo) return { disponivel: false, n: n };
	var abaixo = 0, iguais = 0;
	for (var i = 0; i < n; i++) {
		if (anteriores[i] < igm) abaixo++;
		else if (anteriores[i] === igm) iguais++;
	}
	// Percentil de posição com empates contados pela metade.
	var percentil = Math.round(((abaixo + iguais / 2) / n) * 100);
	var quartil = percentil >= 75 ? 'Q4' : percentil >= 50 ? 'Q3' : percentil >= 25 ? 'Q2' : 'Q1';
	return { disponivel: true, n: n, percentil: percentil, quartil: quartil };
}

function descreverComparacaoRespondentes(c) {
	if (!c.disponivel) {
		return 'Indisponível: são necessárias ao menos ' + MIN_RESPOSTAS_COMPARACAO +
			' respostas anteriores (há ' + c.n + ').';
	}
	return 'Percentil ' + c.percentil + ' (' + c.quartil + ') em relação a ' + c.n + ' respostas anteriores.';
}

function descreverComparacaoOrganizacoes(cfg, c) {
	var org = cfg.organizacao;
	var base = 'IGM médio da ' + org.singular + ': ' + c.igmOrganizacao.toFixed(1) + ' (' + c.respostasDaOrganizacao +
		(c.respostasDaOrganizacao === 1 ? ' resposta). ' : ' respostas). ');
	if (!c.disponivel) {
		return base + 'Comparação indisponível: são necessárias ao menos ' + MIN_ORGANIZACOES_COMPARACAO +
			' outras ' + org.plural + ' (há ' + c.n + ').';
	}
	return base + 'Percentil ' + c.percentil + ' (' + c.quartil + ') em relação a ' + c.n + ' outras ' + org.plural + '.';
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
		if (headers && headers.length) {
			if (sheet.getLastRow() === 0) {
				sheet.appendRow(headers);
			} else {
				// As colunas só são acrescentadas ao final, então reescrever a linha de
				// cabeçalho atualiza planilhas criadas por versões anteriores.
				sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
			}
		}
	}
	return sheet;
}

function getOrCreateReportsFolder() {
	var folders = DriveApp.getFoldersByName(REPORTS_FOLDER_NAME);
	if (folders.hasNext()) return folders.next();
	return DriveApp.createFolder(REPORTS_FOLDER_NAME);
}

function gerarRelatorioPDF(cfg, folder, payload, r) {
	var d = r.diagnostico;
	var est = r.estatisticas;
	var H2 = DocumentApp.ParagraphHeading.HEADING2;
	var doc = DocumentApp.create(cfg.relatorioPrefixo + ' - ' + payload.organizacao + ' - ' + new Date().toISOString());
	var body = doc.getBody();
	body.appendParagraph(cfg.relatorioTitulo).setHeading(DocumentApp.ParagraphHeading.HEADING1);
	body.appendParagraph('Respondente: ' + payload.email);
	body.appendParagraph([cfg.organizacao.rotulo + ': ' + payload.organizacao].concat(cfg.perfil.map(function(campo) {
		return campo.rotulo + ': ' + payload.perfil[campo.campo];
	})).join(' | '));
	body.appendParagraph('');
	body.appendParagraph('Índice Global de Maturidade (IGM): ' + est.media.toFixed(1) + ' / 100');
	body.appendParagraph('Classificação: Nível ' + d.nivel.numero + ' - ' + d.nivel.nome);
	body.appendParagraph('Posição na escala: ' + d.faixa);
	body.appendParagraph('Comparação com outros respondentes: ' + descreverComparacaoRespondentes(d.comparacao.respondentes));
	body.appendParagraph('Comparação com outras ' + cfg.organizacao.plural + ': ' + descreverComparacaoOrganizacoes(cfg, d.comparacao.organizacoes));
	body.appendParagraph('As comparações usam apenas quem já respondeu ao questionário; não representam o conjunto das ' + cfg.organizacao.plural + ' do país.');
	body.appendParagraph('CV: ' + est.coeficienteVariacao.toFixed(1) + '% | DP entre dimensões: ' + est.desvioPadrao.toFixed(1) + ' pontos');
	if (r.contagem.ns || r.contagem.na) {
		body.appendParagraph('Respostas "Não sei": ' + r.contagem.ns + ' de ' + r.contagem.total +
			' | "Não se aplica": ' + r.contagem.na + ' de ' + r.contagem.total + ' (não entram na nota).');
	}
	if (r.alertaNaoSei) {
		body.appendParagraph('Atenção: mais de ' + Math.round(LIMITE_NAO_SEI * 100) + '% das respostas foram "Não sei". ' +
			'A nota é pouco confiável; isso também indica que a governança de IA é pouco visível para quem respondeu.');
	}
	body.appendParagraph('');

	var tableData = [['Dimensão', 'Score (0–100)', 'Classificação']];
	cfg.dimensoes.forEach(function(dim) {
		var s = r.indices[dim.key];
		tableData.push([dim.title, s === null ? 'sem dados' : s.toFixed(1), s === null ? '—' : classificar(s)]);
	});
	body.appendTable(tableData);
	body.appendParagraph('');

	body.appendParagraph('Análise').setHeading(H2);
	body.appendParagraph('Ponto forte: ' + labelDimensao(cfg, d.pontoForte[0]) + ' (' + d.pontoForte[1].toFixed(1) + ')');
	body.appendParagraph('Ponto fraco: ' + labelDimensao(cfg, d.pontoFraco[0]) + ' (' + d.pontoFraco[1].toFixed(1) + ')');
	body.appendParagraph(gerarInterpretacao(cfg, r.indices, d, est));
	body.appendParagraph('');

	var dimFraca = cfg.dimensoes.filter(function(dim) { return dim.key === d.pontoFraco[0]; })[0];
	if (dimFraca.recomendacoes) {
		body.appendParagraph('Recomendações Estratégicas').setHeading(H2);
		body.appendParagraph('Prioridade imediata - Dimensão ' + dimFraca.title);
		body.appendParagraph(dimFraca.recomendacoes);
		if (dimFraca.criterios) body.appendParagraph('Critérios operacionais aplicáveis: ' + dimFraca.criterios);
		body.appendParagraph('');
	}

	if (r.planoAcao) {
		body.appendParagraph('Plano de ação').setHeading(H2);
		if (!r.planoAcao.length) {
			body.appendParagraph('Todos os itens respondidos estão no nível "praticado" ou acima. Próximo passo: medir e revisar periodicamente.');
		} else {
			body.appendParagraph('Itens abaixo do nível "praticado na maior parte da empresa", em ordem de prioridade. ' +
				'Alta = não existe ou é informal; Média = definido por escrito, mas pouco praticado; Verificar = respondido como "Não sei".');
			r.planoAcao.forEach(function(p, i) {
				body.appendParagraph((i + 1) + '. [' + p.prioridade + '] ' + p.dimensao).setBold(true);
				body.appendParagraph(p.texto).setBold(false);
				body.appendParagraph('Situação atual: ' + p.situacao).setBold(false);
				if (p.acao) body.appendParagraph('Próximo passo: ' + p.acao).setBold(false);
				if (p.ref) body.appendParagraph('Referência: ' + p.ref).setBold(false);
			});
		}
		body.appendParagraph('');
	}

	body.appendParagraph('Observações').setHeading(H2);
	cfg.avisos.forEach(function(aviso) { body.appendParagraph(aviso); });
	body.appendParagraph('Para relatório expandido, responda este email.');

	doc.saveAndClose();

	var file = DriveApp.getFileById(doc.getId());
	file.moveTo(folder);

	var pdfBlob = file.getAs('application/pdf').setName(file.getName() + '.pdf');
	var pdf = folder.createFile(pdfBlob);

	// Os arquivos ficam privados (contêm dados pessoais — LGPD).
	// Apenas o respondente recebe acesso de leitura.
	compartilharComRespondente(file, payload.email);
	compartilharComRespondente(pdf, payload.email);

	return { docUrl: file.getUrl(), pdfUrl: pdf.getUrl(), pdfBlob: pdfBlob };
}

function compartilharComRespondente(file, email) {
	try {
		file.addViewer(email);
	} catch (err) {
		// E-mails sem conta Google podem ser recusados; o PDF segue anexado ao e-mail.
		console.warn('Não foi possível compartilhar ' + file.getName() + ' com ' + email + ': ' + err);
	}
}

function enviarEmailRelatorio(cfg, email, pdfUrl, docUrl, pdfBlob, r) {
	var subject = cfg.emailAssunto + ' - IGM: ' + Math.round(r.igm) + '/100';
	var template = HtmlService.createTemplateFromFile('EmailTemplate');
	template.intro = cfg.emailIntro;
	template.igm = r.igm;
	template.diagnostico = r.diagnostico;
	template.docUrl = docUrl;
	template.pdfUrl = pdfUrl;
	var html = template.evaluate().getContent();
	MailApp.sendEmail({
		to: email,
		subject: subject,
		htmlBody: html,
		attachments: [pdfBlob]
	});
}

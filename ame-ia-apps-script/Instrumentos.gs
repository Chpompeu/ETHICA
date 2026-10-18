// Questionários disponíveis no app. Cada um define textos, escala, perguntas,
// níveis de maturidade e onde os dados são gravados. O motor em Code.gs é o mesmo
// para todos. Escolha pela URL do Web App: ?q=ies (padrão) ou ?q=empresa.

const INSTRUMENTO_PADRAO = 'ies';

const INSTRUMENTOS = {
	ies: {
		id: 'ies',
		titulo: 'AME-IA — Questionário e Diagnóstico',
		subtitulo: 'Instrumento baseado no Modelo Contextual de Governança Ética em IA.',
		relatorioTitulo: 'AME-IA | Diagnóstico Institucional - Modelo Contextual',
		relatorioPrefixo: 'Relatório AME-IA',
		emailAssunto: 'AME-IA | Diagnóstico Institucional',
		emailIntro: 'Segue o diagnóstico AME-IA (Avaliação de Maturidade Ética em IA) da sua instituição.',
		abaRespostas: 'Base_Dados',
		abaProcessado: 'Processado',
		organizacao: { campo: 'instituicao', rotulo: 'Instituição', placeholder: 'Nome da instituição', singular: 'instituição', plural: 'instituições' },
		perfil: [
			{ campo: 'regiao', rotulo: 'Região', opcoes: ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'] },
			{ campo: 'cargo', rotulo: 'Cargo', opcoes: ['Reitor', 'Pró-Reitor', 'Diretor', 'Coordenador', 'Docente', 'Técnico'] }
		],
		escala: [
			{ value: '1', label: 'Discordo totalmente', score: 0 },
			{ value: '2', label: 'Discordo parcialmente', score: 25 },
			{ value: '3', label: 'Neutro', score: 50 },
			{ value: '4', label: 'Concordo parcialmente', score: 75 },
			{ value: '5', label: 'Concordo totalmente', score: 100 }
		],
		niveis: [
			{ min: 81, numero: 5, nome: 'Referência - Excelência em Governança' },
			{ min: 61, numero: 4, nome: 'Avançado - Governança Estruturada' },
			{ min: 41, numero: 3, nome: 'Intermediário - Desenvolvimento Progressivo' },
			{ min: 21, numero: 2, nome: 'Básico - Estruturação Preliminar' },
			{ min: 0, numero: 1, nome: 'Inicial - Governança Incipiente' }
		],
		padroes: [
			{ acima: 'conformidade', abaixo: 'inclusao', margem: 20, texto: 'maturidade técnico-normativa desenvolvida com lacunas socioculturais' },
			{ acima: 'transparencia', abaixo: 'sustentabilidade', margem: 20, texto: 'foco em aspectos procedimentais com gaps em sustentabilidade' }
		],
		padraoGeral: 'desenvolvimento equilibrado com oportunidades de melhoria sistêmica',
		avisos: [
			'Este diagnóstico reflete a percepção de um único respondente e deve ser interpretado em conjunto com outras fontes institucionais.'
		],
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
				],
				recomendacoes: '• Implementação de framework de métricas de impacto educacional\n• Estabelecimento de protocolos de auditoria algorítmica\n• Desenvolvimento de indicadores de equidade e justiça',
				criterios: 'Primário: Auditabilidade Contínua | Secundário: Explicabilidade Algorítmica'
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
				],
				recomendacoes: '• Desenvolvimento de documentação técnica multinível\n• Criação de interfaces de explicabilidade algorítmica\n• Estabelecimento de canais de accountability',
				criterios: 'Primário: Explicabilidade Algorítmica | Secundário: Participação Coletiva'
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
				],
				recomendacoes: '• Fortalecimento de mecanismos de supervisão humana\n• Preservação da autonomia docente e discente\n• Implementação de protocolos de override',
				criterios: 'Primário: Participação Coletiva | Secundário: Auditabilidade Contínua'
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
				],
				recomendacoes: '• Incorporação de epistemologias plurais no design de sistemas\n• Implementação de testes com grupos demograficamente diversos\n• Estabelecimento de governança participativa inclusiva',
				criterios: 'Primário: Epistemologia Plural | Secundário: Participação Coletiva'
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
				],
				recomendacoes: '• Adequação integral aos marcos regulatórios (LGPD, AI Act)\n• Constituição de comitê de ética em IA\n• Desenvolvimento de framework de compliance',
				criterios: 'Integração de todos os critérios operacionais do Modelo Contextual'
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
				],
				recomendacoes: '• Desenvolvimento de capacidade técnica institucional\n• Avaliação de impactos ambientais e sociais\n• Planejamento estratégico de longo prazo',
				criterios: 'Desenvolvimento equilibrado dos quatro critérios operacionais'
			}
		]
	},

	empresa: {
		id: 'empresa',
		titulo: 'Diagnóstico de Governança de IA — Empresas',
		subtitulo: 'Autoavaliação baseada na LGPD, no NIST AI RMF e na ISO/IEC 42001. Leva cerca de 10 minutos.',
		relatorioTitulo: 'Diagnóstico de Governança de IA | Empresas',
		relatorioPrefixo: 'Diagnóstico IA Empresa',
		emailAssunto: 'Diagnóstico de Governança de IA',
		emailIntro: 'Segue o diagnóstico de governança de IA da sua empresa, com o plano de ação priorizado.',
		abaRespostas: 'Empresa_Base_Dados',
		abaProcessado: 'Empresa_Processado',
		organizacao: { campo: 'empresa', rotulo: 'Empresa', placeholder: 'Nome da empresa', singular: 'empresa', plural: 'empresas' },
		perfil: [
			{ campo: 'setor', rotulo: 'Setor', opcoes: ['Serviços financeiros', 'Saúde', 'Varejo e e-commerce', 'Indústria', 'Tecnologia e software', 'Telecomunicações', 'Educação', 'Energia e utilidades', 'Logística e transporte', 'Serviços profissionais', 'Outro'] },
			{ campo: 'porte', rotulo: 'Porte', opcoes: ['Até 49 funcionários', '50 a 249', '250 a 999', '1.000 ou mais'] },
			{ campo: 'usoIA', rotulo: 'Como a empresa usa IA', opcoes: ['Só usa ferramentas prontas de terceiros', 'Usa e adapta ferramentas de terceiros', 'Desenvolve sistemas próprios'] },
			{ campo: 'area', rotulo: 'Sua área', opcoes: ['Diretoria / C-level', 'Jurídico / Compliance', 'Privacidade / Encarregado (DPO)', 'Riscos / Auditoria', 'TI / Segurança da informação', 'Dados / IA', 'Produto / Negócio', 'RH', 'Outra'] }
		],
		escala: [
			{ value: '0', label: 'Não existe', score: 0 },
			{ value: '1', label: 'Informal: depende de pessoas', score: 25 },
			{ value: '2', label: 'Definido por escrito', score: 50 },
			{ value: '3', label: 'Praticado na maior parte da empresa', score: 75 },
			{ value: '4', label: 'Praticado, medido e revisado', score: 100 },
			{ value: 'NS', label: 'Não sei', score: null, tipo: 'ns' },
			{ value: 'NA', label: 'Não se aplica', score: null, tipo: 'na' }
		],
		niveis: [
			{ min: 81, numero: 5, nome: 'Otimizado - controles medidos e revisados' },
			{ min: 61, numero: 4, nome: 'Gerenciado - prática consistente' },
			{ min: 41, numero: 3, nome: 'Definido - regras escritas, prática parcial' },
			{ min: 21, numero: 2, nome: 'Reativo - iniciativas isoladas' },
			{ min: 0, numero: 1, nome: 'Inicial - riscos não gerenciados' }
		],
		padroes: [
			{ acima: 'governanca', abaixo: 'testes', margem: 25, texto: 'regras definidas no papel, mas pouca verificação de como os sistemas funcionam na prática' },
			{ acima: 'testes', abaixo: 'governanca', margem: 25, texto: 'controles técnicos à frente da governança: as equipes testam, mas faltam regras e responsáveis formais' },
			{ acima: 'dados', abaixo: 'inventario', margem: 25, texto: 'boa base de privacidade, mas sem visão completa de onde a IA é usada' }
		],
		padraoGeral: 'desenvolvimento relativamente equilibrado entre as dimensões',
		// Itens abaixo deste score (nível 3 = "praticado na maior parte da empresa") entram no plano de ação.
		metaItem: 75,
		avisos: [
			'Este diagnóstico é uma autoavaliação feita por um respondente. Não constitui parecer jurídico, auditoria nem certificação.',
			'Respostas "Não sei" não entram na nota e aparecem no plano de ação para verificação.'
		],
		dimensoes: [
			{
				key: 'governanca',
				title: 'Governança e responsabilidades',
				items: [
					{
						texto: 'Existe uma política de IA aprovada pela direção, dizendo para que a empresa usa IA, o que é proibido e quem decide.',
						ref: 'NIST AI RMF: Govern · ISO/IEC 42001',
						acao: 'Redigir e aprovar uma política curta de IA com usos permitidos, usos proibidos e responsáveis por decisão.'
					},
					{
						texto: 'Uma pessoa ou comitê tem responsabilidade formal pelos riscos de IA, com autoridade para barrar um uso.',
						ref: 'NIST AI RMF: Govern · ISO/IEC 42001',
						acao: 'Nomear um responsável ou comitê com mandato escrito, incluindo poder de veto sobre usos de alto risco.'
					},
					{
						texto: 'A direção recebe, ao menos uma vez por ano, um relato dos riscos e incidentes envolvendo IA.',
						ref: 'NIST AI RMF: Govern · ISO/IEC 42001',
						acao: 'Incluir IA na pauta de riscos da diretoria ou do conselho, com relatório periódico.'
					}
				]
			},
			{
				key: 'inventario',
				title: 'Inventário e classificação de risco',
				items: [
					{
						texto: 'A empresa mantém uma lista atualizada das ferramentas e sistemas de IA em uso, incluindo os de fornecedores e os adotados por funcionários por conta própria.',
						ref: 'NIST AI RMF: Map · ISO/IEC 42001',
						acao: 'Montar um inventário (nome, área responsável, finalidade, dados usados, fornecedor) e revisá-lo periodicamente.'
					},
					{
						texto: 'Cada uso de IA é classificado por nível de risco, com critérios escritos.',
						ref: 'NIST AI RMF: Map',
						acao: 'Definir critérios de risco (impacto sobre pessoas, decisões automatizadas, dados sensíveis) e classificar o inventário.'
					},
					{
						texto: 'Um novo uso de IA só entra em operação depois de passar por avaliação de risco e aprovação.',
						ref: 'NIST AI RMF: Map / Manage · ISO/IEC 42001',
						acao: 'Criar um fluxo de aprovação proporcional ao risco antes de colocar um uso de IA em operação.'
					}
				]
			},
			{
				key: 'dados',
				title: 'Dados e privacidade',
				items: [
					{
						texto: 'Os usos de IA que tratam dados pessoais têm base legal definida e, quando o risco é alto, relatório de impacto à proteção de dados (RIPD).',
						ref: 'LGPD: arts. 7º, 11 e 38',
						acao: 'Mapear os dados pessoais de cada uso de IA e elaborar RIPD para os de alto risco, com o encarregado.'
					},
					{
						texto: 'Há regras claras sobre o que funcionários podem ou não colocar em ferramentas de IA generativa externas (dados de clientes, segredos comerciais, código).',
						ref: 'LGPD: art. 46 · NIST AI RMF: Govern',
						acao: 'Publicar uma orientação com exemplos do que não pode ser inserido e oferecer uma ferramenta aprovada pela empresa.'
					},
					{
						texto: 'A origem, a qualidade e o direito de uso dos dados que alimentam os sistemas de IA da empresa são conhecidos e documentados.',
						ref: 'NIST AI RMF: Map / Measure · ISO/IEC 42001',
						acao: 'Documentar, para cada sistema, de onde vêm os dados, sob qual licença ou base legal, e como sua qualidade é verificada.'
					}
				]
			},
			{
				key: 'testes',
				title: 'Testes e monitoramento',
				items: [
					{
						texto: 'Antes de entrar em uso, os sistemas de IA são testados quanto a erros e a resultados desiguais entre grupos de pessoas.',
						ref: 'NIST AI RMF: Measure',
						acao: 'Definir testes mínimos por nível de risco, incluindo a comparação de resultados entre grupos (gênero, idade, região, raça, quando aplicável).'
					},
					{
						texto: 'O desempenho dos sistemas em uso é acompanhado por indicadores, com um limite que dispara revisão.',
						ref: 'NIST AI RMF: Measure / Manage',
						acao: 'Escolher indicadores e limites de alerta para cada sistema de risco médio ou alto.'
					},
					{
						texto: 'Os sistemas de alto risco passam por revisão independente, feita por quem não os opera (auditoria interna, externa ou outra equipe).',
						ref: 'NIST AI RMF: Measure · ISO/IEC 42001',
						acao: 'Programar revisões periódicas por uma área independente da que opera o sistema.'
					}
				]
			},
			{
				key: 'fornecedores',
				title: 'Fornecedores e terceiros',
				items: [
					{
						texto: 'A contratação de ferramentas de IA passa por avaliação de segurança, privacidade e riscos do fornecedor.',
						ref: 'NIST AI RMF: Govern / Map · ISO/IEC 42001',
						acao: 'Incluir perguntas específicas de IA no processo de compras e homologação de fornecedores.'
					},
					{
						texto: 'Os contratos com fornecedores de IA definem como os dados da empresa podem ser usados (inclusive para treinar modelos), as responsabilidades e o direito de auditoria.',
						ref: 'LGPD: arts. 39 e 42 · ISO/IEC 42001',
						acao: 'Criar cláusulas padrão de IA para contratos novos e para renovações.'
					},
					{
						texto: 'A empresa conseguiria trocar ou desligar um fornecedor de IA crítico sem interromper operações essenciais.',
						ref: 'NIST AI RMF: Manage',
						acao: 'Ter um plano de contingência e de saída para cada fornecedor de IA crítico.'
					}
				]
			},
			{
				key: 'supervisao',
				title: 'Transparência e supervisão humana',
				items: [
					{
						texto: 'Clientes e funcionários são avisados quando interagem com IA ou quando ela é usada em decisões que os afetam.',
						ref: 'LGPD: arts. 6º e 20 · NIST AI RMF: Govern',
						acao: 'Definir avisos padrão para chatbots, decisões automatizadas e conteúdo gerado por IA.'
					},
					{
						texto: 'Decisões com efeito relevante sobre pessoas (crédito, contratação, preço, acesso a serviços) têm revisão humana com poder de mudar o resultado.',
						ref: 'LGPD: art. 20 · NIST AI RMF: Manage',
						acao: 'Listar essas decisões e definir quem revisa, quando e com que autoridade.'
					},
					{
						texto: 'Existe um canal para as pessoas contestarem uma decisão tomada com apoio de IA e pedirem revisão, com prazo de resposta definido.',
						ref: 'LGPD: art. 20',
						acao: 'Criar ou adaptar um canal (SAC, ouvidoria, encarregado) com prazo de resposta e registro dos pedidos.'
					}
				]
			},
			{
				key: 'incidentes',
				title: 'Incidentes e capacitação',
				items: [
					{
						texto: 'Existe um procedimento para registrar e corrigir falhas ou danos causados por IA, incluindo a comunicação a afetados e autoridades quando exigido.',
						ref: 'LGPD: art. 48 · NIST AI RMF: Manage',
						acao: 'Incluir IA no processo de gestão de incidentes, com critérios de quando comunicar afetados e a ANPD.'
					},
					{
						texto: 'Quem usa IA no trabalho ou decide sobre ela recebe treinamento sobre seus riscos e sobre as regras internas.',
						ref: 'NIST AI RMF: Govern · ISO/IEC 42001',
						acao: 'Oferecer um treinamento curto obrigatório para todos e um específico para as áreas de alto risco.'
					},
					{
						texto: 'Incidentes, auditorias e mudanças na regulação levam à revisão das políticas e controles de IA.',
						ref: 'NIST AI RMF: Manage · ISO/IEC 42001',
						acao: 'Fazer uma revisão ao menos anual do programa de IA, registrando o que mudou e por quê.'
					}
				]
			}
		]
	}
};

function getInstrumento(id) {
	return INSTRUMENTOS[id] || INSTRUMENTOS[INSTRUMENTO_PADRAO];
}

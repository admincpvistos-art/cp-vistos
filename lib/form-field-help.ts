/** Orientações de preenchimento (Word DS-160 manual do admin) — tooltips do formulário do cliente. */

export const FIELD_HELP = {
  // Pessoal
  firstName: "Como está no passaporte, sem abreviações.",
  lastName: "Como está no passaporte, sem abreviações.",
  otherNames: "Inclua nome de solteira, profissional, religioso ou qualquer outro nome já utilizado.",
  maritalStatus:
    "Parceiro doméstico = moram juntos sem documento. União estável = documentada. Informe conforme a situação atual.",
  otherNationality: "Se sim, informe a nacionalidade e o número do passaporte, se houver.",
  estaDenied: "Responda se já teve autorização eletrônica (ESTA) negada para os EUA.",
  usSsn: "Preencha somente se tiver registro de trabalho ou estudo nos EUA. Caso contrário, deixe em branco.",
  usTaxpayer:
    "Preencha somente se trabalha ou possui empresa nos EUA. Caso contrário, deixe em branco.",
  warName: "Informe código ou nome de guerra, se houver.",
  fullNameNative: "Nome completo no alfabeto nativo, se diferente do passaporte em caracteres latinos.",

  // Contato / endereço
  residenceAddress: "Inclua número da casa, apartamento etc.",
  phonesLast5Years: "Liste outros números usados nos últimos 5 anos.",
  emailsLast5Years: "Liste outros e-mails usados nos últimos 5 anos.",
  socialMedia:
    "Para visto de turista as redes não precisam estar abertas. Informe Instagram (pessoal e trabalho), Facebook, LinkedIn e outras se houver.",
  cellPhone: "Informe com DDD.",
  workPhone: "Telefone comercial, se houver, com DDD.",

  // Passaporte
  passportLost:
    "Se sim, informe o número do passaporte, o país emissor e explique o que ocorreu.",
  passportIssueDate: "Data exata de emissão conforme o passaporte.",
  passportExpireDate: "Data de expiração conforme o passaporte.",

  // Viagem
  travelPlan:
    "Mesmo sem planos firmes: informe previsão (mês/ano), local e tempo de permanência. O Consulado não pede confirmação de reserva.",
  flightOnlyIfBought: "Preencha somente se a passagem já estiver comprada. Sem compra, deixe em branco.",
  hotelOnlyIfBooked:
    "Preencha somente se já tiver hotel ou endereço confirmado. Sem reserva, não invente um endereço.",
  tripPayer:
    "Se for você quem paga, selecione essa opção. Se for outra pessoa ou empresa, preencha nome, telefone, endereço, e-mail e relação.",

  // Acompanhante
  travelCompanion:
    "No 1º visto, recomendamos acompanhante que já tenha visto — de preferência da família. Informe nome e parentesco.",
  travelGroup: "Se viaja em grupo de trabalho ou escola, informe o nome do grupo ou organização.",

  // Viagens anteriores
  previousUsVisits:
    "Até as últimas 5 visitas: data de entrada (exata ou aproximada) e tempo de permanência. Use os carimbos do passaporte ou o site i94.cbp.dhs.gov.",
  usDriversLicense: "Informe mesmo que a licença seja antiga: número e estado.",
  lastVisaNumber: "Número em vermelho, no canto inferior direito do selo do visto.",
  renewalOnly: "Responda somente se estiver renovando o visto.",
  fingerprints:
    "Se tinha mais de 18 anos no último visto, normalmente forneceu as digitais dos 10 dedos.",
  visaDeniedReason:
    "Explique o que ocorreu na entrevista. Isso ajuda a montar a justificativa do pedido atual.",
  immigrationPetition:
    "Somente se você ou outra pessoa já pediu visto de imigrante em seu nome, mesmo sem aprovação.",

  // Contato EUA
  usaContactSection:
    "Preencha somente se houver contato frequente com alguém nos EUA. Caso contrário, indique que não se aplica.",

  // Família
  parentsEvenDeceased: "Preencha mesmo se falecidos.",
  parentInUsaStatus:
    "Se sim, informe a situação: trabalhando legalmente, passeando, estudando, irregular etc.",
  relativesInUsa:
    "Excluindo os pais: informe nome, parentesco e situação (cidadão, residente, não imigrante, outros/não sei).",
  spouseRequired:
    "Obrigatório conforme o estado civil atual, mesmo se falecido. Separado ou divorciado: informe também as datas de união e separação.",

  // Trabalho
  employerName: "Empresário: informe o nome fantasia da empresa principal (a de abertura mais antiga).",
  jobStartDate: "Com empresa própria: informe a data de abertura ou início de funcionamento.",
  monthlyIncome:
    "Salário bruto, pró-labore, aluguéis etc. — mesmo que não sejam declarados no Imposto de Renda.",
  jobDuties: "Descreva o ramo da empresa e, no seu cargo, as responsabilidades e tarefas do dia a dia.",
  businessEmployees: "Somente se for empresário: quantidade de funcionários CLT e de PJ/freelancers.",
  previousJobs:
    "Histórico dos últimos 5 anos antes da ocupação atual (ou aposentadoria). No máximo duas ocupações anteriores. Se houve lacuna, informe o que fazia (estudo, viagem, pausa).",

  // Escolaridade
  education:
    "Inclua ao menos as duas últimas instituições (pós, graduação, técnico, médio…). Do mais recente ao mais antigo, mesmo curso incompleto.",

  // Adicional
  languages:
    "Se marcar inglês fluente, o cônsul pode testar na entrevista. Indique o nível de cada língua com clareza.",
  otherCountries5Years: "Liste os países visitados nos últimos 5 anos (fora dos EUA).",
  charityOrg: "Se contribui ou faz parte de instituição de caridade ou organização social, informe quais.",
  weaponsTraining: "Se tiver treinamento com arma de fogo, especifique.",
  militaryService: "Se prestou serviço militar, informe país, unidade, patente, especialidade e datas.",

  // Segurança
  securityQuestions:
    "Leia com atenção. Na maioria dos casos a resposta é Não. Se for Sim, explique no campo que aparecer — omissão prejudica o processo.",
} as const;

export const SECTION_HELP = {
  workCurrent: [
    "Na entrevista será preciso apresentar uma linha do tempo coerente de trabalho e estudos.",
    "Aposentado ou dona de casa: pule a ocupação atual e preencha as anteriores.",
    "Empresário: use a empresa principal (abertura mais antiga) e mencione outras na descrição.",
    "Autônomo: nome fantasia do negócio e data de início das atividades (mesmo informal).",
    "Contrato PJ para uma única empresa: dados da empresa contratante. Na dúvida, fale conosco.",
    "CLT: preencha todos os campos e baixe o registro na CTPS digital para a entrevista.",
  ],
  workHistory: [
    "Precisamos do histórico dos últimos 5 anos anteriores à ocupação atual ou à aposentadoria.",
    "Informe no máximo as duas ocupações anteriores.",
    "Se ficou algum período sem trabalhar, diga o que fazia (estudos, viagens, pausa voluntária etc.).",
  ],
  education: [
    "Inclua ao menos as duas últimas instituições de ensino frequentadas.",
    "Comece do mais atual para o mais antigo, mesmo se algum curso não foi concluído.",
  ],
  travelPlan: [
    "Informe uma previsão de viagem mesmo sem planos definidos (mês/ano, local e tempo de permanência).",
    "Voo e hotel: preencha somente se já tiver compra ou reserva confirmada.",
  ],
  usaContact: [
    "Preencha esta seção somente se houver contato frequente com alguém nos Estados Unidos.",
  ],
  security: [
    "Responda com atenção cada pergunta. A maioria das respostas é Não.",
    "Se responder Sim, explique com detalhes — omissão pode prejudicar o visto.",
  ],
} as const;

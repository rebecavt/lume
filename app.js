/**
 * EcoTrack - Calculadora de Pegada de Carbono Diária
 * Lógica de cálculo, validações e feedback interativo
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos do DOM
  const form = document.getElementById('eco-form');
  const distanciaInput = document.getElementById('distancia');
  const transporteSelect = document.getElementById('transporte');
  const mensagemErro = document.getElementById('mensagem-erro');
  const textoErro = document.getElementById('texto-erro');
  
  const resultadoContainer = document.getElementById('resultado-container');
  const valorCo2Elem = document.getElementById('valor-co2');
  const badgeStatus = document.getElementById('badge-status');
  const barraProgresso = document.getElementById('barra-progresso');
  const dicaSustentabilidadeElem = document.getElementById('dica-sustentabilidade');

  // Alternador de Modo Claro / Escuro
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeLabel = document.getElementById('theme-label');

  // Elementos do Histórico de Registros
  const secaoHistorico = document.getElementById('secao-historico');
  const listaHistorico = document.getElementById('lista-historico');
  const btnLimparHistorico = document.getElementById('btn-limpar-historico');
  const alertaMediaEmissao = document.getElementById('alerta-media-emissao');
  const textoAlertaMedia = document.getElementById('texto-alerta-media');
  const resumoMediaBox = document.getElementById('resumo-media-box');
  const valorMediaHistorico = document.getElementById('valor-media-historico');

  const STORAGE_KEY_HISTORICO = 'ecotrack_historico';

  const NOMES_TRANSPORTE = {
    'carro': { nome: 'Carro', icone: '🚗' },
    'onibus': { nome: 'Ônibus', icone: '🚌' },
    'bicicleta': { nome: 'Bicicleta', icone: '🚲' },
    'a-pe': { nome: 'A pé', icone: '🚶' }
  };

  // Fatores médios de emissão em kg de CO2 por passageiro/km
  const FATORES_EMISSAO = {
    'carro': 0.180,       // Carro médio padrão urbano flex/gasolina
    'onibus': 0.085,      // Transporte coletivo urbano por passageiro
    'bicicleta': 0.0,     // Mobilidade ativa (zero emissão direta)
    'a-pe': 0.0           // Caminhada (zero emissão direta)
  };

  /**
   * Exibe aviso de erro em vermelho na tela e destaca o campo
   * @param {string} mensagem
   */
  function exibirErro(mensagem) {
    textoErro.textContent = mensagem;
    mensagemErro.style.display = 'flex';
    distanciaInput.classList.add('input-invalid');
    distanciaInput.setAttribute('aria-invalid', 'true');
    distanciaInput.focus();

    // Oculta resultado anterior para evitar dados inconsistentes
    resultadoContainer.style.display = 'none';
    resultadoContainer.classList.remove('fade-in');
  }

  /**
   * Remove o aviso de erro e restaura o estilo padrão
   */
  function limparErro() {
    mensagemErro.style.display = 'none';
    distanciaInput.classList.remove('input-invalid');
    distanciaInput.removeAttribute('aria-invalid');
  }

  /**
   * Obtém a dica de sustentabilidade personalizada
   * @param {string} meioTransporte
   * @param {number} emissao
   * @param {number} distancia
   * @returns {string}
   */
  function obterDicaSustentabilidade(meioTransporte, emissao, distancia) {
    if (meioTransporte === 'bicicleta') {
      return 'Parabéns pela escolha! Pedalar tem emissão zero de carbono, desafoga o trânsito da cidade e é um excelente exercício para a saúde do coração.';
    }

    if (meioTransporte === 'a-pe') {
      return 'Excelente hábito! Deslocar-se a pé não gera poluentes nem poluição sonora, melhora o condicionamento físico e conecta você com a sua cidade.';
    }

    if (meioTransporte === 'onibus') {
      if (distancia > 25) {
        return 'Excelente opção coletiva! Ao optar pelo ônibus em trajetos longos, você evita emitir mais da metade do CO₂ que emitiria viajando sozinho de carro.';
      }
      return 'Ótima atitude! O transporte público reduz o número de veículos nas ruas e é um dos pilares para cidades mais sustentáveis e menos poluídas.';
    }

    // Carro
    if (emissao === 0) {
      return 'Nenhum deslocamento registrado. Aproveite para manter hábitos conscientes no seu dia!';
    }
    if (distancia <= 3) {
      return 'Para distâncias curtas (até 3 km), que tal experimentar ir a pé ou de bicicleta? Você pouparia 100% das emissões e ainda economizaria combustível!';
    }
    if (emissao <= 4.5) {
      return 'Sua emissão está abaixo da meta diária sustentável de 4,5 kg. Para manter esse bom desempenho, considere adotar caronas solidárias alguns dias da semana.';
    }
    return 'Sua emissão ultrapassou a recomendação diária sustentável (4,5 kg). Dica: tente alternar o uso do carro com transporte coletivo ou combinar caronas com colegas.';
  }

  /**
   * Atualiza a barra de impacto e os crachás visuais
   * @param {number} emissao
   * @param {string} transporte
   */
  function atualizarIndicadores(emissao, transporte) {
    // Resetar classes do badge
    badgeStatus.className = 'badge-status';

    let percentualBarra = Math.min((emissao / 5.0) * 100, 100);

    if (transporte === 'bicicleta' || transporte === 'a-pe' || emissao === 0) {
      badgeStatus.textContent = 'Zero Emissão';
      badgeStatus.classList.add('badge-zero');
      barraProgresso.style.width = '3%';
      barraProgresso.style.backgroundColor = '#10b981';
    } else if (emissao <= 2.5) {
      badgeStatus.textContent = 'Baixo Impacto';
      badgeStatus.classList.add('badge-baixo');
      barraProgresso.style.width = `${Math.max(percentualBarra, 12)}%`;
      barraProgresso.style.backgroundColor = '#059669';
    } else if (emissao <= 4.5) {
      badgeStatus.textContent = 'Impacto Moderado';
      badgeStatus.classList.add('badge-medio');
      barraProgresso.style.width = `${percentualBarra}%`;
      barraProgresso.style.backgroundColor = '#d97706';
    } else {
      badgeStatus.textContent = 'Impacto Elevado';
      badgeStatus.classList.add('badge-alto');
      barraProgresso.style.width = '100%';
      barraProgresso.style.backgroundColor = '#ef4444';
    }
  }

  /**
   * Executa o cálculo e exibe os resultados na tela
   */
  function calcularImpacto(event) {
    if (event) {
      event.preventDefault();
    }

    const valorOriginal = distanciaInput.value.trim();

    // VALIDAÇÃO CONFORME ESPECIFICADO:
    // Se o campo estiver vazio ou o valor for NaN ou for menor que 0:
    // Exibe aviso em vermelho na tela dizendo:
    // "Por favor, insira uma distância válida maior ou igual a zero" e não executa o cálculo.
    if (valorOriginal === '') {
      exibirErro('Por favor, insira uma distância válida maior ou igual a zero');
      return;
    }

    const distancia = parseFloat(valorOriginal);

    if (isNaN(distancia) || distancia < 0) {
      exibirErro('Por favor, insira uma distância válida maior ou igual a zero');
      return;
    }

    // Entrada válida: limpa qualquer erro anterior
    limparErro();

    const meioTransporte = transporteSelect.value;
    const fator = FATORES_EMISSAO[meioTransporte] ?? 0.0;
    const emissaoKg = distancia * fator;

    // Formata o número para o padrão pt-BR (ex: "2,70")
    const emissaoFormatada = emissaoKg.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // Atualiza valores nos elementos
    valorCo2Elem.textContent = emissaoFormatada;
    dicaSustentabilidadeElem.textContent = obterDicaSustentabilidade(meioTransporte, emissaoKg, distancia);
    atualizarIndicadores(emissaoKg, meioTransporte);

    // Salva o cálculo realizado no histórico do localStorage
    const agora = new Date();
    const dataHoraFormatada = agora.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' às ' + agora.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const novoRegistro = {
      id: Date.now(),
      data: dataHoraFormatada,
      distancia: distancia,
      transporte: meioTransporte,
      emissao: emissaoKg
    };

    salvarNoHistorico(novoRegistro);
    renderizarHistorico();

    // Exibe o resultado com animação suave de fade-in
    resultadoContainer.style.display = 'block';
    
    // Força reinício da animação CSS de fade-in
    resultadoContainer.classList.remove('fade-in');
    void resultadoContainer.offsetWidth; // Dispara reflow
    resultadoContainer.classList.add('fade-in');

    // Rola suavemente até o resultado em telas pequenas, se necessário
    if (window.innerWidth < 640) {
      resultadoContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // ============================================
  // Gerenciamento do Histórico de Registros
  // ============================================

  /**
   * Obtém os registros de histórico salvos no localStorage
   * @returns {Array}
   */
  function obterHistorico() {
    try {
      const dados = localStorage.getItem(STORAGE_KEY_HISTORICO);
      return dados ? JSON.parse(dados) : [];
    } catch (e) {
      console.warn('Erro ao ler histórico do localStorage:', e);
      return [];
    }
  }

  /**
   * Salva um novo registro no localStorage
   * @param {Object} registro
   */
  function salvarNoHistorico(registro) {
    try {
      const historico = obterHistorico();
      historico.unshift(registro); // adiciona no início da lista

      // Mantém os 25 cálculos mais recentes
      if (historico.length > 25) {
        historico.pop();
      }

      localStorage.setItem(STORAGE_KEY_HISTORICO, JSON.stringify(historico));
    } catch (e) {
      console.warn('Erro ao salvar registro no localStorage:', e);
    }
  }

  /**
   * Limpa todos os registros do histórico no localStorage e atualiza a interface
   */
  function limparHistorico() {
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORICO);
    } catch (e) {
      console.warn('Erro ao limpar histórico:', e);
    }
    renderizarHistorico();
  }

  /**
   * Renderiza a lista de histórico e avalia a média das emissões
   */
  function renderizarHistorico() {
    if (!listaHistorico) return;

    const historico = obterHistorico();
    listaHistorico.innerHTML = '';

    if (historico.length === 0) {
      if (alertaMediaEmissao) alertaMediaEmissao.style.display = 'none';
      if (resumoMediaBox) resumoMediaBox.style.display = 'none';
      if (btnLimparHistorico) btnLimparHistorico.style.display = 'none';

      listaHistorico.innerHTML = `
        <div class="historico-vazio">
          <div class="historico-vazio-icon">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <p>Nenhum cálculo registrado ainda. Calcule seu impacto acima para começar seu histórico!</p>
        </div>
      `;
      return;
    }

    if (btnLimparHistorico) btnLimparHistorico.style.display = 'inline-flex';

    // Cálculo da média de emissões
    const somaEmissoes = historico.reduce((acumulado, item) => acumulado + (Number(item.emissao) || 0), 0);
    const mediaEmissoes = somaEmissoes / historico.length;
    const mediaFormatada = mediaEmissoes.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // Indicador visual alertando caso a média ultrapasse 5 kg de CO2
    if (mediaEmissoes > 5.0) {
      if (textoAlertaMedia) {
        textoAlertaMedia.textContent = `Sua média recente de emissões é de ${mediaFormatada} kg de CO₂, ultrapassando o limite diário recomendado de 5,0 kg.`;
      }
      if (alertaMediaEmissao) alertaMediaEmissao.style.display = 'flex';
      if (resumoMediaBox) resumoMediaBox.style.display = 'none';
    } else {
      if (alertaMediaEmissao) alertaMediaEmissao.style.display = 'none';
      if (valorMediaHistorico) valorMediaHistorico.textContent = `${mediaFormatada} kg de CO₂`;
      if (resumoMediaBox) resumoMediaBox.style.display = 'inline-flex';
    }

    // Criação dos itens do histórico
    historico.forEach(item => {
      const transporteInfo = NOMES_TRANSPORTE[item.transporte] || { nome: item.transporte, icone: '🌱' };
      const emissaoFormatadaItem = Number(item.emissao).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      const distanciaFormatadaItem = Number(item.distancia).toLocaleString('pt-BR', {
        maximumFractionDigits: 1
      });

      const cardItem = document.createElement('article');
      cardItem.className = 'item-historico';
      cardItem.innerHTML = `
        <div class="item-esquerda">
          <span class="item-transporte-badge">
            <span aria-hidden="true">${transporteInfo.icone}</span>
            <span>${transporteInfo.nome}</span>
          </span>
          <div class="item-meta-info">
            <span class="item-distancia">${distanciaFormatadaItem} km percorridos</span>
            <time class="item-data">${item.data}</time>
          </div>
        </div>
        <div class="item-direita">
          <div class="item-emissao-valor">${emissaoFormatadaItem}</div>
          <div class="item-emissao-unidade">kg de CO₂</div>
        </div>
      `;
      listaHistorico.appendChild(cardItem);
    });
  }

  // Event Listeners
  form.addEventListener('submit', calcularImpacto);

  if (btnLimparHistorico) {
    btnLimparHistorico.addEventListener('click', () => {
      limparHistorico();
    });
  }

  // Inicializa a renderização do histórico salvo
  renderizarHistorico();

  // Limpa o aviso de erro em tempo real quando o usuário começa a digitar um valor válido
  distanciaInput.addEventListener('input', () => {
    const valor = distanciaInput.value.trim();
    if (valor !== '' && !isNaN(parseFloat(valor)) && parseFloat(valor) >= 0) {
      limparErro();
    }
  });

  // ============================================
  // Controle do Modo Claro / Modo Escuro
  // ============================================
  /**
   * Aplica o tema selecionado na interface ('dark' ou 'light')
   * @param {string} tema
   */
  function aplicarTema(tema) {
    if (tema === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (themeLabel) themeLabel.textContent = 'Modo Claro';
      if (themeToggleBtn) {
        themeToggleBtn.setAttribute('title', 'Alternar para Modo Claro');
        themeToggleBtn.setAttribute('aria-label', 'Ativar Modo Claro');
      }
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (themeLabel) themeLabel.textContent = 'Modo Escuro';
      if (themeToggleBtn) {
        themeToggleBtn.setAttribute('title', 'Alternar para Modo Escuro');
        themeToggleBtn.setAttribute('aria-label', 'Ativar Modo Escuro');
      }
    }
  }

  // Recupera o tema salvo ou usa preferência do sistema operacional
  let temaInicial = 'light';
  try {
    const temaSalvo = localStorage.getItem('ecotrack_theme');
    if (temaSalvo) {
      temaInicial = temaSalvo;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      temaInicial = 'dark';
    }
  } catch (e) {
    // Fallback gracioso caso storage esteja desabilitado
  }

  aplicarTema(temaInicial);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const temaAtual = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const novoTema = temaAtual === 'dark' ? 'light' : 'dark';
      aplicarTema(novoTema);
      try {
        localStorage.setItem('ecotrack_theme', novoTema);
      } catch (e) {
        // Fallback gracioso
      }
    });
  }
});

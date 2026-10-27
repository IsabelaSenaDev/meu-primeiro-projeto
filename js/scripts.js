/* =========================================================
   js/scripts.js — CP3
   Todo o JavaScript do site fica neste arquivo.
   1) Tema claro/escuro  (salvo no localStorage)
   2) Formulário com validação + feedback + mensagens salvas
   3) Gráfico Canvas (cole aqui o código do seu graficos.js)
   ========================================================= */

/* ---------- Funções auxiliares do localStorage ---------- */
function lerStorage(chave, padrao) {
  try {
    const valor = localStorage.getItem(chave);
    return valor === null ? padrao : valor;
  } catch (erro) {
    return padrao; // navegador bloqueou o storage
  }
}

function salvarStorage(chave, valor) {
  try {
    localStorage.setItem(chave, valor);
    return true;
  } catch (erro) {
    return false;
  }
}

/* =========================================================
   1) TEMA CLARO / ESCURO
   ========================================================= */
const CHAVE_TEMA = 'cp3_tema';

function aplicarTema(tema) {
  document.documentElement.setAttribute('data-tema', tema);
  const botao = document.getElementById('btn-tema');
  if (botao) {
    botao.textContent = tema === 'escuro' ? '☀️ Tema claro' : '🌙 Tema escuro';
    botao.setAttribute('aria-pressed', String(tema === 'escuro'));
  }
}

// aplica o tema salvo assim que a página carrega
aplicarTema(lerStorage(CHAVE_TEMA, 'claro'));

const botaoTema = document.getElementById('btn-tema');
if (botaoTema) {
  botaoTema.addEventListener('click', function () {
    const atual = document.documentElement.getAttribute('data-tema');
    const novo = atual === 'escuro' ? 'claro' : 'escuro';
    aplicarTema(novo);
    salvarStorage(CHAVE_TEMA, novo);
  });
}

/* =========================================================
   2) FORMULÁRIO DE CONTATO
   ========================================================= */
const CHAVE_MENSAGENS = 'cp3_mensagens';
const formContato = document.getElementById('form-contato');

if (formContato) {
  const caixaFeedback = document.getElementById('feedback-form');
  const listaMensagens = document.getElementById('lista-mensagens');
  const botaoLimpar = document.getElementById('btn-limpar-mensagens');
  const campos = formContato.querySelectorAll(
    'input:not([type="radio"]), select, textarea'
  );

  // ----- mensagens de erro em português -----
  function textoDoErro(campo) {
    const v = campo.validity;
    if (v.valueMissing) {
      if (campo.type === 'checkbox') return 'Você precisa marcar esta opção.';
      if (campo.tagName === 'SELECT') return 'Selecione uma opção.';
      return 'Preencha este campo.';
    }
    if (v.typeMismatch) {
      return campo.type === 'email'
        ? 'Digite um e-mail válido, por exemplo nome@exemplo.com.'
        : 'Digite um endereço válido, começando com https://';
    }
    if (v.tooShort) return 'Digite pelo menos ' + campo.minLength + ' caracteres.';
    if (v.patternMismatch) return campo.title || 'Formato inválido.';
    return 'Valor inválido.';
  }

  function mostrarErro(campo, texto) {
    let aviso = document.getElementById('erro-' + campo.id);
    if (!aviso) {
      aviso = document.createElement('span');
      aviso.id = 'erro-' + campo.id;
      aviso.className = 'erro-campo';
      campo.insertAdjacentElement('afterend', aviso);
    }
    aviso.textContent = texto;
    campo.classList.add('invalido');
    campo.setAttribute('aria-invalid', 'true');
    campo.setAttribute('aria-describedby', aviso.id);
  }

  function limparErro(campo) {
    const aviso = document.getElementById('erro-' + campo.id);
    if (aviso) aviso.remove();
    campo.classList.remove('invalido');
    campo.removeAttribute('aria-invalid');
    campo.removeAttribute('aria-describedby');
  }

  function mostrarFeedback(tipo, texto) {
    caixaFeedback.textContent = texto;
    caixaFeedback.className = 'feedback ' + tipo; // "sucesso" ou "erro"
  }

  // ----- validação enquanto a pessoa digita / sai do campo -----
  campos.forEach(function (campo) {
    campo.addEventListener('blur', function () {
      if (campo.value !== '' || campo.required) {
        campo.checkValidity() ? limparErro(campo) : mostrarErro(campo, textoDoErro(campo));
      }
    });
    campo.addEventListener('input', function () {
      if (campo.classList.contains('invalido') && campo.checkValidity()) limparErro(campo);
    });
    campo.addEventListener('change', function () {
      if (campo.classList.contains('invalido') && campo.checkValidity()) limparErro(campo);
    });
  });

  // ----- mensagens salvas -----
  function lerMensagens() {
    try {
      return JSON.parse(lerStorage(CHAVE_MENSAGENS, '[]')) || [];
    } catch (erro) {
      return [];
    }
  }

  function renderizarMensagens() {
    const mensagens = lerMensagens();
    listaMensagens.innerHTML = '';

    if (mensagens.length === 0) {
      const vazio = document.createElement('li');
      vazio.textContent = 'Nenhuma mensagem salva ainda.';
      listaMensagens.appendChild(vazio);
      botaoLimpar.hidden = true;
      return;
    }

    botaoLimpar.hidden = false;
    mensagens.forEach(function (msg, indice) {
      const item = document.createElement('li');

      const titulo = document.createElement('strong');
      titulo.textContent = msg.nome + ' — ' + msg.assunto;

      const data = document.createElement('small');
      data.textContent = ' (' + msg.data + ')';

      const texto = document.createElement('p');
      texto.textContent = msg.mensagem;

      const remover = document.createElement('button');
      remover.type = 'button';
      remover.className = 'secundario';
      remover.textContent = 'Remover';
      remover.addEventListener('click', function () {
        const lista = lerMensagens();
        lista.splice(indice, 1);
        salvarStorage(CHAVE_MENSAGENS, JSON.stringify(lista));
        renderizarMensagens();
      });

      item.append(titulo, data, texto, remover);
      listaMensagens.appendChild(item);
    });
  }

  // ----- envio -----
  formContato.addEventListener('submit', function (evento) {
    evento.preventDefault(); // não recarrega a página

    let primeiroInvalido = null;
    campos.forEach(function (campo) {
      if (campo.checkValidity()) {
        limparErro(campo);
      } else {
        mostrarErro(campo, textoDoErro(campo));
        if (!primeiroInvalido) primeiroInvalido = campo;
      }
    });

    if (primeiroInvalido) {
      mostrarFeedback('erro', 'Corrija os campos destacados e tente novamente.');
      primeiroInvalido.focus();
      return;
    }

    const nova = {
      nome: formContato.nome.value.trim(),
      email: formContato.email.value.trim(),
      assunto: formContato.assunto.options[formContato.assunto.selectedIndex].text,
      mensagem: formContato.mensagem.value.trim(),
      data: new Date().toLocaleString('pt-BR')
    };

    const mensagens = lerMensagens();
    mensagens.unshift(nova); // a mais recente aparece primeiro

    if (salvarStorage(CHAVE_MENSAGENS, JSON.stringify(mensagens))) {
      mostrarFeedback('sucesso', 'Mensagem enviada e salva neste navegador. Obrigada, ' + nova.nome.split(' ')[0] + '!');
      formContato.reset();
      renderizarMensagens();
    } else {
      mostrarFeedback('erro', 'Não foi possível salvar: o navegador bloqueou o armazenamento local.');
    }
  });

  // ----- botão "Apagar todas" -----
  botaoLimpar.addEventListener('click', function () {
    if (confirm('Apagar todas as mensagens salvas?')) {
      salvarStorage(CHAVE_MENSAGENS, '[]');
      renderizarMensagens();
    }
  });

  renderizarMensagens(); // mostra o que já estava salvo
}

/* =========================================================
   3) GRÁFICO CANVAS (página graficos.html)
   ========================================================= */
const canvasGrafico = document.getElementById('grafico-canvas');

if (canvasGrafico) {
  const ctx = canvasGrafico.getContext('2d');
  const NIVEL_MAXIMO = 5;
  const dados = [
    { rotulo: 'HTML5',      valor: 3, cor: '#2f9e83' },
    { rotulo: 'CSS3',       valor: 2, cor: '#16324f' },
    { rotulo: 'JavaScript', valor: 2, cor: '#d97757' }
  ];

  const margem = { esquerda: 50, direita: 20, topo: 20, base: 40 };
  const larguraUtil = canvasGrafico.width - margem.esquerda - margem.direita;
  const alturaUtil = canvasGrafico.height - margem.topo - margem.base;

  function desenharGrafico(progresso) {
    const escuro = document.documentElement.getAttribute('data-tema') === 'escuro';
    const corTexto = escuro ? '#e6e9ee' : '#24313f';
    const corGrade = escuro ? '#33404f' : '#dde3e8';

    ctx.clearRect(0, 0, canvasGrafico.width, canvasGrafico.height);
    ctx.font = '14px Arial, sans-serif';

    // linhas de grade e números do eixo Y (0 a 5)
    for (let nivel = 0; nivel <= NIVEL_MAXIMO; nivel++) {
      const y = margem.topo + alturaUtil - (nivel / NIVEL_MAXIMO) * alturaUtil;
      ctx.strokeStyle = corGrade;
      ctx.beginPath();
      ctx.moveTo(margem.esquerda, y);
      ctx.lineTo(margem.esquerda + larguraUtil, y);
      ctx.stroke();

      ctx.fillStyle = corTexto;
      ctx.textAlign = 'right';
      ctx.fillText(String(nivel), margem.esquerda - 10, y + 5);
    }

    // barras (crescem de acordo com o progresso da animação)
    const espaco = larguraUtil / dados.length;
    const larguraBarra = 90;

    dados.forEach(function (item, i) {
      const altura = (item.valor / NIVEL_MAXIMO) * alturaUtil * progresso;
      const x = margem.esquerda + i * espaco + (espaco - larguraBarra) / 2;
      const y = margem.topo + alturaUtil - altura;

      ctx.fillStyle = item.cor;
      ctx.fillRect(x, y, larguraBarra, altura);

      ctx.fillStyle = corTexto;
      ctx.textAlign = 'center';
      ctx.fillText(item.rotulo, x + larguraBarra / 2, canvasGrafico.height - 15);
      if (progresso === 1) ctx.fillText(String(item.valor), x + larguraBarra / 2, y - 6);
    });
  }

  function animarGrafico() {
    const duracao = 800; // milissegundos
    let inicio = null;

    function passo(agora) {
      if (inicio === null) inicio = agora;
      const progresso = Math.min((agora - inicio) / duracao, 1);
      desenharGrafico(progresso);
      if (progresso < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  const botaoAnimar = document.getElementById('btn-animar');
  if (botaoAnimar) botaoAnimar.addEventListener('click', animarGrafico);

  // redesenha quando o tema muda, para o texto continuar legível
  if (botaoTema) botaoTema.addEventListener('click', function () { desenharGrafico(1); });

  animarGrafico();
}

/* Escola Base Suprema — comportamento da página.
   Tudo aqui é melhoria: sem script o conteúdo continua visível e os links funcionam. */
(() => {
  const WA = 'https://api.whatsapp.com/send?phone=554430317344&text=';
  const wa = (texto) => WA + encodeURIComponent(texto);
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---- Entradas: cada parte da seção chega na ordem de leitura ---- */
  $$('[data-stagger]').forEach((grupo) => {
    $$('[data-reveal]', grupo).forEach((el, i) => el.style.setProperty('--d', Math.min(i * 70, 630) + 'ms'));
  });
  const alvos = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    alvos.forEach((el) => io.observe(el));
    // rede de segurança: nada fica escondido se o observador não disparar
    window.addEventListener('load', () => setTimeout(() => {
      alvos.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in');
      });
    }, 2500));
  } else {
    alvos.forEach((el) => el.classList.add('is-in'));
  }

  /* ---- Menu no telefone ---- */
  const toggle = $('.bar__toggle');
  const menu = $('#menu');
  if (toggle && menu) {
    const fechar = () => { menu.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = 'Menu'; };
    toggle.addEventListener('click', () => {
      const abrir = !menu.classList.contains('is-open');
      menu.classList.toggle('is-open', abrir);
      toggle.setAttribute('aria-expanded', String(abrir));
      toggle.textContent = abrir ? 'Fechar' : 'Menu';
    });
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) fechar(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });
  }

  /* ---- Projetos e atividades: abas ---- */
  const abas = $$('.tab');
  const ativar = (aba, focar) => {
    abas.forEach((t) => {
      const on = t === aba;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const painel = document.getElementById(t.getAttribute('aria-controls'));
      if (painel) painel.classList.toggle('is-active', on);
      const foto = $(`img[data-panel="${t.getAttribute('aria-controls')}"]`);
      if (foto) foto.classList.toggle('is-active', on);
    });
    if (focar) aba.focus();
  };
  abas.forEach((aba, i) => {
    aba.addEventListener('click', () => ativar(aba));
    aba.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const passo = e.key === 'ArrowRight' ? 1 : -1;
      ativar(abas[(i + passo + abas.length) % abas.length], true);
    });
  });

  /* ---- Turma + período: o dia do aluno e a mensagem pronta ---- */
  const itens = $$('.item[data-turma]');
  const radios = $$('input[name="periodo"]');
  const titulo = $('#dia-titulo');
  const texto = $('#dia-texto');
  const cta = $('#dia-cta');
  const fTurma = $('#f-turma');
  const fPeriodo = $('#f-periodo');
  const nomePeriodo = (p) => (p === 'integral' ? 'período integral' : 'período da ' + p);
  const REFEICOES = {
    a: 'Nesta fase, as refeições do dia são feitas na própria escola, com cardápio elaborado todo mês por uma nutricionista.',
    b: 'Para esta turma, o almoço e o jantar fazem parte do regime obrigatório; o café da manhã e o lanche da tarde são opcionais. O cardápio é elaborado todo mês por uma nutricionista.',
  };

  const atualizar = (sincronizarForm) => {
    const item = itens.find((b) => b.getAttribute('aria-pressed') === 'true');
    const radio = radios.find((r) => r.checked);
    if (!item || !radio || !titulo) return;
    const turma = item.dataset.turma;
    const periodo = nomePeriodo(radio.value);
    titulo.textContent = `${turma}, ${periodo}, ${radio.dataset.horario}.`;
    texto.textContent = REFEICOES[item.dataset.grupo] || REFEICOES.a;
    cta.href = wa(`Olá! Vim pelo site e gostaria de saber sobre vagas para o ${turma}, ${periodo}.`);
    if (sincronizarForm && fTurma && fPeriodo) {
      fTurma.value = turma;
      fPeriodo.value = radio.value;
    }
  };
  itens.forEach((botao) => botao.addEventListener('click', () => {
    itens.forEach((b) => b.setAttribute('aria-pressed', String(b === botao)));
    atualizar(true);
  }));
  radios.forEach((r) => r.addEventListener('change', () => atualizar(true)));
  atualizar(false);

  /* ---- Cupom de visita: monta a mensagem e abre o WhatsApp ---- */
  const form = $('#form-visita');
  if (form) {
    form.addEventListener('submit', () => {
      const nome = $('#f-nome').value.trim();
      const turma = fTurma.value;
      const periodo = fPeriodo.value;
      let msg = 'Olá! ';
      if (nome) msg += `Meu nome é ${nome}. `;
      msg += 'Vim pelo site e gostaria de agendar uma visita à Escola Base Suprema.';
      if (turma && periodo) msg += ` Tenho interesse no ${turma}, ${nomePeriodo(periodo)}.`;
      else if (turma) msg += ` Tenho interesse no ${turma}.`;
      else if (periodo) msg += ` Tenho interesse no ${nomePeriodo(periodo)}.`;
      $('#f-text').value = msg; // o envio nativo do formulário leva phone + text
    });
  }

  /* ---- Botão fixo do WhatsApp: aparece depois da abertura, some no contato ---- */
  const zap = $('.zap');
  const hero = $('.hero');
  const contato = $('#contato');
  /* ---- Fotografia que se move: o arco dos motivos desliza com a rolagem ---- */
  const drift = $('[data-drift]');
  const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let marcado = false;
  const aoRolar = () => {
    marcado = false;
    if (zap && hero) {
      const passouAbertura = hero.getBoundingClientRect().bottom < 80;
      const noContato = contato && contato.getBoundingClientRect().top < innerHeight * 0.6;
      zap.classList.toggle('is-on', passouAbertura && !noContato);
    }
    if (drift && !semMovimento) {
      const r = drift.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) {
        const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
        drift.style.setProperty('--drift', (-12 * p).toFixed(2) + '%');
      }
    }
  };
  const pedir = () => { if (!marcado) { marcado = true; requestAnimationFrame(aoRolar); } };
  addEventListener('scroll', pedir, { passive: true });
  addEventListener('resize', pedir);
  aoRolar();
})();

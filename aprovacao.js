const EMAILJS_SERVICE_ID    = 'service_5efmgj4';
const EMAILJS_TEMPLATE_RESP = 'template_sp6zekj';
const EMAILJS_PUBLIC_KEY    = 'Dk9mXiwX5YIuVzs78';
const RH_EMAIL = 'rh.prosaudejp@gmail.com';

emailjs.init(EMAILJS_PUBLIC_KEY);

let dadosReq = null;

function cc(el, id) { document.getElementById(id).textContent = el.value.length; }
function sv(id, val) { const el = document.getElementById(id); if (el) el.textContent = val || '—'; }

window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const reqId = params.get('req');
  if (!reqId) { mostrarErro(); return; }

  const requisicoes = JSON.parse(localStorage.getItem('requisicoes') || '{}');
  const dados = requisicoes[reqId];

  if (!dados) { mostrarErro(); return; }
  if (dados.status !== 'pendente') { mostrarJaRespondida(dados); return; }

  dadosReq = dados;
  renderizar(dados);
});

function renderizar(d) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('conteudo').style.display = 'block';

  sv('cv-req', d.req);
  sv('cv-nome', d.nome + (d.mat ? ' — Mat. ' + d.mat : ''));
  sv('cv-cargo-depto', d.cargo + ' / ' + d.depto);
  sv('cv-email', d.email);
  sv('cv-data', d.data);
  sv('cv-cc', d.cc || '—');
  sv('cv-tipo', d.tipo);
  sv('cv-col', d.colNome + (d.colMat ? ' — Mat. ' + d.colMat : ''));
  sv('cv-cargo-at', d.colCargo || '—');
  sv('cv-cargo-nv', d.colNovo || '—');
  sv('cv-sal-at', d.salAt ? 'R$ ' + d.salAt : '—');
  sv('cv-sal-nv', d.salNv ? 'R$ ' + d.salNv : '—');
  document.getElementById('cv-sal-nv-row').style.display = d.salNv ? 'flex' : 'none';
  sv('cv-data-mov', d.dataMov || '—');
  sv('cv-urg', d.urg);
  sv('cv-just', d.just);
  sv('cv-imp', d.imp || '—');
  sv('cv-obs', d.obs || '—');
  document.getElementById('cv-imp-wrap').style.display = d.imp ? 'block' : 'none';
  document.getElementById('cv-obs-wrap').style.display = d.obs ? 'block' : 'none';
}

async function decidir(decisao) {
  const comment = document.getElementById('ceo-comment').value.trim();
  const isAprov = decisao === 'aprovado';

  const btnA = document.querySelector('.btn-aprov');
  const btnR = document.querySelector('.btn-repr');
  btnA.disabled = true; btnR.disabled = true;
  if (isAprov) btnA.innerHTML = '<i class="ti ti-loader"></i> Processando...';
  else btnR.innerHTML = '<i class="ti ti-loader"></i> Processando...';

  // Atualizar status
  const requisicoes = JSON.parse(localStorage.getItem('requisicoes') || '{}');
  requisicoes[dadosReq.req].status = decisao;
  requisicoes[dadosReq.req].comentarioCEO = comment;
  requisicoes[dadosReq.req].respondidoEm = new Date().toISOString();
  localStorage.setItem('requisicoes', JSON.stringify(requisicoes));

  // Enviar e-mail de resposta
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_RESP, {
      to_email:       dadosReq.email,
      to_name:        dadosReq.nome,
      rh_email:       RH_EMAIL,
      req_num:        dadosReq.req,
      decisao:        isAprov ? 'APROVADA ✅' : 'REPROVADA ❌',
      decisao_label:  isAprov ? 'aprovada' : 'reprovada',
      solicitante:    dadosReq.nome,
      colaborador:    dadosReq.colNome,
      tipo:           dadosReq.tipo,
      urgencia:       dadosReq.urg,
      comentario_ceo: comment || 'Nenhum comentário registrado.',
      data_decisao:   new Date().toLocaleDateString('pt-BR'),
    });
  } catch (err) {
    console.error('Erro ao enviar e-mail de resposta:', err);
  }

  // Mostrar resultado
  document.getElementById('conteudo').style.display = 'none';
  document.getElementById('resultado').style.display = 'block';

  const box = document.getElementById('result-box');
  box.className = 'result-wrap ' + (isAprov ? 'ok' : 'nok');
  document.getElementById('result-icon').className = 'ti ' + (isAprov ? 'ti-circle-check' : 'ti-circle-x') + ' big';
  document.getElementById('result-titulo').textContent = isAprov ? 'Requisição aprovada!' : 'Requisição reprovada';
  document.getElementById('result-desc').textContent =
    'A requisição ' + dadosReq.req + ' foi ' + (isAprov ? 'aprovada' : 'reprovada') + '.' +
    (comment ? ' Comentário: "' + comment + '"' : '');

  window.scrollTo(0, 0);
}

function mostrarErro() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('erro').style.display = 'block';
}

function mostrarJaRespondida(d) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('resultado').style.display = 'block';
  const isAprov = d.status === 'aprovado';
  const box = document.getElementById('result-box');
  box.className = 'result-wrap ' + (isAprov ? 'ok' : 'nok');
  document.getElementById('result-icon').className = 'ti ' + (isAprov ? 'ti-circle-check' : 'ti-circle-x') + ' big';
  document.getElementById('result-titulo').textContent = 'Esta requisição já foi ' + (isAprov ? 'aprovada' : 'reprovada');
  document.getElementById('result-desc').textContent =
    'A requisição ' + d.req + ' já foi respondida.' +
    (d.comentarioCEO ? ' Comentário: "' + d.comentarioCEO + '"' : '');
}

const EMAILJS_SERVICE_ID    = 'service_5efmgj4';
const EMAILJS_TEMPLATE_RESP = 'template_sp6zekj';
const EMAILJS_PUBLIC_KEY    = 'Dk9mXiwX5YIuVzs78';
const RH_EMAIL = 'rh.prosaudejp@gmail.com';
const JKEY   = '$2a$10$/.yUPbxEBYmJT42PBt.jZuxB/eQj.XaMUkLHkqOh/jCrj6WTGZbcO';
const BIN_ID = '6a30b426da38895dfec731e4';

emailjs.init(EMAILJS_PUBLIC_KEY);
let dadosReq = null;

function cc(el, id) { document.getElementById(id).textContent = el.value.length; }
function sv(id, val) { const el = document.getElementById(id); if(el) el.textContent = val||'—'; }

async function buscarReq(reqId) {
  const r = await fetch('https://api.jsonbin.io/v3/b/' + BIN_ID + '/latest', {
    headers: { 'X-Master-Key': JKEY }
  });
  const d = await r.json();
  return (d.record||{})[reqId]||null;
}

async function atualizarReq(reqId, campos) {
  const r = await fetch('https://api.jsonbin.io/v3/b/' + BIN_ID + '/latest', {
    headers: { 'X-Master-Key': JKEY }
  });
  const d = await r.json();
  const reqs = d.record||{};
  Object.assign(reqs[reqId], campos);
  await fetch('https://api.jsonbin.io/v3/b/' + BIN_ID, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': JKEY },
    body: JSON.stringify(reqs)
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const reqId = params.get('req');
  if (!reqId) { mostrarErro(); return; }
  try {
    const dados = await buscarReq(reqId);
    if (!dados) { mostrarErro(); return; }
    if (dados.status !== 'pendente') { mostrarJaRespondida(dados); return; }
    dadosReq = dados;
    renderizar(dados);
  } catch(e) { console.error(e); mostrarErro(); }
});

function renderizar(d) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('conteudo').style.display = 'block';
  sv('cv-req', d.req);
  sv('cv-nome', d.nome+(d.mat?' — Mat. '+d.mat:''));
  sv('cv-cargo-depto', d.cargo+' / '+d.depto);
  sv('cv-email', d.email);
  sv('cv-data', d.data);
  sv('cv-cc', d.cc||'—');
  sv('cv-tipo', d.tipo);
  sv('cv-col', d.colNome+(d.colMat?' — Mat. '+d.colMat:''));
  sv('cv-cargo-at', d.colCargo||'—');
  sv('cv-cargo-nv', d.colNovo||'—');
  sv('cv-sal-at', d.salAt?'R$ '+d.salAt:'—');
  sv('cv-sal-nv', d.salNv?'R$ '+d.salNv:'—');
  document.getElementById('cv-sal-nv-row').style.display = d.salNv?'flex':'none';
  sv('cv-data-mov', d.dataMov||'—');
  sv('cv-urg', d.urg);
  sv('cv-just', d.just);
  sv('cv-imp', d.imp||'—');
  sv('cv-obs', d.obs||'—');
  document.getElementById('cv-imp-wrap').style.display = d.imp?'block':'none';
  document.getElementById('cv-obs-wrap').style.display = d.obs?'block':'none';
}

function gerarAcaoRH(isAprov, dados) {
  if (isAprov) {
    return 'A requisição foi APROVADA. Por favor, providencie a execução da movimentação de "'
      + dados.tipo + '" para o colaborador ' + dados.colNome
      + ' (cargo atual: ' + (dados.colCargo || 'não informado')
      + (dados.colNovo ? ', novo cargo/situação: ' + dados.colNovo : '') + ')'
      + (dados.dataMov ? ', com data prevista para ' + dados.dataMov : '')
      + '. Atualize o sistema de RH, folha de pagamento e demais cadastros necessários. Comunique o solicitante e o colaborador sobre a aprovação.';
  }
  return 'A requisição foi REPROVADA pelo CEO. Nenhuma ação de movimentação deve ser executada. Recomenda-se arquivar esta solicitação e comunicar formalmente o solicitante sobre a reprovação, incluindo o comentário do CEO acima, se houver.';
}

async function decidir(decisao) {
  const comment = document.getElementById('ceo-comment').value.trim();
  const isAprov = decisao==='aprovado';
  const btnA = document.querySelector('.btn-aprov');
  const btnR = document.querySelector('.btn-repr');
  btnA.disabled=true; btnR.disabled=true;
  if(isAprov) btnA.innerHTML='<i class="ti ti-loader"></i> Processando...';
  else btnR.innerHTML='<i class="ti ti-loader"></i> Processando...';

  try {
    await atualizarReq(dadosReq.req, {
      status:decisao, comentarioCEO:comment,
      respondidoEm:new Date().toISOString()
    });

    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_RESP, {
      to_email:        dadosReq.email,
      to_name:         dadosReq.nome,
      rh_email:        RH_EMAIL,
      req_num:         dadosReq.req,
      decisao:         isAprov?'APROVADA':'REPROVADA',
      decisao_label:   isAprov?'aprovada':'reprovada',
      solicitante:     dadosReq.nome,
      cargo_depto:     dadosReq.cargo + ' / ' + dadosReq.depto,
      colaborador:     dadosReq.colNome,
      cargo_atual:     dadosReq.colCargo || 'não informado',
      cargo_pretendido:dadosReq.colNovo || 'não informado',
      tipo:            dadosReq.tipo,
      centro_custo:    dadosReq.cc || 'não informado',
      data_mov:        dadosReq.dataMov || 'não informada',
      urgencia:        dadosReq.urg,
      justificativa:   dadosReq.just,
      comentario_ceo:  comment || 'Nenhum comentário registrado.',
      data_decisao:    new Date().toLocaleDateString('pt-BR'),
      acao_rh:         gerarAcaoRH(isAprov, dadosReq),
    });
  } catch(e) { console.error('Erro:',e); }

  document.getElementById('conteudo').style.display='none';
  document.getElementById('resultado').style.display='block';
  const box=document.getElementById('result-box');
  box.className='result-wrap '+(isAprov?'ok':'nok');
  document.getElementById('result-icon').className='ti '+(isAprov?'ti-circle-check':'ti-circle-x')+' big';
  sv('result-titulo', isAprov?'Requisição aprovada!':'Requisição reprovada');
  sv('result-desc','A requisição '+dadosReq.req+' foi '+(isAprov?'aprovada':'reprovada')+'.'+(comment?' Comentário: "'+comment+'"':''));
  window.scrollTo(0,0);
}

function mostrarErro() {
  document.getElementById('loading').style.display='none';
  document.getElementById('erro').style.display='block';
}
function mostrarJaRespondida(d) {
  document.getElementById('loading').style.display='none';
  document.getElementById('resultado').style.display='block';
  const isAprov=d.status==='aprovado';
  document.getElementById('result-box').className='result-wrap '+(isAprov?'ok':'nok');
  document.getElementById('result-icon').className='ti '+(isAprov?'ti-circle-check':'ti-circle-x')+' big';
  sv('result-titulo','Esta requisição já foi '+(isAprov?'aprovada':'reprovada'));
  sv('result-desc','A requisição '+d.req+' já foi respondida.'+(d.comentarioCEO?' Comentário: "'+d.comentarioCEO+'"':''));
}

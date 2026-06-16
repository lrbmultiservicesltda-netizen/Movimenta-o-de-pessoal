const EMAILJS_SERVICE_ID   = 'service_5efmgj4';
const EMAILJS_TEMPLATE_CEO = 'template_3cu8cqd';
const EMAILJS_PUBLIC_KEY   = 'Dk9mXiwX5YIuVzs78';
const RH_EMAIL = 'rh.prosaudejp@gmail.com';
const BASE_URL = window.location.origin;
const JKEY   = '$2a$10$/.yUPbxEBYmJT42PBt.jZuxB/eQj.XaMUkLHkqOh/jCrj6WTGZbcO';
const BIN_ID = '6a30b426da38895dfec731e4';

emailjs.init(EMAILJS_PUBLIC_KEY);
let tipoSel = '', urgSel = '';
document.getElementById('f-data').valueAsDate = new Date();

async function salvarReq(dados) {
  const gr = await fetch('https://api.jsonbin.io/v3/b/' + BIN_ID + '/latest', {
    headers: { 'X-Master-Key': JKEY }
  });
  const gd = await gr.json();
  const reqs = gd.record || {};
  reqs[dados.req] = dados;
  const pr = await fetch('https://api.jsonbin.io/v3/b/' + BIN_ID, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': JKEY },
    body: JSON.stringify(reqs)
  });
  if (!pr.ok) throw new Error('Erro ao salvar: ' + pr.status);
}

function selTipo(btn) {
  document.querySelectorAll('.tbtn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on'); tipoSel = btn.dataset.t;
  document.getElementById('tipo-outro-wrap').style.display = tipoSel==='Outro'?'block':'none';
}
function selUrg(btn, n) {
  document.querySelectorAll('.ubtn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on'); urgSel = n;
}
function cc(el, id) { document.getElementById(id).textContent = el.value.length; }
function fmtSal(el) {
  let v = el.value.replace(/\D/g,'');
  if (!v) { el.value=''; return; }
  el.value = (parseInt(v)/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
}
function g(id) { return document.getElementById(id).value.trim(); }

async function enviarRequisicao() {
  const obrig = ['f-nome','f-cargo','f-depto','f-email','f-col-nome','f-just','f-ceo-email'];
  let ok = true;
  obrig.forEach(id => {
    const el = document.getElementById(id);
    if (!el.value.trim()) { el.classList.add('err'); ok=false; } else el.classList.remove('err');
  });
  if (!tipoSel) { alert('Selecione o tipo de movimentação.'); return; }
  if (!urgSel)  { alert('Selecione o nível de urgência.'); return; }
  if (!ok) { alert('Preencha todos os campos obrigatórios.'); return; }

  const btn = document.getElementById('btn-enviar');
  btn.disabled = true;
  btn.innerHTML = '<i class="ti ti-loader"></i> Enviando...';

  const num = 'REQ-'+new Date().getFullYear()+'-'+String(Math.floor(Math.random()*9000)+1000);
  const urgMap = {baixa:'Baixa',media:'Média',alta:'Alta'};
  const dados = {
    req:num, nome:g('f-nome'), mat:g('f-mat'), cargo:g('f-cargo'),
    depto:g('f-depto'), email:g('f-email'),
    data:g('f-data')||new Date().toLocaleDateString('pt-BR'), cc:g('f-cc'),
    tipo:tipoSel==='Outro'?g('f-tipo-outro')||'Outro':tipoSel,
    colNome:g('f-col-nome'), colMat:g('f-col-mat'),
    colCargo:g('f-col-cargo'), colNovo:g('f-col-novo'),
    salAt:g('f-sal-at'), salNv:g('f-sal-nv'),
    dataMov:g('f-data-mov'), urg:urgMap[urgSel],
    just:g('f-just'), imp:g('f-imp'), obs:g('f-obs'),
    ceoEmail:g('f-ceo-email'), status:'pendente',
    criadoEm:new Date().toISOString()
  };

  try {
    await salvarReq(dados);
    const link = BASE_URL+'/aprovacao.html?req='+encodeURIComponent(num);
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_CEO, {
      to_email:dados.ceoEmail, to_name:'CEO', req_num:num,
      solicitante:dados.nome, cargo_depto:dados.cargo+' / '+dados.depto,
      colaborador:dados.colNome, tipo:dados.tipo, urgencia:dados.urg,
      data_mov:dados.dataMov||'—', justificativa:dados.just,
      link_aprovacao:link, rh_email:RH_EMAIL,
    });
    document.getElementById('link-url-text').textContent = link;
    document.getElementById('req-num-tag').textContent = num;
    document.getElementById('form-main').style.display = 'none';
    document.getElementById('form-success').style.display = 'block';
    window.scrollTo(0,0);
  } catch(err) {
    console.error(err);
    alert('Erro ao enviar: ' + (err.text||err.message||JSON.stringify(err)));
  }
  btn.disabled=false;
  btn.innerHTML='<i class="ti ti-send"></i> Enviar requisição ao CEO';
}

function copiarLink() {
  const t = document.getElementById('link-url-text').textContent;
  navigator.clipboard.writeText(t).then(() => {
    const btn = document.querySelector('.copy-btn');
    btn.innerHTML='<i class="ti ti-check"></i> Copiado!';
    setTimeout(()=>{btn.innerHTML='<i class="ti ti-copy"></i> Copiar';},2000);
  });
}

function novaReq() {
  tipoSel=''; urgSel='';
  document.querySelectorAll('input,textarea').forEach(el=>{el.value='';el.classList.remove('err');});
  document.querySelectorAll('.tbtn,.ubtn').forEach(b=>b.classList.remove('on'));
  document.getElementById('tipo-outro-wrap').style.display='none';
  document.querySelectorAll('.char-count span').forEach(s=>s.textContent='0');
  document.getElementById('form-main').style.display='block';
  document.getElementById('form-success').style.display='none';
  document.getElementById('f-data').valueAsDate=new Date();
  window.scrollTo(0,0);
}
function limpar() { if(!confirm('Deseja limpar todos os campos?')) return; novaReq(); }

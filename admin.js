// Seletores
const inputHoras = document.getElementById('horas');
const inputMinutos = document.getElementById('minutos');
const resultado = document.getElementById('tempo-estimado');
const inputMensagem = document.getElementById('aviso');


// Canal de comunicação entre abas
const canal = new BroadcastChannel('canal_cronometro');
canal.onmessage = (event) => {
    const data = event.data;

    if (data.tipo === 'encerrado') {
        const tipo = document.getElementById('tipo').value;
        const horas = parseInt(inputHoras.value) || 0;
        const minutos = parseInt(inputMinutos.value) || 0;
        const atraso = data.atraso || "Nenhum";

        salvarHistorico(tipo, horas, minutos, atraso);

        alert(`⏹ Cronômetro encerrado. Atraso registrado: ${atraso}`);

        inputHoras.value = "";
        inputMinutos.value = "";
        atualizarEstimativa();
    }
};
// Atualiza a estimativa de término
function atualizarEstimativa() {
    const horas = parseInt(inputHoras.value) || 0;
    const minutos = parseInt(inputMinutos.value) || 0;

    const agora = new Date();
    const fim = new Date(agora.getTime() + (horas * 60 + minutos) * 60000);

    const h = fim.getHours().toString().padStart(2, '0');
    const m = fim.getMinutes().toString().padStart(2, '0');

    if (!horas && !minutos) {
        resultado.textContent = `Defina um tempo para ver a estimativa`;
    } else {
        resultado.textContent = `Tempo estimado - ${h}h${m}`;
    }
}

// Adiciona minutos rápidos ao input
function adicionarTempo(min) {
    let horas = parseInt(inputHoras.value) || 0;
    let minutos = parseInt(inputMinutos.value) || 0;

    minutos += min;

    if (minutos >= 60) {
        horas += Math.floor(minutos / 60);
        minutos = minutos % 60;
    }

    inputHoras.value = horas;
    inputMinutos.value = minutos;

    atualizarEstimativa();
}

function limparCampos() {
    inputHoras.value = "";
    inputMinutos.value = "";
    resultado.textContent = "Defina um tempo para ver a estimativa";
}

// Envia mensagem pro pastor
function enviarMensagem() {
  const texto = inputMensagem.value.trim();
  if (texto) {
    canal.postMessage({
      tipo: 'mensagem',
      texto: texto
    });

    inputMensagem.value = "";

    // ✅ Mostra o toast
    const toast = document.getElementById('toast');
    toast.classList.add('show');

    // ⏱ Esconde depois de 3s
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

function pararCronometro() {
    canal.postMessage({
        tipo: 'controle',
        acao: 'parar'
    });
}

function adicionarTempoExtra(segundos) {
    // Atualiza os inputs
    let horas = parseInt(inputHoras.value) || 0;
    let minutos = parseInt(inputMinutos.value) || 0;

    minutos += Math.floor(segundos / 60);

    if (minutos >= 60) {
        horas += Math.floor(minutos / 60);
        minutos = minutos % 60;
    }

    inputHoras.value = horas;
    inputMinutos.value = minutos;

    atualizarEstimativa(); // Atualiza visualmente a estimativa

    // Envia pro display
    canal.postMessage({
        tipo: 'controle',
        acao: 'adicionar',
        segundos: segundos
    });
}


let novaJanela = null;

function CriarCronometro() {
    const horas = parseInt(inputHoras.value) || 0;
    const minutos = parseInt(inputMinutos.value) || 0;
    const totalSegundos = (horas * 60 + minutos) * 60;

    // Salva no localStorage
    localStorage.setItem('tempo_cronometro', totalSegundos.toString());

    const novaJanela = window.open(
        'display.html',
        'DisplayCronometro',
        'width=700,height=325,resizable=no,scrollbars=no,toolbar=no,menubar=no,location=no,status=no'
    );

    if (novaJanela) {
        novaJanela.onload = () => {
            novaJanela.resizeTo(600, 400);
            // Força manter o tamanho fixo mesmo se tentarem redimensionar
            novaJanela.onresize = () => {
                novaJanela.resizeTo(600, 400);
            };
        };
    }
}

function salvarHistorico(tipo, horas, minutos, atraso) {
    const historico = JSON.parse(localStorage.getItem('historico')) || [];

    const dataAtual = new Date();
    const data = dataAtual.toLocaleDateString('pt-BR');
    const tempo = `${String(horas).padStart(2, '0')}h${String(minutos).padStart(2, '0')}min`;

    historico.push({
        tipo,
        data,
        tempo,
        atraso
    });

    localStorage.setItem('historico', JSON.stringify(historico));
}


function exportarCSV() {
    const historico = JSON.parse(localStorage.getItem('historico')) || [];

    if (historico.length === 0) {
        alert("⛔ Nenhum histórico para exportar.");
        return;
    }

    let csv = "Período,Data,Tempo Previsto,Atraso\n";

    historico.forEach(item => {
        csv += `${item.tipo},${item.data},${item.tempo},${item.atraso || "Nenhum"}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `historico_${new Date().toLocaleDateString("pt-BR").replace(/\//g, '-')}.csv`;
    a.click();

    URL.revokeObjectURL(url);
}


// Pausar cronômetro
function pausarCronometro() {
    canal.postMessage({
        tipo: 'controle',
        acao: 'pausar'
    });
}

// Retomar cronômetro
function retomarCronometro() {
    canal.postMessage({
        tipo: 'controle',
        acao: 'retomar'
    });
}

// Reiniciar cronômetro (usa tempo atual do input)
function reiniciarCronometro() {
    const horas = parseInt(inputHoras.value) || 0;
    const minutos = parseInt(inputMinutos.value) || 0;
    const totalSegundos = (horas * 60 + minutos) * 60;

    canal.postMessage({
        tipo: 'controle',
        acao: 'reiniciar',
        segundos: totalSegundos
    });

    atualizarEstimativa();
}



// Atualiza ao digitar
inputHoras.addEventListener('input', atualizarEstimativa);
inputMinutos.addEventListener('input', atualizarEstimativa);

atualizarEstimativa(); // auto start

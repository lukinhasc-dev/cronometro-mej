window.onload = () => {
  const cronometro = document.getElementById('tempo');
  const mensagem = document.getElementById('mensagem');

  let tempoRestante = parseInt(localStorage.getItem('tempo_cronometro')) || 0;
  let intervalo = null;
  let pausado = false;

  function atualizarTempoSeparado(segundos, negativo = false) {
    const h = Math.floor(segundos / 3600).toString().padStart(2, '0');
    const m = Math.floor((segundos % 3600) / 60).toString().padStart(2, '0');
    const s = (segundos % 60).toString().padStart(2, '0');

    document.getElementById('horas').textContent = h;
    document.getElementById('minutos').textContent = m;
    document.getElementById('segundos').textContent = s;

    const spans = document.querySelectorAll('#tempo span');
    spans.forEach(span => {
      span.classList.toggle('negativo', negativo);
    });
  }




  function atualizarDisplay() {
    const h = Math.floor(tempoRestante / 3600);
    const m = Math.floor((tempoRestante % 3600) / 60);
    const s = tempoRestante % 60;

    document.getElementById('horas').textContent = String(h).padStart(2, '0');
    document.getElementById('minutos').textContent = String(m).padStart(2, '0');
    document.getElementById('segundos').textContent = String(s).padStart(2, '0');
  }


  function iniciarContagem() {
    if (intervalo) clearInterval(intervalo);

    intervalo = setInterval(() => {
      if (!pausado) {
        tempoRestante--;

        if (tempoRestante < 0) {
          atualizarTempoSeparado(Math.abs(tempoRestante), true);
          document.getElementById('toast-encerrado').style.display = 'block'; // ⬅ mostra toast
        } else {
          atualizarTempoSeparado(tempoRestante, false);
          document.getElementById('toast-encerrado').style.display = 'none'; // oculta se ainda positivo
        }
      }
    }, 1000);
  }


  atualizarDisplay(); // mostra valor logo ao carregar
  iniciarContagem();  // começa o cronômetro

  // Canal só pra mensagens
  const canal = new BroadcastChannel('canal_cronometro');

  canal.onmessage = (event) => {
    const data = event.data;

    // 👉 Quando o cronômetro for encerrado (parado ou aba fechada)
    if (data.tipo === 'encerrado') {
      const tipo = document.getElementById('tipo').value; // select ou input com nome do período
      const horas = parseInt(inputHoras.value) || 0;
      const minutos = parseInt(inputMinutos.value) || 0;
      const atraso = data.atraso || "Nenhum";

      salvarHistorico(tipo, horas, minutos, atraso);

      alert(`Cronômetro encerrado. Atraso registrado: ${atraso}`);

      inputHoras.value = "";
      inputMinutos.value = "";
      atualizarEstimativa();
      return; // ⛔ Importante: evita continuar processando esse evento abaixo
    }

    // 👉 Mensagem para o display (mensagem do admin pro cronômetro)
    if (data.tipo === 'mensagem') {
      mensagem.textContent = data.texto;
    }

    // 👉 Controle do cronômetro vindo do display
    if (data.tipo === 'controle') {
      switch (data.acao) {
        case 'pausar':
          pausado = true;
          mensagem.textContent = 'Pausado';
          break;
        case 'retomar':
          pausado = false;
          mensagem.textContent = '';
          break;
        case 'reiniciar':
          clearInterval(intervalo);
          intervalo = null;
          pausado = false;

          if (typeof data.segundos === 'number' && data.segundos > 0) {
            tempoRestante = data.segundos;
            cronometro.style.display = 'block';
            mensagem.style.display = 'block';
            atualizarDisplay();
            iniciarContagem();
          } else {
            cronometro.textContent = '00:00';
            mensagem.textContent = '⛔ Tempo inválido para reiniciar.';
          }
          break;

        case 'adicionar':
          const extra = parseInt(data.segundos);
          if (!isNaN(extra)) {
            tempoRestante += extra;
            atualizarDisplay();
            if (!intervalo) iniciarContagem();
          }
          break;

        case 'parar':
          clearInterval(intervalo);
          const atraso = tempoRestante < 0
            ? `${Math.floor(Math.abs(tempoRestante) / 60)}min`
            : "";

          canal.postMessage({
            tipo: 'encerrado',
            atraso: atraso
          });

          tempoRestante = 0;
          cronometro.textContent = "00:00";
          mensagem.textContent = "Cronômetro encerrado";

          setTimeout(() => {
            window.close();
          }, 1000);
          break;
      }
    }

    // 👉 Envia o tempo inicial pro cronômetro
    if (data.tipo === 'tempo') {
      clearInterval(intervalo);
      tempoRestante = data.segundos;
      pausado = false;
      cronometro.style.color = '#fff';
      atualizarDisplay();
      iniciarContagem();
      mensagem.textContent = '';
    }
  };

  // Detecta fechamento da janela e registra atraso, se houver
  window.addEventListener('beforeunload', () => {
    if (tempoRestante < 0) {
      const atraso = `${Math.floor(Math.abs(tempoRestante) / 60)}min`;

      canal.postMessage({
        tipo: 'encerrado',
        atraso: atraso
      });
    }
  });

};

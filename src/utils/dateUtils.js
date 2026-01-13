export const getNowInSaoPaulo = () => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const get = (type) => {
    const part = parts.find(p => p.type === type);
    const value = part && part.value ? String(part.value) : '';
    return value ? value.padStart(2, '0') : '00';
  };

  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = get('hour');
  const minute = get('minute');
  const second = get('second');

  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
};

export const getHojeSaoPauloISODate = () => {
  const spNow = getNowInSaoPaulo();
  return spNow.toISOString().split('T')[0];
};

export const getAnoMesAtualSaoPaulo = () => {
  return getHojeSaoPauloISODate().slice(0, 7);
};

export const calcularIdade = (dataNascimentoISO) => {
  if (!dataNascimentoISO) return null;
  const nascimento = new Date(dataNascimentoISO);
  if (Number.isNaN(nascimento.getTime())) return null;

  const hoje = getNowInSaoPaulo();
  let idade = hoje.getFullYear() - nascimento.getFullYear();

  const mesAtual = hoje.getMonth();
  const diaAtual = hoje.getDate();
  const mesNasc = nascimento.getMonth();
  const diaNasc = nascimento.getDate();

  if (mesAtual < mesNasc || (mesAtual === mesNasc && diaAtual < diaNasc)) {
    idade--;
  }

  return idade;
};
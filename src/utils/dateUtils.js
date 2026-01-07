export const getNowInSaoPaulo = () => {
  const now = new Date();
  const spString = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  return new Date(spString);
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
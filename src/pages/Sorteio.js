const mongoose = require('mongoose');

const SorteioSchema = new mongoose.Schema({
  times: { type: Array, required: true },
  jogadoresPresentes: { type: Number, required: true },
  balanceamento: { type: String, required: true },
  posicaoUnica: { type: String },
  data: { type: Date, default: Date.now },
  // Vínculo opcional com partida para auditoria
  partidaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partida' }
}, { timestamps: true });

module.exports = mongoose.model('Sorteio', SorteioSchema);
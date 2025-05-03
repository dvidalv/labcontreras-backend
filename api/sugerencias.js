const { createPacienteSugerencia } = require('../lib/pacientesDB');
const sendSugerencia = async (req, res) => {
  const sugerencia = req.body;
  const paciente = await createPacienteSugerencia(sugerencia);
  res.status(200).json(paciente);
};

module.exports = { sendSugerencia };

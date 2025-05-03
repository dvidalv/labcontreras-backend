import { MongoClient } from 'mongodb';

const uri = process.env.ATLAS_URI;

const client = new MongoClient(uri);

const createPacienteSugerencia = async (req, res) => {
  const sugerencia = req.body;

//validamos la data
if (!sugerencia.nombre || !sugerencia.satisfaccion || !sugerencia.mejora) {
  return res.status(400).json({ error: 'Todos los campos son requeridos' });
}
const sugerenciasModificada = { 
  ...sugerencia,
  fecha: new Date(),
};
  try {
    await client.connect();
    const db = client.db('sugerencias');
    const sugerencias = db.collection('sugerenciasPacientes');
    await sugerencias.insertOne(sugerenciasModificada);
    res.status(200).json(sugerenciasModificada);
  } catch (error) {
    console.error('Error al crear la sugerencia', error);
    throw error;
  }
};

export { createPacienteSugerencia };

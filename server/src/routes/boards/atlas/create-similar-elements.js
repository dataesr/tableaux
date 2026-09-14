import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017/");

async function run() {
  try {
    const database = client.db('tableaux-dev');
    const atlasCollection = database.collection('atlas2024');
    const similarElementsCollection = database.collection('similar-elements');

    await similarElementsCollection.deleteMany({});

    const years = await atlasCollection.distinct("annee_universitaire");
    const geoIds = await atlasCollection.distinct("geo_id");

    for (let i = 0; i < years.length; i++) {
      for (let j = 0; j < geoIds.length; j++) {
        const query = { geo_id: geoIds[j], annee_universitaire: years[i], regroupement: 'TOTAL' };
        const data = await atlasCollection.find(query).toArray();

        const effectifPR = data.filter((item) => item.secteur === 'PR').reduce((acc, item) => acc + item.effectif, 0);
        const effectifPU = data.filter((item) => item.secteur === 'PU').reduce((acc, item) => acc + item.effectif, 0);
        const pctPR = effectifPR / (effectifPR + effectifPU) * 100;
        const pctPU = effectifPU / (effectifPR + effectifPU) * 100;

        const effectifF = data.filter((item) => item.sexe === '2').reduce((acc, item) => acc + item.effectif, 0);
        const effectifM = data.filter((item) => item.sexe === '1').reduce((acc, item) => acc + item.effectif, 0);
        const pctF = effectifF / (effectifF + effectifM) * 100;
        const pctM = effectifM / (effectifF + effectifM) * 100;

        const similarElement = {
          geo_id: geoIds[j],
          annee_universitaire: years[i],
          niveau_geo: data[0]?.niveau_geo,
          geo_nom: data[0]?.geo_nom,
          effectifPR: effectifPR,
          effectifPU: effectifPU,
          pctPR: pctPR,
          pctPU: pctPU,
          effectifF: effectifF,
          effectifM: effectifM,
          pctF: pctF,
          pctM: pctM,
        };

        const result = await similarElementsCollection.insertOne(similarElement);
      };
    };
  } finally {
    await client.close();
  }
}
run().catch(console.dir);

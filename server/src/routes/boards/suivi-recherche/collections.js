import { NotFoundError } from "../../../commons/errors/index.js";
import { db } from "../../../services/mongo.js";

export const BOARD_ID = "suivi-recherche";

// Les collections sont publiées par la chaîne athena sous le nom <collection>_<horodatage>
// et enregistrées comme versions dans le document du tableau (boards.data[].versions).
// Seule la version courante, choisie dans l'admin (boards.data[].current), est lue :
// une nouvelle publication n'est jamais mise en ligne sans validation.
export async function getCollection(nom) {
  const board = await db.collection("boards").findOne({ id: BOARD_ID });
  const current = board?.data?.find((item) => item.id === nom)?.current;

  if (!current) {
    throw new NotFoundError(`No current version for collection "${nom}" in board "${BOARD_ID}" (to be set in /admin)`);
  }
  return db.collection(current);
}

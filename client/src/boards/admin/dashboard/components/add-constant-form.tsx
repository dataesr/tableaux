import { useState } from "react";
import type { FormEvent } from "react";
import { Alert, Button, Col, Row, TextInput } from "@dataesr/dsfr-plus";

import type { DashboardConstant } from "../utils";

type Props = {
  addConstant: (constant: DashboardConstant) => Promise<{ success: boolean; message: string }>;
};

const emptyConstant: DashboardConstant = { key: "", value: "", description: "" };

// Ajoute une constante en staging. Sa valeur de prod se saisit ensuite dans le tableau des constantes.
export default function AddConstantForm({ addConstant }: Props) {
  const [constant, setConstant] = useState<DashboardConstant>(emptyConstant);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const response = await addConstant(constant);
    setIsSubmitting(false);
    setResult(response);
    if (response.success) setConstant(emptyConstant);
  };

  return (
    <form className="fr-mt-3w fr-mb-5w" onSubmit={handleSubmit}>
      <fieldset className="fr-fieldset">
        <legend className="fr-fieldset__legend">Ajouter une constante</legend>
        <Row gutters className="fr-col-12">
          <Col xs="12" md="3">
            <TextInput label="Clé" onChange={(e) => setConstant({ ...constant, key: e.target.value })} required value={constant.key} />
          </Col>
          <Col xs="12" md="3">
            <TextInput label="Valeur staging" onChange={(e) => setConstant({ ...constant, value: e.target.value })} value={constant.value} />
          </Col>
          <Col xs="12" md="6">
            <TextInput label="Description" onChange={(e) => setConstant({ ...constant, description: e.target.value })} value={constant.description} />
          </Col>
        </Row>
        <div className="fr-fieldset__element">
          <Button disabled={isSubmitting || !constant.key.trim()} icon="add-line" size="sm" type="submit">
            Ajouter la constante
          </Button>
        </div>
      </fieldset>
      <div role="status">{result && <Alert closeMode="controlled" description={result.message} onClose={() => setResult(null)} title={result.success ? "Succès" : "Erreur"} variant={result.success ? "success" : "error"} />}</div>
    </form>
  );
}

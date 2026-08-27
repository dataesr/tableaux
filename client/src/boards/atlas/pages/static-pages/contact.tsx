import {
  Button,
  Col,
  Container,
  Row,
  Text,
  TextArea,
  TextInput,
  Title,
} from "@dataesr/dsfr-plus";
import { useState, useRef } from "react";
import { FormData } from "../../../../types/atlas";

const { VITE_APP_SERVER_URL } = import.meta.env;

export default function Contact() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [fonction, setFonction] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [success, setSuccess] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);

  const isFormValid =
    email.trim() !== "" && message.trim() !== "" && name.trim() !== "";

  const validate = (data: FormData) => {
    const newErrors: Partial<FormData> = {};
    if (!data.email.trim()) {
      newErrors.email = "Ce champ est obligatoire";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = "Email invalide";
    }
    if (!data.message.trim()) {
      newErrors.message = "Ce champ est obligatoire";
    }
    if (!data.name.trim()) {
      newErrors.name = "Ce champ est obligatoire";
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccess(false);

    const formData: FormData = {
      email,
      extra: {
        fonction,
        organisation,
        subApplication: "atlas",
      },
      fromApplication: "tableaux",
      message,
      name,
    };

    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      if (validationErrors.name && nameRef.current) {
        nameRef.current.focus();
      }
      return;
    }

    const response = await fetch(`${VITE_APP_SERVER_URL}/contact`, {
      body: JSON.stringify(formData),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (response.ok) {
      setEmail("");
      setFonction("");
      setMessage("");
      setName("");
      setOrganisation("");
      setSuccess(true);

      if (nameRef.current) {
        nameRef.current.focus();
      }

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } else {
      setErrorMessage("Une erreur est survenue lors de l'envoi du message.");
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
    }
  };

  return (
    <Container className="fr-mt-2w">
      <Title as="h1" look="h2">
        Envoyer un formulaire de contact
      </Title>

      {success && (
        <p role="alert" className="fr-alert fr-alert--success fr-mb-3w">
          Votre message a bien été envoyé !
        </p>
      )}

      {errorMessage && (
        <p role="alert" className="fr-alert fr-alert--error fr-mb-3w">
          {errorMessage}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Row gutters>
          <Col md="6">
            <TextInput
              className="fr-mt-3w"
              disableAutoValidation
              label="Nom"
              message={errors.name}
              messageType={errors.name ? "error" : undefined}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom (obligatoire)"
              ref={nameRef}
              required
              type="text"
              value={name}
            />
            <TextInput
              className="fr-mt-3w"
              disableAutoValidation
              label="Fonction"
              onChange={(e) => setFonction(e.target.value)}
              placeholder="Votre fonction"
              type="text"
              value={fonction}
            />
            <TextInput
              className="fr-mt-3w"
              disableAutoValidation
              label="Organisation"
              onChange={(e) => setOrganisation(e.target.value)}
              placeholder="Votre organisation"
              type="text"
              value={organisation}
            />
          </Col>
          <Col md="6">
            <TextInput
              className="fr-mt-3w"
              disableAutoValidation
              label="Email"
              message={errors.email}
              messageType={errors.email ? "error" : undefined}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email (obligatoire)"
              required
              type="email"
              value={email}
            />
            <TextArea
              disableAutoValidation
              label="Message"
              message={errors.message}
              messageType={errors.message ? "error" : undefined}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Votre message (obligatoire)"
              required
              rows={5}
              value={message}
            />
          </Col>
        </Row>
        <Col style={{ textAlign: "right" }}>
          <Button className="fr-mt-3w" disabled={!isFormValid} type="submit">
            Envoyer le message
          </Button>
          {!isFormValid && (
            <Text className="fr-mt-1w">
              Veuillez remplir tous les champs requis pour envoyer votre
              formulaire.
            </Text>
          )}
        </Col>
      </form>
    </Container>
  );
}

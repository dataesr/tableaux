import {
  Button,
  Col,
  Container,
  Row,
  TextArea,
  TextInput,
  Title,
  useToast,
} from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useSendContact } from "./api";
import i18n from "./i18n.json";

import "./styles.scss";

const { VITE_APP_SERVER_URL } = import.meta.env;


type FormValues = {
  name: string;
  email: string;
  message: string;
  fonction: string;
  organisation: string;
};

type FormErrors = Partial<FormValues>;

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const { toast } = useToast();
  const { mutate: sendContact, isPending } = useSendContact();

  const { data: dashboards, isLoading } = useQuery({
    queryKey: ["list-dashboards"],
    queryFn: () => fetch(`${VITE_APP_SERVER_URL}/admin/list-dashboards`).then((response) => response.json()),
  });

  if (isLoading) {
    return (
      <Container className="fr-py-5w" role="main">
        <p>Chargement...</p>
      </Container>
    );
  }

  function translate(key: keyof typeof i18n): string {
    return i18n[key][currentLang] ?? i18n[key]["fr"];
  }

  const fromParam = searchParams.get("from") ?? "general";
  const dashboard = dashboards.filter((dashboard) => dashboard.homePageVisible).find((dashboard) => dashboard.id === fromParam) ?? fromParam;

  const [values, setValues] = useState<FormValues>({
    name: "",
    email: "",
    message: "",
    fonction: "",
    organisation: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const set =
    (field: keyof FormValues) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setValues((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!values.name.trim()) newErrors.name = translate("nameError");
    if (!values.email.trim()) newErrors.email = translate("emailRequiredError");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      newErrors.email = translate("emailInvalidError");
    if (!values.message.trim()) newErrors.message = translate("messageRequiredError");
    else if (values.message.trim().length < 20)
      newErrors.message = translate("messageTooShortError");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    sendContact(
      {
        email: values.email.trim(),
        name: values.name.trim(),
        message: values.message.trim(),
        subApplication: dashboard,
        ...(values.fonction && { fonction: values.fonction.trim() }),
        ...(values.organisation && {
          organisation: values.organisation.trim(),
        }),
      },
      {
        onSuccess: () => {
          toast?.({
            id: "contact-success",
            title: translate("successTitle"),
            description: translate("successDescription"),
            type: "success",
          });
          setValues({
            name: "",
            email: "",
            message: "",
            fonction: "",
            organisation: "",
          });
        },
        onError: () => {
          toast?.({
            id: "contact-error",
            title: translate("errorTitle"),
            description: translate("errorDescription"),
            type: "error",
          });
        },
      }
    );
  };

  const submitLabel = isPending ? translate("submitPending") : translate("submitButton");

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <Container>
          <p className="contact-hero__label">{translate("heroLabel")}</p>
          <Title as="h1" look="h1" className="contact-hero__title">
            {translate("title")}
          </Title>
          <p className="contact-hero__description">{translate("description")}</p>
        </Container>
      </section>
      <Container as="main" id="main" className="contact-content fr-mt-5w">

        <form onSubmit={handleSubmit} noValidate>
          <Row gutters>
            <Col xs="12" md="5">
              <TextInput
                label={translate("dashboardLabel")}
                hint={translate("dashboardHint")}
                value={dashboard?.name_fr}
                disabled
                disableAutoValidation
              />
              <Row gutters>
                <Col xs="6">
                  <TextInput
                    label={translate("nameLabel")}
                    required
                    disableAutoValidation
                    placeholder={translate("namePlaceholder")}
                    value={values.name}
                    onChange={set("name")}
                    message={errors.name}
                    messageType={errors.name ? "error" : undefined}
                  />
                </Col>
                <Col xs="6">
                  <TextInput
                    label={translate("emailLabel")}
                    required
                    disableAutoValidation
                    type="email"
                    placeholder={translate("emailPlaceholder")}
                    value={values.email}
                    onChange={set("email")}
                    message={errors.email}
                    messageType={errors.email ? "error" : undefined}
                  />
                </Col>
                <Col xs="6">
                  <TextInput
                    label={translate("fonctionLabel")}
                    disableAutoValidation
                    placeholder={translate("fonctionPlaceholder")}
                    value={values.fonction}
                    onChange={set("fonction")}
                  />
                </Col>
                <Col xs="6">
                  <TextInput
                    label={translate("organisationLabel")}
                    disableAutoValidation
                    placeholder={translate("organisationPlaceholder")}
                    value={values.organisation}
                    onChange={set("organisation")}
                  />
                </Col>
              </Row>
            </Col>

            <Col xs="12" md="7">
              <TextArea
                label={translate("messageLabel")}
                required
                disableAutoValidation
                placeholder={translate("messageTooShortError")}
                value={values.message}
                onChange={set("message")}
                message={errors.message}
                messageType={errors.message ? "error" : undefined}
                rows={12}
              />
              <div className="fr-btns-group fr-btns-group--inline-reverse">
                <Button type="submit" disabled={isPending} title={submitLabel}>
                  {submitLabel}
                </Button>
              </div>
            </Col>
          </Row>
        </form>
      </Container>
    </div>
  );
}

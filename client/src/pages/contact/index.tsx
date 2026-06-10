import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  Col,
  Container,
  Row,
  Text,
  TextArea,
  TextInput,
  Title,
  useToast,
} from "@dataesr/dsfr-plus";
import { DASHBOARDS, getDashboardLabel } from "./config";
import { useSendContact } from "./api";
import i18n from "./i18n.json";

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

  function t(key: keyof typeof i18n): string {
    return i18n[key][currentLang] ?? i18n[key]["fr"];
  }

  const fromParam = searchParams.get("from") ?? "general";
  const dashboard = DASHBOARDS.some((d) => d.value === fromParam)
    ? fromParam
    : "general";

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
    if (!values.name.trim()) newErrors.name = t("nameError");
    if (!values.email.trim()) newErrors.email = t("emailRequiredError");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      newErrors.email = t("emailInvalidError");
    if (!values.message.trim()) newErrors.message = t("messageRequiredError");
    else if (values.message.trim().length < 20)
      newErrors.message = t("messageTooShortError");
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
            title: t("successTitle"),
            description: t("successDescription"),
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
            title: t("errorTitle"),
            description: t("errorDescription"),
            type: "error",
          });
        },
      }
    );
  };
  return (
    <Container className="fr-py-8w">
      <Title as="h1" look="h5" className="fr-mb-2w">
        {t("title")}
      </Title>
      <Text className="fr-text--lg fr-mb-6w">{t("description")}</Text>

      <form onSubmit={handleSubmit} noValidate>
        <Row gutters>
          <Col xs="12" md="5">
            <TextInput
              label={t("dashboardLabel")}
              hint={t("dashboardHint")}
              value={getDashboardLabel(dashboard)}
              disabled
              disableAutoValidation
            />
            <Row gutters>
              <Col xs="6">
                <TextInput
                  label={t("nameLabel")}
                  required
                  disableAutoValidation
                  placeholder={t("namePlaceholder")}
                  value={values.name}
                  onChange={set("name")}
                  message={errors.name}
                  messageType={errors.name ? "error" : undefined}
                />
              </Col>
              <Col xs="6">
                <TextInput
                  label={t("emailLabel")}
                  required
                  disableAutoValidation
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={values.email}
                  onChange={set("email")}
                  message={errors.email}
                  messageType={errors.email ? "error" : undefined}
                />
              </Col>
              <Col xs="6">
                <TextInput
                  label={t("fonctionLabel")}
                  disableAutoValidation
                  placeholder={t("fonctionPlaceholder")}
                  value={values.fonction}
                  onChange={set("fonction")}
                />
              </Col>
              <Col xs="6">
                <TextInput
                  label={t("organisationLabel")}
                  disableAutoValidation
                  placeholder={t("organisationPlaceholder")}
                  value={values.organisation}
                  onChange={set("organisation")}
                />
              </Col>
            </Row>
          </Col>

          <Col xs="12" md="7">
            <TextArea
              label={t("messageLabel")}
              required
              disableAutoValidation
              placeholder={t("messageTooShortError")}
              value={values.message}
              onChange={set("message")}
              message={errors.message}
              messageType={errors.message ? "error" : undefined}
              rows={12}
            />

            {/* <Text className="fr-text--xs fr-mt-2w">
              {t("privacy")} <a href="/cookies">{t("privacyLink")}</a>.
            </Text> */}
            <div className="fr-btns-group fr-btns-group--inline-reverse">
              <Button type="submit" disabled={isPending}>
                {isPending ? t("submitPending") : t("submitButton")}
              </Button>
            </div>
          </Col>
        </Row>
      </form>
    </Container>
  );
}

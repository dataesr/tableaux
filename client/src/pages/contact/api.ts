import { useMutation } from "@tanstack/react-query";

const { VITE_APP_SERVER_URL } = import.meta.env;

export type ContactPayload = {
  email: string;
  name: string;
  message: string;
  subApplication: string;
  fonction?: string;
  organisation?: string;
};

async function sendContact(payload: ContactPayload): Promise<void> {
  const response = await fetch(`${VITE_APP_SERVER_URL}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: payload.email,
      name: payload.name,
      message: payload.message,
      fromApplication: "tableaux",
      extra: {
        subApplication: payload.subApplication,
        ...(payload.fonction && { fonction: payload.fonction }),
        ...(payload.organisation && { organisation: payload.organisation }),
      },
    }),
  });
  if (!response.ok) throw new Error("Erreur lors de l'envoi");
}

export function useSendContact() {
  return useMutation({ mutationFn: sendContact });
}

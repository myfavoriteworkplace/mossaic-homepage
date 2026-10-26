import CONTACT_CONFIG from "./data/contact-config.json";

export type ContactPayload = {
  name: string;
  email: string;
  interest: string;
  message: string;
  gotcha: string;
};

export async function sendContactMessage(
  payload: ContactPayload,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch(CONTACT_CONFIG.workerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error("The email service returned an invalid response.");
  }

  const accepted =
    typeof result === "object" &&
    result !== null &&
    "success" in result &&
    result.success === true;

  if (!response.ok || !accepted) {
    throw new Error("The email service did not accept the message.");
  }
}

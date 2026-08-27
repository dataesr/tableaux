import express from "express";

const router = express.Router();

router.post("/contact", async (req, res) => {
  try {
    const { name, email, message, fromApplication, extra } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ error: "Tous les champs requis ne sont pas remplis." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ error: "L'adresse email n'est pas valide." });
    }

    const ticketOfficeUrl = process.env.TICKET_OFFICE_API_URL;

    const response = await fetch(ticketOfficeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${process.env.TICKET_OFFICE_BASIC_AUTH}`,
      },
      body: JSON.stringify({ name, email, message, fromApplication, extra }),
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.statusText}`);
    }

    return res.status(200).json({ message: "Message envoyé avec succès." });
  } catch (error) {
    console.error("Erreur lors de l'envoi du message :", error);
    return res
      .status(500)
      .json({ error: "Une erreur est survenue lors de l'envoi du message." });
  }
});

export default router;

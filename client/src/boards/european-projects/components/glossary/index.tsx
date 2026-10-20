import { Button, Modal, ModalContent, ModalTitle } from "@dataesr/dsfr-plus";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import glossary from "./glossary.json";

import "./styles.scss";


export default function Glossary({ id }: { id: string }) {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const [isOpen, setIsOpen] = useState(false)
  const { definition, label } = glossary[id]

  return (
    <>
      <Modal
        hide={() => setIsOpen(!isOpen)}
        isOpen={isOpen}
        size="lg"
      >
        <ModalTitle>
          {label[currentLang]}
        </ModalTitle>
        <ModalContent>
          {definition[currentLang]}
        </ModalContent>
      </Modal>
      <Button className="glossary-button" icon="book-2-line" onClick={() => setIsOpen(true)} size="sm" variant="secondary" />
    </>
  )
}

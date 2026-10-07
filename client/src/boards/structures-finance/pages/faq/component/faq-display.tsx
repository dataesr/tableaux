import { useState } from "react";

interface FAQTheme {
  theme: string;
  ordre: number;
  questions: {
    question: string;
    reponse: string;
    ordre: number;
  }[];
}

interface FAQProps {
  data: FAQTheme[];
  className?: string;
}

export default function FAQ({ data, className = "" }: FAQProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleAccordion = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (!data || data.length === 0) {
    return (
      <div className="fr-alert fr-alert--info" role="status">
        <p>Aucune question fréquente disponible pour le moment.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {data.map((theme, themeIndex) => (
        <div key={`theme-${themeIndex}`} className="fr-mb-6w">
          <h2 className="fr-h3 fr-mb-2w">{theme.theme}</h2>
          <div className="fr-accordions-group">
            {theme.questions.map((item, questionIndex) => {
              const accordionId = `accordion-${themeIndex}-${questionIndex}`;
              const isExpanded = expandedItems.has(accordionId);

              return (
                <section key={accordionId} className="fr-accordion">
                  <h3 className="fr-accordion__title">
                    <button
                      className="fr-accordion__btn"
                      aria-expanded={isExpanded}
                      aria-controls={`${accordionId}-content`}
                      onClick={() => toggleAccordion(accordionId)}
                      type="button"
                    >
                      {item.question}
                    </button>
                  </h3>
                  <div
                    className="fr-collapse"
                    id={`${accordionId}-content`}
                    style={{ display: isExpanded ? "block" : "none" }}
                  >
                    <p>{item.reponse}</p>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

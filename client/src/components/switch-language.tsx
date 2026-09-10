import { useSearchParams } from "react-router-dom";

export default function SwitchLanguage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";

  const handleLanguageChange = (lang: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("language", lang);
    setSearchParams(newParams);
  };

  return (
    <dialog id="fr-translate-modal" className="fr-modal" role="dialog" aria-labelledby="fr-translate-modal-title">
      <div className="fr-container fr-container--fluid fr-container-md">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-6 fr-col-lg-4">
            <div className="fr-modal__body">
              <div className="fr-modal__header">
                <button type="button" className="fr-btn--close fr-btn" aria-controls="fr-translate-modal" title="Fermer">
                  Fermer
                </button>
              </div>
              <div className="fr-modal__content">
                <h1 id="fr-translate-modal-title" className="fr-modal__title">
                  Sélectionner une langue
                  <span className="fr-hint-text">Select a language</span>
                </h1>
                <div className="fr-translate">
                  <fieldset className="fr-fieldset" id="translate-fieldset">
                    <legend className="fr-fieldset__legend--regular fr-fieldset__legend" id="translate-fieldset-legend">
                      Choisissez une langue
                      <span className="fr-hint-text">Choose a language</span>
                    </legend>
                    <div className="fr-fieldset__element">
                      <div className="fr-radio-group">
                        <input
                          type="radio"
                          id="fr-radios-language-fr"
                          name="fr-radios-language"
                          value="fr"
                          checked={currentLang === "fr"}
                          onChange={() => handleLanguageChange("fr")}
                        />
                        <label className="fr-label" htmlFor="fr-radios-language-fr">
                          Français
                          <span className="fr-hint-text">French</span>
                        </label>
                      </div>
                    </div>
                    <div className="fr-fieldset__element">
                      <div className="fr-radio-group">
                        <input
                          type="radio"
                          id="fr-radios-language-en"
                          name="fr-radios-language"
                          value="en"
                          checked={currentLang === "en"}
                          onChange={() => handleLanguageChange("en")}
                        />
                        <label className="fr-label" htmlFor="fr-radios-language-en">
                          English
                          <span className="fr-hint-text">Anglais</span>
                        </label>
                      </div>
                    </div>
                  </fieldset>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}

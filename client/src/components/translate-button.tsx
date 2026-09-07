import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function TranslateButton() {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentLang = searchParams.get("language") || "fr";

    useEffect(() => {
        if (!searchParams.get("language")) {
            searchParams.set("language", "fr");
            setSearchParams(searchParams);
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        const lang = searchParams.get("language") || "fr";
        document.documentElement.lang = lang;
    }, [searchParams]);

    return (
        <div className="fr-header__tools">
            <div className="fr-header__tools-links">
                <nav role="navigation" className="fr-translate fr-nav">
                    <div className="fr-nav__item">
                        <button aria-controls="translate" aria-expanded="false" type="button" className="fr-translate__btn fr-btn">{currentLang === "en" ? "EN" : "FR"}<span className="fr-hidden-lg">&nbsp;- {currentLang === "en" ? "English" : "Français"}</span>
                        </button>
                        <div className="fr-collapse fr-translate__menu fr-menu" id="translate">
                            <ul className="fr-menu__list">
                                <li>
                                    <a className="fr-translate__language fr-nav__link" lang="fr" href="?language=fr" aria-current={currentLang === "fr" ? "true" : undefined}>FR - Français</a>
                                </li>
                                <li>
                                    <a className="fr-translate__language fr-nav__link" lang="en" href="?language=en" aria-current={currentLang === "en" ? "true" : undefined}>EN - English</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </nav>
            </div>
        </div>
    );
}

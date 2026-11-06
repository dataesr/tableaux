import { useEffect, useId, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import "./translate-button.scss";

const LANGUAGES = [
    { code: "fr", label: "Français" },
    { code: "en", label: "English" },
] as const;

export default function TranslateButton() {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentLang = searchParams.get("language") === "en" ? "en" : "fr";
    const [isOpen, setIsOpen] = useState(false);
    const menuId = useId();
    const navRef = useRef<HTMLElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const onClick = (e: MouseEvent) => {
            if (!navRef.current?.contains(e.target as Node)) setIsOpen(false);
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            setIsOpen(false);
            buttonRef.current?.focus();
        };
        document.addEventListener("click", onClick);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("click", onClick);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [isOpen]);

    return (
        <nav ref={navRef} role="navigation" className="fr-translate fr-nav">
            <div className="fr-nav__item">
                <button
                    aria-controls={menuId}
                    aria-expanded={isOpen}
                    className="fr-translate__btn fr-btn fr-btn--tertiary"
                    onClick={() => setIsOpen((open) => !open)}
                    ref={buttonRef}
                    title="Sélectionner une langue"
                    type="button"
                >
                    {currentLang.toUpperCase()}<span className="fr-hidden-lg">&nbsp;- {LANGUAGES.find(({ code }) => code === currentLang)!.label}</span>
                </button>
                <div
                    className={`fr-collapse fr-translate__menu fr-menu${isOpen ? " fr-collapse--expanded" : ""}`}
                    id={menuId}
                >
                    <ul className="fr-menu__list">
                        {LANGUAGES.map(({ code, label }) => {
                            const params = new URLSearchParams(searchParams);
                            params.set("language", code);
                            return (
                                <li key={code}>
                                    <a
                                        aria-current={code === currentLang ? "true" : undefined}
                                        className="fr-translate__language fr-nav__link"
                                        href={`?${params.toString()}`}
                                        hrefLang={code}
                                        lang={code}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setSearchParams(params);
                                            setIsOpen(false);
                                        }}
                                    >
                                        {code.toUpperCase()} - {label}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </nav>
    );
}

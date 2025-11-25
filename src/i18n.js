// src/i18n.js
import en from "./locales/en.json";
import es from "./locales/es.json";
import pt from "./locales/pt.json";

const translations = {
  en,
  es,
  pt,
};

/**
 * Crea una función t(path) para un idioma dado.
 * path = "app.title", "buttons.download", "editor.placeholder", etc.
 */
export function createTranslator(lang = "en") {
  const dict = translations[lang] || translations["en"];

  return function t(path) {
    const value = path.split(".").reduce((obj, key) => {
      if (!obj || typeof obj !== "object") return undefined;
      return obj[key];
    }, dict);

    // Si no existe la clave, devolvemos la propia clave para detectar errores
    return value === undefined ? path : value;
  };
}

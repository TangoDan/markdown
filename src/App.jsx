import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { defaultMarkdowns } from "./i18n/defaultMarkdowns";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import "./App.css";

import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";

import { createTranslator } from "./i18n";

// Configuración de idiomas para el menú y las banderas
const LANGUAGE_CONFIG = {
  es: {
    label: "ES",
    name: "Español",
    flagClass: "flag-es",
  },
  en: {
    label: "EN",
    name: "English",
    flagClass: "flag-en",
  },
  pt: {
    label: "PT",
    name: "Português",
    flagClass: "flag-pt",
  },
};

function App() {
  // Idioma actual
  const [language, setLanguage] = useState(
    () => localStorage.getItem("app_lang") || "es"
  );
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const t = useMemo(() => createTranslator(language), [language]);
  const lang = language; // "es", "en", "pt"


  // Mostrar/ocultar vista previa
  const [showPreview, setShowPreview] = useState(true);

  // Refs para sincronizar scroll
  const previewRef = useRef(null);
  const codeMirrorRef = useRef(null);
  const isSyncingRef = useRef(null);

  // Texto del editor
  const [markdownText, setMarkdownText] = useState("");
    const track = (eventName, props) => {
    if (window.plausible) {
      window.plausible(eventName, props ? { props } : undefined);
    }
  };

  // Configuración global de marked + highlight.js
  useEffect(() => {
    marked.setOptions({
      breaks: true,
      highlight: (code, lang) => {
        const langToUse = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language: langToUse }).value;
      },
    });
  }, []);

  // Carga inicial: localStorage o texto por defecto según idioma
  useEffect(() => {
    const savedText = localStorage.getItem("markdown_editor_content");
    if (savedText && savedText.length > 0) {
      setMarkdownText(savedText);
    } else {
      // 👇 acá usamos el markdown por defecto según idioma
      setMarkdownText(defaultMarkdowns[lang] || defaultMarkdowns.es);
    }
    // No ponemos lang en dependencias para no pisar el texto al cambiar idioma
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si cambia el idioma y el editor está vacío, cargamos el ejemplo de ese idioma
  useEffect(() => {
    // Solo queremos tocar el editor si NO hay nada guardado de antes
    const savedText = localStorage.getItem("markdown_editor_content");
    if (!savedText || savedText.length === 0) {
      setMarkdownText(defaultMarkdowns[lang] || defaultMarkdowns.es);
    }
  }, [lang]);

   //función para alternar light
  const [theme, setTheme] = useState(
  () => localStorage.getItem("app_theme") || "light"
  );

  //función para alternar
  const toggleTheme = () => {
  setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const getMarkdownHtml = () => ({
    __html: marked(markdownText || ""),
  });

  // Cambiar idioma desde el menú
  const handleLanguageChange = (lang) => {

    track("change_lang", { lang });   // 👈 evento con prop "lang"

    setLanguage(lang);
    localStorage.setItem("app_lang", lang);
    setIsLangMenuOpen(false);
  };

  // Descargar archivo .md
  const handleDownload = () => {

    track("download_md");          // 👈 evento Plausible para medir

    const blob = new Blob([markdownText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "documento.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Cargar archivo .md
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {

      track("upload_md");          // 👈 evento Plausible

      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === "string") {
          setMarkdownText(e.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearEditor = () => {
    setMarkdownText("");
    localStorage.setItem("markdown_editor_content", "");

    track("clear_editor"); // opcional: evento para Plausible
  };


  // --- Sincronización de scroll ---

  const syncScroll = (sourceElement, targetElement) => {
    if (!sourceElement || !targetElement) return;
    const maxSourceScroll =
      sourceElement.scrollHeight - sourceElement.clientHeight;
    const maxTargetScroll =
      targetElement.scrollHeight - targetElement.clientHeight;
    if (maxSourceScroll <= 0) return;

    const ratio = sourceElement.scrollTop / maxSourceScroll;
    targetElement.scrollTop = ratio * maxTargetScroll;
  };

  const handleEditorScroll = useCallback(
    (event) => {
      if (!showPreview) return;

      // Si el último scroll lo disparó el preview, no volvemos a sincronizar
      if (isSyncingRef.current === "preview") return;

      isSyncingRef.current = "editor";

      const previewElement = previewRef.current;
      if (previewElement) {
        syncScroll(event.target, previewElement);
      }

      // Liberamos el bloqueo en el siguiente frame
      window.requestAnimationFrame(() => {
        isSyncingRef.current = null;
      });
    },
    [showPreview]
  );
  const handlePreviewScroll = useCallback((event) => {
    const editorView = codeMirrorRef.current?.view;
    if (!editorView) return;

    // Si el último scroll lo disparó el editor, no volvemos a sincronizar
    if (isSyncingRef.current === "editor") return;

    isSyncingRef.current = "preview";

    const editorScroller = editorView.dom.querySelector(".cm-scroller");
    if (editorScroller) {
      syncScroll(event.target, editorScroller);
    }

    window.requestAnimationFrame(() => {
      isSyncingRef.current = null;
    });
  }, []);

  //Agregá este efecto para aplicarlo al body
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("app_theme", theme);
  }, [theme]);

  // Guardar contenido del editor en localStorage
  useEffect(() => {
    localStorage.setItem("markdown_editor_content", markdownText);

    if (markdownText && markdownText.length > 5) {
      // Marco que este usuario realmente usó el editor
      if (!localStorage.getItem("editor_used_once")) {
        localStorage.setItem("editor_used_once", "1");
        track("first_time_typing");
      }
    }
  }, [markdownText]);

  // Suscribir scroll del editor
  useEffect(() => {
    const editorView = codeMirrorRef.current?.view;
    if (!editorView || !editorView.dom) return;

    const editorScrollElement = editorView.dom.querySelector(".cm-scroller");
    if (!editorScrollElement) return;

    editorScrollElement.addEventListener("scroll", handleEditorScroll);
    return () => {
      editorScrollElement.removeEventListener("scroll", handleEditorScroll);
    };
  }, [handleEditorScroll]);

  // Forzar re-layout cuando se oculta/muestra la preview
  useEffect(() => {
    setTimeout(() => {
      const view = codeMirrorRef.current?.view;
      if (view) {
        view.requestMeasure();
      }
      window.dispatchEvent(new Event("resize"));
    }, 100);
  }, [showPreview]);

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <div className="header-left">
          <h1>{t("app.title")}</h1>
          <p className="subtitle">{t("app.subtitle")}</p>
        </div>

        <div className="header-right">
          <div className="marketing-text">
            <strong>{t("app.idealTitle")}</strong>
            <br />
            <span>{t("app.idealList")}</span>
          </div>

          <div className="toolbar">
            {/* Selector de idioma con banderas */}
            <div className="lang-selector">
              <button
                type="button"
                className="lang-button"
                onClick={() => setIsLangMenuOpen((open) => !open)}
              >
                <span
                  className={`flag-icon ${
                    LANGUAGE_CONFIG[language].flagClass
                  }`}
                />
                <span className="lang-label">
                  {LANGUAGE_CONFIG[language].label}
                </span>
              </button>

              {isLangMenuOpen && (
                <div className="lang-menu">
                  {["es", "en", "pt"].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      className={`lang-menu-item ${
                        lang === language ? "active" : ""
                      }`}
                      onClick={() => handleLanguageChange(lang)}
                    >
                      <span
                        className={`flag-icon ${
                          LANGUAGE_CONFIG[lang].flagClass
                        }`}
                      />
                      <span className="lang-menu-text">
                        {LANGUAGE_CONFIG[lang].name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 👉 NUEVO: Limpiar editor */}
            <button
              onClick={handleClearEditor}
              className="action-button clear-btn"
              type="button"
            >
              {t("buttons.clear")}
            </button>

            {/* 👉 NUEVO: "🌙" : "☀️" */}
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>

            {/* Toggle de vista previa */}
            <button
              onClick={() => setShowPreview((v) => !v)}
              className="action-button secondary"
              type="button"
            >
              {showPreview
                ? t("buttons.hidePreview")
                : t("buttons.showPreview")}
            </button>

            {/* Cargar archivo */}
            <label htmlFor="file-upload" className="upload-label">
              {t("buttons.upload")}
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".md, .markdown"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />


            {/* Descargar archivo */}
            <button
              onClick={handleDownload}
              className="action-button primary"
              type="button"
            >
              {t("buttons.download")}
            </button>
          </div>
        </div>
      </header>

      {/* LAYOUT PRINCIPAL */}
      <div className="editor-layout">
        <div className={`editor-pane ${!showPreview ? "expanded" : ""}`}>
          <CodeMirror
            className="cm-theme-wrapper"
            value={markdownText}
            onChange={(value) => setMarkdownText(value)}
            extensions={[markdown(), EditorView.lineWrapping]}
            theme={oneDark}
            height="100%"
            basicSetup={{ lineNumbers: true, tabSize: 4 }}
            ref={codeMirrorRef}
          />
        </div>

        {showPreview && (
          <div
            className="preview-pane"
            dangerouslySetInnerHTML={getMarkdownHtml()}
            ref={previewRef}
            onScroll={handlePreviewScroll}
          />
        )}
      </div>
    </div>
  );
}

export default App;
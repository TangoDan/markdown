import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
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

  // Mostrar/ocultar vista previa
  const [showPreview, setShowPreview] = useState(true);

  // Refs para sincronizar scroll
  const previewRef = useRef(null);
  const codeMirrorRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(null);

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

  // Carga inicial: localStorage o placeholder según idioma
  useEffect(() => {
    const savedText = localStorage.getItem("markdown_editor_content");
    if (savedText && savedText.length > 0) {
      setMarkdownText(savedText);
    } else {
      setMarkdownText(t("editor.placeholder"));
    }
    // No ponemos t en dependencias para no pisar el texto al cambiar idioma
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (isScrolling === "preview" || !showPreview) return;
      setIsScrolling("editor");
      const previewElement = previewRef.current;
      if (previewElement) {
        syncScroll(event.target, previewElement);
      }
      setTimeout(() => setIsScrolling(null), 50);
    },
    [isScrolling, showPreview]
  );

  const handlePreviewScroll = useCallback(
    (event) => {
      if (isScrolling === "editor" || !codeMirrorRef.current) return;
      setIsScrolling("preview");
      const previewElement = event.target;
      const editorView = codeMirrorRef.current.view;
      if (editorView && editorView.dom) {
        const editorScroller = editorView.dom.querySelector(".cm-scroller");
        if (editorScroller) {
          syncScroll(previewElement, editorScroller);
        }
      }
      setTimeout(() => setIsScrolling(null), 50);
    },
    [isScrolling]
  );

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
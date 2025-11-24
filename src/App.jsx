import { useState, useRef, useEffect, useCallback } from 'react';
import { marked } from 'marked'; 
import hljs from 'highlight.js'; 
import 'highlight.js/styles/github-dark.css'; 
import './App.css'; 

import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view'; 

// Diccionario de traducciones
const TRANSLATIONS = {
  es: {
    title: "Markdown Express",
    subtitle: "Escribe en Markdown. Ve el resultado al instante. Sin registro. 100% gratis.",
    idealTitle: "🚀 Ideal para:",
    idealList: "Escritores técnicos • Profesores de programación • Creadores en Notion/Obsidian",
    hidePreview: "📝 Ocultar Vista Previa",
    showPreview: "👀 Mostrar Vista Previa",
    upload: "📂 Cargar .md",
    download: "💾 Descargar .md",
    placeholder: "# ¡Funciona! 🎉\n\nSi ocultas la vista previa, este editor ocupará el 100% de la pantalla.\n\n---\n\n## Instrucciones:\n1. Usa el botón **'Ocultar Vista Previa'**.\n2. El editor debe expandirse totalmente.\n"
  },
  en: {
    title: "Markdown Express",
    subtitle: "Write in Markdown. See result instantly. No signup. 100% free.",
    idealTitle: "🚀 Ideal for:",
    idealList: "Technical Writers • Coding Instructors • Notion/Obsidian Creators",
    hidePreview: "📝 Hide Preview",
    showPreview: "👀 Show Preview",
    upload: "📂 Load .md",
    download: "💾 Download .md",
    placeholder: "# It Works! 🎉\n\nIf you hide the preview, this editor will take up 100% of the screen.\n\n---\n\n## Instructions:\n1. Use the **'Hide Preview'** button.\n2. The editor should expand fully.\n"
  }
};

function App() {
  
  // 1. ESTADOS Y REFERENCIAS
  // Estado de idioma (por defecto intenta leer localStorage o usa español)
  const [language, setLanguage] = useState(() => localStorage.getItem('app_lang') || 'es');
  const t = TRANSLATIONS[language]; // Acceso rápido a textos actuales

  const [showPreview, setShowPreview] = useState(true); 
  const previewRef = useRef(null); 
  const codeMirrorRef = useRef(null); 
  const [isScrolling, setIsScrolling] = useState(null); 
  
  const [markdownText, setMarkdownText] = useState(t.placeholder);
  
  // 2. CONFIGURACIÓN DE MARKED
  marked.setOptions({
    breaks: true,
    highlight: (code, lang) => {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  });

  const getMarkdownHtml = () => {
    return { __html: marked(markdownText) };
  };

  // 3. FUNCIONES DE ARCHIVOS Y UTILIDADES
  const toggleLanguage = () => {
    const newLang = language === 'es' ? 'en' : 'es';
    setLanguage(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documento.md'; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setMarkdownText(e.target.result);
      reader.readAsText(file);
    }
  };  

  // 4. SCROLL SYNC
  const syncScroll = (sourceElement, targetElement) => {
    if (!sourceElement || !targetElement) return;
    const scrollRatio = sourceElement.scrollTop / (sourceElement.scrollHeight - sourceElement.clientHeight);
    targetElement.scrollTop = scrollRatio * (targetElement.scrollHeight - targetElement.clientHeight);
  };

  const handleEditorScroll = useCallback((event) => {
    if (isScrolling === 'preview' || !showPreview) return;
    setIsScrolling('editor');
    const previewElement = previewRef.current;
    if (previewElement) syncScroll(event.target, previewElement);
    setTimeout(() => setIsScrolling(null), 50);
  }, [isScrolling, showPreview]); 

  const handlePreviewScroll = useCallback((event) => {
      if (isScrolling === 'editor' || !codeMirrorRef.current) return;
      setIsScrolling('preview');
      const previewElement = event.target;
      const editorView = codeMirrorRef.current.view; 
      if (editorView && editorView.dom) {
          const editorScroller = editorView.dom.querySelector('.cm-scroller');
          if (editorScroller) syncScroll(previewElement, editorScroller);
      }
      setTimeout(() => setIsScrolling(null), 50);
  }, [isScrolling]);

  // 5. LOCAL STORAGE Y SETUP
  useEffect(() => {
    const savedText = localStorage.getItem('markdown_editor_content');
    // Si hay texto guardado, lo usamos. Si no, usamos el placeholder del idioma actual
    if (savedText) {
        setMarkdownText(savedText);
    } else {
        setMarkdownText(t.placeholder);
    }
  }, []); // Solo al montar

  useEffect(() => {
    localStorage.setItem('markdown_editor_content', markdownText);
  }, [markdownText]); 

  useEffect(() => {
    const editorView = codeMirrorRef.current?.view;
    if (!editorView || !editorView.dom) return;
    const editorScrollElement = editorView.dom.querySelector('.cm-scroller');
    if (editorScrollElement) {
      editorScrollElement.addEventListener('scroll', handleEditorScroll);
      return () => editorScrollElement.removeEventListener('scroll', handleEditorScroll);
    }
  }, [handleEditorScroll]);

  // 7. REDIMENSIONAMIENTO
  useEffect(() => {
    setTimeout(() => {
        if (codeMirrorRef.current?.view) {
            codeMirrorRef.current.view.requestMeasure();
        }
        window.dispatchEvent(new Event('resize'));
    }, 100);
  }, [showPreview]);


  // 6. RENDERIZADO
  return (
    <div className="app-container">
      
      {/* NUEVO HEADER FLEXIBLE */}
      <header className="app-header">
        <div className="header-left">
            <h1>{t.title}</h1>
            <p className="subtitle">{t.subtitle}</p>
        </div>
        
        <div className="header-right">
            <div className="marketing-text">
                <strong>{t.idealTitle}</strong> <br/>
                <span>{t.idealList}</span>
            </div>
            
            <div className="toolbar">
                <button onClick={toggleLanguage} className="lang-button">
                    {language === 'es' ? '🇺🇸 EN' : '🇪🇸 ES'}
                </button>

                <button onClick={() => setShowPreview(!showPreview)} className="action-button secondary">
                    {showPreview ? t.hidePreview : t.showPreview}
                </button>
                
                <label htmlFor="file-upload" className="upload-label">
                    {t.upload}
                </label>
                <input 
                    id="file-upload"
                    type="file"
                    accept=".md, .markdown"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                />

                <button onClick={handleDownload} className="action-button primary">
                    {t.download}
                </button>
            </div>
        </div>
      </header>

      <div className="editor-layout">
        <div className={`editor-pane ${!showPreview ? 'expanded' : ''}`}> 
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
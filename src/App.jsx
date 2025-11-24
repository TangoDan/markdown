import { useState, useRef, useEffect, useCallback } from 'react';
import { marked } from 'marked'; 
import hljs from 'highlight.js'; 
import 'highlight.js/styles/github-dark.css'; 
import './App.css'; 

import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view'; 

function App() {
  
  // 1. ESTADOS Y REFERENCIAS
  // CRÍTICO: Controla la visibilidad y, por CSS, la expansión del editor.
  const [showPreview, setShowPreview] = useState(true); 
  const previewRef = useRef(null); 
  const codeMirrorRef = useRef(null); 
  const [isScrolling, setIsScrolling] = useState(null); 
  
  const [markdownText, setMarkdownText] = useState(
`# ¡Editor Listo! 🎉

Ahora el botón "Ocultar Vista Previa" funciona correctamente:

1. **Expansión al 100%:** El editor ocupa el 100% de ancho de la pantalla al ocultar la vista previa.
2. **Redibujado Forzado:** El editor se redibuja correctamente sin quedarse a 50% de ancho.

---

## Próximas pasos:
- Sincronización del scroll: Pruébala, está implementada.
- Manejo de archivos: Carga y descarga tu Markdown.

### Código de ejemplo
\`\`\`javascript
function saludar() {
  console.log("¡Todo funcionando!");
}
saludar();
\`\`\`
`
  );
  
  // 2. CONFIGURACIÓN DE MARKED (con Highlight.js)
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

  // 3. FUNCIONES DE MANEJO
  
  // FUNCIÓN CRÍTICA: Cambia el estado de la vista previa
  const togglePreview = () => {
    setShowPreview(prev => !prev);
  };
  
  // Manejo de Descarga
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

  // Manejo de Carga de Archivo
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setMarkdownText(e.target.result);
      reader.readAsText(file);
    }
  };  
  
  // 4. SCROLL SYNC LOGIC (Optimizado con useCallback)
  const syncScroll = (sourceElement, targetElement) => {
    if (!sourceElement || !targetElement) return;
    const scrollRatio = sourceElement.scrollTop / (sourceElement.scrollHeight - sourceElement.clientHeight);
    targetElement.scrollTop = scrollRatio * (targetElement.scrollHeight - targetElement.clientHeight);
  };

  const handleEditorScroll = useCallback((event) => {
    // Solo sincroniza si la vista previa está visible
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


  // 5. USE EFFECTS

  // Efectos para Local Storage
  useEffect(() => {
    const savedText = localStorage.getItem('markdown_editor_content');
    if (savedText) setMarkdownText(savedText);
  }, []); 

  useEffect(() => {
    localStorage.setItem('markdown_editor_content', markdownText);
  }, [markdownText]); 

  // Efecto para adjuntar el listener de scroll al editor
  useEffect(() => {
    const editorView = codeMirrorRef.current?.view;
    if (!editorView || !editorView.dom) return;
    const editorScrollElement = editorView.dom.querySelector('.cm-scroller');
    if (editorScrollElement) {
      editorScrollElement.addEventListener('scroll', handleEditorScroll);
      return () => editorScrollElement.removeEventListener('scroll', handleEditorScroll);
    }
  }, [handleEditorScroll]);

  // EFECTO CRÍTICO: FORZAR REDIMENSIONAMIENTO DE CODEMIRROR
  // Se ejecuta CADA VEZ que el estado showPreview cambia (al presionar el botón)
  useEffect(() => {
    if (codeMirrorRef.current?.view) {
        // Obliga a CodeMirror a recalcular su ancho
        codeMirrorRef.current.view.requestMeasure();
        window.dispatchEvent(new Event('resize')); 
    }
  }, [showPreview]); 


  // 6. RENDERIZADO
  return (
    <div className="app-container">
      <h1>Editor Markdown Online</h1>

      <div className="toolbar">
          
          {/* BOTÓN TOGGLE (Ocultar/Mostrar Vista Previa) */}
          <button onClick={togglePreview} className="download-button">
              {showPreview ? '📝 Ocultar Vista Previa' : '👀 Mostrar Vista Previa'}
          </button>

          {/* Cargar Archivo */}
          <label htmlFor="file-upload" className="upload-label">
              📂 Cargar .md
          </label>
          <input 
              id="file-upload"
              type="file"
              accept=".md, .markdown"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
          />
          
          {/* Descargar Archivo */}
          <button onClick={handleDownload} className="download-button">
              💾 Descargar .md
          </button>
      </div>

      <div className="editor-layout">
        
        {/* PANEL IZQUIERDO: EDITOR */}
        {/* CRÍTICO: Clase condicional 'expanded' para el CSS */}
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
        
        {/* PANEL DERECHO: VISTA PREVIA (Condicional) */}
        {/* CRÍTICO: Condicional que quita el div del DOM cuando showPreview es falso */}
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
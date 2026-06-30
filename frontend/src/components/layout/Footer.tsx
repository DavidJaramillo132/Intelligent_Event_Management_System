import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__inner container">
        <p className="footer__text">
          © {new Date().getFullYear()} EventosPro — Sistema Inteligente de Gestión de Eventos
        </p>
        <p className="footer__a11y">
          <span aria-hidden="true">♿</span> Diseñado siguiendo las pautas WCAG 2.2 Nivel AA
          <span className="footer__shortcuts-hint" aria-hidden="true"> &nbsp;·&nbsp; </span>
          <kbd className="footer__kbd">Shift</kbd>
          <span className="sr-only">Presiona Shift para abrir la guía de atajos de teclado</span>
          <span aria-hidden="true"> atajos de teclado</span>
        </p>
      </div>
    </footer>
  );
}

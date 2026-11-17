  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const languageLinks = document.querySelectorAll(".language-switch a");
  function selectTab(tab, fragment = tab.id === "ai-tab" ? "#ai-panel" : "") {
    languageLinks.forEach(link => {
      link.hash = fragment;
    });
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
    document.dispatchEvent(new Event('certificate-tab-change'));
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectTab(tabs[next]);
      tabs[next].focus();
    });
  });
  function revealHash() {
    const target = document.getElementById(location.hash.slice(1));
    const panel = target && target.closest('[role="tabpanel"]');
    if (!panel) return;
    selectTab(document.getElementById(panel.getAttribute('aria-labelledby')), location.hash);
    if (target === panel) return;
    requestAnimationFrame(() => target.scrollIntoView());
  }
  window.addEventListener('hashchange', revealHash);
  revealHash();

  // Full-page rendering of the Projeto Colapso PDF; scales with the site card.
  // Upload the certificate to certs/projeto-colapso-certificate.pdf.
  document.addEventListener('DOMContentLoaded', async function () {
    const container = document.getElementById('colapso-pdf-preview');
    if (!container) return;
    // Wait until the panel has a real layout width, including on the first visit.
    if (!container.clientWidth) {
      await new Promise(resolve => {
        const onVisible = () => {
          if (!container.clientWidth) return;
          document.removeEventListener('certificate-tab-change', onVisible);
          resolve();
        };
        document.addEventListener('certificate-tab-change', onVisible);
        onVisible();
      });
    }
    const availableWidth = container.clientWidth;
    const pdfUrl = container.dataset.pdfSrc;
    const fallback = function () {
      container.innerHTML = '';
      const message = document.createElement('p');
      message.className = 'pdf-preview-message';
      message.textContent = container.dataset.previewUnavailable + " ";
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = container.dataset.openPdf;
      message.appendChild(link);
      container.appendChild(message);
    };

    if (!window.pdfjsLib) {
      fallback();
      return;
    }

    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const pdf = await pdfjsLib.getDocument({ url: pdfUrl }).promise;
      container.innerHTML = '';
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);


      // Normally certificates have one page; render every page if more exist.
      for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex++) {
        const page = await pdf.getPage(pageIndex);
        const original = page.getViewport({ scale: 1 });
        const fitScale = availableWidth / original.width;
        const canvas = document.createElement('canvas');
        canvas.setAttribute('aria-label', container.dataset.pageLabel + " " + pageIndex);
        const displayViewport = page.getViewport({ scale: fitScale });
        const renderViewport = page.getViewport({ scale: fitScale * pixelRatio });
        canvas.width = Math.ceil(renderViewport.width);
        canvas.height = Math.ceil(renderViewport.height);
        canvas.style.aspectRatio = displayViewport.width + ' / ' + displayViewport.height;
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d', { alpha: false });
        await page.render({ canvasContext: ctx, viewport: renderViewport, background: 'white' }).promise;
      }
    } catch (error) {
      console.warn('Unable to render Projeto Colapso certificate:', error);
      fallback();
    }
  });

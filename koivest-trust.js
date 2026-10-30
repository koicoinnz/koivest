/* KOIVEST V16.4: only augments Contact and Footer; no hero or portfolio modifications */
(function(){
  function install(){
    const contact = document.querySelector('.kv-contact-right');
    if (contact && !contact.querySelector('.kv-company-info')) {
      const info=document.createElement('div');
      info.className='kv-company-info';
      info.innerHTML='<p class="kv-company-title">Company Information</p><dl>'+
        '<div><dt>Legal Entity</dt><dd>KOIVEST LIMITED</dd></div>'+
        '<div><dt>Registered In</dt><dd>New Zealand</dd></div>'+
        '<div><dt>NZBN</dt><dd>9429053045928</dd></div>'+
        '<div><dt>FSP Number</dt><dd>FSP1013286</dd></div>'+
        '<div><dt>Dispute Resolution</dt><dd>FDRS Member</dd></div></dl>';
      contact.appendChild(info);
    }
    const footer=document.querySelector('footer');
    if(footer && !footer.querySelector('.kv-legal-links')){
      const nav=document.createElement('nav');
      nav.className='kv-legal-links';nav.setAttribute('aria-label','Legal information');
      nav.innerHTML='<a href="./privacy.html">Privacy Policy</a>'+
        '<a href="./complaints.html">Complaints &amp; Dispute Resolution</a>'+
        '<a href="./legal.html">Legal &amp; Regulatory</a>';
      footer.appendChild(nav);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();

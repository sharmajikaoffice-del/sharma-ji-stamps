import React from "react";

const IMG = {
  logo: "https://files.cdn-files-a.com/uploads/12309348/800_6a79e07f2e747.png?format=avif",
  hero: "https://files.cdn-files-a.com/uploads/12309348/800_gi-6a79e0d550720.jpg?format=avif",
  exmark: "https://files.cdn-files-a.com/uploads/12309348/800_6a79e1969af08.png?format=avif",
  neo: "https://files.cdn-files-a.com/uploads/12309348/800_6a79e19734cbc.png?format=avif",
  sunce: "https://files.cdn-files-a.com/uploads/12309348/800_6a79e19893df6.png?format=avif",
  press: "https://files.cdn-files-a.com/uploads/12309348/800_gi-6a79df6f9e9e8.jpg?format=avif",
};

const green = "#3A5A40";
const dark = "#1F2E23";
const cream = "#FAF9F6";
const pale = "#F1F4EB";

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function WelcomePage() {
  return (
    <div className="sjs-welcome">
      <style>{`
        .sjs-welcome{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:${dark};background:${cream};line-height:1.5}
        .sjs-welcome *{box-sizing:border-box}
        .sjs-nav{position:sticky;top:0;z-index:30;background:rgba(250,249,246,.94);backdrop-filter:blur(14px);border-bottom:1px solid #e5e7df}
        .sjs-nav-inner{max-width:1180px;margin:auto;padding:13px 22px;display:flex;align-items:center;gap:26px}
        .sjs-logo{height:52px;width:auto;object-fit:contain}
        .sjs-links{display:flex;align-items:center;gap:24px;margin-left:auto}
        .sjs-links button,.sjs-login{border:0;background:none;color:${dark};font:600 14px inherit;cursor:pointer;text-decoration:none}
        .sjs-login{background:${green};color:#fff;padding:10px 15px;border-radius:9px}
        .sjs-hero{max-width:1180px;margin:auto;padding:74px 22px 90px;display:grid;grid-template-columns:1.03fr .97fr;align-items:center;gap:64px}
        .sjs-eyebrow{display:inline-flex;align-items:center;gap:8px;color:${green};font-weight:800;font-size:13px;letter-spacing:.08em;text-transform:uppercase}
        .sjs-dot{width:8px;height:8px;border-radius:50%;background:#9B4A3D}
        .sjs-h1{font-size:clamp(43px,6vw,72px);line-height:1.02;letter-spacing:-.045em;margin:18px 0 22px;font-weight:850}
        .sjs-lead{font-size:18px;color:#5f665f;max-width:600px;margin:0 0 30px}
        .sjs-actions{display:flex;gap:12px;flex-wrap:wrap}
        .sjs-btn{border:1px solid ${green};padding:13px 19px;border-radius:10px;font-weight:800;cursor:pointer;font-size:14px}
        .sjs-primary{background:${green};color:#fff}.sjs-secondary{background:transparent;color:${green}}
        .sjs-hero-card{position:relative;background:#e9eddf;border-radius:28px;overflow:hidden;min-height:480px;box-shadow:0 24px 70px rgba(31,46,35,.12)}
        .sjs-hero-card img{width:100%;height:100%;min-height:480px;object-fit:cover}
        .sjs-badge{position:absolute;left:20px;bottom:20px;background:#fff;padding:13px 16px;border-radius:14px;box-shadow:0 12px 30px rgba(0,0,0,.14);font-size:13px;font-weight:800}
        .sjs-section{padding:86px 22px}.sjs-section.alt{background:${pale}}
        .sjs-wrap{max-width:1180px;margin:auto}
        .sjs-center{text-align:center}.sjs-kicker{color:${green};font-weight:800;text-transform:uppercase;letter-spacing:.1em;font-size:12px}
        .sjs-h2{font-size:clamp(30px,4vw,48px);line-height:1.08;letter-spacing:-.035em;margin:10px 0 14px}
        .sjs-sub{color:#666d66;max-width:680px;margin:0 auto 42px}
        .sjs-products{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
        .sjs-card{background:#fff;border:1px solid #e4e7de;border-radius:20px;overflow:hidden;box-shadow:0 8px 25px rgba(31,46,35,.06)}
        .sjs-card-img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}
        .sjs-card-body{padding:22px}.sjs-card h3{margin:0 0 8px;font-size:21px}.sjs-card p{margin:0;color:#6a716a;font-size:14px}
        .sjs-about{display:grid;grid-template-columns:.9fr 1.1fr;gap:60px;align-items:center}
        .sjs-about-img{width:100%;height:450px;object-fit:cover;border-radius:24px}
        .sjs-copy p{color:#656c65;font-size:16px}.sjs-features{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:34px}
        .sjs-feature{background:#fff;border:1px solid #e3e6de;border-radius:16px;padding:22px}.sjs-icon{font-size:24px;color:${green};margin-bottom:12px}.sjs-feature h3{font-size:16px;margin:0 0 6px}.sjs-feature p{font-size:13px;color:#737a73;margin:0}
        .sjs-contact{display:grid;grid-template-columns:1fr 1fr;gap:24px}.sjs-contact-card{background:#fff;border:1px solid #e3e6de;border-radius:20px;padding:30px}
        .sjs-contact-card h3{margin-top:0;font-size:24px}.sjs-contact-card p{color:#687068}.sjs-contact-row{margin:15px 0}.sjs-contact-row strong{display:block;font-size:13px;color:${green};text-transform:uppercase;letter-spacing:.07em}
        .sjs-footer{background:${dark};color:#fff;padding:50px 22px 24px}.sjs-footer-inner{max-width:1180px;margin:auto;display:flex;justify-content:space-between;gap:30px;flex-wrap:wrap}.sjs-footer img{height:70px;background:#fff;border-radius:10px;padding:4px}.sjs-footer p{color:#c6cec7}.sjs-copyline{max-width:1180px;margin:35px auto 0;border-top:1px solid rgba(255,255,255,.15);padding-top:18px;color:#aeb7af;font-size:12px}
        @media(max-width:850px){.sjs-links{display:none}.sjs-hero{grid-template-columns:1fr;padding-top:48px}.sjs-hero-card{min-height:360px}.sjs-hero-card img{min-height:360px}.sjs-products,.sjs-features,.sjs-contact,.sjs-about{grid-template-columns:1fr}.sjs-about-img{height:340px}.sjs-section{padding:64px 18px}}
      `}</style>

      <header className="sjs-nav">
        <div className="sjs-nav-inner">
          <button onClick={() => scrollTo("top")} style={{border:0,background:"none",padding:0,cursor:"pointer"}} aria-label="Sharmaji Stamps home">
            <img className="sjs-logo" src={IMG.logo} alt="Sharmaji Stamps" />
          </button>
          <nav className="sjs-links">
            <button onClick={() => scrollTo("top")}>Home</button>
            <button onClick={() => scrollTo("about")}>About</button>
            <button onClick={() => scrollTo("products")}>Products</button>
            <button onClick={() => scrollTo("contact")}>Contact</button>
            <a className="sjs-login" href="/login">Login</a>
            <a className="sjs-login" href="/customer">Submit your design</a>
          </nav>
        </div>
      </header>

      <main>
        <section id="top" className="sjs-hero">
          <div>
            <div className="sjs-eyebrow"><span className="sjs-dot" /> Sharmaji Stamps & Prints</div>
            <h1 className="sjs-h1">Multi-Brand Stamps in 10 Minutes.</h1>
            <p className="sjs-lead">Crafting quality impressions for years. Get reliable self-inking, pre-inked and traditional stamps for offices, businesses and everyday professional use.</p>
            <div className="sjs-actions">
              <button className="sjs-btn sjs-primary" onClick={() => scrollTo("contact")}>Request Quote</button>
              <button className="sjs-btn sjs-secondary" onClick={() => scrollTo("products")}>Explore Products</button>
            </div>
          </div>
          <div className="sjs-hero-card">
            <img src={IMG.hero} alt="Modern self-inking rubber stamp" />
            <div className="sjs-badge">Fast turnaround • Professional finish</div>
          </div>
        </section>

        <section id="products" className="sjs-section alt">
          <div className="sjs-wrap sjs-center">
            <div className="sjs-kicker">Our products</div>
            <h2 className="sjs-h2">Top brands. Ready in 10 minutes.</h2>
            <p className="sjs-sub">Choose from dependable stamp brands and formats, with custom text and business details prepared for you.</p>
            <div className="sjs-products">
              {[
                [IMG.exmark,"Exmark Premium Stamps","Premium self-inking stamps designed for clean, repeatable impressions."],
                [IMG.neo,"NEO Pre-Inked Stamps","Compact pre-inked stamps for sharp impressions and everyday office use."],
                [IMG.sunce,"Sunce & Sun Stamper","Reliable stampers for signatures, addresses, seals and routine paperwork."],
              ].map(([img,title,text]) => <article className="sjs-card" key={title}><img className="sjs-card-img" src={img} alt={title}/><div className="sjs-card-body"><h3>{title}</h3><p>{text}</p></div></article>)}
            </div>
          </div>
        </section>

        <section id="about" className="sjs-section">
          <div className="sjs-wrap sjs-about">
            <img className="sjs-about-img" src={IMG.press} alt="Professional printing press machine" />
            <div className="sjs-copy">
              <div className="sjs-kicker">About us</div>
              <h2 className="sjs-h2">Quality impressions, made for real businesses.</h2>
              <p>Sharmaji Stamps & Prints provides custom stamps and printing solutions for offices, shops, professionals and businesses. We focus on clear impressions, dependable products and quick service.</p>
              <p>From a single address stamp to recurring business orders, our team helps you choose the right stamp and get it ready quickly.</p>
              <button className="sjs-btn sjs-primary" onClick={() => scrollTo("contact")}>Get a Quote</button>
            </div>
          </div>
        </section>

        <section id="features" className="sjs-section alt">
          <div className="sjs-wrap sjs-center">
            <div className="sjs-kicker">Why choose us</div>
            <h2 className="sjs-h2">Why businesses trust our services.</h2>
            <div className="sjs-features">
              {[
                ["✦","Custom Designs","Your name, address, GST and business details prepared to your requirement."],
                ["⚡","Rapid Delivery","Quick turnaround for standard stamp requirements."],
                ["✓","Enduring Quality","Reliable materials and clean, professional impressions."],
                ["₹","Bulk Order Discounts","Talk to us for repeat and bulk business requirements."],
              ].map(([icon,title,text]) => <div className="sjs-feature" key={title}><div className="sjs-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div>)}
            </div>
          </div>
        </section>

        <section id="contact" className="sjs-section">
          <div className="sjs-wrap sjs-contact">
            <div>
              <div className="sjs-kicker">Contact</div>
              <h2 className="sjs-h2">Get a quote for your custom stamp.</h2>
              <p className="sjs-sub" style={{marginLeft:0}}>Tell us what you need and our team can help with the right stamp, brand and quantity.</p>
              <a className="sjs-btn sjs-primary" href="tel:+919899029807" style={{display:"inline-block",textDecoration:"none"}}>Call 98990 29807</a>
            </div>
            <div className="sjs-contact-card">
              <h3>Request a Quote.</h3>
              <div className="sjs-contact-row"><strong>Phone</strong><a href="tel:+919899029807">98990 29807</a></div>
              <div className="sjs-contact-row"><strong>Email</strong><a href="mailto:sharmajikaoffice@gmail.com">sharmajikaoffice@gmail.com</a></div>
              <div className="sjs-contact-row"><strong>Address</strong><span>Dayalpur, 33 Ft Road, near Akashdeep School, North East Delhi – 110094</span></div>
              <div className="sjs-actions" style={{marginTop:22}}>
                <a className="sjs-btn sjs-primary" href="mailto:sharmajikaoffice@gmail.com?subject=Stamp%20Quote%20Request" style={{textDecoration:"none"}}>Email Inquiry</a>
                <a className="sjs-btn sjs-secondary" href="https://www.google.com/maps/search/?api=1&query=Dayalpur%2033%20Ft%20Road%20North%20East%20Delhi%20110094" target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>Open in Google Maps</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="sjs-footer">
        <div className="sjs-footer-inner">
          <div><img src={IMG.logo} alt="Sharmaji Stamps" /><p>Professional stamps and printing solutions.</p></div>
          <div><p><strong>Sharmaji Stamps & Prints</strong><br/>Dayalpur, 33 Ft Road, North East Delhi – 110094<br/>98990 29807 • sharmajikaoffice@gmail.com</p></div>
        </div>
        <div className="sjs-copyline">© {new Date().getFullYear()} Sharmaji Stamps & Prints. All rights reserved.</div>
      </footer>
    </div>
  );
}

export default WelcomePage;

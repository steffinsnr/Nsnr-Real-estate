/* EDIT YOUR LISTINGS HERE. Photos go in the images folder. price = KSh millions. status: "Available" | "Few left" | "Sold" */
const PROPS = [
  {name:"The Loft", area:"Kileleshwa", beds:1, baths:1, sqm:68, price:24, status:"Available", img:"loft.jpg"},
  {name:"Skyline One", area:"Kileleshwa", beds:2, baths:2, sqm:104, price:38, status:"Few left", img:"skyline-one.jpg"},
  {name:"Garden Residence", area:"Runda", beds:2, baths:2, sqm:118, price:46, status:"Available", img:"garden.jpg"},
  {name:"Terrace Suite", area:"Muthaiga", beds:3, baths:3, sqm:165, price:68, status:"Available", img:"hero.jpg"},
  {name:"Signature Penthouse", area:"Runda", beds:4, baths:4, sqm:310, price:120, status:"Few left", img:"penthouse.jpg"},
  {name:"The Studio Loft", area:"Muthaiga", beds:1, baths:1, sqm:55, price:19, status:"Sold", img:"studio.jpg"}
];
const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);

/* menu */
const mb = $("#menuBtn");
function menu(open){ document.body.classList.toggle("menu-open", open); mb.setAttribute("aria-expanded", open); }
mb.onclick = () => menu(!document.body.classList.contains("menu-open"));
$("#overlay").onclick = e => { if(e.target.tagName==="A") menu(false); };
document.onkeydown = e => { if(e.key==="Escape") menu(false); };

/* header turns solid on scroll */
const hd = $("#top");
const onScroll = () => hd.classList.toggle("solid", scrollY > 60);
addEventListener("scroll", onScroll, {passive:true}); onScroll();

/* reveal on scroll */
const io = new IntersectionObserver(es => es.forEach(e => {
  if(!e.isIntersecting) return;
  (e.target._img || e.target).classList.add("in"); io.unobserve(e.target);
}), {threshold:.12});
$$(".rv").forEach(el => io.observe(el));
/* photos start fully clipped, so watch their parent box instead of the photo itself */
$$(".img-rv").forEach(el => { const p = el.parentElement; p._img = el; io.observe(p); });

/* floor plan carousel */
let beds = "", idx = 0, list = [];
const track = $("#track");
const pv = () => innerWidth < 640 ? 1 : innerWidth < 980 ? 2 : 3;
function render(){
  list = PROPS.filter(p => !beds || (beds==="3" ? p.beds>=3 : p.beds===+beds));
  track.innerHTML = list.length ? list.map(p => `
    <div class="slide"><article class="card">
      <div class="ph"><img loading="lazy" alt="${p.name}, ${p.area}" src="images/${p.img}"><span class="tag ${p.status==="Sold"?"sold":""}">${p.status}</span></div>
      <div class="cb"><h3>${p.name}</h3><p class="loc">${p.area}, Nairobi</p>
      <div class="specs"><span><b>${p.beds}</b> bed</span><span><b>${p.baths}</b> bath</span><span><b>${p.sqm}</b> sqm</span></div>
      <p class="price">From KSh ${p.price}M</p>
      <a class="btn" href="#touch" data-plan="${p.name}">${p.status==="Sold"?"Join waiting list":"Book a viewing"}</a></div>
    </article></div>`).join("") : `<div class="empty">No floor plans match yet. <a href="#touch">Tell us what you need.</a></div>`;
  idx = 0; move();
}
function move(){
  const v = pv(), max = Math.max(0, list.length - v);
  idx = Math.min(idx, max);
  track.style.setProperty("--pv", v);
  track.style.transform = `translateX(-${idx*100/v}%)`;
  $("#count").textContent = `${idx+1} / ${max+1}`;
  $("#prev").disabled = idx===0; $("#next").disabled = idx>=max;
}
$("#prev").onclick = () => { idx--; move(); };
$("#next").onclick = () => { idx++; move(); };
addEventListener("resize", move);
$("#tabs").onclick = e => { const b = e.target.closest("button"); if(!b) return; beds = b.dataset.b; $$("#tabs button").forEach(x => x.setAttribute("aria-pressed", x===b)); render(); };
track.onclick = e => { const a = e.target.closest("[data-plan]"); if(a) $("#tourForm textarea").value = "I'm interested in: " + a.dataset.plan; };
/* swipe on touch screens */
let sx = 0; track.addEventListener("touchstart", e => sx = e.touches[0].clientX, {passive:true});
track.addEventListener("touchend", e => { const d = e.changedTouches[0].clientX - sx; if(Math.abs(d)>50){ idx += d<0 ? 1 : -1; idx = Math.max(0, idx); move(); } });

/* tour form: sends each request to your email through Web3Forms */
const WEB3FORMS_KEY = "c8a7a1a8-1ca7-47cd-8f80-e5abfc4c889d";
$("#tourForm").onsubmit = async e => {
  e.preventDefault();
  const form = e.target, btn = form.querySelector("button[type=submit]"), out = $("#msg");
  const f = Object.fromEntries(new FormData(form));
  const first = f.name.split(" ")[0];

  btn.disabled = true; btn.textContent = "Sending...";
  out.textContent = "";
  try{
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {"Content-Type":"application/json", "Accept":"application/json"},
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: "New viewing request from " + f.name,
        from_name: "NSNR Website",
        name: f.name,
        email: f.email,
        phone: f.phone,
        interested_in: f.topic,
        preferred_date: f.date || "Flexible",
        tour_type: f.type,
        message: f.msg || "(no message)"
      })
    });
    const data = await res.json();
    if(res.ok && data.success){
      out.textContent = "Thank you " + first + "! We received your request and will contact you soon.";
      form.reset();
    } else { throw new Error(data.message || "Failed"); }
  } catch(err){
    out.textContent = "Sorry, something went wrong. Please try again in a moment.";
  }
  btn.disabled = false; btn.textContent = "Request viewing";
};
$("#tourForm [name=date]").min = new Date().toISOString().split("T")[0];
render();

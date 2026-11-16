import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, MapPin, CalendarDays, ArrowRight, PackageSearch, ShieldCheck, HeartHandshake, X, LogIn, LogOut, UserRound, Filter, CheckCircle2, Clock3 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "./supabase";

const demoItems = [
  { id: "demo-1", title: "Black wireless earbuds", type: "found", category: "Electronics", location: "Central Library", date: "2026-11-14", description: "Black earbuds in a small charging case. Found near the reading area.", image_url: "", contact_email: "finder@campus.edu", status: "open" },
  { id: "demo-2", title: "Blue water bottle", type: "lost", category: "Accessories", location: "Block B, Room 204", date: "2026-11-13", description: "A navy blue insulated bottle with a small sticker on the side.", image_url: "", contact_email: "student@campus.edu", status: "open" },
  { id: "demo-3", title: "Engineering mathematics notebook", type: "found", category: "Books & Notes", location: "Canteen", date: "2026-11-12", description: "Spiral notebook with handwritten maths notes. Name is not visible.", image_url: "", contact_email: "helper@campus.edu", status: "open" },
  { id: "demo-4", title: "Student ID card", type: "lost", category: "ID & Cards", location: "Main Auditorium", date: "2026-11-11", description: "Student ID card lost after an afternoon lecture. Please contact me if found.", image_url: "", contact_email: "student2@campus.edu", status: "open" }
];

const categories = ["Electronics", "Accessories", "Books & Notes", "ID & Cards", "Bags", "Other"];
const dateToday = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [items, setItems] = useState(demoItems);
  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState("");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [claimItem, setClaimItem] = useState(null);
  const [form, setForm] = useState({ type: "lost", title: "", category: "Electronics", location: "", date: dateToday(), description: "", contact_email: "", image_url: "" });

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    loadItems();
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadItems() {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase.from("items").select("*").order("created_at", { ascending: false });
    if (!error && data) setItems(data);
  }

  const visibleItems = useMemo(() => items.filter(item => {
    const matchesType = filter === "all" || item.type === filter;
    const matchesCategory = category === "all" || item.category === category;
    const text = `${item.title} ${item.location} ${item.description} ${item.category}`.toLowerCase();
    return matchesType && matchesCategory && text.includes(search.toLowerCase());
  }), [items, filter, category, search]);

  const stats = {
    total: items.length,
    found: items.filter(i => i.type === "found").length,
    returned: items.filter(i => i.status === "returned").length
  };

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  }

  function openReport(type = "lost") {
    if (!user && isSupabaseConfigured) {
      setAuthMode("login"); setModal("auth");
      showNotice("Please log in before posting an item.");
      return;
    }
    setForm(f => ({ ...f, type, contact_email: user?.email || f.contact_email }));
    setModal("report");
  }

  async function handleAuth(event) {
    event.preventDefault(); setBusy(true);
    const email = event.target.email.value.trim();
    const password = event.target.password.value;
    if (!isSupabaseConfigured) {
      showNotice("Connect Supabase first to enable student accounts.");
      setBusy(false); return;
    }
    const result = authMode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) { showNotice(result.error.message); return; }
    if (authMode === "signup" && !result.data.session) showNotice("Account created. Check your email to confirm, then log in.");
    else { setUser(result.data.user); setModal(""); showNotice("You're logged in."); }
  }

  async function handleReport(event) {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      showNotice("Demo mode: connect Supabase to publish reports for everyone.");
      return;
    }
    setBusy(true);
    const payload = { ...form, contact_email: user.email, user_id: user.id, status: "open" };
    const { error } = await supabase.from("items").insert(payload);
    setBusy(false);
    if (error) { showNotice(error.message); return; }
    setModal(""); setForm({ type: "lost", title: "", category: "Electronics", location: "", date: dateToday(), description: "", contact_email: user.email, image_url: "" });
    await loadItems(); showNotice("Your item report has been published.");
  }

  async function handleClaim(event) {
    event.preventDefault();
    if (!user) { setModal("auth"); setAuthMode("login"); showNotice("Log in to send a claim request."); return; }
    if (!isSupabaseConfigured) { showNotice("Connect Supabase to send claim requests."); return; }
    setBusy(true);
    const { error } = await supabase.from("claims").insert({ item_id: claimItem.id, claimant_id: user.id, message: event.target.message.value });
    setBusy(false);
    if (error) { showNotice(error.message); return; }
    setModal(""); showNotice("Claim request sent successfully.");
  }

  async function logout() {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setUser(null); showNotice("Logged out.");
  }

  return <div>
    <header className="topbar">
      <a className="brand" href="#"><span className="brand-mark">C</span><span>Campus<span className="accent">Find</span></span></a>
      <nav><a href="#browse">Browse items</a><a href="#how">How it works</a></nav>
      <div className="top-actions">
        {user ? <><span className="user-email">{user.email}</span><button className="btn btn-ghost" onClick={logout}><LogOut size={15}/> Log out</button></> :
          <button className="btn btn-ghost" onClick={() => {setAuthMode("login");setModal("auth");}}>Log in</button>}
        <button className="btn btn-primary" onClick={() => openReport("lost")}>Report an item <Plus size={16}/></button>
      </div>
    </header>

    {!isSupabaseConfigured && <div className="demo-banner"><span className="demo-dot"/> Preview mode is active. Sample items are shown; connect Supabase to enable accounts, shared posts and claims.</div>}

    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse"/> YOUR CAMPUS, CONNECTED</div>
          <h1>Lost something?<br/><span>Let's find it.</span></h1>
          <p className="hero-text">A simpler way to reunite students with the things they misplace. Search what's been found or report something you've lost.</p>
          <div className="hero-buttons"><button className="btn btn-primary btn-large" onClick={() => document.getElementById("browse").scrollIntoView({behavior:"smooth"})}>Explore items <ArrowRight size={17}/></button><button className="btn btn-light btn-large" onClick={() => openReport("lost")}><Plus size={17}/> Report an item</button></div>
          <div className="trust-row"><div className="avatar-stack"><i>👩🏻</i><i>👨🏽</i><i>👩🏾</i></div><span>Made for your campus community</span></div>
        </div>
        <div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="float-card float-top"><span className="float-icon mint">✓</span><div><b>Found something?</b><small>Help it get home</small></div></div>
          <div className="phone-wrap"><div className="phone"><div className="speaker"/><div className="phone-screen"><div className="screen-brand">CampusFind <span>•••</span></div><div className="screen-search">⌕ &nbsp; Search items</div><div className="screen-label">RECENTLY FOUND</div>{demoItems.filter(x=>x.type==="found").slice(0,2).map(x=><div className="screen-item" key={x.id}><span className="screen-emoji">📦</span><div><b>{x.title}</b><small>{x.location}</small></div></div>)}</div></div></div>
          <div className="float-card float-bottom"><span className="float-icon peach">♡</span><div><b>One community</b><small>Helping things find their way</small></div></div><span className="sparkle sparkle-a">✦</span><span className="sparkle sparkle-b">✧</span>
        </div>
      </section>

      <section className="stats"><div><strong>{stats.total}</strong><span>Items posted</span></div><div><strong>{stats.found}</strong><span>Found items</span></div><div><strong>{stats.returned}</strong><span>Returned home</span></div><div className="stat-note"><span className="stat-dot"/> A little help goes a long way.</div></section>

      <section className="browse-section" id="browse">
        <div className="section-heading"><div><div className="eyebrow">THE COMMUNITY BOARD</div><h2>Find what you're <span>looking for.</span></h2><p>Browse recent reports from around campus.</p></div><button className="btn btn-outline" onClick={() => openReport("found")}><Plus size={16}/> Post an item</button></div>
        <div className="filters"><div className="search-wrap"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by item, location or keyword..."/></div>
          <div className="filter-tabs">{["all","lost","found"].map(f=><button key={f} className={`filter ${filter===f?"active":""}`} onClick={()=>setFilter(f)}>{f==="all"?"All items":f[0].toUpperCase()+f.slice(1)}</button>)}</div>
          <select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">All categories</option>{categories.map(c=><option key={c}>{c}</option>)}</select>
        </div>
        <div className="items-grid">{visibleItems.length ? visibleItems.map(item=><article className="item-card" key={item.id}>
          <div className={`item-visual ${item.type}`}>{item.image_url ? <img src={item.image_url} alt={item.title}/> : <span>{item.category==="Electronics"?"🎧":item.category==="Books & Notes"?"📚":item.category==="ID & Cards"?"🪪":item.category==="Bags"?"🎒":item.category==="Accessories"?"🔑":"📦"}</span>}<span className={`status-pill ${item.type}`}>{item.type==="lost"?"Lost item":"Found item"}</span></div>
          <div className="item-content"><div className="item-category">{item.category}</div><h3>{item.title}</h3><p className="item-description">{item.description}</p><div className="item-meta"><span><MapPin size={14}/>{item.location}</span><span><CalendarDays size={14}/>{item.date}</span></div>
          <button className="claim-btn" onClick={()=>{setClaimItem(item);setModal("claim");}}>This might be mine <ArrowRight size={15}/></button></div>
        </article>) : <div className="empty-state"><PackageSearch size={35}/><h3>No matching items</h3><p>Try another search or category, or post a new report.</p><button className="btn btn-primary" onClick={()=>openReport("lost")}>Report an item</button></div>}</div>
      </section>

      <section className="how-section" id="how"><div className="eyebrow">SIMPLE BY DESIGN</div><h2>Three steps. <span>One happy reunion.</span></h2><div className="steps">
        <article><div className="step-num">01</div><div className="step-icon"><PackageSearch/></div><h3>Post an item</h3><p>Share a few details and a photo of what you've lost or found.</p></article>
        <article><div className="step-num">02</div><div className="step-icon"><Search/></div><h3>Search & connect</h3><p>Browse reports and send a claim request if an item is yours.</p></article>
        <article><div className="step-num">03</div><div className="step-icon"><HeartHandshake/></div><h3>Make the reunion</h3><p>Coordinate safely and mark the item as returned.</p></article>
      </div></section>
    </main>

    <footer><a className="brand" href="#"><span className="brand-mark">C</span><span>Campus<span className="accent">Find</span></span></a><span>Built for a more helpful campus community.</span><span>© 2026 CampusFind</span></footer>

    {modal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal("");}}>
      <div className={`modal ${modal==="report"?"modal-wide":""}`}><button className="close" onClick={()=>setModal("")}><X/></button>
        {modal==="auth" && <><div className="modal-kicker">WELCOME TO CAMPUSFIND</div><h2>{authMode==="login"?"Welcome back.":"Create your account."}</h2><p>{authMode==="login"?"Log in to post items and contact other students.":"Use your college email to join the campus community."}</p><form onSubmit={handleAuth} className="stack-form"><label>Email address<input name="email" type="email" placeholder="you@college.edu" required/></label><label>Password<input name="password" type="password" placeholder="At least 6 characters" minLength="6" required/></label><button className="btn btn-primary btn-full" disabled={busy}>{busy?"Please wait...":authMode==="login"?"Log in":"Create account"}</button></form><p className="switch-auth">{authMode==="login"?"New here?":"Already registered?"} <button onClick={()=>setAuthMode(authMode==="login"?"signup":"login")}>{authMode==="login"?"Create an account":"Log in"}</button></p></>}
        {modal==="report" && <><div className="modal-kicker">ADD TO THE COMMUNITY BOARD</div><h2>Report an item.</h2><p>Give enough detail to help the right person recognise it.</p><form className="form-grid" onSubmit={handleReport}>
          <label>Report type<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="lost">I lost this</option><option value="found">I found this</option></select></label>
          <label>Item name<input required maxLength="70" placeholder="e.g. Black wallet" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
          <label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
          <label>Location<input required maxLength="100" placeholder="e.g. Library, Block A" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></label>
          <label>Date<input type="date" required value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
          <label>Image URL <span className="optional">(optional)</span><input type="url" placeholder="https://..." value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})}/></label>
          <label className="full-field">Description<textarea required rows="3" maxLength="500" placeholder="Colour, brand, distinguishing details..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
          <button className="btn btn-primary btn-full full-field" disabled={busy}>{busy?"Publishing...":"Publish report"} <ArrowRight size={16}/></button>
        </form></>}
        {modal==="claim" && claimItem && <><div className="modal-kicker">ITEM CLAIM</div><h2>Is this yours?</h2><p>Send a message to the person who posted <b>{claimItem.title}</b>. Avoid sharing passwords or sensitive personal details.</p><form className="stack-form" onSubmit={handleClaim}><label>Your message<textarea name="message" rows="4" maxLength="400" required placeholder="I think this may be mine because..."/></label><button className="btn btn-primary btn-full" disabled={busy}>{busy?"Sending...":"Send claim request"}</button></form></>}
      </div>
    </div>}
    {notice && <div className="toast"><CheckCircle2 size={17}/>{notice}</div>}
  </div>;
}

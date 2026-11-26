import { useEffect, useState } from "react";
import { Link, Routes, Route, useNavigate, useParams } from "react-router-dom";
import api, { imageUrl } from "./api";

const categories = ["All", "Mobiles", "Electronics", "Vehicles", "Furniture", "Books", "Fashion", "Others"];
const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

function Header() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const logout = () => { localStorage.clear(); setUser(null); window.location.href = "/"; };
  useEffect(() => {
    const update = () => setUser(JSON.parse(localStorage.getItem("user") || "null"));
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);
  return <header className="topbar"><Link className="brand" to="/">Re<span>Market</span></Link>
    <nav><Link to="/">Explore</Link>{user && <Link to="/sell">+ Sell item</Link>}{user && <Link to="/mine">My listings</Link>}
      {user ? <><span className="welcome">Hi, {user.name}</span><button className="small ghost" onClick={logout}>Logout</button></>
        : <><Link to="/login">Login</Link><Link className="small primary" to="/register">Sign up</Link></>}
    </nav></header>;
}

function Home() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (category !== "All") params.category = category;
      if (location) params.location = location;
      const { data } = await api.get("/products", { params });
      setItems(data); setError("");
    } catch { setError("Could not connect to the server. Check that backend is running."); }
  };
  useEffect(() => { load(); }, [category]);
  return <main className="container">
    <section className="hero"><p className="eyebrow">A smarter way to reuse</p><h1>Find great deals.<br/><span>Give things a new life.</span></h1>
      <p>Buy and sell pre-loved items in your neighbourhood.</p>
      <div className="searchbar"><input placeholder="What are you looking for?" value={search} onChange={e=>setSearch(e.target.value)} />
        <input placeholder="Location" value={location} onChange={e=>setLocation(e.target.value)} />
        <button className="primary" onClick={load}>Search</button></div>
    </section>
    <div className="section-head"><div><p className="eyebrow">Browse marketplace</p><h2>Explore categories</h2></div></div>
    <div className="categories">{categories.map(c=><button key={c} className={category===c?"chip active":"chip"} onClick={()=>setCategory(c)}>{c}</button>)}</div>
    <div className="section-head"><div><p className="eyebrow">Fresh finds</p><h2>Latest listings</h2></div><span className="muted">{items.length} items</span></div>
    {error && <p className="error">{error}</p>}
    <div className="products">{items.map(p=><Link className="product" to={`/product/${p.id}`} key={p.id}>
      <div className="product-image">{p.image ? <img src={imageUrl(p.image)} /> : <span>📦</span>}</div>
      <div className="product-info"><strong>{money(p.price)}</strong><h3>{p.title}</h3><p>{p.location}</p><small>{new Date(p.created_at).toLocaleDateString()}</small></div>
    </Link>)}</div>
    {!items.length && !error && <div className="empty">No listings yet. Be the first to sell an item!</div>}
  </main>;
}

function Auth({ mode }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", phone:"", password:"" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const change = e => setForm({...form, [e.target.name]:e.target.value});
  const submit = async e => {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      if (mode === "register") {
        await api.post("/auth/register", form);
        alert("Registration successful. Please login.");
        navigate("/login");
      } else {
        const { data } = await api.post("/auth/login", { email:form.email, password:form.password });
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
        window.location.reload();
      }
    } catch (err) { setError(err.response?.data?.message || "Request failed. Is the backend running?"); }
    finally { setBusy(false); }
  };
  return <main className="auth-wrap"><form className="form-card" onSubmit={submit}><p className="eyebrow">{mode==="login"?"Welcome back":"Join the community"}</p>
    <h2>{mode==="login"?"Login to ReMarket":"Create your account"}</h2><p className="muted">Buy and sell pre-loved items with ease.</p>
    {mode==="register" && <><label>Full name<input name="name" value={form.name} onChange={change} required /></label>
      <label>Mobile number<input name="phone" value={form.phone} onChange={change} required /></label></>}
    <label>Email address<input type="email" name="email" value={form.email} onChange={change} required /></label>
    <label>Password<input type="password" name="password" minLength="6" value={form.password} onChange={change} required /></label>
    {error && <p className="error">{error}</p>}<button className="primary full" disabled={busy}>{busy?"Please wait...":mode==="login"?"Login":"Create account"}</button>
    <p className="muted center">{mode==="login"?"New here? ":"Already registered? "}<Link to={mode==="login"?"/register":"/login"}>{mode==="login"?"Create an account":"Login"}</Link></p>
  </form></main>;
}

function Sell() {
  const navigate = useNavigate();
  const [form,setForm] = useState({title:"",description:"",price:"",category:"Mobiles",location:""});
  const [image,setImage] = useState(null);
  const [error,setError] = useState("");
  const submit = async e => {
    e.preventDefault(); setError("");
    const body = new FormData();
    Object.entries(form).forEach(([k,v])=>body.append(k,v));
    if(image) body.append("image",image);
    try { await api.post("/products",body); alert("Your item is now listed!"); navigate("/"); }
    catch(err) { setError(err.response?.data?.message || "Could not post item. Please login."); }
  };
  if (!localStorage.getItem("token")) return <main className="container empty">Please <Link to="/login">login</Link> to sell an item.</main>;
  return <main className="auth-wrap"><form className="form-card wide" onSubmit={submit}><p className="eyebrow">Start selling</p><h2>Post your item</h2>
    <label>Item title<input required maxLength="150" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. iPhone 12, good condition"/></label>
    <label>Description<textarea required rows="4" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
    <div className="two"><label>Price (₹)<input required type="number" min="1" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label>
      <label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.slice(1).map(c=><option key={c}>{c}</option>)}</select></label></div>
    <label>Location<input required value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="e.g. Salem"/></label>
    <label>Product image (JPG/PNG/WEBP, max 5MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setImage(e.target.files[0])}/></label>
    {error && <p className="error">{error}</p>}<button className="primary full">Publish listing</button>
  </form></main>;
}

function ProductDetails() {
  const {id}=useParams(); const [p,setP]=useState(null); const [error,setError]=useState("");
  useEffect(()=>{api.get(`/products/${id}`).then(r=>setP(r.data)).catch(e=>setError(e.response?.data?.message||"Unable to load item."));},[id]);
  if(error) return <main className="container empty error">{error}</main>;
  if(!p) return <main className="container empty">Loading item...</main>;
  return <main className="container detail"><div className="detail-image">{p.image?<img src={imageUrl(p.image)}/>:<span>📦</span>}</div>
    <section className="detail-card"><p className="eyebrow">{p.category} · {p.location}</p><h1>{p.title}</h1><h2>{money(p.price)}</h2><h3>About this item</h3><p>{p.description}</p>
      <div className="seller"><p className="eyebrow">Seller details</p><strong>{p.seller_name}</strong><p>{p.seller_phone}</p><a className="primary button-link" href={`tel:${p.seller_phone}`}>Call seller</a></div>
    </section></main>;
}

function Mine() {
  const [items,setItems]=useState([]); const [error,setError]=useState("");
  const load=()=>api.get("/products/mine").then(r=>setItems(r.data)).catch(e=>setError(e.response?.data?.message||"Please login."));
  useEffect(()=>{load();},[]);
  const remove=async id=>{if(!confirm("Delete this listing?"))return;try{await api.delete(`/products/${id}`);load();}catch(e){setError("Could not delete listing.");}};
  return <main className="container"><div className="section-head"><h2>My listings</h2><Link className="primary button-link" to="/sell">+ Sell item</Link></div>
    {error&&<p className="error">{error}</p>}<div className="products">{items.map(p=><div className="product" key={p.id}><Link to={`/product/${p.id}`}><div className="product-image">{p.image?<img src={imageUrl(p.image)}/>:<span>📦</span>}</div><div className="product-info"><strong>{money(p.price)}</strong><h3>{p.title}</h3><p>{p.location}</p></div></Link><button className="delete" onClick={()=>remove(p.id)}>Delete listing</button></div>)}</div>
  </main>;
}

export default function App() {
  return <><Header/><Routes><Route path="/" element={<Home/>}/><Route path="/login" element={<Auth mode="login"/>}/><Route path="/register" element={<Auth mode="register"/>}/><Route path="/sell" element={<Sell/>}/><Route path="/product/:id" element={<ProductDetails/>}/><Route path="/mine" element={<Mine/>}/><Route path="*" element={<main className="empty">Page not found. <Link to="/">Go home</Link></main>}/></Routes><footer>ReMarket · Give pre-loved items a new life.</footer></>;
}

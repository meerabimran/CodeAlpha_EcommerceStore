import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'

const CartContext = createContext(null)
const CatalogContext = createContext(null)
const money = (amount) => `$${Number(amount).toFixed(2)}`
const useCart = () => useContext(CartContext)
const useCatalog = () => useContext(CatalogContext)

function CatalogProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const loadCatalog = useCallback(async (signal) => {
    try {
      const response = await fetch('/api/products', { signal })
      if (!response.ok) throw new Error(`Catalog request failed (${response.status}).`)
      const items = await response.json()
      if (!Array.isArray(items)) throw new Error('The catalog response was invalid.')
      setProducts(items.map((product) => ({
        ...product,
        id: product.slug || String(product._id),
        stock: Number.isFinite(product.stock) ? product.stock : 1,
        rating: product.rating ?? 4.8,
        tone: product.tone || 'sage',
        icon: product.icon || '✳',
        badge: product.badge || '',
        description: product.description || '',
      })))
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError(requestError.message)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    Promise.resolve().then(() => loadCatalog(controller.signal))
    return () => controller.abort()
  }, [loadCatalog])
  const categories = useMemo(() => [...new Set(products.map((product) => product.category))], [products])
  const retry = () => {
    setLoading(true)
    setError('')
    loadCatalog()
  }
  return <CatalogContext.Provider value={{ products, categories, loading, error, retry }}>{children}</CatalogContext.Provider>
}

function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('shopsphere-cart') || '[]') } catch { return [] }
  })
  useEffect(() => localStorage.setItem('shopsphere-cart', JSON.stringify(cart)), [cart])
  const add = (product, quantity = 1) => setCart((items) => {
    const old = items.find((item) => item.id === product.id)
    const nextQuantity = Math.min(product.stock, (old?.quantity || 0) + Number(quantity))
    return old ? items.map((item) => item.id === product.id ? { ...item, quantity: nextQuantity } : item) : [...items, { ...product, quantity: nextQuantity }]
  })
  const update = (id, quantity) => setCart((items) => items.map((item) => item.id === id ? { ...item, quantity: Math.max(1, Math.min(item.stock, Number(quantity))) } : item))
  const remove = (id) => setCart((items) => items.filter((item) => item.id !== id))
  const count = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return <CartContext.Provider value={{ cart, add, update, remove, count, subtotal }}>{children}</CartContext.Provider>
}

function Header() {
  const { count } = useCart()
  const { categories } = useCatalog()
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const submit = (event) => { event.preventDefault(); navigate(`/products?search=${encodeURIComponent(search)}`) }
  return <header className="site-header">
    <div className="announcement">A little joy, delivered. <span>Free shipping on orders over $75</span></div>
    <div className="header-main wrap">
      <Link className="brand" to="/" aria-label="ShopSphere home"><span className="brand-mark">s</span>shopsphere<span className="brand-dot">.</span></Link>
      <form className="search-form" onSubmit={submit}><label className="sr-only" htmlFor="site-search">Search products</label><span aria-hidden="true">⌕</span><input id="site-search" placeholder="Search for something lovely..." value={search} onChange={(e) => setSearch(e.target.value)} /><button aria-label="Search">↗</button></form>
      <div className="header-actions"><Link to="/login" className="account-link"><span aria-hidden="true">♙</span><span>Account</span></Link><Link to="/cart" className="cart-link"><span aria-hidden="true">♧</span><span>Bag</span><b>{count}</b></Link></div>
    </div>
    <nav className="main-nav"><div className="wrap nav-inner"><NavLink to="/products">Shop all</NavLink>{categories.slice(0, 4).map((category) => <NavLink key={category} to={`/products?category=${encodeURIComponent(category)}`}>{category}</NavLink>)}<NavLink to="/products?sort=featured">Our favorites</NavLink><span className="nav-note">Thoughtful things for everyday living</span></div></nav>
  </header>
}

function Footer() {
  return <footer className="site-footer"><div className="wrap footer-main"><div><Link className="brand footer-brand" to="/"><span className="brand-mark">s</span>shopsphere<span className="brand-dot">.</span></Link><p>Everyday essentials, chosen with a little extra care.</p></div><div><h3>Explore</h3><Link to="/products">Shop all</Link><Link to="/products?category=Home">Home & living</Link><Link to="/products?category=Accessories">Accessories</Link></div><div><h3>Here to help</h3><Link to="/login">Your account</Link><Link to="/cart">Your bag</Link><a href="mailto:hello@shopsphere.example">Get in touch</a></div><div className="newsletter"><h3>A good note, now and then</h3><p>Fresh finds and small moments of inspiration.</p><form onSubmit={(e) => { e.preventDefault(); e.currentTarget.reset(); }}><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" type="email" placeholder="Your email address" required /><button aria-label="Subscribe">→</button></form><small>By subscribing, you agree to receive our occasional emails.</small></div></div><div className="wrap footer-bottom"><span>© 2026 ShopSphere. Made for the everyday.</span><span>Secure checkout · Thoughtful service · Easy returns</span></div></footer>
}

function ProductVisual({ product, large = false }) {
  return <div className={`product-visual visual-${product.tone}${large ? ' visual-large' : ''}`} role="img" aria-label={product.name}><span className="visual-shape shape-one"/><span className="visual-shape shape-two"/><span className="visual-icon">{product.icon}</span><span className="visual-caption">{product.category}</span></div>
}

function ProductCard({ product }) {
  const { add } = useCart()
  return <article className="product-card"><Link className="product-image-link" to={`/products/${product.id}`}><ProductVisual product={product}/>{product.badge && <span className="product-badge">{product.badge}</span>}<span className="quick-view">View details <span>↗</span></span></Link><div className="product-info"><div className="product-category">{product.category}</div><div className="product-title-row"><Link to={`/products/${product.id}`} className="product-name">{product.name}</Link><span className="rating">★ {product.rating}</span></div><div className="product-bottom"><strong>{money(product.price)}</strong><button className="add-button" onClick={() => add(product)} disabled={!product.stock}>{product.stock ? 'Add to bag +' : 'Sold out'}</button></div></div></article>
}

function HomePage() {
  const { products, loading, error, retry } = useCatalog()
  return <><main><section className="hero wrap"><div className="hero-copy"><span className="eyebrow"><span className="eyebrow-line"/>THE EVERYDAY EDIT</span><h1>Make room for<br/>a little <em>lovely.</em></h1><p>Considered essentials for home, work, and everywhere in between. The good stuff, made to last.</p><Link to="/products" className="button button-dark">Find your favorites <span>↗</span></Link><div className="hero-proof"><div className="avatar-stack"><i>J</i><i>M</i><i>A</i></div><span>Loved by 2,400+ happy homes</span></div></div><div className="hero-art"><div className="sun-disc"/><div className="hero-art-label">A slower kind<br/>of shopping <span>✳</span></div><div className="hero-product hero-vase"><span>◡</span></div><div className="hero-product hero-cup"><span>☕</span></div><div className="hero-product hero-book">THE<br/>LITTLE<br/>THINGS</div><div className="hero-stem">✳</div><span className="art-caption">OBJECTS WITH A POINT OF VIEW — No. 01</span></div></section>
    <section className="benefits"><div className="wrap benefit-row"><div><span>✳</span><p><b>Made to be kept</b><small>Good things, built for everyday</small></p></div><div><span>♧</span><p><b>Thoughtfully chosen</b><small>A little less, a lot better</small></p></div><div><span>↗</span><p><b>On its way to you</b><small>Free shipping over $75</small></p></div></div></section>
    <section className="section wrap"><div className="section-heading"><div><span className="eyebrow">A FEW GOOD THINGS</span><h2>Popular right now<span className="brand-dot">.</span></h2></div><Link className="text-link" to="/products">See everything <span>↗</span></Link></div>{loading ? <p role="status">Loading the collection…</p> : error ? <div className="empty-state" role="alert"><p>{error}</p><button className="button button-dark" onClick={retry}>Try again <span>↗</span></button></div> : <div className="product-grid">{products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product}/>)}</div>}</section>
    <section className="category-band"><div className="wrap category-content"><span className="eyebrow">YOUR SPACE, YOUR PACE</span><h2>Little upgrades.<br/><em>Big everyday energy.</em></h2><p>Thoughtful pieces that make your space feel a little more like you.</p><Link to="/products?category=Home" className="button button-light">Shop home & living <span>↗</span></Link><div className="category-sparkle">✳</div></div></section>
    <section className="section wrap"><div className="section-heading"><div><span className="eyebrow">GOOD COMPANY</span><h2>A note from our customers<span className="brand-dot">.</span></h2></div></div><div className="quote-card"><div className="quote-stars">★★★★★</div><blockquote>“Everything feels considered. My order arrived beautifully packed, and the pieces have found a home in every room.”</blockquote><div className="quote-by"><span className="quote-avatar">E</span><span><b>Ella R.</b><small>Verified customer · Portland, OR</small></span></div><span className="quote-mark">“</span></div></section>
  </main></>
}

function ProductsPage() {
  const { products, categories, loading, error, retry } = useCatalog()
  const [params, setParams] = useSearchParams()
  const query = params.get('search') || ''
  const category = params.get('category') || 'All'
  const sort = params.get('sort') || 'featured'
  const filtered = useMemo(() => {
    const result = products.filter((p) => (!query || p.name.toLowerCase().includes(query.toLowerCase()) || p.description.toLowerCase().includes(query.toLowerCase())) && (category === 'All' || p.category === category))
    return result.sort((a, b) => sort === 'price-low' ? a.price - b.price : sort === 'price-high' ? b.price - a.price : sort === 'name' ? a.name.localeCompare(b.name) : b.rating - a.rating)
  }, [products, query, category, sort])
  const change = (key, value) => { const next = new URLSearchParams(params); value && value !== 'All' ? next.set(key, value) : next.delete(key); setParams(next) }
  return <main className="wrap page-content"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span> Shop</div><div className="listing-heading"><div><span className="eyebrow">FIND YOUR EVERYDAY FAVORITES</span><h1>Good things, right this way<span className="brand-dot">.</span></h1><p>Useful, beautiful, and always a pleasure to come home to.</p></div><span className="result-count">{loading ? 'Loading…' : error ? 'Catalog unavailable' : `${filtered.length} thoughtful finds`}</span></div>{loading ? <div className="empty-state" role="status"><p>Loading the collection…</p></div> : error ? <div className="empty-state" role="alert"><span>!</span><p>{error}</p><button className="button button-dark" onClick={retry}>Try again <span>↗</span></button></div> : <><div className="filter-bar"><div className="category-filters"><button onClick={() => change('category', 'All')} className={category === 'All' ? 'filter-chip active' : 'filter-chip'}>Everything</button>{categories.map((item) => <button key={item} onClick={() => change('category', item)} className={category === item ? 'filter-chip active' : 'filter-chip'}>{item}</button>)}</div><label className="sort-control">Sort by <select value={sort} onChange={(e) => change('sort', e.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name</option></select></label></div>{filtered.length ? <div className="product-grid">{filtered.map((p) => <ProductCard key={p.id} product={p}/>)}</div> : <div className="empty-state"><span>⌕</span><h2>No lovely finds just yet</h2><p>Try another search or browse everything in our collection.</p><button className="button button-dark" onClick={() => { setParams({}); }}>See all products <span>↗</span></button></div>}</>}</main>
}

function ProductPage() {
  const { products, loading, error, retry } = useCatalog(); const { id } = useParams(); const product = products.find((item) => item.id === id); const { add } = useCart(); const [qty, setQty] = useState(1); const navigate = useNavigate()
  if (loading) return <main className="wrap page-content empty-state" role="status"><p>Loading the collection…</p></main>
  if (error) return <main className="wrap page-content empty-state" role="alert"><p>{error}</p><button className="button button-dark" onClick={retry}>Try again <span>↗</span></button></main>
  if (!product) return <main className="wrap page-content empty-state"><span>✳</span><h1>We couldn't find that one.</h1><p>It may have wandered off. Let's get you back to the good stuff.</p><Link className="button button-dark" to="/products">Browse the collection <span>↗</span></Link></main>
  return <main className="wrap page-content"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/products">Shop</Link><span>/</span>{product.name}</div><div className="detail-layout"><ProductVisual product={product} large/><div className="detail-copy"><span className="eyebrow">{product.category.toUpperCase()} · A CUSTOMER FAVORITE</span><h1>{product.name}</h1><div className="detail-rating">★★★★★ <span>{product.rating} · 38 reviews</span></div><div className="detail-price">{money(product.price)}</div><p className="detail-description">{product.description}</p><div className="stock-note"><span className="stock-dot"/> In stock and ready to make your day</div><div className="purchase-row"><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button aria-label="Increase quantity" onClick={() => setQty(Math.min(product.stock, qty + 1))}>+</button></div><button className="button button-dark purchase-button" disabled={!product.stock} onClick={() => { add(product, qty); navigate('/cart') }}>Add to bag · {money(product.price * qty)} <span>↗</span></button></div><div className="detail-perks"><span>✓ Thoughtfully selected</span><span>✓ Free shipping over $75</span><span>✓ Easy 30-day returns</span></div><div className="detail-divider"/><div className="detail-note"><b>A little more about it</b><p>Designed to be part of your everyday. Made with care, chosen to bring a little more joy to the ordinary moments.</p></div></div></div></main>
}

function CartPage() {
  const { cart, update, remove, subtotal } = useCart()
  const delivery = subtotal >= 75 || subtotal === 0 ? 0 : 6.95
  return <main className="wrap page-content"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span> Your bag</div><div className="listing-heading"><div><span className="eyebrow">THE GOOD STUFF YOU PICKED</span><h1>Your bag<span className="brand-dot">.</span></h1></div><Link className="text-link" to="/products">Keep browsing <span>↗</span></Link></div>{cart.length === 0 ? <div className="empty-state"><span>♧</span><h2>Your bag is taking a little breather</h2><p>There’s plenty of room for something lovely.</p><Link className="button button-dark" to="/products">Explore the collection <span>↗</span></Link></div> : <div className="cart-layout"><div className="cart-items">{cart.map((item) => <article className="cart-item" key={item.id}><Link to={`/products/${item.id}`}><ProductVisual product={item}/></Link><div className="cart-item-info"><span className="product-category">{item.category}</span><Link to={`/products/${item.id}`} className="product-name">{item.name}</Link><span className="cart-unit-price">{money(item.price)} each</span><div className="quantity-control"><button aria-label={`Decrease ${item.name} quantity`} onClick={() => update(item.id, item.quantity - 1)}>−</button><span>{item.quantity}</span><button aria-label={`Increase ${item.name} quantity`} onClick={() => update(item.id, item.quantity + 1)}>+</button></div></div><div className="cart-item-end"><b>{money(item.price * item.quantity)}</b><button className="remove-button" onClick={() => remove(item.id)}>Remove</button></div></article>)}</div><aside className="order-summary"><h2>A tidy little summary</h2><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Shipping</span><b>{delivery ? money(delivery) : 'On us'}</b></div>{subtotal < 75 && <p className="shipping-hint">You're {money(75 - subtotal)} away from complimentary shipping.</p>}<div className="summary-total"><span>Total</span><b>{money(subtotal + delivery)}</b></div><Link to="/checkout" className="button button-dark checkout-button">Continue to checkout <span>↗</span></Link><small>Taxes calculated at checkout. Secure checkout.</small></aside></div>}</main>
}

function LoginPage({ register = false }) {
  const [message, setMessage] = useState('')
  return <main className="wrap auth-wrap"><div className="auth-card"><span className="auth-mark">✳</span><span className="eyebrow">A LITTLE SPACE OF YOUR OWN</span><h1>{register ? 'Come on in.' : 'Welcome back.'}</h1><p>{register ? 'Create an account to keep all your good things together.' : 'Sign in to see your orders and saved details.'}</p><form className="auth-form" onSubmit={(e) => { e.preventDefault(); setMessage('Account features will be available when we connect the backend.') }}>{register && <label>Your name<input required autoComplete="name" placeholder="How should we call you?"/></label>}<label>Email address<input type="email" required autoComplete="email" placeholder="you@example.com"/></label><label>Password<input type="password" required minLength="8" autoComplete={register ? 'new-password' : 'current-password'} placeholder="At least 8 characters"/></label><button className="button button-dark" type="submit">{register ? 'Create account' : 'Sign in'} <span>↗</span></button>{message && <p className="form-message" role="status">{message}</p>}</form><div className="auth-switch">{register ? 'Already have an account?' : 'New around here?'} <Link to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create an account'}</Link></div></div></main>
}

function CheckoutPage() {
  const { cart, subtotal } = useCart(); const [placed, setPlaced] = useState(false); const delivery = subtotal >= 75 ? 0 : 6.95
  if (!cart.length && !placed) return <main className="wrap page-content empty-state"><span>♧</span><h1>Your bag is empty</h1><p>Add a few favorites before heading to checkout.</p><Link className="button button-dark" to="/products">Browse products <span>↗</span></Link></main>
  if (placed) return <main className="wrap page-content empty-state"><span>✳</span><h1>Thank you for your order.</h1><p>Your demo order is confirmed. Order processing will be available after the backend is connected.</p><Link className="button button-dark" to="/products">Keep exploring <span>↗</span></Link></main>
  return <main className="wrap page-content"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/cart">Your bag</Link><span>/</span> Checkout</div><div className="listing-heading"><div><span className="eyebrow">ALMOST YOURS</span><h1>Let's get it to you<span className="brand-dot">.</span></h1></div></div><form className="checkout-layout" onSubmit={(e) => { e.preventDefault(); setPlaced(true) }}><div className="checkout-form"><section><h2>01 <span>Delivery details</span></h2><div className="form-grid"><label className="full-field">Full name<input required autoComplete="name" placeholder="Your name"/></label><label>Email address<input type="email" required autoComplete="email" placeholder="you@example.com"/></label><label>Phone number<input type="tel" required autoComplete="tel" placeholder="(555) 555-0123"/></label><label className="full-field">Street address<input required autoComplete="street-address" placeholder="123 Somewhere Street"/></label><label>City<input required autoComplete="address-level2" placeholder="Portland"/></label><label>ZIP / Postal code<input required autoComplete="postal-code" placeholder="97201"/></label></div></section><section className="payment-demo"><h2>02 <span>Payment</span></h2><div className="demo-payment"><span>♡</span><div><b>Payment is a demo</b><p>No real payment details are collected or charged.</p></div><span className="demo-tag">DEMO</span></div></section></div><aside className="order-summary"><h2>Your little bundle</h2>{cart.map((item) => <div className="checkout-line" key={item.id}><span>{item.name} <small>× {item.quantity}</small></span><b>{money(item.price * item.quantity)}</b></div>)}<div><span>Shipping</span><b>{delivery ? money(delivery) : 'On us'}</b></div><div className="summary-total"><span>Total</span><b>{money(subtotal + delivery)}</b></div><button className="button button-dark checkout-button" type="submit">Place demo order <span>↗</span></button><small>Demonstration only. No payment will be taken.</small></aside></form></main>
}

function AppShell() {
  return <><Header/><Routes><Route path="/" element={<HomePage/>}/><Route path="/products" element={<ProductsPage/>}/><Route path="/products/:id" element={<ProductPage/>}/><Route path="/cart" element={<CartPage/>}/><Route path="/login" element={<LoginPage/>}/><Route path="/register" element={<LoginPage register/>}/><Route path="/checkout" element={<CheckoutPage/>}/><Route path="*" element={<main className="wrap page-content empty-state"><span>✳</span><h1>That page is off exploring.</h1><Link className="button button-dark" to="/">Back to the home page <span>↗</span></Link></main>}/></Routes><Footer/></>
}

function App() { return <BrowserRouter><CatalogProvider><CartProvider><AppShell/></CartProvider></CatalogProvider></BrowserRouter> }
export default App

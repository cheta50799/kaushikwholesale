import { FormEvent, useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import {
  ArrowRight, BarChart3, Boxes, Check, ChevronRight, Clock3, CreditCard, Download,
  Eye, FileText, LockKeyhole, LogOut, MapPin, Menu, MessageCircle, Package,
  PackageCheck, Plus, Printer, Search, ShieldCheck, ShoppingBag, ShoppingCart,
  Store, Truck, UserRound, Users, X, Receipt,
} from 'lucide-react'

type Product = {
  id: number
  name: string
  brand: string
  category: string
  price: number
  mrp: number
  unit: string
  icon: string
  tone: string
  stock: number
  tag?: string
}
type CartLine = Product & { quantity: number }
type OrderStatus = 'Placed' | 'Picking' | 'Out for delivery' | 'Delivered'
type Order = {
  code: string
  createdAt: number
  customer: string
  phone: string
  address: string
  payment: string
  items: CartLine[]
  total: number
  status: OrderStatus
}

type View = 'shop' | 'track' | 'admin'
type AdminSection = 'overview' | 'orders' | 'customers' | 'inventory'

const categories = ['All products', 'Snacks', 'Beverages', 'Breakfast', 'Household', 'Personal care']
const products: Product[] = [
  { id: 1, name: 'Classic Salted Chips', brand: 'Lay\'s', category: 'Snacks', price: 20, mrp: 20, unit: '52 g', icon: '🥔', tone: 'sunny', stock: 42, tag: 'Bestseller' },
  { id: 2, name: 'Dark Chocolate', brand: 'Cadbury', category: 'Snacks', price: 100, mrp: 110, unit: '110 g', icon: '🍫', tone: 'cocoa', stock: 18, tag: '10% off' },
  { id: 3, name: 'Coca-Cola Original', brand: 'Coca-Cola', category: 'Beverages', price: 40, mrp: 40, unit: '750 ml', icon: '🥤', tone: 'cola', stock: 60 },
  { id: 4, name: 'Instant Noodles', brand: 'Maggi', category: 'Breakfast', price: 14, mrp: 14, unit: '70 g', icon: '🍜', tone: 'noodle', stock: 74 },
  { id: 5, name: 'Toned Milk', brand: 'Amul', category: 'Breakfast', price: 33, mrp: 33, unit: '500 ml', icon: '🥛', tone: 'milk', stock: 29, tag: 'Daily essential' },
  { id: 6, name: 'Moisture Care Soap', brand: 'Dove', category: 'Personal care', price: 58, mrp: 62, unit: '100 g', icon: '🧼', tone: 'rose', stock: 35 },
  { id: 7, name: 'Dishwash Liquid', brand: 'Vim', category: 'Household', price: 115, mrp: 125, unit: '500 ml', icon: '🧴', tone: 'aqua', stock: 16 },
  { id: 8, name: 'Masala Oats', brand: 'Saffola', category: 'Breakfast', price: 45, mrp: 50, unit: '40 g', icon: '🥣', tone: 'oat', stock: 23 },
]

const seedOrders: Order[] = [
  { code: '4821', createdAt: Date.now() - 18 * 60 * 1000, customer: 'Ananya Das', phone: '98765 43210', address: 'Flat 4B, Lake View Apartments, Kolkata', payment: 'UPI', items: [{ ...products[1], quantity: 1 }, { ...products[4], quantity: 2 }, { ...products[6], quantity: 1 }], total: 339, status: 'Picking' },
  { code: '7356', createdAt: Date.now() - 44 * 60 * 1000, customer: 'Rahul Mehta', phone: '98310 44218', address: '12 Park Street, Kolkata', payment: 'Cash on delivery', items: [{ ...products[0], quantity: 2 }, { ...products[2], quantity: 1 }], total: 80, status: 'Out for delivery' },
  { code: '1904', createdAt: Date.now() - 94 * 60 * 1000, customer: 'Moumita Sen', phone: '90071 88342', address: '8A, Salt Lake Sector V, Kolkata', payment: 'UPI', items: [{ ...products[3], quantity: 4 }, { ...products[5], quantity: 2 }], total: 172, status: 'Delivered' },
]

const money = (value: number) => `₹${value.toFixed(2)}`
const orderStorageKey = 'market-counter-orders'
const retentionWindow = 30 * 24 * 60 * 60 * 1000

function formatOrderDate(timestamp: number) {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(timestamp)
}

function loadRetainedOrders() {
  const saved = localStorage.getItem(orderStorageKey)
  const rawOrders: Order[] = saved ? JSON.parse(saved) : seedOrders
  const now = Date.now()
  const retained = rawOrders.map((order) => ({
    ...order,
    createdAt: typeof order.createdAt === 'number' ? order.createdAt : now,
  })).filter((order) => now - order.createdAt < retentionWindow)
  localStorage.setItem(orderStorageKey, JSON.stringify(retained))
  return retained
}

function createInvoicePdf(order: Order) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = 24
  pdf.setTextColor(23, 75, 60)
  pdf.setFontSize(19)
  pdf.text('marketcounter', 20, y)
  pdf.setFontSize(9)
  pdf.setTextColor(105, 116, 105)
  pdf.text('Neighbourhood essentials · Delivery invoice', 20, y + 7)
  pdf.text('140A, Acharya Prafulla Chandra Rd, Kolkata 700006', 20, y + 13)
  pdf.setDrawColor(23, 75, 60)
  pdf.line(20, y + 20, 190, y + 20)
  y += 34
  pdf.setTextColor(35, 41, 35)
  pdf.setFontSize(15)
  pdf.text(`Invoice #${order.code}`, 20, y)
  pdf.setFontSize(9)
  pdf.setTextColor(105, 116, 105)
  pdf.text(formatOrderDate(order.createdAt), 145, y)
  pdf.text(`Customer: ${order.customer}`, 20, y + 8)
  pdf.text(order.phone, 20, y + 13)
  pdf.text(order.address, 20, y + 18)
  y += 31
  pdf.setTextColor(23, 75, 60)
  pdf.text('Item', 20, y)
  pdf.text('Qty', 135, y)
  pdf.text('Amount', 165, y)
  y += 7
  pdf.setTextColor(35, 41, 35)
  order.items.forEach((item) => {
    pdf.text(`${item.name} (${item.unit})`, 20, y)
    pdf.text(String(item.quantity), 137, y)
    pdf.text(money(item.price * item.quantity), 165, y)
    y += 7
  })
  y += 5
  pdf.line(120, y, 190, y)
  y += 8
  pdf.text('Order total', 125, y)
  pdf.text(money(order.total), 165, y)
  y += 7
  pdf.text(`Payment: ${order.payment}`, 125, y)
  pdf.setTextColor(105, 116, 105)
  pdf.text('Thank you for shopping with marketcounter.', 20, 270)
  return pdf
}

function openInvoicePreview(order: Order) {
  const preview = window.open('', '_blank', 'width=760,height=900')
  if (!preview) return
  const rows = order.items.map((item) => `<tr><td>${item.name}<small>${item.brand} · ${item.unit}</small></td><td>${item.quantity}</td><td>${money(item.price * item.quantity)}</td></tr>`).join('')
  preview.document.write(`<!doctype html><html><head><title>Invoice #${order.code}</title><style>body{font-family:Arial,sans-serif;max-width:680px;margin:40px auto;color:#242923;padding:0 24px}header{border-bottom:2px solid #174b3c;padding-bottom:18px}h1{color:#174b3c;font-size:25px;margin:0 0 7px}h2{font-size:17px;color:#174b3c;margin-top:28px}p{color:#69756b;font-size:12px;line-height:1.5;margin:4px 0}table{width:100%;border-collapse:collapse;margin-top:22px}td,th{text-align:left;border-bottom:1px solid #dedfd5;padding:11px 5px;font-size:13px}td:nth-child(2),th:nth-child(2){text-align:center;width:60px}td:last-child,th:last-child{text-align:right}small{display:block;color:#8b958b;font-size:10px;margin-top:3px}.total{text-align:right;border-top:2px solid #174b3c;margin-top:22px;padding-top:14px;color:#174b3c;font-size:19px}</style></head><body><header><h1>marketcounter</h1><p>Neighbourhood essentials · Delivery invoice</p><p>Invoice #${order.code} · ${formatOrderDate(order.createdAt)}</p><p>${order.customer} · ${order.phone}</p><p>${order.address}</p></header><h2>Items</h2><table><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><p class="total">Total: ${money(order.total)}</p><p>Payment: ${order.payment}</p></body></html>`)
  preview.document.close()
  preview.focus()
  return preview
}

function shareInvoiceOnWhatsApp(order: Order) {
  const phone = order.phone.replace(/\D/g, '')
  const normalizedPhone = phone.length === 10 ? `91${phone}` : phone
  const message = `Hello ${order.customer}, your marketcounter order #${order.code} invoice is ready. Total: ${money(order.total)}. Thank you for shopping with us.`
  window.open(`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
}

function printThermalReceipt(order: Order) {
  const receipt = window.open('', '_blank', 'width=420,height=720')
  if (!receipt) return
  const rows = order.items.map((item) => `<div class="line"><span>${item.name}</span><span>${item.quantity} x ${money(item.price * item.quantity)}</span></div>`).join('')
  receipt.document.write(`<!doctype html><html><head><title>Receipt #${order.code}</title><style>@page{size:80mm auto;margin:0}*{box-sizing:border-box}body{width:72mm;margin:0 auto;padding:5mm 0;color:#111;font:12px monospace}h1{text-align:center;font:bold 17px Arial;margin:0 0 4px}p{text-align:center;font-size:10px;margin:3px 0 10px}.rule{border-top:1px dashed #111;margin:8px 0}.meta{font-size:10px;line-height:1.5}.line{display:flex;justify-content:space-between;gap:8px;margin:7px 0}.line span:first-child{max-width:43mm}.line span:last-child{text-align:right;white-space:nowrap}.total{display:flex;justify-content:space-between;font-weight:bold;font-size:14px;margin-top:10px}.thanks{text-align:center;margin-top:18px;font-size:10px}</style></head><body><h1>MARKETCOUNTER</h1><p>Neighbourhood essentials</p><div class="rule"></div><div class="meta">Receipt #${order.code}<br />${formatOrderDate(order.createdAt)}<br />Customer: ${order.customer}<br />${order.phone}</div><div class="rule"></div>${rows}<div class="rule"></div><div class="total"><span>TOTAL</span><span>${money(order.total)}</span></div><div class="meta">Payment: ${order.payment}</div><p class="thanks">Thank you for shopping with us.</p><script>window.onload=function(){window.focus();window.print()}</script></body></html>`)
  receipt.document.close()
}

function App() {
  const [view, setView] = useState<View>('shop')
  const [catalog, setCatalog] = useState(products)
  const [category, setCategory] = useState('All products')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [orders, setOrders] = useState<Order[]>(loadRetainedOrders)
  const [trackCode, setTrackCode] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' })
  const [payment, setPayment] = useState('UPI')
  const [notice, setNotice] = useState('')
  const [adminAuthed, setAdminAuthed] = useState(false)
  const [adminCredentials, setAdminCredentials] = useState({ id: '', password: '' })
  const [adminError, setAdminError] = useState('')
  const [adminSearch, setAdminSearch] = useState('')
  const [adminFilter, setAdminFilter] = useState<'All' | OrderStatus>('All')
  const [mobileMenu, setMobileMenu] = useState(false)

  const filteredProducts = useMemo(() => catalog.filter((product) => {
    const categoryMatch = category === 'All products' || product.category === category
    const searchMatch = `${product.name} ${product.brand}`.toLowerCase().includes(search.toLowerCase())
    return categoryMatch && searchMatch
  }), [category, search])
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = subtotal >= 499 || subtotal === 0 ? 0 : 30
  const total = subtotal + deliveryFee
  const trackedOrder = orders.find((order) => order.code === trackCode)
  const filteredOrders = orders.filter((order) => {
    const searchMatch = `${order.code} ${order.customer} ${order.phone}`.toLowerCase().includes(adminSearch.toLowerCase())
    return searchMatch && (adminFilter === 'All' || order.status === adminFilter)
  })

  useEffect(() => {
    const pruneDaily = () => setOrders(loadRetainedOrders())
    const interval = window.setInterval(pruneDaily, 24 * 60 * 60 * 1000)
    return () => window.clearInterval(interval)
  }, [])

  function notify(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }

  function updateOrders(nextOrders: Order[]) {
    setOrders(nextOrders)
    localStorage.setItem(orderStorageKey, JSON.stringify(nextOrders))
  }

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      return existing
        ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { ...product, quantity: 1 }]
    })
    notify(`${product.name} added to basket`)
  }

  function changeQuantity(id: number, amount: number) {
    setCart((current) => current.flatMap((item) => item.id === id
      ? item.quantity + amount > 0 ? [{ ...item, quantity: item.quantity + amount }] : []
      : [item]))
  }

  function placeOrder(event: FormEvent) {
    event.preventDefault()
    if (!customer.name || !customer.phone || !customer.address || !cart.length) return
    let code = String(Math.floor(1000 + Math.random() * 9000))
    while (orders.some((order) => order.code === code)) code = String(Math.floor(1000 + Math.random() * 9000))
    const order: Order = { code, createdAt: Date.now(), customer: customer.name, phone: customer.phone, address: customer.address, payment, items: cart, total, status: 'Placed' }
    updateOrders([order, ...orders])
    setCart([])
    setCustomer({ name: '', phone: '', address: '' })
    setTrackCode(code)
    setSelectedOrder(order)
    setView('track')
    notify(`Order ${code} placed successfully`)
  }

  function signInAdmin(event: FormEvent) {
    event.preventDefault()
    if (adminCredentials.id === 'admin@marketcounter.in' && adminCredentials.password === 'Store@1234') {
      setAdminAuthed(true)
      setAdminError('')
      notify('Admin console unlocked')
    } else setAdminError('Incorrect admin ID or password')
  }

  function updateOrderStatus(order: Order, status: OrderStatus) {
    const updated = { ...order, status }
    updateOrders(orders.map((item) => item.code === order.code ? updated : item))
    setSelectedOrder(updated)
    notify(`Order ${order.code} marked ${status.toLowerCase()}`)
  }

  return <div className="portal-shell">
    <header className="site-header">
      <button className="brand" onClick={() => { setView('shop'); setMobileMenu(false) }}><span className="brand-mark"><ShoppingBag size={18} /></span><span><strong>market<span>counter</span></strong><small>neighbourhood essentials</small></span></button>
      <nav className={mobileMenu ? 'main-nav open' : 'main-nav'}>
        <button className={view === 'shop' ? 'active' : ''} onClick={() => { setView('shop'); setMobileMenu(false) }}>Shop</button>
        <button className={view === 'track' ? 'active' : ''} onClick={() => { setView('track'); setMobileMenu(false) }}>Track order</button>
        <button className={view === 'admin' ? 'active' : ''} onClick={() => { setView('admin'); setMobileMenu(false) }}><LockKeyhole size={14} /> Admin console</button>
      </nav>
      <div className="header-tools"><span className="delivery-zone"><MapPin size={15} /> Delivering to <b>Kolkata 700006</b></span><button className="basket-button" onClick={() => document.getElementById('basket')?.scrollIntoView({ behavior: 'smooth' })}><ShoppingCart size={18} /><span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span></button><button className="menu-button" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={20} /></button></div>
    </header>

    {view === 'shop' && <main className="customer-main">
      <section className="store-hero"><div className="hero-copy"><p className="kicker">Open daily · 7:00 AM to 11:00 PM</p><h1>The everyday shop,<br /><em>delivered.</em></h1><p>Snacks, drinks, breakfast and home essentials from your neighbourhood store. Delivered fresh to your door in under 30 minutes.</p><div className="hero-actions"><button className="primary-button" onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}>Start shopping <ArrowRight size={16} /></button><button className="text-link" onClick={() => setView('track')}>Track an order <ChevronRight size={15} /></button></div></div><div className="hero-art"><div className="hero-sun" /><div className="hero-shelf shelf-back"><i /><i /><i /><i /><i /></div><div className="hero-shelf shelf-front"><i /><i /><i /><i /></div><span className="hero-product product-one">🥤</span><span className="hero-product product-two">🍫</span><span className="hero-product product-three">🥔</span><div className="hero-sticker">FRESH<br /><b>EVERY<br />DAY</b></div></div></section>
      <section className="service-strip"><div><Truck size={20} /><span><b>Fast local delivery</b><small>Under 30 min on orders over ₹199</small></span></div><div><ShieldCheck size={20} /><span><b>Secure payments</b><small>UPI, cards and cash at your door</small></span></div><div><PackageCheck size={20} /><span><b>Quality checked</b><small>Fresh stock from trusted brands</small></span></div></section>
      <section className="catalog-section" id="catalog"><div className="section-intro"><div><p className="kicker">Curated for your everyday</p><h2>What are you picking up?</h2></div><div className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products or brands" /></div></div><div className="category-row">{categories.map((item) => <button className={category === item ? 'selected' : ''} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="product-layout"><div className="product-grid">{filteredProducts.map((product) => <article className="product-card" key={product.id}><div className={`product-visual ${product.tone}`}><span>{product.icon}</span>{product.tag && <b>{product.tag}</b>}<button onClick={() => addToCart(product)} aria-label={`Add ${product.name}`}><Plus size={17} /></button></div><div className="product-details"><div><small>{product.brand}</small><h3>{product.name}</h3><span>{product.unit}</span></div><div className="price"><strong>{money(product.price)}</strong>{product.mrp !== product.price && <del>{money(product.mrp)}</del>}</div></div></article>)}</div><Basket cart={cart} subtotal={subtotal} deliveryFee={deliveryFee} total={total} changeQuantity={changeQuantity} onClear={() => setCart([])} onCheckout={() => document.getElementById('checkout-form')?.scrollIntoView({ behavior: 'smooth' })} /></div></section>
      <CheckoutForm customer={customer} setCustomer={setCustomer} payment={payment} setPayment={setPayment} cart={cart} total={total} onSubmit={placeOrder} />
    </main>}

    {view === 'track' && <main className="track-page"><div className="page-heading"><p className="kicker">Order support</p><h1>Track your delivery.</h1><p>Enter the four digit code from your confirmation to see the latest status.</p></div><div className="track-search"><input value={trackCode} maxLength={4} onChange={(event) => setTrackCode(event.target.value.replace(/\D/g, ''))} placeholder="e.g. 4821" /><button className="primary-button" onClick={() => notify(trackedOrder ? 'Order found' : 'No order found for that code')}>Find order <Search size={16} /></button></div>{trackedOrder ? <OrderStatusCard order={trackedOrder} /> : <div className="empty-track"><Package size={28} /><h3>Nothing to show yet</h3><p>Your active order will appear here once you enter its code.</p></div>}</main>}

    {view === 'admin' && <main className="admin-page">{!adminAuthed ? <AdminLogin credentials={adminCredentials} setCredentials={setAdminCredentials} error={adminError} onSubmit={signInAdmin} /> : <AdminWorkspace catalog={catalog} onAddProduct={(product) => setCatalog((current) => [...current, product])} orders={filteredOrders} allOrders={orders} search={adminSearch} setSearch={setAdminSearch} filter={adminFilter} setFilter={setAdminFilter} selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder} onStatus={updateOrderStatus} onLogout={() => setAdminAuthed(false)} />}</main>}
    {view === 'admin' && adminAuthed && <AdminProductQuickAdd catalog={catalog} onAddProduct={(product) => setCatalog((current) => [...current, product])} />}
    {notice && <div className="notice"><Check size={15} /> {notice}<button onClick={() => setNotice('')}><X size={14} /></button></div>}
  </div>
}

function Basket({ cart, subtotal, deliveryFee, total, changeQuantity, onClear, onCheckout }: { cart: CartLine[]; subtotal: number; deliveryFee: number; total: number; changeQuantity: (id: number, amount: number) => void; onClear: () => void; onCheckout: () => void }) {
  return <aside className="basket" id="basket"><div className="basket-heading"><div><p className="kicker">Your basket</p><h2>{cart.length ? `${cart.reduce((sum, item) => sum + item.quantity, 0)} items` : 'Start an order'}</h2></div>{cart.length > 0 && <button className="clear-link" onClick={onClear}>Clear all</button>}</div>{cart.length === 0 ? <div className="empty-basket"><ShoppingCart size={25} /><p>Your basket is waiting</p><span>Add a few essentials and they will show up here.</span></div> : <><div className="basket-lines">{cart.map((item) => <div className="basket-line" key={item.id}><span className={`line-icon ${item.tone}`}>{item.icon}</span><div><b>{item.name}</b><small>{money(item.price)} · {item.unit}</small></div><div className="stepper"><button onClick={() => changeQuantity(item.id, -1)}>-</button><b>{item.quantity}</b><button onClick={() => changeQuantity(item.id, 1)}>+</button></div></div>)}</div><div className="basket-total"><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Delivery</span><b className={deliveryFee === 0 ? 'free' : ''}>{deliveryFee === 0 ? 'FREE' : money(deliveryFee)}</b></div><div className="grand-total"><span>Total</span><strong>{money(total)}</strong></div></div><button className="primary-button full" onClick={onCheckout}>Continue to checkout <ArrowRight size={16} /></button></>}</aside>
}

function CheckoutForm({ customer, setCustomer, payment, setPayment, cart, total, onSubmit }: { customer: { name: string; phone: string; address: string }; setCustomer: (value: { name: string; phone: string; address: string }) => void; payment: string; setPayment: (value: string) => void; cart: CartLine[]; total: number; onSubmit: (event: FormEvent) => void }) {
  return <section className="checkout-section" id="checkout-form"><div className="checkout-heading"><div><p className="kicker">Secure checkout</p><h2>Where should we bring it?</h2></div><span><LockKeyhole size={14} /> Your details are protected</span></div><form onSubmit={onSubmit} className="checkout-form"><div className="form-fields"><label>Full name<input required value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} placeholder="e.g. Ananya Das" /></label><label>Mobile number<input required value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} placeholder="10 digit mobile number" inputMode="tel" /></label><label className="wide">Delivery address<input required value={customer.address} onChange={(event) => setCustomer({ ...customer, address: event.target.value })} placeholder="Flat, building, street and locality" /></label></div><div className="checkout-pay"><span className="pay-label">Payment method</span><div className="payment-select"><button type="button" className={payment === 'UPI' ? 'selected' : ''} onClick={() => setPayment('UPI')}><CreditCard size={16} /> UPI / Card</button><button type="button" className={payment === 'Cash on delivery' ? 'selected' : ''} onClick={() => setPayment('Cash on delivery')}><span className="cash-symbol">₹</span> Cash on delivery</button></div><button className="primary-button full" disabled={!cart.length}>Place order · {money(total)} <ArrowRight size={16} /></button></div></form></section>
}

function OrderStatusCard({ order }: { order: Order }) {
  const statuses: OrderStatus[] = ['Placed', 'Picking', 'Out for delivery', 'Delivered']
  const activeIndex = statuses.indexOf(order.status)
  return <section className="order-card"><div className="order-card-top"><div><p className="kicker">Order confirmation</p><h2>Order <strong>#{order.code}</strong></h2><span>{formatOrderDate(order.createdAt)} · {order.payment}</span></div><span className={`status-badge ${order.status.toLowerCase().replace(/ /g, '-')}`}>{order.status}</span></div><div className="progress-track">{statuses.map((status, index) => <div className={index <= activeIndex ? 'progress-step done' : 'progress-step'} key={status}><span>{index < activeIndex ? <Check size={13} /> : index + 1}</span><small>{status}</small></div>)}</div><div className="order-detail-grid"><div><small>Delivering to</small><b>{order.customer}</b><span>{order.address}</span></div><div><small>Order total</small><b>{money(order.total)}</b><span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</span></div><div><small>Need help?</small><b>Call store</b><span>+91 98310 00000</span></div></div><div className="ordered-items">{order.items.map((item) => <div key={item.id}><span>{item.icon}</span><b>{item.name}</b><small>× {item.quantity}</small><strong>{money(item.price * item.quantity)}</strong></div>)}</div></section>
}

function AdminProductQuickAdd({ catalog, onAddProduct }: { catalog: Product[]; onAddProduct: (product: Product) => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', brand: '', category: 'Snacks', unit: '', price: '', mrp: '', stock: '' })

  function submit(event: FormEvent) {
    event.preventDefault()
    const price = Number(form.price)
    const stock = Number(form.stock)
    if (!form.name.trim() || !form.brand.trim() || !form.unit.trim() || !price || stock < 0) return
    onAddProduct({ id: Math.max(...catalog.map((product) => product.id), 0) + 1, name: form.name.trim(), brand: form.brand.trim(), category: form.category, price, mrp: Number(form.mrp) || price, unit: form.unit.trim(), icon: '📦', tone: 'aqua', stock, tag: 'New' })
    setForm({ name: '', brand: '', category: 'Snacks', unit: '', price: '', mrp: '', stock: '' })
    setOpen(false)
  }

  return <>{open && <div className="product-modal-backdrop" onClick={() => setOpen(false)}><form className="product-modal" onSubmit={submit} onClick={(event) => event.stopPropagation()}><div className="product-modal-heading"><div><p className="kicker">Inventory intake</p><h2>Add new product</h2></div><button type="button" onClick={() => setOpen(false)}><X size={17} /></button></div><div className="product-form-grid"><label>Product name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Green Tea Bags" /></label><label>Brand<input required value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} placeholder="e.g. Tata Tea" /></label><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.slice(1).map((category) => <option key={category}>{category}</option>)}</select></label><label>Pack size<input required value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder="e.g. 250 g" /></label><label>Selling price<input required type="number" min="1" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="₹" /></label><label>MRP <span>(optional)</span><input type="number" min="1" value={form.mrp} onChange={(event) => setForm({ ...form, mrp: event.target.value })} placeholder="₹" /></label><label>Opening stock<input required type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} placeholder="Units" /></label></div><button className="primary-button full" type="submit">Add to catalog <Plus size={15} /></button></form></div>}<button className="add-product-fab" onClick={() => setOpen(true)}><Plus size={16} /> Add product</button></>
}

function AdminLogin({ credentials, setCredentials, error, onSubmit }: { credentials: { id: string; password: string }; setCredentials: (value: { id: string; password: string }) => void; error: string; onSubmit: (event: FormEvent) => void }) {
  return <section className="admin-login"><div className="login-ornament"><Store size={28} /><span>MC / OPS</span></div><div className="login-copy"><p className="kicker">Restricted workspace</p><h1>Welcome to<br /><em>operations.</em></h1><p>Manage live orders, delivery handoffs and store performance from one secure console.</p></div><form onSubmit={onSubmit} className="login-form"><div className="login-title"><LockKeyhole size={18} /><div><h2>Admin sign in</h2><span>Authorised personnel only</span></div></div><label>Admin ID<input required value={credentials.id} onChange={(event) => setCredentials({ ...credentials, id: event.target.value })} placeholder="name@marketcounter.in" /></label><label>Password<input required type="password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} placeholder="Enter your password" /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button full">Sign in to console <ArrowRight size={16} /></button><small className="login-foot"><ShieldCheck size={14} /> Session protected · Demo access is preconfigured</small></form></section>
}

function AdminWorkspace({ catalog, onAddProduct, orders, allOrders, search, setSearch, filter, setFilter, selectedOrder, setSelectedOrder, onStatus, onLogout }: { catalog: Product[]; onAddProduct: (product: Product) => void; orders: Order[]; allOrders: Order[]; search: string; setSearch: (value: string) => void; filter: 'All' | OrderStatus; setFilter: (value: 'All' | OrderStatus) => void; selectedOrder: Order | null; setSelectedOrder: (value: Order | null) => void; onStatus: (order: Order, status: OrderStatus) => void; onLogout: () => void }) {
  const [section, setSection] = useState<AdminSection>('overview')
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState('')
  const [inventory, setInventory] = useState(catalog)
  const [showProductForm, setShowProductForm] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', brand: '', category: 'Snacks', unit: '', price: '', mrp: '', stock: '' })
  useEffect(() => setInventory(catalog), [catalog])
  const revenue = allOrders.reduce((sum, order) => sum + order.total, 0)
  const pending = allOrders.filter((order) => order.status !== 'Delivered').length
  const customers = Array.from(allOrders.reduce((records, order) => {
    const existing = records.get(order.phone)
    records.set(order.phone, existing ? { ...existing, orderCount: existing.orderCount + 1, spend: existing.spend + order.total, lastOrder: Math.max(existing.lastOrder, order.createdAt) } : { name: order.customer, phone: order.phone, address: order.address, orderCount: 1, spend: order.total, lastOrder: order.createdAt })
    return records
  }, new Map<string, { name: string; phone: string; address: string; orderCount: number; spend: number; lastOrder: number }>()).values())
  const selectedCustomerOrders = allOrders.filter((order) => order.phone === selectedCustomerPhone)

  function adjustStock(id: number, amount: number) {
    setInventory((current) => current.map((product) => product.id === id ? { ...product, stock: Math.max(0, product.stock + amount) } : product))
  }

  function addProduct(event: FormEvent) {
    event.preventDefault()
    const price = Number(newProduct.price)
    const stock = Number(newProduct.stock)
    if (!newProduct.name.trim() || !newProduct.brand.trim() || !newProduct.unit.trim() || !price || stock < 0) return
    const product: Product = { id: Math.max(...inventory.map((item) => item.id), 0) + 1, name: newProduct.name.trim(), brand: newProduct.brand.trim(), category: newProduct.category, price, mrp: Number(newProduct.mrp) || price, unit: newProduct.unit.trim(), icon: '📦', tone: 'aqua', stock, tag: 'New' }
    setInventory((current) => [...current, product])
    onAddProduct(product)
    setNewProduct({ name: '', brand: '', category: 'Snacks', unit: '', price: '', mrp: '', stock: '' })
    setShowProductForm(false)
  }

  return <div className="admin-console"><aside className="admin-sidebar"><div className="admin-brand"><span className="brand-mark"><ShoppingBag size={18} /></span><strong>market<span>counter</span></strong></div><p className="admin-label">Operations</p><button className={`admin-nav ${section === 'overview' ? 'active' : ''}`} onClick={() => setSection('overview')}><BarChart3 size={17} /> Overview</button><button className={`admin-nav ${section === 'orders' ? 'active' : ''}`} onClick={() => setSection('orders')}><ShoppingBag size={17} /> Orders <b>{pending}</b></button><button className={`admin-nav ${section === 'customers' ? 'active' : ''}`} onClick={() => setSection('customers')}><Users size={17} /> Customers <b>{customers.length}</b></button><button className={`admin-nav ${section === 'inventory' ? 'active' : ''}`} onClick={() => setSection('inventory')}><Boxes size={17} /> Inventory</button><div className="admin-side-bottom"><div className="admin-user"><span>JD</span><div><b>Jamie Davis</b><small>Store manager</small></div></div><button className="logout-button" onClick={onLogout}><LogOut size={15} /> Sign out</button></div></aside><section className="admin-content"><header className="admin-topbar"><div><p className="kicker">Tuesday, 28 May 2024</p><h1>{section === 'customers' ? 'Customer book.' : section === 'inventory' ? 'Stock control.' : 'Good morning, Jamie.'}</h1></div><div className="admin-top-actions"><span className="store-live"><i /> Store live</span><button className="avatar-button">JD</button></div></header><div className="admin-stats"><div><span>30-day revenue</span><strong>{money(revenue)}</strong><small className="positive">Retention window active</small></div><div><span>Open orders</span><strong>{pending}</strong><small>Needs attention today</small></div><div><span>Customers</span><strong>{customers.length}</strong><small>Unique buyers in 30 days</small></div><div><span>Delivery SLA</span><strong>94.8%</strong><small className="positive">↑ 2.1% this week</small></div></div>{section === 'customers' ? <section className="admin-module"><div className="orders-header"><div><p className="kicker">Relationship history</p><h2>Customers <span>{customers.length} in the last 30 days</span></h2></div><span className="retention-note"><Clock3 size={14} /> Older records are automatically removed daily</span></div><div className="customer-table"><div className="customer-table-head"><span>Customer</span><span>Mobile</span><span>Orders</span><span>30-day spend</span><span>Last order</span><span /></div>{customers.map((customer) => <button className={selectedCustomerPhone === customer.phone ? 'customer-row selected' : 'customer-row'} key={customer.phone} onClick={() => setSelectedCustomerPhone(customer.phone)}><span><b>{customer.name}</b><small>{customer.address}</small></span><span>{customer.phone}</span><strong>{customer.orderCount}</strong><b>{money(customer.spend)}</b><span>{formatOrderDate(customer.lastOrder)}</span><ChevronRight size={15} /></button>)}</div>{selectedCustomerPhone && <div className="customer-history"><div className="section-heading"><div><p className="kicker">Past orders</p><h3>{customers.find((customer) => customer.phone === selectedCustomerPhone)?.name}</h3></div><button className="clear-link" onClick={() => setSelectedCustomerPhone('')}>Close</button></div>{selectedCustomerOrders.map((order) => <button className="history-row" key={order.code} onClick={() => setSelectedOrder(order)}><strong>#{order.code}</strong><span>{formatOrderDate(order.createdAt)}</span><span>{order.items.length} products</span><b>{money(order.total)}</b><span className={`status-badge ${order.status.toLowerCase().replace(/ /g, '-')}`}>{order.status}</span></button>)}</div>}</section> : section === 'inventory' ? <section className="admin-module"><div className="orders-header"><div><p className="kicker">Live stock ledger</p><h2>Inventory <span>Updates apply to this session</span></h2></div><span className="retention-note"><Boxes size={14} /> {inventory.reduce((sum, product) => sum + product.stock, 0)} units across {inventory.length} SKUs</span></div><div className="inventory-admin-grid">{inventory.map((product) => <article className="inventory-admin-card" key={product.id}><div className={`line-icon ${product.tone}`}>{product.icon}</div><div className="inventory-copy"><small>{product.brand} · {product.category}</small><h3>{product.name}</h3><span>{product.unit} · SKU MC-{String(product.id).padStart(4, '0')}</span></div><div className={product.stock < 20 ? 'stock-level low' : 'stock-level'}><b>{product.stock}</b><small>units</small></div><div className="stock-actions"><button onClick={() => adjustStock(product.id, -1)}>-</button><button onClick={() => adjustStock(product.id, 1)}>+</button></div></article>)}</div></section> : <><div className="orders-header"><div><p className="kicker">Live queue</p><h2>{section === 'orders' ? 'All online orders' : 'Online orders'} <span>{orders.length} shown · 30-day data</span></h2></div><div className="admin-controls"><div className="admin-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order or customer" /></div><select value={filter} onChange={(event) => setFilter(event.target.value as 'All' | OrderStatus)}><option value="All">All statuses</option><option value="Placed">Placed</option><option value="Picking">Picking</option><option value="Out for delivery">Out for delivery</option><option value="Delivered">Delivered</option></select></div></div><div className="admin-order-layout"><div className="orders-table"><div className="orders-table-head"><span>Order</span><span>Customer</span><span>Items</span><span>Total</span><span>Status</span><span /></div>{orders.map((order) => <button className={selectedOrder?.code === order.code ? 'order-row selected' : 'order-row'} key={order.code} onClick={() => setSelectedOrder(order)}><strong>#{order.code}</strong><span><b>{order.customer}</b><small>{formatOrderDate(order.createdAt)}</small></span><span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</span><b>{money(order.total)}</b><span className={`status-badge ${order.status.toLowerCase().replace(/ /g, '-')}`}>{order.status}</span><ChevronRight size={16} /></button>)}{!orders.length && <div className="no-results">No orders match this view.</div>}</div>{selectedOrder ? <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} onStatus={onStatus} /> : <div className="detail-empty"><PackageCheck size={30} /><h3>Select an order</h3><p>Choose an order from the queue to view items and update its handoff status.</p></div>}</div></>}</section></div>
}

function AdminDashboard({ orders, allOrders, search, setSearch, filter, setFilter, selectedOrder, setSelectedOrder, onStatus, onLogout }: { orders: Order[]; allOrders: Order[]; search: string; setSearch: (value: string) => void; filter: 'All' | OrderStatus; setFilter: (value: 'All' | OrderStatus) => void; selectedOrder: Order | null; setSelectedOrder: (value: Order | null) => void; onStatus: (order: Order, status: OrderStatus) => void; onLogout: () => void }) {
  const revenue = allOrders.reduce((sum, order) => sum + order.total, 0)
  const pending = allOrders.filter((order) => order.status !== 'Delivered').length
  return <div className="admin-console"><aside className="admin-sidebar"><div className="admin-brand"><span className="brand-mark"><ShoppingBag size={18} /></span><strong>market<span>counter</span></strong></div><p className="admin-label">Operations</p><button className="admin-nav active"><BarChart3 size={17} /> Overview</button><button className="admin-nav"><ShoppingBag size={17} /> Orders <b>{pending}</b></button><button className="admin-nav"><Package size={17} /> Inventory</button><div className="admin-side-bottom"><div className="admin-user"><span>JD</span><div><b>Jamie Davis</b><small>Store manager</small></div></div><button className="logout-button" onClick={onLogout}><LogOut size={15} /> Sign out</button></div></aside><section className="admin-content"><header className="admin-topbar"><div><p className="kicker">Tuesday, 28 May 2024</p><h1>Good morning, Jamie.</h1></div><div className="admin-top-actions"><span className="store-live"><i /> Store live</span><button className="avatar-button">JD</button></div></header><div className="admin-stats"><div><span>Today's revenue</span><strong>{money(revenue + 18240)}</strong><small className="positive">↑ 12.4% vs yesterday</small></div><div><span>Open orders</span><strong>{pending + 8}</strong><small>Needs attention today</small></div><div><span>Avg. basket value</span><strong>{money(383.75)}</strong><small>Across all online orders</small></div><div><span>Delivery SLA</span><strong>94.8%</strong><small className="positive">↑ 2.1% this week</small></div></div><div className="orders-header"><div><p className="kicker">Live queue</p><h2>Online orders <span>{orders.length} shown</span></h2></div><div className="admin-controls"><div className="admin-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order or customer" /></div><select value={filter} onChange={(event) => setFilter(event.target.value as 'All' | OrderStatus)}><option value="All">All statuses</option><option value="Placed">Placed</option><option value="Picking">Picking</option><option value="Out for delivery">Out for delivery</option><option value="Delivered">Delivered</option></select></div></div><div className="admin-order-layout"><div className="orders-table"><div className="orders-table-head"><span>Order</span><span>Customer</span><span>Items</span><span>Total</span><span>Status</span><span /></div>{orders.map((order) => <button className={selectedOrder?.code === order.code ? 'order-row selected' : 'order-row'} key={order.code} onClick={() => setSelectedOrder(order)}><strong>#{order.code}</strong><span><b>{order.customer}</b><small>{order.createdAt}</small></span><span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</span><b>{money(order.total)}</b><span className={`status-badge ${order.status.toLowerCase().replace(/ /g, '-')}`}>{order.status}</span><ChevronRight size={16} /></button>)}{!orders.length && <div className="no-results">No orders match this view.</div>}</div>{selectedOrder ? <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} onStatus={onStatus} /> : <div className="detail-empty"><PackageCheck size={30} /><h3>Select an order</h3><p>Choose an order from the queue to view items and update its handoff status.</p></div>}</div></section></div>
}

function OrderDetail({ order, onClose, onStatus }: { order: Order; onClose: () => void; onStatus: (order: Order, status: OrderStatus) => void }) {
  const nextStatus: OrderStatus | null = order.status === 'Placed' ? 'Picking' : order.status === 'Picking' ? 'Out for delivery' : order.status === 'Out for delivery' ? 'Delivered' : null
  return <aside className="order-detail"><div className="detail-heading"><div><p className="kicker">Order detail</p><h2>#{order.code}</h2></div><button onClick={onClose}><X size={17} /></button></div><span className={`status-badge ${order.status.toLowerCase().replace(/ /g, '-')}`}>{order.status}</span><div className="detail-customer"><span><UserRound size={17} /></span><div><b>{order.customer}</b><small>{order.phone}</small><small>{order.address}</small></div></div><div className="detail-items">{order.items.map((item) => <div key={item.id}><span>{item.icon}</span><div><b>{item.name}</b><small>{item.brand} · {item.unit}</small></div><strong>{item.quantity} × {money(item.price)}</strong></div>)}</div><div className="detail-total"><span>Order total</span><strong>{money(order.total)}</strong><small>{order.payment}</small></div><div className="detail-actions">{nextStatus ? <button className="primary-button full" onClick={() => onStatus(order, nextStatus)}>{nextStatus === 'Picking' ? 'Start picking order' : nextStatus === 'Out for delivery' ? 'Mark out for delivery' : 'Mark as delivered'} <ArrowRight size={15} /></button> : <div className="delivered-note"><Check size={15} /> Delivery completed</div>}<div className="invoice-actions"><button title="View invoice" onClick={() => openInvoicePreview(order)}><Eye size={14} /> View</button><button title="Print invoice" onClick={() => { const preview = openInvoicePreview(order); if (preview) window.setTimeout(() => preview.print(), 250) }}><Printer size={14} /> Print</button><button title="Download invoice PDF" onClick={() => createInvoicePdf(order).save(`marketcounter-invoice-${order.code}.pdf`)}><Download size={14} /> PDF</button><button title="Share invoice on WhatsApp" className="whatsapp-action" onClick={() => shareInvoiceOnWhatsApp(order)}><MessageCircle size={14} /> WhatsApp</button>{order.status === 'Delivered' && <button title="Generate and print 80 mm receipt" className="receipt-action" onClick={() => printThermalReceipt(order)}><Receipt size={14} /> Receipt</button>}</div><button className="secondary-button full" onClick={() => window.print()}><Truck size={15} /> Print handoff slip</button></div></aside>
}

export default App

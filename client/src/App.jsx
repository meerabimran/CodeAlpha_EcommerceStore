import axios from 'axios'
import { useEffect, useState } from 'react'

function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      setLoading(true)
      setError('')

      try {
        const apiUrl = import.meta.env.VITE_API_URL || ''
        const response = await axios.get(`${apiUrl}/api/products`, {
          signal: controller.signal,
        })
        setProducts(response.data)
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError.response?.data?.message || 'Could not load products. Please try again.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadProducts()
    return () => controller.abort()
  }, [reload])

  const addToCart = (product) => {
    setCart((currentCart) => [...currentCart, product])
  }

  const total = cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black">CodeAlpha Store</h1>
          <div className="flex gap-6 items-center">
            <span className="text-gray-600">Products: {products.length}</span>
            <button
              onClick={() => setShowCart(!showCart)}
              className="bg-black text-white px-5 py-2 rounded-full font-semibold relative"
            >
              Cart ({cart.length})
            </button>
          </div>
        </div>
      </nav>

      <section className="bg-black text-white py-16 text-center">
        <h2 className="text-5xl font-extrabold mb-4">Summer Sale 50% OFF</h2>
        <p className="text-gray-300 text-lg">Professional MERN E-commerce Project for CodeAlpha Internship</p>
      </section>

      {showCart && (
        <aside className="fixed right-0 top-0 w-full max-w-sm h-full bg-white shadow-2xl z-50 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Your Cart</h3>
            <button onClick={() => setShowCart(false)} className="text-2xl" aria-label="Close cart">✕</button>
          </div>
          {cart.length === 0 ? <p className="text-gray-500">Cart is empty</p> : (
            <>
              {cart.map((item, index) => (
                <div key={`${item._id}-${index}`} className="flex justify-between py-3 border-b">
                  <span>{item.name}</span>
                  <span className="font-bold">${Number(item.price).toFixed(2)}</span>
                </div>
              ))}
              <div className="mt-6">
                <p className="text-xl font-bold">Total: ${total}</p>
                <button className="w-full bg-black text-white py-3 rounded-lg mt-4">Checkout</button>
              </div>
            </>
          )}
        </aside>
      )}

      <main className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <p className="text-center text-gray-600" role="status">Loading products...</p>
        ) : error ? (
          <div className="text-center" role="alert">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setReload((attempt) => attempt + 1)}
              className="mt-4 bg-black text-white px-5 py-2 rounded-full"
            >
              Try again
            </button>
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-600">No products are available yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product._id} className="bg-white rounded-2xl shadow hover:shadow-xl transition p-4">
                <img src={product.image} alt={product.name} className="w-full h-64 object-cover rounded-xl mb-4" />
                <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">{product.category}</span>
                <h3 className="text-lg font-bold mt-3">{product.name}</h3>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xl font-extrabold">${Number(product.price).toFixed(2)}</span>
                  <button
                    onClick={() => addToCart(product)}
                    className="bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-white border-t py-6 text-center text-gray-500">
        Built for CodeAlpha Internship | MERN Stack
      </footer>
    </div>
  )
}

export default App

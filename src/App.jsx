import { useEffect, useState } from 'react'
import './App.css'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

function App() {
  const [authMode, setAuthMode] = useState('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [authMessageType, setAuthMessageType] = useState('')
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false)

  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(localStorage.getItem('access_token')),
  )

  const [products, setProducts] = useState([])
  const [productName, setProductName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [editingId, setEditingId] = useState(null)

  const clearAuth = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')

    setIsLoggedIn(false)
  }

  useEffect(() => {
    if (!isLoggedIn) {
      return
    }

    const fetchProducts = async () => {
      try {
        const accessToken = localStorage.getItem('access_token')

        const response = await fetch(
          `${API_BASE_URL}/api/products`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        )

        const data = await response.json()

        if (response.status === 401) {
          clearAuth()
          return
        }

        if (!response.ok) {
          console.error(data.error || 'Failed to load products')
          return
        }

        setProducts(data)

        console.log('Products loaded successfully:', data.length)
      } catch (error) {
        console.error('Failed to load products:', error)
      }
    }

    fetchProducts()
  }, [isLoggedIn])

  const handleAddProduct = async (event) => {
    event.preventDefault()

    try {
      const accessToken = localStorage.getItem('access_token')

      const response = await fetch(
        `${API_BASE_URL}/api/products`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            product_name: productName,
            description: description,
            price: Number(price),
            quantity: Number(quantity),
          }),
        },
      )

      const data = await response.json()

      if (response.status === 401) {
        clearAuth()
        return
      }

      if (!response.ok) {
        console.error(data.error || 'Failed to add product')
        return
      }

      const newProduct = {
        id: data.product_id,
        product_name: productName,
        description: description,
        price: Number(price),
        quantity: Number(quantity),
      }

      setProducts((currentProducts) => [...currentProducts, newProduct])

      setProductName('')
      setDescription('')
      setPrice('')
      setQuantity('')

      console.log('Product created successfully')
    } catch (error) {
      console.error('Failed to add product:', error)
    }
  }

  const handleEdit = (product) => {
    setEditingId(product.id)
    setProductName(product.product_name)
    setDescription(product.description || '')
    setPrice(product.price)
    setQuantity(product.quantity)

    if (window.matchMedia('(max-width: 900px)').matches) {
      document.getElementById('productName')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setProductName('')
    setDescription('')
    setPrice('')
    setQuantity('')
  }

  const handleUpdateProduct = async (event) => {
    event.preventDefault()

    try {
      const accessToken = localStorage.getItem('access_token')

      const response = await fetch(
        `${API_BASE_URL}/api/products/${editingId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            product_name: productName,
            description: description,
            price: Number(price),
            quantity: Number(quantity),
          }),
        },
      )

      const data = await response.json()

      if (response.status === 401) {
        clearAuth()
        return
      }

      if (!response.ok) {
        console.error(data.error || 'Failed to update product')
        return
      }

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === editingId
            ? {
                ...product,
                product_name: productName,
                description: description,
                price: Number(price),
                quantity: Number(quantity),
              }
            : product,
        ),
      )

      setEditingId(null)
      setProductName('')
      setDescription('')
      setPrice('')
      setQuantity('')

      console.log('Product updated successfully')
    } catch (error) {
      console.error('Failed to update product:', error)
    }
  }

  const handleDeleteProduct = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this product?',
    )

    if (!confirmed) {
      return
    }

    try {
      const accessToken = localStorage.getItem('access_token')

      const response = await fetch(
        `${API_BASE_URL}/api/products/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      const data = await response.json()

      if (response.status === 401) {
        clearAuth()
        return
      }

      if (!response.ok) {
        console.error(data.error || 'Failed to delete product')
        return
      }

      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== id),
      )

      console.log('Product deleted successfully')
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
  }

  const handleLogout = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to logout?',
    )

    if (!confirmed) {
      return
    }

    try {
      const refreshToken = localStorage.getItem('refresh_token')

      const response = await fetch(
        `${API_BASE_URL}/api/logout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh_token: refreshToken,
          }),
        },
      )

      await response.json()

      if (response.status === 401) {
        clearAuth()
        return
      }

      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')

      setIsLoggedIn(false)

      console.log('Logout successful')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setAuthMessage('')
    setIsSubmittingAuth(true)

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        setAuthMessage(data.error || 'Unable to sign in. Please try again.')
        setAuthMessageType('error')
        return
      }

      localStorage.setItem('access_token', data.tokens.access_token)
      localStorage.setItem('refresh_token', data.tokens.refresh_token)
      localStorage.setItem('user', JSON.stringify(data.user))

      setIsLoggedIn(true)
    } catch (error) {
      console.error('Login failed:', error)
      setAuthMessage('Could not reach the server. Make sure the backend is running.')
      setAuthMessageType('error')
    } finally {
      setIsSubmittingAuth(false)
    }
  }

  const handleSignup = async (event) => {
    event.preventDefault()
    setAuthMessage('')

    if (password !== confirmPassword) {
      setAuthMessage('Your passwords do not match.')
      setAuthMessageType('error')
      return
    }

    setIsSubmittingAuth(true)

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, email, password }),
        },
      )
      const data = await response.json()

      if (!response.ok) {
        setAuthMessage(data.error || 'Unable to create your account. Please try again.')
        setAuthMessageType('error')
        return
      }

      setAuthMode('login')
      setPassword('')
      setConfirmPassword('')
      setAuthMessage('Your account is ready. Sign in with your email and password.')
      setAuthMessageType('success')
    } catch (error) {
      console.error('Signup failed:', error)
      setAuthMessage('Could not reach the server. Make sure the backend is running.')
      setAuthMessageType('error')
    } finally {
      setIsSubmittingAuth(false)
    }
  }

  if (isLoggedIn) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-container">
          <header className="dashboard-header">
            <div className="dashboard-brand">
              <div className="login-icon">P</div>

              <div>
                <span className="dashboard-eyebrow">STOCKWISE INVENTORY</span>
                <h1>Product management</h1>
                <p>Your products, organized in one place.</p>
              </div>
            </div>

            <div className="dashboard-header-actions">
              <span className="dashboard-user">
                <span className="user-status-dot" />
                Inventory workspace
              </span>
              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          </header>

          <div className="dashboard-content">
            <section className={`form-card${editingId ? ' is-editing' : ''}`}>
              <div className="section-heading">
                <span className="section-kicker">
                  {editingId ? `EDITING PRODUCT #${editingId}` : 'INVENTORY'}
                </span>
                <h2>{editingId ? 'Update product' : 'Add a product'}</h2>
                <p>
                  {editingId
                    ? 'Make your changes below, then save the updated details.'
                    : 'Add a new item to your product inventory.'}
                </p>
              </div>

              <form
                className="product-form"
                onSubmit={
                  editingId
                    ? handleUpdateProduct
                    : handleAddProduct
                }
              >
                <div className="form-group">
                  <label htmlFor="productName">Product Name</label>

                  <input
                    type="text"
                    id="productName"
                    placeholder="Enter product name"
                    value={productName}
                    onChange={(event) =>
                      setProductName(event.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>

                  <input
                    type="text"
                    id="description"
                    placeholder="Enter description"
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="price">Price</label>

                  <input
                    type="number"
                    id="price"
                    placeholder="Enter price"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(event) =>
                      setPrice(event.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="quantity">Quantity</label>

                  <input
                    type="number"
                    id="quantity"
                    placeholder="Enter quantity"
                    min="0"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(event.target.value)
                    }
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="login-button"
                >
                  {editingId ? 'Save changes' : 'Add product'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="cancel-edit-button"
                    onClick={cancelEdit}
                  >
                    Cancel editing
                  </button>
                )}
              </form>
            </section>

            <section className="products-card">
              <div className="products-heading">
                <div className="section-heading">
                  <span className="section-kicker">YOUR CATALOG</span>
                  <h2>Products</h2>
                  <p>Review and update the items in your inventory.</p>
                </div>
                <span className="product-count">
                  {products.length} {products.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {products.length === 0 ? (
                <div className="empty-products">
                  <div className="empty-icon">P</div>

                  <h3>No products yet</h3>

                  <p>
                    Add your first product using the form.
                  </p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td data-label="Product">
                            <div className="product-info">
                              <strong>{product.product_name}</strong>

                              <span>
                                {product.description ||
                                  'No description'}
                              </span>
                            </div>
                          </td>

                          <td data-label="Price">
                            ₱{Number(product.price).toFixed(2)}
                          </td>

                          <td data-label="Quantity">
                            <span className="quantity-badge">
                              {product.quantity}
                            </span>
                          </td>

                          <td data-label="Actions">
                            <div className="action-buttons">
                              <button
                                type="button"
                                className="edit-button"
                                onClick={() =>
                                  handleEdit(product)
                                }
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="delete-button"
                                onClick={() =>
                                  handleDeleteProduct(product.id)
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="login-page">
      <section className="auth-card">
        <div className="auth-showcase">
          <div className="auth-brand">
            <span className="auth-brand-mark">P</span>
            <span>Stockwise</span>
          </div>
          <div className="showcase-copy">
            <span className="showcase-eyebrow">PRODUCT MANAGEMENT</span>
            <h1>Everything in stock. Everything in control.</h1>
            <p>
              A clearer, calmer way to track products, stay on top of stock,
              and keep your business moving.
            </p>
          </div>
          <div className="showcase-preview" aria-hidden="true">
            <div className="preview-heading">
              <span className="preview-window-dots"><i /><i /><i /></span>
              <span>INVENTORY OVERVIEW</span>
              <span className="preview-live"><i /> LIVE</span>
            </div>
            <div className="preview-summary">
              <div><strong>128</strong><span>Total products</span></div>
              <div><strong>94%</strong><span>In stock</span></div>
              <div className="preview-chart" />
            </div>
            <div className="preview-product">
              <span className="preview-product-icon">A</span>
              <span className="preview-product-name"><strong>Wireless headphones</strong><small>Electronics</small></span>
              <span className="preview-stock">In stock</span>
            </div>
            <div className="preview-product">
              <span className="preview-product-icon preview-product-icon-alt">S</span>
              <span className="preview-product-name"><strong>Everyday backpack</strong><small>Accessories</small></span>
              <span className="preview-stock">In stock</span>
            </div>
          </div>
          <div className="showcase-stat">
            <span className="stat-dot" />
            <span>Simple, secure inventory management</span>
          </div>
          <div className="showcase-orb showcase-orb-one" />
          <div className="showcase-orb showcase-orb-two" />
        </div>

        <div className="auth-panel">
          <div className="auth-form-wrap">
            <div className="auth-mobile-brand">
              <span className="auth-brand-mark">P</span>
              <span>Stockwise</span>
            </div>
            <div className="auth-heading">
              <span className="auth-kicker">
                {authMode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}
              </span>
              <h2>
                {authMode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p>
                {authMode === 'login'
                  ? 'Sign in to access your product inventory.'
                  : 'Enter your details below to get started.'}
              </p>
            </div>

            {authMessage && (
              <div className={`auth-message ${authMessageType}`} role="status">
                {authMessage}
              </div>
            )}

            <form onSubmit={authMode === 'login' ? handleSubmit : handleSignup}>
              {authMode === 'signup' && (
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    placeholder="e.g. alexmorgan"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    maxLength={100}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input
                  type="email"
                  id="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder={authMode === 'signup' ? 'At least 8 characters' : 'Enter your password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    minLength={authMode === 'signup' ? 8 : undefined}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {authMode === 'signup' && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    placeholder="Enter your password again"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className="login-button"
                disabled={isSubmittingAuth}
              >
                {isSubmittingAuth
                  ? 'Please wait...'
                  : authMode === 'login'
                    ? 'Sign in'
                    : 'Create account'}
              </button>
            </form>

            <p className="auth-switch">
              {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login')
                  setAuthMessage('')
                }}
              >
                {authMode === 'login' ? ' Sign up' : ' Sign in'}
              </button>
            </p>
          </div>
          <p className="auth-footer">© 2026 Stockwise · Inventory made simple</p>
        </div>
      </section>
    </main>
  )
}

export default App
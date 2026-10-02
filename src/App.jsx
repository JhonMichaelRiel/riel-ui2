import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

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
          `${import.meta.env.VITE_API_URL}/api/products`,
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
        `${import.meta.env.VITE_API_URL}/api/products`,
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
  }

  const handleUpdateProduct = async (event) => {
    event.preventDefault()

    try {
      const accessToken = localStorage.getItem('access_token')

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/products/${editingId}`,
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
        `${import.meta.env.VITE_API_URL}/api/products/${id}`,
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
        `${import.meta.env.VITE_API_URL}/api/logout`,
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

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/login`,
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
        console.error(data.error || 'Login failed')
        return
      }

      localStorage.setItem('access_token', data.tokens.access_token)
      localStorage.setItem('refresh_token', data.tokens.refresh_token)
      localStorage.setItem('user', JSON.stringify(data.user))

      setIsLoggedIn(true)

      console.log('Login successful')
    } catch (error) {
      console.error('Login failed:', error)
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
                <h1>Product Management</h1>
                <p>Manage your product inventory</p>
              </div>
            </div>

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </header>

          <div className="dashboard-content">
            <section className="form-card">
              <div className="section-heading">
                <h2>{editingId ? 'Edit Product' : 'Add Product'}</h2>
                <p>
                  {editingId
                    ? 'Update the selected product information.'
                    : 'Enter the information for your new product.'}
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
                  {editingId ? 'Update Product' : 'Add Product'}
                </button>
              </form>
            </section>

            <section className="products-card">
              <div className="section-heading">
                <h2>Products</h2>
                <p>
                  {products.length}{' '}
                  {products.length === 1 ? 'product' : 'products'} in inventory
                </p>
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
                          <td>
                            <div className="product-info">
                              <strong>{product.product_name}</strong>

                              <span>
                                {product.description ||
                                  'No description'}
                              </span>
                            </div>
                          </td>

                          <td>
                            ₱{Number(product.price).toFixed(2)}
                          </td>

                          <td>
                            <span className="quantity-badge">
                              {product.quantity}
                            </span>
                          </td>

                          <td>
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
      <section className="login-card">
        <div className="login-header">
          <div className="login-icon">P</div>

          <h1>Welcome Back</h1>
          <p>Sign in to manage your products</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>

            <input
              type="email"
              id="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-button"
          >
            Sign In
          </button>
        </form>
      </section>
    </main>
  )
}

export default App
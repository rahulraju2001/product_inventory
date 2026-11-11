import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const emptyProduct = {
  name: "",
  category: "",
  price: "",
  stock: "",
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function App() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [formProduct, setFormProduct] = useState(null);
  const [formValues, setFormValues] = useState(emptyProduct);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data } = await axios.get("/api/products");
        setProducts(data);
      } catch {
        setError("Could not load products.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))].sort(),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesName = product.name.toLowerCase().includes(normalizedSearch);
      const matchesCategory =
        category === "All categories" || product.category === category;
      return matchesName && matchesCategory;
    });
  }, [products, search, category]);

  const lowStockCount = products.filter((product) => product.stock < 5).length;

  const openForm = (product = null) => {
    setError("");
    setFormProduct(product);
    setFormValues(
      product
        ? {
            name: product.name,
            category: product.category,
            price: product.price,
            stock: product.stock,
          }
        : emptyProduct,
    );
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormProduct(null);
    setFormValues(emptyProduct);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...formValues,
      price: Number(formValues.price),
      stock: Number(formValues.stock),
    };

    try {
      if (formProduct) {
        const { data } = await axios.put(
          `/api/products/${formProduct._id}`,
          payload,
        );
        setProducts((current) =>
          current.map((product) => (product._id === data._id ? data : product)),
        );
      } else {
        const { data } = await axios.post("/api/products", payload);
        setProducts((current) => [data, ...current]);
      }
      closeForm();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not save product.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`))
      return;

    try {
      await axios.delete(`/api/products/${product._id}`);
      setProducts((current) =>
        current.filter((item) => item._id !== product._id),
      );
      setError("");
    } catch {
      setError("Could not delete product.");
    }
  };

  return (
    <main className="inventory-app min-h-screen">
      <div className="page-content">
        <section className="page-heading flex items-end justify-between">
          <h1>Product Inventory</h1>
          <button className="button-primary" onClick={() => openForm()}>
            Add product
          </button>
        </section>

        <section className="summary-grid" aria-label="Inventory summary">
          <article className="summary-item">
            <span className="summary-label">Total products</span>
            <strong>{products.length}</strong>
          </article>
          <article className="summary-item low-stock-summary">
            <span className="summary-label">Low stock (under 5)</span>
            <strong>{lowStockCount}</strong>
          </article>
        </section>

        <section className="products-section">
          <div className="section-heading flex items-center justify-between">
            <div>
              <h2>Products</h2>
              <span className="result-count">
                {filteredProducts.length} shown
              </span>
            </div>
          </div>

          <div className="toolbar flex items-center">
            <label className="search-field">
              <span className="sr-only">Search products by name</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products..."
              />
            </label>
            <label className="filter-field">
              <span className="sr-only">Filter by category</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option>All categories</option>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          {error && !isFormOpen && (
            <p className="notice" role="alert">
              {error}
            </p>
          )}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>CATEGORY</th>
                  <th>PRICE</th>
                  <th>IN STOCK</th>
                  <th>ADDED</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="empty-state" colSpan="6">
                      Loading inventory...
                    </td>
                  </tr>
                ) : filteredProducts.length ? (
                  filteredProducts.map((product) => (
                    <tr key={product._id}>
                      <td className="product-name">{product.name}</td>
                      <td>{product.category}</td>
                      <td>{currency.format(product.price)}</td>
                      <td>
                        <span
                          className={`stock-value ${product.stock < 5 ? "stock-low" : ""}`}
                        >
                          {product.stock}{" "}
                          {product.stock === 1 ? "unit" : "units"}
                        </span>
                      </td>
                      <td>{dateFormat.format(new Date(product.addedDate))}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="button-quiet"
                            onClick={() => openForm(product)}
                          >
                            Edit
                          </button>
                          <button
                            className="button-quiet button-delete"
                            onClick={() => deleteProduct(product)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="empty-state" colSpan="6">
                      {products.length
                        ? "No matching products."
                        : "No products found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isFormOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <section
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-title"
          >
            <div className="modal-heading">
              <h2 id="form-title">
                {formProduct ? "Edit product" : "Add product"}
              </h2>
              <button className="close-button" onClick={closeForm}>
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <label className="form-field">
                <span>Product name</span>
                <input
                  autoFocus
                  required
                  maxLength="100"
                  value={formValues.name}
                  onChange={(event) =>
                    setFormValues({ ...formValues, name: event.target.value })
                  }
                  placeholder="e.g. Pencil"
                />
              </label>
              <label className="form-field">
                <span>Category</span>
                <input
                  required
                  maxLength="60"
                  value={formValues.category}
                  onChange={(event) =>
                    setFormValues({
                      ...formValues,
                      category: event.target.value,
                    })
                  }
                  placeholder="e.g. Stationary"
                />
              </label>
              <div className="form-grid grid grid-cols-2 gap-4">
                <label className="form-field">
                  <span>Price</span>
                  <div className="number-input">
                    <span>$</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.1"
                      value={formValues.price}
                      onChange={(event) =>
                        setFormValues({
                          ...formValues,
                          price: event.target.value,
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </label>
                <label className="form-field">
                  <span>Stock quantity</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={formValues.stock}
                    onChange={(event) =>
                      setFormValues({
                        ...formValues,
                        stock: event.target.value,
                      })
                    }
                    placeholder="0"
                  />
                </label>
              </div>
              {error && (
                <p className="notice" role="alert">
                  {error}
                </p>
              )}
              <div className="form-actions">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={closeForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : formProduct
                      ? "Save changes"
                      : "Add product"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;


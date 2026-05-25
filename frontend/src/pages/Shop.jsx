import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingBag, Star, Check } from 'lucide-react';
import API_BASE from '../api';

const FALLBACK_PRODUCTS = [
  { id: 1,  name: 'Premium Salmon Kibble',    price: 45.99,  image: 'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&w=400&q=80', category: 'Food' },
  { id: 2,  name: 'Plush Donut Bed',          price: 34.50,  image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=400&q=80', category: 'Beds' },
  { id: 3,  name: 'Interactive Laser Toy',    price: 18.99,  image: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=400&q=80', category: 'Toys' },
  { id: 4,  name: 'Organic Dog Treats',       price: 12.50,  image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=400&q=80', category: 'Food' },
  { id: 5,  name: 'Cat Tree Tower',           price: 120.00, image: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?auto=format&fit=crop&w=400&q=80', category: 'Furniture' },
  { id: 6,  name: 'Heavy Duty Leash',         price: 25.00,  image: 'https://images.unsplash.com/photo-1625794084867-8ddd239946b1?auto=format&fit=crop&w=400&q=80', category: 'Accessories' },
  { id: 7,  name: 'Stainless Steel Bowl',     price: 15.00,  image: 'https://images.unsplash.com/photo-1602584386319-fa8eb4361c2c?auto=format&fit=crop&w=400&q=80', category: 'Accessories' },
  { id: 8,  name: 'Pet Grooming Kit',         price: 40.00,  image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=400&q=80', category: 'Grooming' },
  { id: 9,  name: 'Automatic Feeder',         price: 85.00,  image: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?auto=format&fit=crop&w=400&q=80', category: 'Accessories' },
  { id: 10, name: 'Self-Cleaning Litter Box', price: 150.00, image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=400&q=80', category: 'Accessories' },
  { id: 11, name: 'Squeaky Chew Toy',         price: 8.99,   image: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?auto=format&fit=crop&w=400&q=80', category: 'Toys' },
  { id: 12, name: 'Cozy Cat Cave',            price: 45.00,  image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=400&q=80', category: 'Beds' },
  { id: 13, name: 'Reflective Harness',       price: 28.50,  image: 'https://images.unsplash.com/photo-1625794084867-8ddd239946b1?auto=format&fit=crop&w=400&q=80', category: 'Accessories' },
  { id: 14, name: 'Puppy Training Pads',      price: 22.00,  image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=400&q=80', category: 'Training' },
  { id: 15, name: 'Ceramic Water Fountain',   price: 65.00,  image: 'https://images.unsplash.com/photo-1602584386319-fa8eb4361c2c?auto=format&fit=crop&w=400&q=80', category: 'Accessories' },
];

const CATEGORIES = ['All', 'Food', 'Toys', 'Beds', 'Accessories', 'Grooming', 'Furniture', 'Training'];

const CATEGORY_ICONS = {
  All: '🛍️', Food: '🍖', Toys: '🎾', Beds: '🛏️',
  Accessories: '🎀', Grooming: '✂️', Furniture: '🪵', Training: '📋',
};

function fakeRating() {
  return (4.2 + Math.random() * 0.7).toFixed(1);
}

function fakeReviews() {
  return Math.floor(20 + Math.random() * 180);
}

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState('All');
  const [added, setAdded]       = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/api/orders/products`)
      .then(res => setProducts(Array.isArray(res.data) ? res.data : FALLBACK_PRODUCTS))
      .catch(() => setProducts(FALLBACK_PRODUCTS))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));
    setAdded(product.id);
    setTimeout(() => setAdded(null), 1800);
  };

  const visible = category === 'All'
    ? products
    : products.filter(p => p.category === category);

  return (
    <div className="bg-cream min-h-screen">
      {/* Header */}
      <div className="bg-burgundy-50 py-14 text-center border-b border-burgundy-100">
        <h1 className="text-4xl lg:text-5xl font-bold text-primary font-serif mb-3">Pet Shop</h1>
        <p className="text-gray-500 max-w-xl mx-auto text-lg">
          Premium products curated for happy, healthy pets.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          {CATEGORIES.map(cat => (
            <button key={cat}
              onClick={() => setCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                category === cat
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
              }`}>
              {CATEGORY_ICONS[cat]} {cat}
            </button>
          ))}
          <span className="px-4 py-2 text-sm text-gray-400 self-center">
            {visible.length} item{visible.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-burgundy-100 border-t-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visible.map(product => {
              const rating  = fakeRating();
              const reviews = fakeReviews();
              const isAdded = added === product.id;
              return (
                <div key={product.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover-lift border border-gray-100 flex flex-col group">
                  {/* Product image */}
                  <div className="relative h-48 bg-gray-50 overflow-hidden">
                    <img
                      src={product.image || product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=400&q=80'; }}
                    />
                    {product.category && (
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-xs font-semibold text-gray-700 px-2.5 py-1 rounded-full">
                        {CATEGORY_ICONS[product.category] ?? '🐾'} {product.category}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 leading-snug">{product.name}</h3>

                    {/* Stars */}
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j}
                          className={`w-3 h-3 ${j < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                      ))}
                      <span className="text-xs text-gray-400 ml-1">{rating} ({reviews})</span>
                    </div>

                    <div className="text-2xl font-black text-primary mt-auto mb-4">
                      ₹{(product.price * 83).toFixed(0)}
                      <span className="text-xs font-normal text-gray-400 ml-1">(${product.price})</span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      className={`w-full flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition duration-300 text-sm ${
                        isAdded
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-900 hover:bg-primary text-white'
                      }`}>
                      {isAdded
                        ? <><Check className="w-4 h-4" /> Added!</>
                        : <><ShoppingBag className="w-4 h-4" /> Add to Cart</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
